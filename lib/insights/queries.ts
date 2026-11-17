import 'server-only';

import { query } from '@/lib/insights/db';

/**
 * Figures of the Control Center pages, computed by SQL on the events table. Days and hours are
 * counted in Brazzaville time (UTC+1), so a visit at 23:30 belongs to the right day.
 */

const DAY = 86400_000;
const LOCAL = "(ts + 3600000) / 1000, 'unixepoch'";
export const dayExpr = `date(${LOCAL})`;

export type Range = { from: number; to: number };
export function ranges(days: number, now = Date.now()): { current: Range; previous: Range } {
  return { current: { from: now - days * DAY, to: now }, previous: { from: now - 2 * days * DAY, to: now - days * DAY } };
}

export const num = (value: unknown) => Number(value ?? 0) || 0;

/** Per-day series: visitors, page views, bounce rate, average visit length, tool uses. */
export async function dailyAudience(range: Range) {
  const [views, visits, uses] = await Promise.all([
    query<{ day: string; visitors: number; pageviews: number }>(
      `SELECT ${dayExpr} AS day, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS pageviews FROM events WHERE type = 'pageview' AND ts >= ? AND ts < ? GROUP BY day ORDER BY day`,
      [range.from, range.to],
    ),
    // One row per visitor and day: how many pages and how long between the first and the last.
    query<{ day: string; visits: number; bounces: number; duration: number }>(
      `SELECT day, COUNT(*) AS visits, SUM(CASE WHEN pages = 1 THEN 1 ELSE 0 END) AS bounces, AVG(span) AS duration FROM (
         SELECT ${dayExpr} AS day, visitor, COUNT(*) AS pages, (MAX(ts) - MIN(ts)) / 1000.0 AS span FROM events
         WHERE type = 'pageview' AND ts >= ? AND ts < ? GROUP BY day, visitor
       ) GROUP BY day ORDER BY day`,
      [range.from, range.to],
    ),
    // A tool use is a result downloaded; before the collection started, a successful server call.
    query<{ day: string; uses: number }>(
      `SELECT ${dayExpr} AS day, COUNT(*) AS uses FROM events WHERE ts >= ? AND ts < ? AND (type = 'tool_download' OR (type = 'tool_api' AND origin = 'reports' AND CAST(name AS INTEGER) < 400)) GROUP BY day ORDER BY day`,
      [range.from, range.to],
    ),
  ]);
  const byDay = new Map<string, { day: string; visitors: number; pageviews: number; visits: number; bounces: number; duration: number; uses: number }>();
  const row = (day: string) => byDay.get(day) ?? byDay.set(day, { day, visitors: 0, pageviews: 0, visits: 0, bounces: 0, duration: 0, uses: 0 }).get(day)!;
  for (const item of views) Object.assign(row(item.day), { visitors: num(item.visitors), pageviews: num(item.pageviews) });
  for (const item of visits) Object.assign(row(item.day), { visits: num(item.visits), bounces: num(item.bounces), duration: num(item.duration) });
  for (const item of uses) row(item.day).uses = num(item.uses);
  return Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day));
}

/** Totals of a period, for the cards and their change. */
export async function audienceTotals(range: Range) {
  const [totals] = await query<{ visitors: number; pageviews: number }>(
    "SELECT COUNT(DISTINCT visitor || date((ts + 3600000) / 1000, 'unixepoch')) AS visitors, COUNT(*) AS pageviews FROM events WHERE type = 'pageview' AND ts >= ? AND ts < ?",
    [range.from, range.to],
  );
  const [visits] = await query<{ visits: number; bounces: number; duration: number }>(
    `SELECT COUNT(*) AS visits, SUM(CASE WHEN pages = 1 THEN 1 ELSE 0 END) AS bounces, AVG(span) AS duration FROM (
       SELECT visitor, ${dayExpr} AS day, COUNT(*) AS pages, (MAX(ts) - MIN(ts)) / 1000.0 AS span FROM events WHERE type = 'pageview' AND ts >= ? AND ts < ? GROUP BY visitor, day
     )`,
    [range.from, range.to],
  );
  const [uses] = await query<{ uses: number }>(
    "SELECT COUNT(*) AS uses FROM events WHERE ts >= ? AND ts < ? AND (type = 'tool_download' OR (type = 'tool_api' AND origin = 'reports' AND CAST(name AS INTEGER) < 400))",
    [range.from, range.to],
  );
  const visitCount = num(visits?.visits);
  return {
    visitors: num(totals?.visitors),
    pageviews: num(totals?.pageviews),
    bounceRate: visitCount ? Number(((num(visits?.bounces) / visitCount) * 100).toFixed(1)) : 0,
    duration: Math.round(num(visits?.duration)),
    toolUses: num(uses?.uses),
  };
}

