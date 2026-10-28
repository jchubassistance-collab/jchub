/**
 * Reading the reports for the admin. The admin page asks again every 15 seconds: requests already
 * read stay in this instance's memory, and each refresh only downloads the last minutes of the
 * current day, so watching the page costs a few kilobytes per refresh instead of the whole period.
 */
import {
  dayKey, ERROR_RETENTION_DAYS, errorReport, isReportId, matchesError, matchesRequest, PERIODS, REQUEST_RETENTION_DAYS,
  reportIdTime, reportKeyAt, requestReport, requestStats, type ErrorReport, type ReportPeriod, type RequestFilters,
  type RequestKind, type StoredError, type StoredFingerprint, type StoredRequest,
} from '@/lib/reports/core';
import { rtdbGet, rtdbUpdate } from '@/lib/reports/rtdb';

/** Most entries read for one day: beyond it the oldest of the day are left out (flagged to the admin). */
const DAY_LIMIT = 5000;
const ERROR_LIMIT = 2000;
/** A route can answer up to 5 minutes after its request: refreshes re-read that window. */
const LATE_RESULT_WINDOW = 6 * 60 * 1000;
const FULL_REFRESH = 10 * 60 * 1000;
const MIN_REFRESH = 4000;
/** The admin can wait longer than a visitor: a cold instance first fetches its access token. */
const READ_TIMEOUT = 15_000;

type DayCache = { entries: Record<string, StoredRequest>; fetchedAt: number; fullAt: number; capped: boolean };
type ErrorCache = { entries: Record<string, StoredError>; from: number; fetchedAt: number; fullAt: number };

const days = new Map<string, DayCache>();
let errorCache: ErrorCache | null = null;

async function loadDay(day: string, now: number): Promise<DayCache> {
  const cached = days.get(day);
  const current = day >= dayKey(now - LATE_RESULT_WINDOW);
  if (cached && (now - cached.fetchedAt < MIN_REFRESH || (!current && now - cached.fetchedAt < FULL_REFRESH))) return cached;
  if (cached && current && now - cached.fullAt < FULL_REFRESH) {
    const recent = await rtdbGet<Record<string, StoredRequest>>(`reports/requests/${day}`, {
      orderBy: '$key', startAt: reportKeyAt('r', cached.fetchedAt - LATE_RESULT_WINDOW),
    }, READ_TIMEOUT);
    Object.assign(cached.entries, recent || {});
    cached.fetchedAt = now;
    return cached;
  }
  const entries = await rtdbGet<Record<string, StoredRequest>>(`reports/requests/${day}`, { orderBy: '$key', limitToLast: DAY_LIMIT }, READ_TIMEOUT) || {};
  const fresh = { entries, fetchedAt: now, fullAt: now, capped: Object.keys(entries).length >= DAY_LIMIT };
  days.set(day, fresh);
  // Days past the retention are never asked again.
  const oldest = dayKey(now - (REQUEST_RETENTION_DAYS + 1) * 86400e3);
  Array.from(days.keys()).forEach((key) => { if (key < oldest) days.delete(key); });
  return fresh;
}

function daysBetween(since: number, now: number): string[] {
  const result: string[] = [];
  for (let time = since; dayKey(time) <= dayKey(now); time += 86400e3) result.push(dayKey(time));
  if (result[result.length - 1] !== dayKey(now)) result.push(dayKey(now));
  return Array.from(new Set(result));
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  return { items: items.slice((current - 1) * pageSize, current * pageSize), page: current };
}

export type ListOptions = { period: ReportPeriod; page: number; pageSize: number; now?: number };

export async function listRequests(options: ListOptions & { filters: RequestFilters }) {
  const now = options.now ?? Date.now();
  const since = now - PERIODS[options.period];
  const loaded = await Promise.all(daysBetween(since, now).map((day) => loadDay(day, now)));
  const firstKey = reportKeyAt('r', since);
  const all = loaded.flatMap((cache) => Object.keys(cache.entries)
    .filter((id) => id >= firstKey && isReportId(id, 'r'))
    .map((id) => requestReport(id, cache.entries[id])))
    .sort((a, b) => (a.id < b.id ? 1 : -1));
  const filtered = all.filter((report) => matchesRequest(report, options.filters));
  const countries = Array.from(new Set(all.map((report) => report.country).filter(Boolean))).sort();
  return {
    ...paginate(filtered, options.page, options.pageSize),
    total: filtered.length,
    stats: requestStats(filtered),
    countries,
    truncated: loaded.some((cache) => cache.capped),
  };
}

async function loadErrors(since: number, now: number): Promise<ErrorCache> {
  if (errorCache && since >= errorCache.from && now - errorCache.fullAt < FULL_REFRESH) {
    if (now - errorCache.fetchedAt >= MIN_REFRESH) {
      // Errors never change once written: only the new ones are downloaded.
      const recent = await rtdbGet<Record<string, StoredError>>('reports/errors', { orderBy: '$key', startAt: reportKeyAt('e', errorCache.fetchedAt - 60_000) }, READ_TIMEOUT);
      Object.assign(errorCache.entries, recent || {});
      errorCache.fetchedAt = now;
    }
    return errorCache;
  }
  const entries = await rtdbGet<Record<string, StoredError>>('reports/errors', { orderBy: '$key', startAt: reportKeyAt('e', since), limitToLast: ERROR_LIMIT }, READ_TIMEOUT) || {};
  errorCache = { entries, from: since, fetchedAt: now, fullAt: now };
  return errorCache;
}


