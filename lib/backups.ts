import 'server-only';

import { gunzipSync, gzipSync, strFromU8, strToU8 } from 'fflate';
import { del, get, list, put } from '@vercel/blob';
import {
  DocumentReference, GeoPoint, Timestamp,
  type CollectionReference, type DocumentData, type Firestore,
} from 'firebase-admin/firestore';
import type { InValue } from '@libsql/client';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { insightsDb } from '@/lib/insights/db';

/**
 * Backups of the site data: every Firestore collection (with its subcollections) and every
 * Turso table, in one gzipped JSON file kept private in Vercel Blob (backups/…). The cron
 * /api/cron/backup makes one each day, the admin can make one or restore one from
 * /admin/sauvegardes. A restore first saves the current state, so it can be undone.
 */

export const BACKUP_PREFIX = 'backups/';
export const BACKUP_RETENTION_DAYS = 30;
const FORMAT_VERSION = 1;

/**
 * Left out: caches, quotas and rate limits (names starting with _), and the 2FA secrets
 * (adminSecurity): a backup must not hold them, and a restore must not bring back an old secret.
 */
export function isBackedUpCollection(name: string): boolean {
  return !name.startsWith('_') && name !== 'adminSecurity';
}

/** Turso tables rebuilt on their own (limits, caches, locks): not worth keeping or restoring. */
const SKIPPED_TABLES = new Set(['limits', 'pacing', 'kv_cache', 'locks']);

export type BackupTrigger = 'cron' | 'manual' | 'pre-restore';

type Encoded = null | boolean | number | string | Encoded[] | { [key: string]: Encoded };
/** data is null for a document that does not exist but has subcollections. */
type DocumentDump = { id: string; data: Record<string, Encoded> | null; sub?: Record<string, DocumentDump[]> };
type TableDump = { sql: string; columns: string[]; rows: Encoded[][] };

export type BackupFile = {
  version: number;
  createdAt: string;
  trigger: BackupTrigger;
  by: string;
  firestore: Record<string, DocumentDump[]>;
  turso: Record<string, TableDump>;
};

export type BackupSummary = {
  id: string;
  pathname: string;
  url: string;
  size: number;
  createdAt: string;
  trigger: BackupTrigger;
};

export type BackupContents = {
  firestore: { name: string; documents: number }[];
  turso: { name: string; rows: number }[];
};

// ---------------------------------------------------------------------------------------------
// Firestore values <-> JSON

function encode(value: unknown): Encoded {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : { __type: 'number', value: String(value) };
  if (typeof value === 'bigint') return { __type: 'bigint', value: value.toString() };
  if (value instanceof Timestamp) return { __type: 'timestamp', seconds: value.seconds, nanoseconds: value.nanoseconds };
  if (value instanceof Date) return { __type: 'timestamp', seconds: Math.floor(value.getTime() / 1000), nanoseconds: (value.getTime() % 1000) * 1e6 };
  if (value instanceof GeoPoint) return { __type: 'geopoint', latitude: value.latitude, longitude: value.longitude };
  if (value instanceof DocumentReference) return { __type: 'ref', path: value.path };
  if (value instanceof Uint8Array) return { __type: 'bytes', base64: Buffer.from(value).toString('base64') };
  if (value instanceof ArrayBuffer) return { __type: 'bytes', base64: Buffer.from(new Uint8Array(value)).toString('base64') };
  if (Array.isArray(value)) return value.map(encode);
  if (typeof value === 'object') {
    // Vector values and other special types expose toArray()/toJSON(): kept as plain data.
    const record = value as Record<string, unknown>;
    if (typeof record.toArray === 'function' && value.constructor?.name === 'VectorValue') {
      return { __type: 'vector', values: (record.toArray as () => number[])() };
    }
    return Object.fromEntries(Object.entries(record).map(([key, item]) => [key, encode(item)]));
  }
  return String(value);
}