/** Where visits come from: the first page of each visitor in a day. */
export async function sources(range: Range) {
  return (await query<{ source: string; visits: number }>(
    "SELECT source, COUNT(*) AS visits FROM events WHERE type = 'pageview' AND source IS NOT NULL AND source <> 'interne' AND ts >= ? AND ts < ? GROUP BY source ORDER BY visits DESC",
    [range.from, range.to],
  )).map((row) => ({ source: String(row.source), visits: num(row.visits) }));
}

async function distinctBy(column: 'country' | 'device' | 'lang', range: Range) {
  return (await query<{ key: string; visitors: number }>(
    `SELECT COALESCE(${column}, '') AS key, COUNT(DISTINCT visitor || ${dayExpr}) AS visitors FROM events WHERE type = 'pageview' AND ts >= ? AND ts < ? GROUP BY key ORDER BY visitors DESC`,
    [range.from, range.to],
  )).map((row) => ({ key: String(row.key), visitors: num(row.visitors) }));
}

export async function audienceBreakdown(range: Range) {
  const [countries, devices, langs, cities] = await Promise.all([
    distinctBy('country', range),
    distinctBy('device', range),
    distinctBy('lang', range),
    query<{ city: string; country: string; visitors: number }>(
      `SELECT city, country, COUNT(DISTINCT visitor || ${dayExpr}) AS visitors FROM events WHERE type = 'pageview' AND city IS NOT NULL AND city <> '' AND ts >= ? AND ts < ? GROUP BY city, country ORDER BY visitors DESC LIMIT 15`,
      [range.from, range.to],
    ),
  ]);
  return { countries, devices, langs, cities: cities.map((row) => ({ city: String(row.city), country: String(row.country ?? ''), visitors: num(row.visitors) })) };
}

/** Page views by weekday (0 = Sunday) and hour, Brazzaville time. */
export async function heatmap(range: Range) {
  return (await query<{ day: number; hour: number; views: number }>(
    `SELECT CAST(strftime('%w', ${LOCAL}) AS INTEGER) AS day, CAST(strftime('%H', ${LOCAL}) AS INTEGER) AS hour, COUNT(*) AS views FROM events WHERE type = 'pageview' AND ts >= ? AND ts < ? GROUP BY day, hour`,
    [range.from, range.to],
  )).map((row) => ({ day: num(row.day), hour: num(row.hour), views: num(row.views) }));
}

/**
 * One candle per day from the visitors of each hour: open = first hour (0h), close = last hour
 * (23h), high = busiest hour, low = quietest hour.
 */
export async function hourlyCandles(range: Range) {
  const rows = await query<{ day: string; hour: number; visitors: number }>(
    `SELECT ${dayExpr} AS day, CAST(strftime('%H', ${LOCAL}) AS INTEGER) AS hour, COUNT(DISTINCT visitor) AS visitors FROM events WHERE type = 'pageview' AND ts >= ? AND ts < ? GROUP BY day, hour`,
    [range.from, range.to],
  );
  const days = new Map<string, number[]>();
  for (const row of rows) {
    const hours = days.get(String(row.day)) ?? Array.from({ length: 24 }, () => 0);
    hours[num(row.hour)] = num(row.visitors);
    days.set(String(row.day), hours);
  }
  return Array.from(days.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([day, hours]) => ({
    day, open: hours[0], close: hours[23], high: Math.max(...hours), low: Math.min(...hours), peakHour: hours.indexOf(Math.max(...hours)),
  }));
}

export const percentile = (values: number[], ratio: number) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return Math.round(sorted[Math.min(sorted.length - 1, Math.floor(ratio * sorted.length))]);
};

