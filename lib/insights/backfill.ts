import 'server-only';

import { insightsDb, releaseLock, takeLock, visitorId } from '@/lib/insights/db';
import { articlePageOf, classifySource, deviceOf, pageLang, toolPageOf } from '@/lib/insights/paths';
import { TOOL_ROUTES } from '@/lib/insights/server-events';
import { dayKey, isBotRequest, REQUEST_RETENTION_DAYS, type StoredRequest } from '@/lib/reports/core';
import { rtdbGet } from '@/lib/reports/rtdb';
import { getPublicBaseUrl } from '@/lib/site-url';
import { tools } from '@/lib/tools';

/**
 * Imports the history kept by the site reports (30 days of requests) into the Control Center,
 * so its pages are not empty on the first day. Imported rows have origin 'reports' and are
 * replaced on each import; the collection's own rows ('tracker', 'server') are never touched.
 * Only pages seen by humans and calls to the server tools are imported.
 */

const DAY = 86400_000;

/**
 * Cities of large data centers (Amazon, Google, Microsoft, OVH…). The reports mark robots that
 * say so, but many crawlers pose as a real Chrome from these places: in the imported history
 * they are left out. The site's own collection does not need this: it needs a real browser.
 */
export const DATA_CENTER_CITIES = new Set(['Ashburn', 'Boardman', 'Council Bluffs', 'The Dalles', 'Moncks Corner', 'Santa Clara', 'Singapore', 'Columbus', 'North Charleston', 'Hillsboro', 'Quincy', 'San Antonio', 'Des Moines', 'Lenoir', 'Pryor', 'Mayes County', 'Clarksville', 'Phoenix', 'Gravelines', 'Roubaix', 'Strasbourg', 'Frankfurt am Main', 'Dublin', 'Amsterdam', 'Hong Kong']);

function toolSlug(locale: 'fr' | 'en', slug: string): string | null {
  return tools.find((item) => (locale === 'en' ? (item.translations?.en?.slug || item.slug) : item.slug) === slug || item.path?.endsWith(`/${slug}`))?.slug ?? null;
}

export async function backfillFromReports(now = Date.now()): Promise<{ days: number; pageviews: number; toolCalls: number; failures: string[] }> {
  const db = await insightsDb();
  if (!db) throw new Error('Base du Control Center non configurée (TURSO_DATABASE_URL).');
  // Two imports at once would each empty the table and then both write: duplicates.
  if (!(await takeLock('backfill', 5 * 60_000))) throw new BackfillRunningError('Un import est déjà en cours. Attends qu’il se termine (environ une minute).');
  try {
    return await importDays(db, now);
  } finally {
    await releaseLock('backfill');
  }
}

export class BackfillRunningError extends Error {}

async function importDays(db: NonNullable<Awaited<ReturnType<typeof insightsDb>>>, now: number) {
  const siteHost = new URL(getPublicBaseUrl()).hostname;
  // Imported history stops where the collection's own rows begin, so nothing is counted twice.
  const firstOwn = Number((await db.execute("SELECT MIN(ts) AS first FROM events WHERE origin = 'tracker'")).rows[0]?.first) || now;
  await db.execute("DELETE FROM events WHERE origin = 'reports'");

  let pageviews = 0;
  let toolCalls = 0;
  let days = 0;
  const failures: string[] = [];
  const firstSeen = new Set<string>();
  for (let index = REQUEST_RETENTION_DAYS; index >= 0; index -= 1) {
    const day = dayKey(now - index * DAY);
    let entries: Record<string, StoredRequest> | null;
    try {
      entries = await rtdbGet<Record<string, StoredRequest>>(`reports/requests/${day}`, undefined, 25_000);
    } catch (error) {
      // A day that cannot be read is named, instead of silently giving "0 day imported".
      failures.push(`${day} : ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    if (!entries) continue;
    days += 1;
    const rows: { sql: string; args: (string | number | null)[] }[] = [];
    for (const entry of Object.values(entries).sort((a, b) => a.t - b.t)) {
      if (!entry?.t || entry.t >= firstOwn || !entry.p) continue;
      const userAgent = entry.ua || '';
      const path = entry.p.split('?')[0];
      const visitor = visitorId(day, entry.ip || 'inconnue', userAgent);
      // Redirections (308 from / to /fr…) are not page views; their status is the only one stored for pages.
      const redirected = entry.st !== undefined && entry.st >= 300;
      if (entry.k === 'page' && !entry.b && !redirected && !isBotRequest(userAgent, path) && !/HeadlessChrome|Lighthouse|PageSpeed/i.test(userAgent) && !DATA_CENTER_CITIES.has(entry.ci || '') && !path.startsWith('/admin')) {
        const toolPage = toolPageOf(path);
        const articlePage = articlePageOf(path);
        // The first page of a visitor in the day carries where they came from.
        const first = !firstSeen.has(visitor);
        firstSeen.add(visitor);
        rows.push({
          sql: "INSERT INTO events (ts, type, path, lang, visitor, country, city, device, source, tool, article, origin) VALUES (?, 'pageview', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'reports')",
          args: [entry.t, path, pageLang(path) || null, visitor, entry.cc || null, entry.ci || null, deviceOf(userAgent), first ? classifySource(entry.rf, undefined, siteHost) : null, toolPage ? toolSlug(toolPage.locale, toolPage.slug) : null, articlePage ? `${articlePage.locale}:${articlePage.slug}` : null],
        });
        pageviews += 1;
        continue;
      }
      const route = path.match(/^\/api\/tools\/([a-z0-9-]+)/)?.[1];
      if (entry.k === 'api' && route && TOOL_ROUTES[route] && entry.m !== 'OPTIONS' && entry.st) {
        rows.push({
          sql: "INSERT INTO events (ts, type, name, path, visitor, country, city, device, tool, value, origin) VALUES (?, 'tool_api', ?, ?, ?, ?, ?, ?, ?, ?, 'reports')",
          args: [entry.t, String(entry.st), path, visitor, entry.cc || null, entry.ci || null, deviceOf(userAgent), TOOL_ROUTES[route], entry.ms ?? null],
        });
        toolCalls += 1;
      }
    }
    for (let start = 0; start < rows.length; start += 500) await db.batch(rows.slice(start, start + 500), 'write');
  }
  return { days, pageviews, toolCalls, failures };
}
