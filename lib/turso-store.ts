import 'server-only';

import { insightsDb } from '@/lib/insights/db';

/**
 * Counters, limits and caches kept in Turso instead of Firestore (November 2026): each one is a
 * single atomic SQL statement where Firestore needed a transaction (one read and one write).
 * Every function returns null when Turso is unavailable, so the caller can fall back to its
 * former Firestore code and nothing breaks.
 */

async function db() {
  try {
    return await insightsDb();
  } catch (error) {
    console.error('[turso-store] Base indisponible :', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Counts one use of `id` in a window of `windowMs` and says whether `limit` is respected.
 * The window starts with the first use and resets once it has passed. null: Turso unavailable.
 */
export async function consumeLimit(id: string, limit: number, windowMs: number, now = Date.now()): Promise<{ allowed: boolean; count: number; resetAt: number } | null> {
  const client = await db();
  if (!client) return null;
  try {
    const result = await client.execute({
      sql: `INSERT INTO limits (id, start, count, expires) VALUES (?, ?, 1, ?)
            ON CONFLICT(id) DO UPDATE SET
              count = CASE WHEN limits.start + ? > excluded.start THEN limits.count + 1 ELSE 1 END,
              start = CASE WHEN limits.start + ? > excluded.start THEN limits.start ELSE excluded.start END,
              expires = excluded.expires
            RETURNING count, start`,
      args: [id, now, now + windowMs * 2, windowMs, windowMs],
    });
    const count = Number(result.rows[0]?.count ?? 1);
    const start = Number(result.rows[0]?.start ?? now);
    return { allowed: count <= limit, count, resetAt: start + windowMs };
  } catch (error) {
    console.error('[turso-store] Limite non comptée :', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Reserves the next call slot of a paced service (`spacingMs` between calls). Returns the wait in
 * ms, or 'full' when the queue is longer than `maxWaitMs`. null: Turso unavailable.
 */
export async function reserveSlot(name: string, spacingMs: number, maxWaitMs: number, now = Date.now()): Promise<number | 'full' | null> {
  const client = await db();
  if (!client) return null;
  try {
    const result = await client.execute({
      sql: `INSERT INTO pacing (name, next_at) VALUES (?, ?)
            ON CONFLICT(name) DO UPDATE SET next_at = MAX(pacing.next_at, ?) + ?
            WHERE MAX(pacing.next_at, ?) - ? <= ?
            RETURNING next_at`,
      args: [name, now + spacingMs, now, spacingMs, now, now, maxWaitMs],
    });
    if (!result.rows.length) return 'full';
    return Math.max(0, Number(result.rows[0].next_at) - spacingMs - now);
  } catch {
    return null;
  }
}

/** Keeps a paced service closed until `until` (after a 429). */
export async function holdSlot(name: string, until: number): Promise<boolean> {
  const client = await db();
  if (!client) return false;
  try {
    await client.execute({ sql: 'INSERT INTO pacing (name, next_at) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET next_at = MAX(pacing.next_at, excluded.next_at)', args: [name, until] });
    return true;
  } catch {
    return false;
  }
}

/** A cached JSON value, or undefined when missing or expired; null when Turso is unavailable. */
export async function cacheGet<T>(key: string, now = Date.now()): Promise<T | undefined | null> {
  const client = await db();
  if (!client) return null;
  try {
    const result = await client.execute({ sql: 'SELECT value FROM kv_cache WHERE key = ? AND expires > ?', args: [key, now] });
    return result.rows.length ? JSON.parse(String(result.rows[0].value)) as T : undefined;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlMs: number, now = Date.now()): Promise<boolean> {
  const client = await db();
  if (!client) return false;
  try {
    await client.execute({ sql: 'INSERT INTO kv_cache (key, value, expires) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires = excluded.expires', args: [key, JSON.stringify(value), now + ttlMs] });
    return true;
  } catch {
    return false;
  }
}

/** Adds `by` to a named counter and returns its new value; null when Turso is unavailable. */
export async function incrementCounter(name: string, by = 1): Promise<number | null> {
  const client = await db();
  if (!client) return null;
  try {
    const result = await client.execute({ sql: 'INSERT INTO counters (name, value, updated) VALUES (?, ?, ?) ON CONFLICT(name) DO UPDATE SET value = counters.value + excluded.value, updated = excluded.updated RETURNING value', args: [name, by, Date.now()] });
    return Number(result.rows[0]?.value ?? by);
  } catch {
    return null;
  }
}

/** One view of an article, per day and language. Returns its new total; null when unavailable. */
export async function recordArticleView(slug: string, lang: 'fr' | 'en', day = new Date().toISOString().slice(0, 10)): Promise<number | null> {
  const client = await db();
  if (!client) return null;
  try {
    await client.execute({ sql: 'INSERT INTO article_views (slug, day, lang, views) VALUES (?, ?, ?, 1) ON CONFLICT(slug, day, lang) DO UPDATE SET views = article_views.views + 1', args: [slug, day, lang] });
    const total = await client.execute({ sql: 'SELECT SUM(views) AS views FROM article_views WHERE slug = ?', args: [slug] });
    return Number(total.rows[0]?.views ?? 0);
  } catch {
    return null;
  }
}

/** All-time views of each article; null when Turso is unavailable. */
export async function articleViewTotals(slugs: string[]): Promise<Map<string, number> | null> {
  const client = await db();
  if (!client) return null;
  if (!slugs.length) return new Map();
  try {
    const result = await client.execute({ sql: `SELECT slug, SUM(views) AS views FROM article_views WHERE slug IN (${slugs.map(() => '?').join(', ')}) GROUP BY slug`, args: slugs });
    return new Map(result.rows.map((row) => [String(row.slug), Number(row.views)]));
  } catch {
    return null;
  }
}

/** Views per day and language of these articles since `since` (YYYY-MM-DD); null when unavailable. */
export async function articleDailyViews(slugs: string[], since: string): Promise<{ slug: string; day: string; lang: string; views: number }[] | null> {
  const client = await db();
  if (!client) return null;
  if (!slugs.length) return [];
  try {
    const result = await client.execute({ sql: `SELECT slug, day, lang, views FROM article_views WHERE day >= ? AND slug IN (${slugs.map(() => '?').join(', ')})`, args: [since, ...slugs] });
    return result.rows.map((row) => ({ slug: String(row.slug), day: String(row.day), lang: String(row.lang), views: Number(row.views) }));
  } catch {
    return null;
  }
}

/** One search of the menu; null when Turso is unavailable. */
export async function recordSearchTerm(term: string, day = new Date().toISOString().slice(0, 10)): Promise<boolean | null> {
  const client = await db();
  if (!client) return null;
  try {
    await client.execute({ sql: 'INSERT INTO search_terms (day, term, count) VALUES (?, ?, 1) ON CONFLICT(day, term) DO UPDATE SET count = search_terms.count + 1', args: [day, term] });
    return true;
  } catch {
    return null;
  }
}

/** Searched terms since `since`, most searched first; null when Turso is unavailable. */
export async function searchTermTotals(since: string, limit = 500): Promise<{ term: string; count: number }[] | null> {
  const client = await db();
  if (!client) return null;
  try {
    const result = await client.execute({ sql: 'SELECT term, SUM(count) AS count FROM search_terms WHERE day >= ? GROUP BY term ORDER BY count DESC LIMIT ?', args: [since, limit] });
    return result.rows.map((row) => ({ term: String(row.term), count: Number(row.count) }));
  } catch {
    return null;
  }
}
