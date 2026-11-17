import 'server-only';

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createClient, type Client, type InValue } from '@libsql/client';

/**
 * Database of the Control Center: Turso (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN) in production,
 * a local SQLite file (.data/insights.db, ignored by git and Vercel) in development.
 * Returns null when nothing is configured: collection is then skipped and the pages say so.
 */

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

export function insightsConfigured(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL?.trim() || process.env.NODE_ENV !== 'production');
}

function connect(): Client | null {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL?.trim() || (process.env.NODE_ENV !== 'production' ? 'file:.data/insights.db' : '');
  if (!url) return null;
  if (url.startsWith('file:')) {
    // The folder must exist before SQLite creates the file.
    fs.mkdirSync('.data', { recursive: true });
  }
  client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined });
  return client;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    type TEXT NOT NULL,
    name TEXT,
    path TEXT NOT NULL,
    lang TEXT,
    visitor TEXT,
    country TEXT,
    city TEXT,
    device TEXT,
    source TEXT,
    tool TEXT,
    article TEXT,
    value REAL,
    meta TEXT,
    origin TEXT NOT NULL DEFAULT 'tracker'
  )`,
  'CREATE INDEX IF NOT EXISTS events_ts ON events (ts)',
  'CREATE INDEX IF NOT EXISTS events_type_ts ON events (type, ts)',
  'CREATE INDEX IF NOT EXISTS events_tool_ts ON events (tool, ts)',
  'CREATE INDEX IF NOT EXISTS events_article_ts ON events (article, ts)',
  'CREATE TABLE IF NOT EXISTS locks (name TEXT PRIMARY KEY, until INTEGER NOT NULL)',
  // Counters moved from Firestore (lib/turso-store.ts), November 2026.
  'CREATE TABLE IF NOT EXISTS article_views (slug TEXT NOT NULL, day TEXT NOT NULL, lang TEXT NOT NULL, views INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (slug, day, lang))',
  'CREATE INDEX IF NOT EXISTS article_views_day ON article_views (day)',
  'CREATE TABLE IF NOT EXISTS search_terms (day TEXT NOT NULL, term TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, term))',
  'CREATE TABLE IF NOT EXISTS counters (name TEXT PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0, updated INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS limits (id TEXT PRIMARY KEY, start INTEGER NOT NULL, count INTEGER NOT NULL, expires INTEGER NOT NULL)',
  'CREATE INDEX IF NOT EXISTS limits_expires ON limits (expires)',
  'CREATE TABLE IF NOT EXISTS pacing (name TEXT PRIMARY KEY, next_at INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS kv_cache (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires INTEGER NOT NULL)',
  // Control Center › Alertes (lib/alerts): settings of each rule, and every alert raised.
  'CREATE TABLE IF NOT EXISTS alert_rules (id TEXT PRIMARY KEY, enabled INTEGER NOT NULL, threshold REAL, channels TEXT NOT NULL, updated INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS alerts (id INTEGER PRIMARY KEY AUTOINCREMENT, ts INTEGER NOT NULL, rule TEXT NOT NULL, level TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, link TEXT, sent TEXT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS alerts_ts ON alerts (ts)',
];

/** The database, its table created on first use; null when not configured. */
export async function insightsDb(): Promise<Client | null> {
  const db = connect();
  if (!db) return null;
  schemaReady ??= db.batch(SCHEMA, 'write').then(() => undefined).catch((error) => { schemaReady = null; throw error; });
  await schemaReady;
  return db;
}

export type Row = Record<string, InValue>;

export async function query<T = Record<string, unknown>>(sql: string, args: InValue[] = []): Promise<T[]> {
  const db = await insightsDb();
  if (!db) return [];
  const result = await db.execute({ sql, args });
  return result.rows.map((row) => Object.fromEntries(result.columns.map((column) => [column, row[column]]))) as T[];
}

/**
 * Anonymous visitor id: a hash of the day, the IP and the browser with a secret salt. It changes
 * every day and the IP is never stored, so no one can be followed from one day to the next.
 */
export function visitorId(day: string, ip: string, userAgent: string): string {
  const salt = process.env.INSIGHTS_SALT?.trim() || process.env.CRON_SECRET?.trim() || 'jchub-insights';
  return createHash('sha256').update(`${salt}:${day}:${ip}:${userAgent}`).digest('base64url').slice(0, 16);
}

/** Events are kept 13 months: enough to compare a month with the same one a year before. */
export const EVENT_RETENTION_DAYS = 395;

export async function purgeOldEvents(now = Date.now()): Promise<number> {
  const db = await insightsDb();
  if (!db) return 0;
  const result = await db.execute({ sql: 'DELETE FROM events WHERE ts < ?', args: [now - EVENT_RETENTION_DAYS * 86400_000] });
  // Expired rate limits and cache entries are useless once past.
  await db.batch([
    { sql: 'DELETE FROM limits WHERE expires < ?', args: [now] },
    { sql: 'DELETE FROM kv_cache WHERE expires < ?', args: [now] },
    { sql: 'DELETE FROM alerts WHERE ts < ?', args: [now - EVENT_RETENTION_DAYS * 86400_000] },
  ], 'write');
  return result.rowsAffected;
}

/**
 * Takes a named lock for `ms` milliseconds, shared by every server and the local machine (the
 * lock lives in the database). False when someone else holds it.
 */
export async function takeLock(name: string, ms: number): Promise<boolean> {
  const db = await insightsDb();
  if (!db) return false;
  const now = Date.now();
  const result = await db.execute({
    sql: 'INSERT INTO locks (name, until) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET until = excluded.until WHERE locks.until < ?',
    args: [name, now + ms, now],
  });
  return result.rowsAffected > 0;
}

export async function releaseLock(name: string): Promise<void> {
  const db = await insightsDb();
  await db?.execute({ sql: 'DELETE FROM locks WHERE name = ?', args: [name] });
}
