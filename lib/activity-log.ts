import 'server-only';

import { after, type NextRequest } from 'next/server';
import { Timestamp, type Query } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { clientIpFromHeaders } from '@/lib/client-ip';
import { describeIntent, redactPath, truncate } from '@/lib/reports/core';

/**
 * Activity log of the admin, CM and writing spaces: who changed or removed what, and when.
 * Every request that changes data (anything but GET/HEAD/OPTIONS) made with a session is
 * written here by lib/admin-auth.ts, plus sign-ins, sign-outs, backups and restores.
 * Kept a year (cleaned by /api/cron/cleanup-reports), unlike the 30-day request reports.
 */

export const ACTIVITY_COLLECTION = 'activity_log';
export const ACTIVITY_RETENTION_DAYS = 365;

export type ActivityRole = 'admin' | 'cm' | 'writer' | 'system' | 'unknown';

export type ActivityEntry = {
  id: string;
  at: string;
  uid: string;
  email: string;
  role: ActivityRole;
  method: string;
  path: string;
  action: string;
  ip: string;
};

type Actor = { uid: string; email?: string | null; role: ActivityRole };

const logged = new WeakSet<Request>();
/** Text a route gave for a request already logged by lib/admin-auth.ts: it replaces the generic one. */
const described = new WeakMap<Request, { action: string; actor: Actor }>();

function hasStore() {
  return hasFirebaseAdminConfig();
}

async function write(entry: Omit<ActivityEntry, 'id' | 'at'>) {
  if (!hasStore()) return;
  await getAdminDb().collection(ACTIVITY_COLLECTION).add({ ...entry, at: Timestamp.now() });
}

/** Runs the write once the response is sent; a failure is only logged, it never breaks the request. */
function schedule(task: () => Promise<void>) {
  const run = () => task().catch((error) => console.warn('[activity-log] Entrée non enregistrée :', error instanceof Error ? error.message : error));
  try {
    after(run);
  } catch {
    void run();
  }
}

function requestFields(request: NextRequest | Request) {
  const url = new URL(request.url);
  return {
    method: request.method.toUpperCase(),
    path: truncate(redactPath(url.pathname), 300),
    ip: truncate(clientIpFromHeaders(request.headers), 60),
    pathname: url.pathname,
  };
}

/** Called by requireAdmin / requireCmActor / requireWriter: logs a change made by this account. */
export function logRequestActivity(request: NextRequest | Request, actor: Actor): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase()) || logged.has(request)) return;
  logged.add(request);
  const { method, path, ip, pathname } = requestFields(request);
  // Written once the response is sent, so a route's own description (logActivity) can replace it.
  schedule(() => {
    const own = described.get(request);
    const who = own?.actor || actor;
    return write({
      uid: who.uid,
      email: truncate(who.email || '', 160),
      role: who.role,
      method,
      path,
      action: truncate(own?.action || describeIntent({ method, pathname }), 200),
      ip,
    });
  });
}

/** An event the route describes itself (sign-in, backup, restore…). */
export function logActivity(request: NextRequest | Request | null, actor: Actor, action: string): void {
  if (request && logged.has(request)) {
    described.set(request, { action, actor });
    return;
  }
  const fields = request ? requestFields(request) : { method: 'SYSTEM', path: '', ip: '' };
  if (request) logged.add(request);
  schedule(() => write({
    uid: actor.uid,
    email: truncate(actor.email || '', 160),
    role: actor.role,
    method: fields.method,
    path: fields.path,
    action: truncate(action, 200),
    ip: fields.ip,
  }));
}

function toEntry(id: string, data: Record<string, unknown>): ActivityEntry {
  const at = data.at instanceof Timestamp ? data.at.toDate().toISOString() : '';
  const role = String(data.role || 'unknown');
  return {
    id,
    at,
    uid: String(data.uid || ''),
    email: String(data.email || ''),
    role: (['admin', 'cm', 'writer', 'system'].includes(role) ? role : 'unknown') as ActivityRole,
    method: String(data.method || ''),
    path: String(data.path || ''),
    action: String(data.action || ''),
    ip: String(data.ip || ''),
  };
}

/**
 * A page of the log, newest first. `before` (ISO date) continues a previous page. With `email`,
 * only that account: the entries are then sorted here, so no composite index is needed.
 */
export async function readActivity(options: { limit?: number; before?: string; email?: string } = {}): Promise<{ entries: ActivityEntry[]; next: string | null }> {
  const limit = Math.min(Math.max(options.limit || 50, 1), 200);
  const collection = getAdminDb().collection(ACTIVITY_COLLECTION);
  const before = options.before ? new Date(options.before) : null;
  const beforeTs = before && !Number.isNaN(before.getTime()) ? Timestamp.fromDate(before) : null;

  if (options.email) {
    const snapshot = await collection.where('email', '==', options.email).limit(2000).get();
    const all = snapshot.docs.map((document) => toEntry(document.id, document.data()))
      .filter((entry) => !beforeTs || entry.at < beforeTs.toDate().toISOString())
      .sort((a, b) => b.at.localeCompare(a.at));
    const entries = all.slice(0, limit);
    return { entries, next: all.length > limit ? entries[entries.length - 1].at : null };
  }

  let query: Query = collection.orderBy('at', 'desc');
  if (beforeTs) query = query.where('at', '<', beforeTs);
  const snapshot = await query.limit(limit + 1).get();
  const entries = snapshot.docs.slice(0, limit).map((document) => toEntry(document.id, document.data()));
  return { entries, next: snapshot.docs.length > limit ? entries[entries.length - 1].at : null };
}

/** Removes the entries older than the retention; returns how many went. */
export async function purgeOldActivity(now = Date.now()): Promise<number> {
  if (!hasStore()) return 0;
  const cutoff = Timestamp.fromMillis(now - ACTIVITY_RETENTION_DAYS * 86400e3);
  const db = getAdminDb();
  let deleted = 0;
  for (let round = 0; round < 20; round += 1) {
    const snapshot = await db.collection(ACTIVITY_COLLECTION).where('at', '<', cutoff).limit(400).get();
    if (snapshot.empty) break;
    const batch = db.batch();
    snapshot.docs.forEach((document) => batch.delete(document.ref));
    await batch.commit();
    deleted += snapshot.size;
    if (snapshot.size < 400) break;
  }
  return deleted;
}
