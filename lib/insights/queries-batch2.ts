import 'server-only';

import { query } from '@/lib/insights/db';
import { dayExpr, num, percentile, type Range } from '@/lib/insights/queries';

/** Figures of the Control Center pages of batch 2: Blog, Conversions, Live, Performance. */

/** Per article (key "fr:slug" / "en:slug"): views, readers, real reading time and depth reached. */
export async function articleStats(range: Range) {
  const [views, depth, toTools] = await Promise.all([
    query<Record<string, unknown>>(
      `SELECT article,
         SUM(CASE WHEN type = 'pageview' THEN 1 ELSE 0 END) AS views,
         COUNT(DISTINCT CASE WHEN type = 'pageview' THEN visitor || ${dayExpr} END) AS readers,
         AVG(CASE WHEN type = 'read_time' THEN value END) AS readSeconds,
         SUM(CASE WHEN type = 'read_time' THEN 1 ELSE 0 END) AS readSamples
       FROM events WHERE article IS NOT NULL AND ts >= ? AND ts < ? GROUP BY article`,
      [range.from, range.to],
    ),
    query<{ article: string; step: number; readers: number }>(
      `SELECT article, CAST(value AS INTEGER) AS step, COUNT(DISTINCT visitor || ${dayExpr}) AS readers FROM events WHERE type = 'scroll' AND article IS NOT NULL AND ts >= ? AND ts < ? GROUP BY article, step`,
      [range.from, range.to],
    ),
    // A reader who opens a tool within a day after the article.
    query<{ article: string; visitors: number }>(
      `SELECT a.article AS article, COUNT(DISTINCT a.visitor) AS visitors
       FROM events a JOIN events t ON t.visitor = a.visitor AND t.type = 'pageview' AND t.tool IS NOT NULL AND t.ts > a.ts AND t.ts - a.ts < 86400000
       WHERE a.type = 'pageview' AND a.article IS NOT NULL AND a.ts >= ? AND a.ts < ? GROUP BY a.article`,
      [range.from, range.to],
    ),
  ]);
  const depthBy = new Map<string, Record<number, number>>();
  for (const row of depth) depthBy.set(String(row.article), { ...(depthBy.get(String(row.article)) ?? {}), [num(row.step)]: num(row.readers) });
  const toolsBy = new Map(toTools.map((row) => [String(row.article), num(row.visitors)]));
  return views.map((row) => {
    const key = String(row.article);
    const steps = depthBy.get(key) ?? {};
    return {
      key,
      views: num(row.views),
      readers: num(row.readers),
      readSeconds: row.readSeconds === null ? null : Math.round(num(row.readSeconds)),
      readSamples: num(row.readSamples),
      depth: { 25: steps[25] ?? 0, 50: steps[50] ?? 0, 75: steps[75] ?? 0, 100: steps[100] ?? 0 },
      toTools: toolsBy.get(key) ?? 0,
    };
  });
}

/** What counts as a conversion: newsletter, contact form, template request, WhatsApp click. */
const CONVERSION = "((type = 'custom' AND name IN ('newsletter_signup', 'contact_submit', 'resource_request')) OR (type = 'outbound' AND name IN ('wa.me', 'api.whatsapp.com')))";