export async function listErrors(options: ListOptions & { filters: { kind?: RequestKind | ''; country?: string; search?: string } }) {
  const now = options.now ?? Date.now();
  const since = now - PERIODS[options.period];
  const cache = await loadErrors(since, now);
  const firstKey = reportKeyAt('e', since);
  const all = Object.keys(cache.entries)
    .filter((id) => id >= firstKey && isReportId(id, 'e'))
    .map((id) => errorReport(id, cache.entries[id]))
    .sort((a, b) => (a.id < b.id ? 1 : -1));
  const filtered = all.filter((report) => matchesError(report, options.filters));
  const page = paginate(filtered, options.page, options.pageSize);
  return {
    // The stack comes with the detail only.
    items: page.items.map((item) => ({ ...item, stack: '' })),
    page: page.page,
    total: filtered.length,
    countries: Array.from(new Set(all.map((report) => report.country).filter(Boolean))).sort(),
    truncated: Object.keys(cache.entries).length >= ERROR_LIMIT,
  };
}

/** A request with its errors, or an error with its request and the other errors of that request. */
export async function getReport(id: string) {
  let focus: ErrorReport | null = null;
  let requestId = isReportId(id, 'r') ? id : '';
  if (isReportId(id, 'e')) {
    const stored = await rtdbGet<StoredError>(`reports/errors/${id}`, undefined, READ_TIMEOUT);
    if (!stored) return null;
    focus = errorReport(id, stored);
    requestId = focus.requestId;
  }
  const storedRequest = requestId
    ? await rtdbGet<StoredRequest>(`reports/requests/${dayKey(reportIdTime(requestId))}/${requestId}`, undefined, READ_TIMEOUT)
    : null;
  if (!storedRequest && !focus) return null;
  const request = storedRequest ? requestReport(requestId, storedRequest) : null;
  const errorIds = Array.from(new Set([...(request?.errorIds || []), ...(focus ? [focus.id] : [])])).sort();
  const errors = (await Promise.all(errorIds.map(async (errorId) => {
    if (focus && errorId === focus.id) return focus;
    const stored = await rtdbGet<StoredError>(`reports/errors/${errorId}`, undefined, READ_TIMEOUT).catch(() => null);
    return stored ? errorReport(errorId, stored) : null;
  }))).filter((item): item is ErrorReport => Boolean(item));
  const fingerprints = Array.from(new Set(errors.map((error) => error.fingerprint).filter(Boolean)));
  const occurrences: Record<string, { count: number; first: number | null; last: number | null; mailed: number | null }> = {};
  await Promise.all(fingerprints.map(async (fingerprint) => {
    const stored = await rtdbGet<StoredFingerprint>(`reports/fingerprints/${fingerprint}`, undefined, READ_TIMEOUT).catch(() => null);
    if (stored) occurrences[fingerprint] = { count: stored.n || 0, first: stored.first || null, last: stored.last || null, mailed: stored.mailed || null };
  }));
  return { request, errors, focus: id, occurrences };
}

/** Deletes requests older than 30 days, errors and their counters older than 90 days. */
export async function cleanUpReports(now = Date.now()) {
  const removals: Record<string, null> = {};
  const lastRequestDay = dayKey(now - REQUEST_RETENTION_DAYS * 86400e3);
  const storedDays = await rtdbGet<Record<string, boolean>>('reports/requests', { shallow: true }, READ_TIMEOUT) || {};
  const oldDays = Object.keys(storedDays).filter((day) => day < lastRequestDay);
  oldDays.forEach((day) => { removals[`reports/requests/${day}`] = null; });

  const errorLimit = now - ERROR_RETENTION_DAYS * 86400e3;
  const oldErrors = await rtdbGet<Record<string, unknown>>('reports/errors', { orderBy: '$key', endAt: reportKeyAt('e', errorLimit), limitToFirst: 1000 }, READ_TIMEOUT) || {};
  Object.keys(oldErrors).forEach((id) => { removals[`reports/errors/${id}`] = null; });

  const fingerprints = await rtdbGet<Record<string, StoredFingerprint>>('reports/fingerprints', undefined, READ_TIMEOUT) || {};
  const oldFingerprints = Object.keys(fingerprints).filter((key) => (fingerprints[key]?.last || 0) < errorLimit);
  oldFingerprints.forEach((key) => { removals[`reports/fingerprints/${key}`] = null; });

  const keys = Object.keys(removals);
  for (let index = 0; index < keys.length; index += 500) {
    const chunk: Record<string, null> = {};
    keys.slice(index, index + 500).forEach((key) => { chunk[key] = null; });
    await rtdbUpdate('', chunk, 20000);
  }
  return { days: oldDays.length, errors: Object.keys(oldErrors).length, fingerprints: oldFingerprints.length };
}
