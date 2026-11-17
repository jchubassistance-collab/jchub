import 'server-only';

import { Timestamp } from 'firebase-admin/firestore';
import { getAccessToken, rowsToObjects, runReport } from '@/lib/ga4';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { searchConsoleAccount, searchConsoleHistory, type SeoHistory } from '@/lib/insights/search-console';
import { query } from '@/lib/insights/db';
import { dailyAudience, num } from '@/lib/insights/queries';
import { cacheGet, cacheSet } from '@/lib/turso-store';

/**
 * The site's history since 3 September 2026 (Control Center › Historique), gathered from every
 * source that kept something, day by day:
 * - Google Analytics: complete until 12 October, then only the visitors who accepted cookies;
 * - Google Search Console: everything, about two days late;
 * - the site's own figures (server reports from 28 October, own measure from 4 November);
 * - Firestore: newsletter, contact messages, comments, template requests.
 * Built on demand (a dozen calls to Google), then kept in Turso: the page opens at once.
 */

export const HISTORY_START = '2026-09-03';
/** Last day Google Analytics measured every visitor, before the consent banner. */
export const GA_FULL_UNTIL = '2026-10-12';
const SNAPSHOT_KEY = 'history:v1';
const KEEP_MS = 10 * 365 * 86400_000;
const DAY = 86400_000;

