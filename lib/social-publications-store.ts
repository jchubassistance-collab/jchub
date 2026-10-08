import 'server-only';

import { randomUUID } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { contentHash, publicationGuardId, publicationId } from '@/lib/social-utils';
import { canRetryPublication } from '@/lib/social-utils';
import type { PublicationCopy, PublicationRecord, PublicationStatus, SocialPlatform, SocialSettings, SocialSource } from '@/lib/social-types';

const COLLECTION = 'social_publications';
const SETTINGS_DOC = 'social_publishing';
const boolEnv = (name: string, fallback: boolean) => process.env[name] === undefined ? fallback : process.env[name] === 'true';

export function defaultSocialSettings(): SocialSettings {
  return {
    linkedinEnabled: boolEnv('LINKEDIN_ENABLED', false),
    facebookEnabled: boolEnv('FACEBOOK_ENABLED', false),
    githubEnabled: boolEnv('GITHUB_ENABLED', false),
    autoPublish: boolEnv('AUTO_PUBLISH', false),
    dryRun: boolEnv('DRY_RUN', true),
    timezone: process.env.PUBLISH_TIMEZONE?.trim() || 'Africa/Lagos',
  };
}

export async function getSocialSettings(): Promise<SocialSettings> {
  const snapshot = await getAdminDb().collection('app_config').doc(SETTINGS_DOC).get();
  const defaults = defaultSocialSettings();
  const data = snapshot.data() || {};
  const settings: SocialSettings = {
    linkedinEnabled: typeof data.linkedinEnabled === 'boolean' ? data.linkedinEnabled : defaults.linkedinEnabled,
    facebookEnabled: typeof data.facebookEnabled === 'boolean' ? data.facebookEnabled : defaults.facebookEnabled,
    githubEnabled: typeof data.githubEnabled === 'boolean' ? data.githubEnabled : defaults.githubEnabled,
    autoPublish: typeof data.autoPublish === 'boolean' ? data.autoPublish : defaults.autoPublish,
    dryRun: typeof data.dryRun === 'boolean' ? data.dryRun : defaults.dryRun,
    timezone: typeof data.timezone === 'string' ? data.timezone : defaults.timezone,
  };
  try { new Intl.DateTimeFormat('fr-FR', { timeZone: settings.timezone }); }
  catch { settings.timezone = defaults.timezone; }
  return settings;
}

export async function saveSocialSettings(settings: SocialSettings): Promise<void> {
  await getAdminDb().collection('app_config').doc(SETTINGS_DOC).set({ ...settings, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
}

export function destinationFor(platform: SocialPlatform): string {
  if (platform === 'linkedin') return `member:${process.env.LINKEDIN_AUTHOR_URN?.trim() || 'unconfigured'}`;
  if (platform === 'facebook') return `page:${process.env.FACEBOOK_PAGE_ID?.trim() || 'unconfigured'}`;
  const owner = process.env.GITHUB_OWNER?.trim() || 'jchubassistance-collab';
  const repo = process.env.GITHUB_REPOSITORY?.trim() || 'jchub';
  const branch = process.env.GITHUB_BRANCH?.trim() || 'main';
  const path = process.env.GITHUB_PUBLISH_PATH?.trim() || 'docs/social-publications.md';
  return `${owner}/${repo}@${branch}:${path}`;
}

function asIso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return typeof value === 'string' ? value : null;
}

export function toPublicationRecord(id: string, data: Record<string, any>): PublicationRecord {
  return {
    id,
    sourceContentId: String(data.sourceContentId || ''),
    sourceTitle: String(data.sourceTitle || ''),
    sourceDescription: String(data.sourceDescription || ''),
    sourceUrl: String(data.sourceUrl || ''),
    imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
    platform: data.platform as SocialPlatform,
    destination: String(data.destination || ''),
    content: String(data.content || ''),
    contentHash: String(data.contentHash || ''),
    status: data.status as PublicationStatus,
    createdAt: asIso(data.createdAt) || undefined,
    updatedAt: asIso(data.updatedAt) || undefined,
    scheduledAt: asIso(data.scheduledAt),
    publishedAt: asIso(data.publishedAt),
    externalId: data.externalId ? String(data.externalId) : null,
    externalUrl: data.externalUrl ? String(data.externalUrl) : null,
    error: data.error ? String(data.error) : null,
    errorCode: data.errorCode ? String(data.errorCode) : null,
    retryCount: Number(data.retryCount || 0),
    lastAttemptAt: asIso(data.lastAttemptAt),
    dryRun: Boolean(data.dryRun),
  };
}

export async function createPlatformPublications(source: SocialSource, copies: PublicationCopy, initialStatus: 'DRAFT' | 'APPROVED' = 'DRAFT') {
  const db = getAdminDb();
  const platforms: SocialPlatform[] = ['linkedin', 'facebook', 'github'];
  return Promise.all(platforms.map(async (platform) => {
    const content = copies[platform].trim();
    const hash = contentHash(content);
    const destination = destinationFor(platform);
    const id = publicationId(source.id, platform, destination, hash);
    const ref = db.collection(COLLECTION).doc(id);
    const guardRef = db.collection('social_publication_guards').doc(publicationGuardId(source.id, platform, destination));
    const canonicalId = await db.runTransaction(async (transaction) => {
      const guard = await transaction.get(guardRef);
      const existing = await transaction.get(ref);
      if (guard.exists) return String(guard.data()?.publicationId || id);
      if (existing.exists) {
        transaction.create(guardRef, { publicationId: id, createdAt: FieldValue.serverTimestamp() });
        return id;
      }
      transaction.create(ref, {
        sourceContentId: source.id,
        sourceTitle: source.title,
        sourceDescription: source.description,
        sourceUrl: source.url,
        imageUrl: source.imageUrl || null,
        platform,
        destination,
        content,
        contentHash: hash,
        status: initialStatus,
        retryCount: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.create(guardRef, { publicationId: id, createdAt: FieldValue.serverTimestamp() });
      return id;
    });
    const snapshot = await db.collection(COLLECTION).doc(canonicalId).get();
    return toPublicationRecord(canonicalId, snapshot.data() || {});
  }));
}

export async function getPublication(id: string): Promise<PublicationRecord | null> {
  const snapshot = await getAdminDb().collection(COLLECTION).doc(id).get();
  return snapshot.exists ? toPublicationRecord(snapshot.id, snapshot.data() || {}) : null;
}

export async function listPublications(limit = 100): Promise<PublicationRecord[]> {
  const snapshot = await getAdminDb().collection(COLLECTION).orderBy('createdAt', 'desc').limit(Math.min(200, Math.max(1, limit))).get();
  return snapshot.docs.map((document) => toPublicationRecord(document.id, document.data()));
}

export async function listDuePublications(limit = 50): Promise<PublicationRecord[]> {
  const snapshot = await getAdminDb().collection(COLLECTION)
    .where('scheduledAt', '<=', Timestamp.now()).orderBy('scheduledAt', 'asc').limit(limit).get();
  return snapshot.docs.filter((document) => document.data().status === 'SCHEDULED')
    .map((document) => toPublicationRecord(document.id, document.data()));
}

export async function updatePublicationStatus(id: string, from: PublicationStatus[], status: PublicationStatus, extra: Record<string, unknown> = {}) {
  const ref = getAdminDb().collection(COLLECTION).doc(id);
  return getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists || !from.includes(snapshot.data()?.status)) return false;
    transaction.update(ref, { status, ...extra, ...(status === 'CANCELLED' ? { scheduledAt: FieldValue.delete() } : {}), updatedAt: FieldValue.serverTimestamp() });
    return true;
  });
}