function decode(value: Encoded, db: Firestore): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => decode(item, db));
  switch (value.__type) {
    case 'timestamp': return new Timestamp(Number(value.seconds), Number(value.nanoseconds));
    case 'geopoint': return new GeoPoint(Number(value.latitude), Number(value.longitude));
    case 'ref': return db.doc(String(value.path));
    case 'bytes': return Buffer.from(String(value.base64), 'base64');
    case 'number': return Number(value.value);
    case 'bigint': return Number(value.value);
    case 'vector': return Array.isArray(value.values) ? value.values.map(Number) : [];
    default: return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, decode(item, db)]));
  }
}

// ---------------------------------------------------------------------------------------------
// Export

/** Runs `task` over `items`, `limit` at a time. */
async function mapLimit<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index++;
      results[current] = await task(items[current]);
    }
  }));
  return results;
}

async function dumpCollection(collection: CollectionReference): Promise<DocumentDump[]> {
  const [snapshot, references] = await Promise.all([collection.get(), collection.listDocuments()]);
  const data = new Map(snapshot.docs.map((document) => [document.id, document.data()]));
  // listDocuments also gives the documents that only hold subcollections, which get() leaves out.
  const all = new Map<string, DocumentReference>(references.map((reference) => [reference.id, reference]));
  snapshot.docs.forEach((document) => all.set(document.id, document.ref));
  const dumps = await mapLimit(Array.from(all.values()), 25, async (reference) => {
    const saved = data.get(reference.id);
    const dump: DocumentDump = { id: reference.id, data: saved ? encode(saved) as Record<string, Encoded> : null };
    const subcollections = await reference.listCollections();
    if (subcollections.length) {
      dump.sub = {};
      for (const sub of subcollections) dump.sub[sub.id] = await dumpCollection(sub);
    }
    return dump;
  });
  return dumps.filter((dump) => dump.data || dump.sub);
}

async function dumpFirestore(): Promise<Record<string, DocumentDump[]>> {
  if (!hasFirebaseAdminConfig()) return {};
  const db = getAdminDb();
  const collections = (await db.listCollections()).filter((collection) => isBackedUpCollection(collection.id));
  const result: Record<string, DocumentDump[]> = {};
  for (const collection of collections) result[collection.id] = await dumpCollection(collection);
  return result;
}

function encodeCell(value: unknown): Encoded {
  if (value instanceof ArrayBuffer) return { __type: 'bytes', base64: Buffer.from(new Uint8Array(value)).toString('base64') };
  if (typeof value === 'bigint') return { __type: 'bigint', value: value.toString() };
  return value === undefined ? null : value as Encoded;
}

function decodeCell(value: Encoded): InValue {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (value.__type === 'bytes') return new Uint8Array(Buffer.from(String(value.base64), 'base64'));
    if (value.__type === 'bigint') return BigInt(String(value.value));
  }
  return value as InValue;
}

const quoteName = (name: string) => `"${name.replace(/"/g, '""')}"`;

async function dumpTurso(): Promise<Record<string, TableDump>> {
  const client = await insightsDb();
  if (!client) return {};
  const tables = await client.execute("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream%'");
  const result: Record<string, TableDump> = {};
  for (const table of tables.rows) {
    const name = String(table.name);
    if (SKIPPED_TABLES.has(name)) continue;
    const dump: TableDump = { sql: String(table.sql || ''), columns: [], rows: [] };
    // Read by pages of rowid, so a large table (events) never needs one huge response.
    let after = -Infinity;
    for (;;) {
      const page = await client.execute({ sql: `SELECT rowid AS __rowid, * FROM ${quoteName(name)} WHERE rowid > ? ORDER BY rowid LIMIT 5000`, args: [Number.isFinite(after) ? after : -9007199254740991] });
      if (!dump.columns.length) dump.columns = page.columns.filter((column) => column !== '__rowid');
      for (const row of page.rows) dump.rows.push(dump.columns.map((column) => encodeCell(row[column])));
      if (page.rows.length < 5000) break;
      after = Number(page.rows[page.rows.length - 1].__rowid);
    }
    result[name] = dump;
  }
  return result;
}

