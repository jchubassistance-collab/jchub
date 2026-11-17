import 'server-only';

import { revalidatePath } from 'next/cache';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { reportUserError } from '@/lib/user-error';
import { resources as builtInResources, type Resource } from '@/lib/resources';
import type { EditableResource, ResourceResearch, StoredResource } from '@/lib/resource-schema';
import type { Locale } from '@/i18n/routing';

/**
 * Resources created in Admin > Ressources live in Firestore, next to the ones written in
 * lib/resources.ts. Pages read them through a one-minute cache, like the tools: a slow
 * database never holds a page for more than a second.
 */

export const RESOURCES_COLLECTION = 'resources';
const CACHE_MS = 60_000;
const TIMEOUT_MS = 1_200;

let cache: StoredResource[] | null = null;
let cachedAt = 0;
let pending: Promise<StoredResource[] | null> | null = null;

const asIso = (value: unknown) => value instanceof Timestamp ? value.toDate().toISOString() : typeof value === 'string' ? value : null;

export function toStoredResource(id: string, data: Record<string, unknown>): StoredResource | null {
  const fr = data.fr as Resource['fr'] | undefined;
  const en = data.en as Resource['en'] | undefined;
  if (!fr?.slug || !en?.slug || !Array.isArray(fr.sections) || !Array.isArray(en.sections)) return null;
  const updatedAt = asIso(data.updatedAt);
  return {
    id,
    kind: data.kind === 'checklist' ? 'checklist' : 'cheatsheet',
    gated: false,
    format: 'pdf',
    code: data.code === true,
    updated: (updatedAt ?? new Date().toISOString()).slice(0, 10),
    fr,
    en,
    status: data.status === 'published' ? 'published' : 'draft',
    topic: String(data.topic ?? ''),
    provider: String(data.provider ?? ''),
    origin: data.origin === 'agent' ? 'agent' : 'admin',
    research: data.research && typeof data.research === 'object' ? {
      reason: String((data.research as ResourceResearch).reason ?? ''),
      signals: Array.isArray((data.research as ResourceResearch).signals) ? (data.research as ResourceResearch).signals.map(String) : [],
      runId: String((data.research as ResourceResearch).runId ?? ''),
    } : null,
    createdAt: asIso(data.createdAt),
    updatedAt,
  };
}

/** Every resource saved in Firestore, drafts included. Throws when Firestore cannot be read. */
export async function readStoredResources(): Promise<StoredResource[]> {
  if (!hasFirebaseAdminConfig()) return [];
  const snapshot = await getAdminDb().collection(RESOURCES_COLLECTION).get();
  const list = snapshot.docs.flatMap((document) => toStoredResource(document.id, document.data()) ?? []);
  cache = list;
  cachedAt = Date.now();
  return list;
}

/** Saves a resource written by the AI as a draft: nothing goes online before the admin publishes it. */
export async function createResourceDraft(resource: EditableResource, meta: { topic: string; provider: string; origin: StoredResource['origin']; research?: ResourceResearch }): Promise<StoredResource> {
  const reference = getAdminDb().collection(RESOURCES_COLLECTION).doc();
  const fields = { ...resource, status: 'draft', topic: meta.topic, provider: meta.provider, origin: meta.origin, research: meta.research ?? null };
  await reference.set({ ...fields, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  forgetStoredResources();
  const now = new Date().toISOString();
  return toStoredResource(reference.id, { ...fields, createdAt: now, updatedAt: now })!;
}

/** Called after an admin change, so this server and the built public pages show it at once. */
export function forgetStoredResources() {
  cache = null;
  cachedAt = 0;
  try {
    // The resource pages, and the other pages that list resources, are rebuilt on their next visit.
    revalidatePath('/[locale]', 'layout');
  } catch (error) {
    // Outside a request (a script): no page cache to clear.
    console.warn('[ressources] Pages non rafraîchies :', error instanceof Error ? error.message : error);
  }
}

async function storedResourcesWithoutBlocking(): Promise<StoredResource[]> {
  if (cache && Date.now() - cachedAt < CACHE_MS) return cache;
  if (!pending) {
    pending = readStoredResources().catch((error) => {
      reportUserError(error);
      cachedAt = Date.now();
      return null;
    }).finally(() => { pending = null; });
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), TIMEOUT_MS); });
  const list = await Promise.race([pending, timedOut]);
  if (timer) clearTimeout(timer);
  return list ?? cache ?? [];
}

/** The resources shown on the site: those of the code, then the published ones of the admin. */
export async function getPublishedResources(): Promise<Resource[]> {
  const stored = (await storedResourcesWithoutBlocking()).filter((resource) => resource.status === 'published');
  const taken = new Set(builtInResources.flatMap((resource) => [resource.fr.slug, resource.en.slug]));
  return [...builtInResources, ...stored.filter((resource) => !taken.has(resource.fr.slug) && !taken.has(resource.en.slug))];
}

export async function findPublishedResource(slug: string, locale: Locale): Promise<{ resource: Resource; exact: boolean } | null> {
  const list = await getPublishedResources();
  const exact = list.find((resource) => resource[locale].slug === slug);
  if (exact) return { resource: exact, exact: true };
  const other = list.find((resource) => resource.fr.slug === slug || resource.en.slug === slug);
  return other ? { resource: other, exact: false } : null;
}