/** Everything per tool: funnel, files, sizes, processing time and errors. */
export async function toolStats(range: Range) {
  const [perTool, apiDurations, funnel, daily, errors] = await Promise.all([
    query<Record<string, unknown>>(
      `SELECT tool,
         SUM(CASE WHEN type = 'pageview' THEN 1 ELSE 0 END) AS opens,
         COUNT(DISTINCT CASE WHEN type = 'pageview' THEN visitor || ${dayExpr} END) AS visitors,
         SUM(CASE WHEN type = 'tool_upload' THEN 1 ELSE 0 END) AS uploads,
         SUM(CASE WHEN type = 'tool_upload' THEN COALESCE(json_extract(meta, '$.files'), 1) ELSE 0 END) AS files,
         SUM(CASE WHEN type = 'tool_upload' THEN value ELSE 0 END) AS bytes,
         SUM(CASE WHEN type = 'tool_download' THEN 1 ELSE 0 END) AS downloads,
         AVG(CASE WHEN type = 'tool_download' AND json_extract(meta, '$.afterUpload') THEN value END) AS waitMs,
         SUM(CASE WHEN type = 'tool_error' THEN 1 ELSE 0 END) AS clientErrors,
         SUM(CASE WHEN type = 'tool_api' THEN 1 ELSE 0 END) AS apiCalls,
         SUM(CASE WHEN type = 'tool_api' AND CAST(name AS INTEGER) >= 400 THEN 1 ELSE 0 END) AS apiErrors
       FROM events WHERE tool IS NOT NULL AND ts >= ? AND ts < ? GROUP BY tool`,
      [range.from, range.to],
    ),
    query<{ tool: string; value: number }>("SELECT tool, value FROM events WHERE type = 'tool_api' AND value IS NOT NULL AND CAST(name AS INTEGER) < 400 AND ts >= ? AND ts < ?", [range.from, range.to]),
    query<Record<string, unknown>>(
      `SELECT
         COUNT(DISTINCT CASE WHEN type = 'pageview' THEN visitor || ${dayExpr} || tool END) AS opened,
         COUNT(DISTINCT CASE WHEN type = 'tool_upload' THEN visitor || ${dayExpr} || tool END) AS uploaded,
         COUNT(DISTINCT CASE WHEN type = 'tool_download' THEN visitor || ${dayExpr} || tool END) AS downloaded
       FROM events WHERE tool IS NOT NULL AND origin = 'tracker' AND ts >= ? AND ts < ?`,
      [range.from, range.to],
    ),
    query<{ day: string; tool: string; uses: number }>(
      `SELECT ${dayExpr} AS day, tool, COUNT(*) AS uses FROM events WHERE tool IS NOT NULL AND ts >= ? AND ts < ? AND (type = 'tool_download' OR (type = 'tool_api' AND origin = 'reports' AND CAST(name AS INTEGER) < 400)) GROUP BY day, tool ORDER BY day`,
      [range.from, range.to],
    ),
    query<{ tool: string; name: string; count: number }>("SELECT tool, name, COUNT(*) AS count FROM events WHERE type = 'tool_error' AND ts >= ? AND ts < ? GROUP BY tool, name ORDER BY count DESC LIMIT 10", [range.from, range.to]),
  ]);
  const durations = new Map<string, number[]>();
  for (const row of apiDurations) durations.set(String(row.tool), [...(durations.get(String(row.tool)) ?? []), num(row.value)]);
  const tools = perTool.map((row) => {
    const tool = String(row.tool);
    const uploads = num(row.uploads);
    const apiCalls = num(row.apiCalls);
    const values = durations.get(tool) ?? [];
    const failures = num(row.clientErrors) + num(row.apiErrors);
    const attempts = Math.max(uploads, apiCalls);
    return {
      tool,
      opens: num(row.opens),
      visitors: num(row.visitors),
      uploads,
      files: num(row.files),
      averageSize: num(row.files) ? Math.round(num(row.bytes) / num(row.files)) : null,
      downloads: num(row.downloads),
      waitMs: row.waitMs === null ? null : Math.round(num(row.waitMs)),
      apiCalls,
      processingP50: percentile(values, 0.5),
      processingP95: percentile(values, 0.95),
      errorRate: attempts ? Number(((failures / attempts) * 100).toFixed(1)) : null,
    };
  });
  return {
    tools,
    funnel: { opened: num(funnel[0]?.opened), uploaded: num(funnel[0]?.uploaded), downloaded: num(funnel[0]?.downloaded) },
    daily: daily.map((row) => ({ day: String(row.day), tool: String(row.tool), uses: num(row.uses) })),
    errors: errors.map((row) => ({ tool: String(row.tool), message: String(row.name ?? ''), count: num(row.count) })),
  };
}

/** When the site's own collection started, and how many rows came from the reports. */
export async function collectionInfo() {
  const [row] = await query<{ first: number | null; imported: number; own: number }>(
    "SELECT MIN(CASE WHEN origin <> 'reports' THEN ts END) AS first, SUM(CASE WHEN origin = 'reports' THEN 1 ELSE 0 END) AS imported, SUM(CASE WHEN origin <> 'reports' THEN 1 ELSE 0 END) AS own FROM events",
  );
  return { firstOwnEvent: row?.first ? new Date(num(row.first)).toISOString() : null, importedRows: num(row?.imported), ownRows: num(row?.own) };
}