/** Visitor → tool → conversion funnel, partner clicks, cookie choices, conversions per day. */
export async function conversionStats(range: Range) {
  const [funnel, conversions, outbound, consent, daily] = await Promise.all([
    query<Record<string, unknown>>(
      `SELECT
         COUNT(DISTINCT CASE WHEN type = 'pageview' THEN visitor || ${dayExpr} END) AS visitors,
         COUNT(DISTINCT CASE WHEN type IN ('tool_upload', 'tool_download') THEN visitor || ${dayExpr} END) AS toolUsers,
         COUNT(DISTINCT CASE WHEN ${CONVERSION} THEN visitor || ${dayExpr} END) AS converted
       FROM events WHERE origin = 'tracker' AND ts >= ? AND ts < ?`,
      [range.from, range.to],
    ),
    query<{ name: string; subject: string | null; count: number }>(
      "SELECT name, json_extract(meta, '$.subject') AS subject, COUNT(*) AS count FROM events WHERE type = 'custom' AND name IN ('newsletter_signup', 'contact_submit', 'resource_request', 'resource_download') AND ts >= ? AND ts < ? GROUP BY name, subject",
      [range.from, range.to],
    ),
    query<{ host: string; clicks: number; visitors: number }>(
      `SELECT name AS host, COUNT(*) AS clicks, COUNT(DISTINCT visitor || ${dayExpr}) AS visitors FROM events WHERE type = 'outbound' AND ts >= ? AND ts < ? GROUP BY name ORDER BY clicks DESC LIMIT 25`,
      [range.from, range.to],
    ),
    query<{ choice: string; count: number }>("SELECT name AS choice, COUNT(*) AS count FROM events WHERE type = 'consent' AND ts >= ? AND ts < ? GROUP BY name", [range.from, range.to]),
    query<{ day: string; count: number }>(`SELECT ${dayExpr} AS day, COUNT(*) AS count FROM events WHERE ${CONVERSION} AND ts >= ? AND ts < ? GROUP BY day ORDER BY day`, [range.from, range.to]),
  ]);
  return {
    funnel: { visitors: num(funnel[0]?.visitors), toolUsers: num(funnel[0]?.toolUsers), converted: num(funnel[0]?.converted) },
    conversions: conversions.map((row) => ({ name: String(row.name), subject: row.subject === null ? null : String(row.subject), count: num(row.count) })),
    outbound: outbound.map((row) => ({ host: String(row.host), clicks: num(row.clicks), visitors: num(row.visitors) })),
    consent: consent.map((row) => ({ choice: String(row.choice), count: num(row.count) })),
    daily: daily.map((row) => ({ day: String(row.day), count: num(row.count) })),
  };
}

/** Visitors seen in the last minutes, the page each one is on, and the latest events. */
export async function liveStats(now = Date.now()) {
  const recent = now - 5 * 60_000;
  const [online, pages, countries, feed, perMinute] = await Promise.all([
    query<{ visitors: number }>("SELECT COUNT(DISTINCT visitor) AS visitors FROM events WHERE origin = 'tracker' AND ts >= ?", [recent]),
    // The last page of each visitor active in the last five minutes (SQLite returns the row of MAX).
    query<{ path: string; visitors: number }>(
      `SELECT path, COUNT(*) AS visitors FROM (
         SELECT visitor, path, MAX(ts) AS last FROM events WHERE type = 'pageview' AND origin = 'tracker' AND ts >= ? GROUP BY visitor
       ) GROUP BY path ORDER BY visitors DESC LIMIT 15`,
      [recent],
    ),
    query<{ country: string; visitors: number }>("SELECT country, COUNT(DISTINCT visitor) AS visitors FROM events WHERE origin = 'tracker' AND country IS NOT NULL AND ts >= ? GROUP BY country", [now - 30 * 60_000]),
    query<Record<string, unknown>>(
      `SELECT ts, type, name, path, tool, country, city, device, value, meta FROM events
       WHERE origin = 'tracker' AND type IN ('pageview', 'tool_upload', 'tool_download', 'tool_error', 'custom', 'outbound') AND ts >= ?
       ORDER BY ts DESC LIMIT 40`,
      [now - 60 * 60_000],
    ),
    query<{ minute: number; visitors: number }>(
      "SELECT (ts / 60000) AS minute, COUNT(DISTINCT visitor) AS visitors FROM events WHERE origin = 'tracker' AND ts >= ? GROUP BY minute ORDER BY minute",
      [now - 30 * 60_000],
    ),
  ]);
  return {
    online: num(online[0]?.visitors),
    pages: pages.map((row) => ({ path: String(row.path), visitors: num(row.visitors) })),
    countries: countries.map((row) => ({ code: String(row.country), visitors: num(row.visitors) })),
    feed: feed.map((row) => {
      let meta: Record<string, unknown> | null = null;
      try { meta = row.meta ? JSON.parse(String(row.meta)) as Record<string, unknown> : null; } catch { meta = null; }
      return {
        ts: num(row.ts), type: String(row.type), name: row.name === null ? null : String(row.name), path: String(row.path), tool: row.tool === null ? null : String(row.tool),
        country: row.country === null ? null : String(row.country), city: row.city === null ? null : String(row.city), device: String(row.device ?? ''), value: row.value === null ? null : num(row.value), meta,
      };
    }),
    perMinute: perMinute.map((row) => ({ minute: num(row.minute) * 60_000, visitors: num(row.visitors) })),
  };
}