export async function schedulePublication(id: string, at: Date): Promise<boolean> {
  const ref = getAdminDb().collection(COLLECTION).doc(id);
  return getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists || snapshot.data()?.status !== 'APPROVED') return false;
    transaction.update(ref, { status: 'SCHEDULED', scheduledAt: Timestamp.fromDate(at), updatedAt: FieldValue.serverTimestamp(), error: null, errorCode: null });
    return true;
  });
}

export type PublicationClaim = { ok: true; leaseId: string; record: PublicationRecord } | { ok: false; reason: string };

export async function claimPublication(id: string, allowManualRetry = false, confirmUnknownRetry = false): Promise<PublicationClaim> {
  const ref = getAdminDb().collection(COLLECTION).doc(id);
  return getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return { ok: false, reason: 'Publication introuvable.' };
    const data = snapshot.data() || {};
    const status = data.status as PublicationStatus;
    const retryable = allowManualRetry && canRetryPublication(status, data.errorCode, confirmUnknownRetry);
    if (status !== 'APPROVED' && status !== 'SCHEDULED' && !retryable) return { ok: false, reason: 'Cette publication ne peut pas être revendiquée.' };
    if (status === 'SCHEDULED' && (!data.scheduledAt || data.scheduledAt.toMillis() > Date.now())) return { ok: false, reason: 'La publication n’est pas encore due.' };
    const leaseId = randomUUID();
    transaction.update(ref, {
      status: 'PUBLISHING', leaseId, claimedAt: FieldValue.serverTimestamp(),
      lastAttemptAt: FieldValue.serverTimestamp(), retryCount: Number(data.retryCount || 0) + 1,
      scheduledAt: FieldValue.delete(), error: null, errorCode: null, updatedAt: FieldValue.serverTimestamp(),
    });
    return { ok: true, leaseId, record: toPublicationRecord(id, { ...data, status: 'PUBLISHING', retryCount: Number(data.retryCount || 0) + 1 }) };
  });
}

export async function finishPublication(id: string, leaseId: string, result: {
  status: 'PUBLISHED' | 'FAILED' | 'UNKNOWN';
  externalId?: string;
  externalUrl?: string;
  error?: string;
  errorCode?: string;
  unchanged?: boolean;
  dryRun?: boolean;
}): Promise<boolean> {
  const ref = getAdminDb().collection(COLLECTION).doc(id);
  return getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists || snapshot.data()?.leaseId !== leaseId) return false;
    const update: Record<string, unknown> = {
      status: result.status,
      externalId: result.externalId || null,
      externalUrl: result.externalUrl || null,
      error: result.error || null,
      errorCode: result.errorCode || null,
      unchanged: Boolean(result.unchanged),
      dryRun: Boolean(result.dryRun),
      updatedAt: FieldValue.serverTimestamp(),
      leaseId: FieldValue.delete(),
      claimedAt: FieldValue.delete(),
    };
    if (result.status === 'PUBLISHED') {
      update.publishedAt = FieldValue.serverTimestamp();
      update.scheduledAt = FieldValue.delete();
    }
    transaction.update(ref, update);
    return true;
  });
}

export async function dueQueryHasItems(): Promise<boolean> {
  const snapshot = await getAdminDb().collection(COLLECTION).where('scheduledAt', '<=', Timestamp.now()).limit(1).get();
  return snapshot.docs.some((document) => document.data().status === 'SCHEDULED');
}
