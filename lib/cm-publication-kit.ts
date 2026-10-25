import 'server-only';

import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getPublishedArticleBySlug } from '@/lib/blog';
import { generateOpenRouterText, generateQuickText } from '@/lib/content-agent';
import { getAdminDb } from '@/lib/firebase-admin';
import { findPhotos, photosEnabled, readPhoto, trackPhotoDownload, type Photo } from '@/lib/photos';
import { getPublicBaseUrl } from '@/lib/site-url';
import type { SocialCardInput } from '@/lib/social-card';
import { generateKitCopy, type KitContentSource, type KitCopy, type KitPlatform } from '@/lib/social-copy';
import type { PublicationStatus } from '@/lib/social-types';
import { getPublishedTools, toolPath } from '@/lib/tools';
import { reportUserError } from '@/lib/user-error';

export type CmSource = KitContentSource & { slug: string; readTime?: string; content: string };
export type KitChannel = { status: PublicationStatus; publicationId: string; externalUrl: string | null; error: string | null; updatedAt: string };
export type CmKit = KitCopy & Omit<CmSource, 'content'> & {
  id: string;
  status: 'draft' | 'ready' | 'published';
  provider: string;
  photo: Photo | null;
  channels: Partial<Record<KitPlatform, KitChannel>>;
  publishRequestedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

const KITS = 'cmKits';
export class KitSourceNotFoundError extends Error {}

const asIso = (value: unknown) => value instanceof Timestamp ? value.toDate().toISOString() : typeof value === 'string' ? value : null;
const strings = (value: unknown) => Array.isArray(value) ? value.map(String) : [];

export function toKit(id: string, data: Record<string, any>): CmKit {
  return {
    id,
    kind: data.kind === 'tool' ? 'tool' : 'article',
    slug: String(data.slug || ''),
    title: String(data.title || ''),
    description: String(data.description || ''),
    category: String(data.category || ''),
    url: String(data.url || ''),
    tags: strings(data.tags),
    readTime: data.readTime ? String(data.readTime) : undefined,
    imageTitle: String(data.imageTitle || ''),
    imageSubtitle: String(data.imageSubtitle || ''),
    instagramCaption: String(data.instagramCaption || ''),
    instagramHashtags: strings(data.instagramHashtags),
    // Les kits créés avant le passage de Snapchat à Facebook gardent leurs anciens champs.
    facebookCaption: String(data.facebookCaption ?? data.snapchatCaption ?? ''),
    facebookHashtags: strings(data.facebookHashtags ?? data.snapchatHashtags),
    photoQueries: strings(data.photoQueries).slice(0, 3),
    status: data.status === 'ready' || data.status === 'published' ? data.status : 'draft',
    provider: String(data.provider || ''),
    photo: readPhoto(data.photo),
    channels: (data.channels && typeof data.channels === 'object' ? data.channels : {}) as CmKit['channels'],
    publishRequestedAt: asIso(data.publishRequestedAt),
    createdAt: asIso(data.createdAt),
    updatedAt: asIso(data.updatedAt),
  };
}

export async function resolveKitSource(kind: 'article' | 'tool', slug: string): Promise<CmSource | null> {
  const base = getPublicBaseUrl();
  if (kind === 'article') {
    const article = await getPublishedArticleBySlug(slug);
    if (article?.status !== 'published') return null;
    return { kind, slug, title: article.title, description: article.excerpt || article.description, category: article.category, url: `${base}/fr/blog/${encodeURIComponent(slug)}`, tags: article.tags || [], readTime: article.readTime, content: article.content };
  }
  const tool = (await getPublishedTools({ includeScheduled: true })).find((item) => item.slug === slug);
  if (!tool) return null;
  return {
    kind, slug, title: tool.name, description: tool.description, category: tool.category,
    url: `${base}${toolPath(tool, 'fr')}`, tags: tool.tags || [],
    content: [tool.description, tool.seo.description, `Mots-clés : ${[...tool.tags, ...tool.seo.keywords].join(', ')}`].join('\n\n'),
  };
}

// Modèles Gemini légers d'abord (2 s environ, chaque essai rejette une sortie non conforme). openrouter/free
// tire un modèle gratuit au hasard, souvent lent ou hors consigne : un seul essai, en secours.
async function generateWithFallback<T>(run: (generate: (prompt: string) => Promise<string>, attempts: number) => Promise<T>): Promise<{ value: T; provider: string }> {
  let provider = '';
  const fromQuickModels = async (prompt: string) => {
    const result = await generateQuickText(prompt);
    provider = result.provider;
    return result.text;
  };
  try {
    return { value: await run(fromQuickModels, 3), provider };
  } catch {
    reportUserError();
    return { value: await run((prompt) => generateOpenRouterText(prompt, 5000), 1), provider: 'openrouter' };
  }
}

// Première photo des recherches proposées par l'IA; le CM peut en choisir une autre dans le kit.
async function pickKitPhoto(queries: string[]): Promise<Photo | null> {
  if (!photosEnabled() || !queries.length) return null;
  try {
    const [photo] = await findPhotos(queries, 'landscape', 3);
    if (photo) await trackPhotoDownload(photo);
    return photo ?? null;
  } catch {
    reportUserError();
    return null;
  }
}

export async function createKit(kind: 'article' | 'tool', slug: string, actorUid: string): Promise<CmKit> {
  const source = await resolveKitSource(kind, slug);
  if (!source) throw new KitSourceNotFoundError('Ce contenu n’est plus publié ou disponible.');
  const copy = await generateWithFallback((generate, attempts) => generateKitCopy(source, generate, attempts));
  const photo = await pickKitPhoto(copy.value.photoQueries);
  const ref = getAdminDb().collection(KITS).doc();
  const data = {
    kind: source.kind, slug: source.slug, title: source.title, description: source.description, category: source.category,
    url: source.url, tags: source.tags, ...(source.readTime ? { readTime: source.readTime } : {}),
    ...copy.value, provider: copy.provider, photo, status: 'draft', channels: {},
    createdBy: actorUid, updatedBy: actorUid, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  };
  await ref.set(data);
  const now = new Date().toISOString();
  return toKit(ref.id, { ...data, createdAt: now, updatedAt: now });
}

export async function getKit(id: string): Promise<CmKit | null> {
  const snapshot = await getAdminDb().collection(KITS).doc(id).get();
  return snapshot.exists ? toKit(snapshot.id, snapshot.data() || {}) : null;
}

export async function findArticleKit(slug: string): Promise<CmKit | null> {
  const snapshot = await getAdminDb().collection(KITS).where('kind', '==', 'article').where('slug', '==', slug).limit(1).get();
  return snapshot.empty ? null : toKit(snapshot.docs[0].id, snapshot.docs[0].data());
}

// Le visuel public du kit (téléchargé par Meta) n'est servi qu'après une demande de publication.
export async function markKitPublishRequested(id: string): Promise<void> {
  await getAdminDb().collection(KITS).doc(id).update({ publishRequestedAt: FieldValue.serverTimestamp() });
}

// État de publication par réseau; le kit passe à « publié » quand tous ses réseaux le sont.
export async function setKitChannel(id: string, platform: KitPlatform, channel: Omit<KitChannel, 'updatedAt'>): Promise<void> {
  const ref = getAdminDb().collection(KITS).doc(id);
  await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return;
    const data = snapshot.data() || {};
    const channels = { ...(data.channels || {}), [platform]: { ...channel, updatedAt: new Date().toISOString() } } as Record<string, KitChannel>;
    const allPublished = Object.values(channels).length > 0 && Object.values(channels).every((item) => item.status === 'PUBLISHED');
    transaction.update(ref, { channels, ...(allPublished ? { status: 'published' } : {}), updatedAt: FieldValue.serverTimestamp() });
  });
}

// Contenu du visuel : titre et sous-titre relus par le CM, photo choisie pour le sujet.
export function kitCardInput(kit: CmKit): SocialCardInput {
  return {
    title: kit.imageTitle || kit.title,
    subtitle: kit.imageSubtitle,
    badge: kit.category,
    footer: kit.kind === 'tool' ? ['Outil gratuit', 'jchub.dev/outils'] : [kit.readTime ? `Lecture ${kit.readTime}` : 'À lire sur JcHub', 'jchub.dev/blog'],
    photo: kit.photo?.url ?? null,
  };
}
