import { NextRequest, NextResponse } from 'next/server';
import { insightsDb, visitorId } from '@/lib/insights/db';
import { trackBatchSchema } from '@/lib/insights/events';
import { articlePageOf, classifySource, deviceOf, pageLang, toolPageOf } from '@/lib/insights/paths';
import { requestVisitor } from '@/lib/reports/server';
import { isBotRequest } from '@/lib/reports/core';
import { tools } from '@/lib/tools';
import { getPublicBaseUrl } from '@/lib/site-url';

export const runtime = 'nodejs';

/**
 * Collection of the Control Center (sent by components/insights/InsightsTracker.tsx with
 * sendBeacon). No cookie, no stored IP: the visitor is a daily hash. Robots, foreign origins and
 * floods are dropped silently; the answer is always 204 so the page never waits or retries.
 */

const WINDOW_MS = 60_000;
const MAX_EVENTS_PER_WINDOW = 150;
const recent = new Map<string, { start: number; count: number }>();

function allowed(key: string, count: number): boolean {
  const now = Date.now();
  if (recent.size > 5000) recent.clear();
  const entry = recent.get(key);
  if (!entry || now - entry.start > WINDOW_MS) { recent.set(key, { start: now, count }); return count <= MAX_EVENTS_PER_WINDOW; }
  entry.count += count;
  return entry.count <= MAX_EVENTS_PER_WINDOW;
}

/** French slug of a tool page, whatever the language of its address. */
function toolSlug(locale: 'fr' | 'en', slug: string): string | null {
  const tool = tools.find((item) => (locale === 'en' ? (item.translations?.en?.slug || item.slug) : item.slug) === slug || item.path?.endsWith(`/${slug}`));
  return tool?.slug ?? null;
}

const done = () => new NextResponse(null, { status: 204 });

export async function POST(request: NextRequest) {
  const siteHost = new URL(getPublicBaseUrl()).hostname;
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  let originHost = '';
  try { originHost = new URL(origin).hostname.replace(/^www\./, ''); } catch { /* checked below */ }
  if (originHost !== siteHost && originHost !== 'localhost' && !originHost.endsWith('.vercel.app')) return done();

  const userAgent = request.headers.get('user-agent') || '';
  const body = await request.text().catch(() => '');
  if (body.length > 20_000) return done();
  const parsed = trackBatchSchema.safeParse((() => { try { return JSON.parse(body); } catch { return null; } })());
  if (!parsed.success) return done();
  const events = parsed.data.events.filter((event) => !event.path.startsWith('/admin') && !event.path.startsWith('/api/'));
  if (!events.length || isBotRequest(userAgent, events[0].path)) return done();

  const location = requestVisitor(request.headers);
  const now = Date.now();
  const visitor = visitorId(new Date(now).toISOString().slice(0, 10), location.ip || 'inconnue', userAgent);
  if (!allowed(visitor, events.length)) return done();

  const db = await insightsDb().catch(() => null);
  if (!db) return done();
  const device = deviceOf(userAgent);
  try {
    await db.batch(events.map((event) => {
      const toolPage = toolPageOf(event.path);
      const articlePage = articlePageOf(event.path);
      const source = event.type === 'pageview' && (event.referrer !== undefined || event.utm) ? classifySource(event.referrer, event.utm, siteHost) : null;
      return {
        sql: 'INSERT INTO events (ts, type, name, path, lang, visitor, country, city, device, source, tool, article, value, meta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          now,
          event.type,
          event.name ?? null,
          event.path,
          pageLang(event.path) || null,
          visitor,
          location.country || null,
          location.city || null,
          device,
          source,
          toolPage ? toolSlug(toolPage.locale, toolPage.slug) : null,
          articlePage ? `${articlePage.locale}:${articlePage.slug}` : null,
          event.value ?? null,
          event.meta ? JSON.stringify(event.meta) : null,
        ],
      };
    }), 'write');
  } catch (error) {
    console.error('[insights] Écriture impossible :', error instanceof Error ? error.message : error);
  }
  return done();
}