/** Web Vitals at the 75th percentile (Google's threshold), overall and per page. */
export async function webVitals(range: Range) {
  const rows = await query<{ name: string; path: string; value: number }>(
    "SELECT name, path, value FROM events WHERE type = 'web_vital' AND ts >= ? AND ts < ? ORDER BY ts DESC LIMIT 20000",
    [range.from, range.to],
  );
  const overall = new Map<string, number[]>();
  const pages = new Map<string, Map<string, number[]>>();
  for (const row of rows) {
    const name = String(row.name);
    const value = num(row.value);
    overall.set(name, [...(overall.get(name) ?? []), value]);
    const page = pages.get(String(row.path)) ?? new Map<string, number[]>();
    page.set(name, [...(page.get(name) ?? []), value]);
    pages.set(String(row.path), page);
  }
  const summary = (values: number[] | undefined) => (values?.length ? { p75: percentile(values, 0.75), samples: values.length } : null);
  return {
    overall: Object.fromEntries(['LCP', 'INP', 'CLS', 'FCP', 'TTFB'].map((name) => [name, summary(overall.get(name))])) as Record<string, { p75: number | null; samples: number } | null>,
    pages: Array.from(pages.entries())
      .map(([path, metrics]) => ({ path, samples: Math.max(...Array.from(metrics.values()).map((values) => values.length)), LCP: summary(metrics.get('LCP')), INP: summary(metrics.get('INP')), CLS: summary(metrics.get('CLS')) }))
      .sort((a, b) => b.samples - a.samples)
      .slice(0, 25),
  };
}

/**
 * API latency per hour as candles (min, median, 95th percentile, max), the 4xx / 5xx per day,
 * the slowest routes and the share of calls answered without a server error.
 */
export async function apiHealth(range: Range) {
  const rows = await query<{ ts: number; path: string; status: string; value: number }>(
    "SELECT ts, path, name AS status, value FROM events WHERE type IN ('api_call', 'tool_api') AND value IS NOT NULL AND ts >= ? AND ts < ? ORDER BY ts LIMIT 50000",
    [range.from, range.to],
  );
  const hours = new Map<number, number[]>();
  const days = new Map<string, { day: string; ok: number; client: number; server: number }>();
  const routes = new Map<string, { route: string; calls: number; errors: number; durations: number[] }>();
  for (const row of rows) {
    const ts = num(row.ts);
    const status = Number(row.status) || 0;
    const duration = num(row.value);
    // Cron jobs run for minutes in the background: in the hourly candles they would crush the
    // scale of the calls visitors wait for. They stay in the routes table and the error counts.
    if (!String(row.path).startsWith('/api/cron/')) {
      // Shifted to the site's time (UTC+1, like the days below): the chart prints timestamps as UTC.
      const hour = Math.floor((ts + 3600_000) / 3600_000) * 3600_000;
      const values = hours.get(hour);
      if (values) values.push(duration); else hours.set(hour, [duration]);
    }
    const day = new Date(ts + 3600_000).toISOString().slice(0, 10);
    const entry = days.get(day) ?? { day, ok: 0, client: 0, server: 0 };
    if (status >= 500) entry.server += 1; else if (status >= 400) entry.client += 1; else entry.ok += 1;
    days.set(day, entry);
    const route = routes.get(String(row.path)) ?? { route: String(row.path), calls: 0, errors: 0, durations: [] };
    route.calls += 1;
    if (status >= 500) route.errors += 1;
    route.durations.push(duration);
    routes.set(String(row.path), route);
  }
  const total = rows.length;
  const serverErrors = Array.from(days.values()).reduce((sum, day) => sum + day.server, 0);
  return {
    candles: Array.from(hours.entries()).sort(([a], [b]) => a - b).map(([hour, values]) => ({ time: hour / 1000, min: Math.min(...values), p50: percentile(values, 0.5) ?? 0, p95: percentile(values, 0.95) ?? 0, max: Math.max(...values), calls: values.length })),
    daily: Array.from(days.values()).sort((a, b) => a.day.localeCompare(b.day)),
    routes: Array.from(routes.values()).map((route) => ({ route: route.route, calls: route.calls, errors: route.errors, p50: percentile(route.durations, 0.5), p95: percentile(route.durations, 0.95) })).sort((a, b) => (b.p95 ?? 0) - (a.p95 ?? 0)).slice(0, 15),
    // Below 20 calls a percentage says nothing (2 calls, 1 error = 50 %).
    availability: total >= 20 ? Number((((total - serverErrors) / total) * 100).toFixed(2)) : null,
    calls: total,
  };
}