// ---------------------------------------------------------------------------------------------
// Storage

function backupId(date: Date, trigger: BackupTrigger) {
  return `${date.toISOString().replace(/[:.]/g, '-')}_${trigger}`;
}

function parseBackupPath(pathname: string): { id: string; createdAt: string; trigger: BackupTrigger } | null {
  const match = pathname.match(/^backups\/((\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z_(cron|manual|pre-restore))\.json\.gz$/);
  if (!match) return null;
  return { id: match[1], createdAt: `${match[2]}T${match[3]}:${match[4]}:${match[5]}.${match[6]}Z`, trigger: match[7] as BackupTrigger };
}

export function hasBackupStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function countContents(file: Pick<BackupFile, 'firestore' | 'turso'>): BackupContents {
  const countDocuments = (documents: DocumentDump[]): number => documents.reduce((total, document) => total + (document.data ? 1 : 0) + Object.values(document.sub || {}).reduce((sum, sub) => sum + countDocuments(sub), 0), 0);
  return {
    firestore: Object.entries(file.firestore).map(([name, documents]) => ({ name, documents: countDocuments(documents) })).sort((a, b) => a.name.localeCompare(b.name)),
    turso: Object.entries(file.turso).map(([name, table]) => ({ name, rows: table.rows.length })).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/** Makes a backup now and stores it; returns its summary and contents. */
export async function createBackup(trigger: BackupTrigger, by: string): Promise<BackupSummary & { contents: BackupContents }> {
  if (!hasBackupStorage()) throw new Error('BLOB_READ_WRITE_TOKEN manquant : aucun stockage pour les sauvegardes.');
  const createdAt = new Date();
  const [firestore, turso] = await Promise.all([dumpFirestore(), dumpTurso()]);
  const file: BackupFile = { version: FORMAT_VERSION, createdAt: createdAt.toISOString(), trigger, by, firestore, turso };
  const body = Buffer.from(gzipSync(strToU8(JSON.stringify(file)), { level: 6 }));
  const id = backupId(createdAt, trigger);
  const blob = await put(`${BACKUP_PREFIX}${id}.json.gz`, body, { access: 'private', contentType: 'application/gzip', addRandomSuffix: false, allowOverwrite: false });
  return { id, pathname: blob.pathname, url: blob.url, size: body.length, createdAt: file.createdAt, trigger, contents: countContents(file) };
}

/** Stored backups, newest first. */
export async function listBackups(): Promise<BackupSummary[]> {
  if (!hasBackupStorage()) return [];
  const backups: BackupSummary[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: BACKUP_PREFIX, limit: 1000, ...(cursor ? { cursor } : {}) });
    for (const blob of page.blobs) {
      const parsed = parseBackupPath(blob.pathname);
      if (parsed) backups.push({ ...parsed, pathname: blob.pathname, url: blob.url, size: blob.size });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findBackup(id: string): Promise<BackupSummary | null> {
  return (await listBackups()).find((backup) => backup.id === id) || null;
}

export async function readBackup(backup: BackupSummary): Promise<BackupFile> {
  const blob = await get(backup.url, { access: 'private', useCache: false });
  if (!blob || blob.statusCode !== 200) throw new Error('Sauvegarde introuvable dans le stockage.');
  const compressed = new Uint8Array(await new Response(blob.stream).arrayBuffer());
  const file = JSON.parse(strFromU8(gunzipSync(compressed))) as BackupFile;
  if (file.version !== FORMAT_VERSION || typeof file.firestore !== 'object' || typeof file.turso !== 'object') throw new Error('Format de sauvegarde inconnu.');
  return file;
}

/** The raw gzipped file, for a download from the admin. */
export async function backupStream(backup: BackupSummary): Promise<ReadableStream<Uint8Array>> {
  const blob = await get(backup.url, { access: 'private', useCache: false });
  if (!blob || blob.statusCode !== 200) throw new Error('Sauvegarde introuvable dans le stockage.');
  return blob.stream;
}

/** Removes the backups older than the retention; the latest one always stays. */
export async function purgeOldBackups(now = Date.now()): Promise<number> {
  const backups = await listBackups();
  const cutoff = new Date(now - BACKUP_RETENTION_DAYS * 86400e3).toISOString();
  const expired = backups.slice(1).filter((backup) => backup.createdAt < cutoff);
  if (expired.length) await del(expired.map((backup) => backup.url));
  return expired.length;
}

export async function deleteBackup(backup: BackupSummary): Promise<void> {
  await del(backup.url);
}

// ---------------------------------------------------------------------------------------------
// Restore

async function restoreCollection(db: Firestore, collection: CollectionReference, documents: DocumentDump[]) {
  const wanted = new Set(documents.map((document) => document.id));
  // Documents created since the backup go, with their subcollections.
  const current = await collection.listDocuments();
  for (const reference of current) {
    if (!wanted.has(reference.id)) await db.recursiveDelete(reference);
  }
  const writer = db.bulkWriter();
  writer.onWriteError((error) => error.failedAttempts < 5);
  for (const document of documents) {
    if (document.data) void writer.set(collection.doc(document.id), decode(document.data, db) as DocumentData);
    // A document absent from the backup but present now (it only held subcollections then) goes.
    else void writer.delete(collection.doc(document.id));
  }
  await writer.close();
  for (const document of documents) {
    const reference = collection.doc(document.id);
    const backedUpSubs = document.sub || {};
    // A subcollection created since the backup is emptied too.
    for (const sub of await reference.listCollections()) {
      if (!(sub.id in backedUpSubs)) await db.recursiveDelete(sub);
    }
    for (const [name, subDocuments] of Object.entries(backedUpSubs)) await restoreCollection(db, reference.collection(name), subDocuments);
  }
}

async function restoreTable(name: string, table: TableDump) {
  const client = await insightsDb();
  if (!client) throw new Error('Turso indisponible.');
  const quoted = quoteName(name);
  const columns = table.columns.map(quoteName).join(', ');
  const placeholders = table.columns.map(() => '?').join(', ');
  const exists = await client.execute({ sql: "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?", args: [name] });
  const setup: { sql: string; args: InValue[] }[] = [];
  if (!exists.rows.length && table.sql) setup.push({ sql: table.sql, args: [] });
  setup.push({ sql: `DELETE FROM ${quoted}`, args: [] });
  if (!table.columns.length) { await client.batch(setup, 'write'); return; }
  const insert = `INSERT INTO ${quoted} (${columns}) VALUES (${placeholders})`;
  const inserts = table.rows.map((row) => ({ sql: insert, args: row.map(decodeCell) }));
  // A small table is restored in one transaction (all or nothing); a large one (events) by
  // batches of 1000 rows, as one request could not carry it.
  if (inserts.length <= 1000) { await client.batch([...setup, ...inserts], 'write'); return; }
  await client.batch(setup, 'write');
  for (let index = 0; index < inserts.length; index += 1000) await client.batch(inserts.slice(index, index + 1000), 'write');
}

export type RestoreScope = { firestore: string[]; turso: string[] };

/**
 * Puts back the chosen collections and tables as they were in `file`: documents and rows
 * added since then are removed, changed ones go back to their saved version.
 */
export async function restoreBackup(file: BackupFile, scope: RestoreScope): Promise<{ firestore: string[]; turso: string[] }> {
  const done = { firestore: [] as string[], turso: [] as string[] };
  if (scope.firestore.length) {
    if (!hasFirebaseAdminConfig()) throw new Error('Firebase indisponible.');
    const db = getAdminDb();
    for (const name of scope.firestore) {
      if (!isBackedUpCollection(name) || !(name in file.firestore)) continue;
      await restoreCollection(db, db.collection(name), file.firestore[name]);
      done.firestore.push(name);
    }
  }
  for (const name of scope.turso) {
    if (SKIPPED_TABLES.has(name) || !(name in file.turso)) continue;
    await restoreTable(name, file.turso[name]);
    done.turso.push(name);
  }
  return done;
}