const localDay = (time: number) => new Date(time + 3600_000).toISOString().slice(0, 10);
const gaDay = (value: string) => `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;

type Ga = {
  configured: true;
  daily: { day: string; users: number; newUsers: number; sessions: number; pageviews: number; duration: number; bounce: number; engaged: number }[];
  pages: { path: string; pageviews: number; users: number; duration: number }[];
  sources: { source: string; sessions: number; users: number; engaged: number }[];
  channels: { channel: string; sessions: number }[];
  countries: { country: string; users: number; sessions: number }[];
  cities: { city: string; country: string; users: number }[];
  devices: { device: string; users: number; sessions: number }[];
  events: { name: string; count: number; users: number }[];
};
type Unavailable = { configured: false; reason: string; account?: string };

async function googleAnalytics(from: string, to: string): Promise<Ga | Unavailable> {
  try {
    const access = await getAccessToken();
    if (!access) return { configured: false, reason: 'GA4_PROPERTY_ID ou le compte de service Google manque.' };
    const run = (dimensions: string[], metrics: string[], limit: number, chronological = false) => runReport(access, dimensions, metrics, limit, from, to, chronological).then(rowsToObjects);
    const [daily, pages, sources, channels, countries, cities, devices, events] = await Promise.all([
      run(['date'], ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'averageSessionDuration', 'bounceRate', 'engagedSessions'], 400, true),
      run(['pagePath'], ['screenPageViews', 'activeUsers', 'averageSessionDuration'], 300),
      run(['sessionSourceMedium'], ['sessions', 'activeUsers', 'engagedSessions'], 100),
      run(['sessionDefaultChannelGroup'], ['sessions'], 20),
      run(['country'], ['activeUsers', 'sessions'], 100),
      run(['city', 'country'], ['activeUsers'], 100),
      run(['deviceCategory'], ['activeUsers', 'sessions'], 10),
      run(['eventName'], ['eventCount', 'totalUsers'], 100),
    ]);
    const n = (value: unknown) => Number(value) || 0;
    return {
      configured: true,
      daily: daily.map((row) => ({ day: gaDay(String(row.date)), users: n(row.activeUsers), newUsers: n(row.newUsers), sessions: n(row.sessions), pageviews: n(row.screenPageViews), duration: Math.round(n(row.averageSessionDuration)), bounce: Number((n(row.bounceRate) * 100).toFixed(1)), engaged: n(row.engagedSessions) })),
      pages: pages.map((row) => ({ path: String(row.pagePath), pageviews: n(row.screenPageViews), users: n(row.activeUsers), duration: Math.round(n(row.averageSessionDuration)) })),
      sources: sources.map((row) => ({ source: String(row.sessionSourceMedium), sessions: n(row.sessions), users: n(row.activeUsers), engaged: n(row.engagedSessions) })),
      channels: channels.map((row) => ({ channel: String(row.sessionDefaultChannelGroup), sessions: n(row.sessions) })),
      countries: countries.map((row) => ({ country: String(row.country), users: n(row.activeUsers), sessions: n(row.sessions) })),
      cities: cities.map((row) => ({ city: String(row.city), country: String(row.country), users: n(row.activeUsers) })),
      devices: devices.map((row) => ({ device: String(row.deviceCategory), users: n(row.activeUsers), sessions: n(row.sessions) })),
      events: events.map((row) => ({ name: String(row.eventName), count: n(row.eventCount), users: n(row.totalUsers) })),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google Analytics indisponible.';
    const denied = /permission|403|access/i.test(message);
    return {
      configured: false,
      account: searchConsoleAccount() ?? undefined,
      reason: denied ? 'Le compte de service n’a pas accès à la propriété Google Analytics : ajoute-le comme « Lecteur » dans Analytics › Administration › Gestion des accès à la propriété.' : message,
    };
  }
}

/** Documents of a Firestore collection per day, from a date field (Timestamp, Date or ISO text). */
async function firestoreDaily(collection: string, field: string, since: number): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!hasFirebaseAdminConfig()) return counts;
  const snapshot = await getAdminDb().collection(collection).select(field).get();
  for (const document of snapshot.docs) {
    const value = document.get(field) as unknown;
    const time = value instanceof Timestamp ? value.toMillis() : value instanceof Date ? value.getTime() : typeof value === 'string' ? Date.parse(value) : typeof (value as { toMillis?: () => number })?.toMillis === 'function' ? (value as { toMillis: () => number }).toMillis() : NaN;
    if (!Number.isFinite(time) || time < since) continue;
    counts.set(localDay(time), (counts.get(localDay(time)) ?? 0) + 1);
  }
  return counts;
}

function everyDay(from: string, to: string): string[] {
  const days: string[] = [];
  for (let time = Date.parse(`${from}T12:00:00Z`); time <= Date.parse(`${to}T12:00:00Z`); time += DAY) days.push(new Date(time).toISOString().slice(0, 10));
  return days;
}

/** Monday of the week of a day (YYYY-MM-DD). */
export function weekOf(day: string): string {
  const date = new Date(`${day}T12:00:00Z`);
  const shift = (date.getUTCDay() || 7) - 1;
  return new Date(date.getTime() - shift * DAY).toISOString().slice(0, 10);
}

export async function buildHistory(now = Date.now()) {
  const today = localDay(now);
  const since = Date.parse(`${HISTORY_START}T00:00:00Z`) - 3600_000;
  const settle = <T>(promise: Promise<T>, fallback: T) => promise.catch(() => fallback);
  const [ga, seo, own, articleViews, newsletter, contacts, comments, resources] = await Promise.all([
    googleAnalytics(HISTORY_START, today),
    searchConsoleHistory(HISTORY_START, today).catch((error): Unavailable => ({ configured: false, reason: error instanceof Error ? error.message : 'Search Console indisponible.' })),
    settle(dailyAudience({ from: since, to: now }), []),
    settle(query<{ day: string; views: number }>("SELECT day, SUM(views) AS views FROM article_views WHERE day >= ? GROUP BY day", [HISTORY_START]), []),
    settle(firestoreDaily('newsletter_subscribers', 'confirmedAt', since), new Map()),
    settle(firestoreDaily('contact_messages', 'createdAt', since), new Map()),
    settle(firestoreDaily('blog_comments', 'createdAt', since), new Map()),
    settle(firestoreDaily('resource_requests', 'requestedAt', since), new Map()),
  ]);
  const gaByDay = new Map(ga.configured ? ga.daily.map((row) => [row.day, row]) : []);
  const seoByDay = new Map(seo.configured ? (seo as SeoHistory).daily.map((row) => [row.day, row]) : []);
  const ownByDay = new Map(own.map((row) => [row.day, row]));
  const viewsByDay = new Map(articleViews.map((row) => [String(row.day), num(row.views)]));

  const daily = everyDay(HISTORY_START, today).map((day) => {
    const analytics = gaByDay.get(day);
    const google = seoByDay.get(day);
    const site = ownByDay.get(day);
    return {
      day,
      gaUsers: analytics?.users ?? null, gaNewUsers: analytics?.newUsers ?? null, gaSessions: analytics?.sessions ?? null, gaPageviews: analytics?.pageviews ?? null,
      gaDuration: analytics?.duration ?? null, gaBounce: analytics?.bounce ?? null,
      gaPartial: day > GA_FULL_UNTIL,
      googleClicks: google?.clicks ?? null, googleImpressions: google?.impressions ?? null, googleCtr: google?.ctr ?? null, googlePosition: google?.position ?? null,
      siteVisitors: site?.visitors ?? null, sitePageviews: site?.pageviews ?? null, siteToolUses: site?.uses ?? null,
      articleViews: viewsByDay.get(day) ?? null,
      newsletter: newsletter.get(day) ?? 0, contacts: contacts.get(day) ?? 0, comments: comments.get(day) ?? 0, resources: resources.get(day) ?? 0,
    };
  });

  const weeks = new Map<string, { week: string; days: number; gaUsers: number; gaPageviews: number; gaSessions: number; googleClicks: number; googleImpressions: number; siteVisitors: number; sitePageviews: number; newsletter: number; contacts: number; comments: number; resources: number }>();
  for (const row of daily) {
    const key = weekOf(row.day);
    const week = weeks.get(key) ?? { week: key, days: 0, gaUsers: 0, gaPageviews: 0, gaSessions: 0, googleClicks: 0, googleImpressions: 0, siteVisitors: 0, sitePageviews: 0, newsletter: 0, contacts: 0, comments: 0, resources: 0 };
    week.days += 1;
    week.gaUsers += row.gaUsers ?? 0; week.gaPageviews += row.gaPageviews ?? 0; week.gaSessions += row.gaSessions ?? 0;
    week.googleClicks += row.googleClicks ?? 0; week.googleImpressions += row.googleImpressions ?? 0;
    week.siteVisitors += row.siteVisitors ?? 0; week.sitePageviews += row.sitePageviews ?? 0;
    week.newsletter += row.newsletter; week.contacts += row.contacts; week.comments += row.comments; week.resources += row.resources;
    weeks.set(key, week);
  }

  const lastWith = (key: 'gaUsers' | 'googleClicks' | 'siteVisitors') => [...daily].reverse().find((row) => row[key] !== null)?.day ?? null;
  const firstWith = (key: 'gaUsers' | 'googleClicks' | 'siteVisitors') => daily.find((row) => row[key] !== null)?.day ?? null;
  const sum = (key: keyof (typeof daily)[number]) => daily.reduce((total, row) => total + (typeof row[key] === 'number' ? row[key] as number : 0), 0);

  return {
    builtAt: now,
    range: { from: HISTORY_START, to: today },
    coverage: [
      { source: 'Google Analytics', from: firstWith('gaUsers'), to: lastWith('gaUsers'), status: ga.configured ? 'ok' : 'indisponible', note: ga.configured ? `Complet jusqu’au 12 octobre ; ensuite seulement les visiteurs qui acceptent les cookies.` : ga.reason },
      { source: 'Google Search Console', from: firstWith('googleClicks'), to: lastWith('googleClicks'), status: seo.configured ? 'ok' : 'indisponible', note: seo.configured ? 'Visites venues de Google, avec environ 2 jours de retard.' : seo.reason },
      { source: 'Mesure du site', from: firstWith('siteVisitors'), to: lastWith('siteVisitors'), status: own.length ? 'ok' : 'vide', note: 'Rapports du serveur depuis le 28 octobre (estimés), mesure propre sans cookie depuis le 4 novembre.' },
      { source: 'Firestore', from: HISTORY_START, to: today, status: hasFirebaseAdminConfig() ? 'ok' : 'indisponible', note: 'Inscriptions newsletter, messages de contact, commentaires, demandes de modèles.' },
    ],
    totals: {
      gaUsers: sum('gaUsers'), gaPageviews: sum('gaPageviews'), gaSessions: sum('gaSessions'),
      googleClicks: sum('googleClicks'), googleImpressions: sum('googleImpressions'),
      siteVisitors: sum('siteVisitors'), sitePageviews: sum('sitePageviews'),
      newsletter: sum('newsletter'), contacts: sum('contacts'), comments: sum('comments'), resources: sum('resources'),
    },
    daily,
    weeks: Array.from(weeks.values()),
    ga,
    seo: seo as SeoHistory | Unavailable,
  };
}

export type History = Awaited<ReturnType<typeof buildHistory>>;

/** The stored history; rebuilt when asked, or when none was built yet. */
export async function getHistory(options: { refresh?: boolean } = {}): Promise<History> {
  if (!options.refresh) {
    const stored = await cacheGet<History>(SNAPSHOT_KEY);
    if (stored) return stored;
  }
  const history = await buildHistory();
  await cacheSet(SNAPSHOT_KEY, history, KEEP_MS);
  return history;
}
