import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import type { DocumentData } from 'firebase-admin/firestore';
import { isSafeArticleId } from '@/lib/article-files';
import { articleImage } from '@/lib/blog';
import { getAdminDb } from '@/lib/firebase-admin';
import { readPhoto } from '@/lib/photos';
import { reportUserError } from '@/lib/user-error';
import { wordCount, WRITER_LIMITS, type WriterArticle, type WriterArticleSummary } from '@/lib/writer-rules';

/**
 * Articles of the writing space (/admin/redaction). They live in the articles collection like
 * the others, with authorUid naming their writer: a writer only ever reads or changes those.
 */

function isoDate(value: unknown): string | null {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date ? date.toISOString() : null;
  }
  return typeof value === 'string' && value ? value : null;
}

/** Small picture of the article in the lists: its cover photo, or the card drawn once it is published. */
function thumbnail(data: DocumentData): string {
  const photo = readPhoto(data.photo);
  if (photo) return photo.thumb || photo.url;
  return data.image ? articleImage(String(data.image), String(data.title || ''), 'fr') : '';
}

export function toWriterSummary(id: string, data: DocumentData, views = 0): WriterArticleSummary {
  return {
    id,
    slug: String(data.slug || id),
    title: String(data.title || 'Sans titre'),
    description: String(data.description || ''),
    category: String(data.category || ''),
    status: String(data.status || 'draft'),
    image: thumbnail(data),
    plannedFor: typeof data.plannedFor === 'string' && data.plannedFor ? data.plannedFor : null,
    publishedAt: isoDate(data.publishedAt),
    updatedAt: isoDate(data.updatedAt),
    createdAt: isoDate(data.createdAt),
    views,
    words: wordCount(String(data.content || '')),
  };
}

export function toWriterArticle(id: string, data: DocumentData, views = 0): WriterArticle {
  return {
    ...toWriterSummary(id, data, views),
    content: String(data.content || ''),
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    customSlug: data.customSlug === true,
  };
}

/** The writer's article. Another writer's article answers NOT_FOUND too, so its existence is not revealed. */
export async function ownedArticle(uid: string, id: string) {
  if (!isSafeArticleId(id)) throw new Error('NOT_FOUND');
  const reference = getAdminDb().collection('articles').doc(id);
  const snapshot = await reference.get();
  const data = snapshot.data();
  if (!snapshot.exists || !data || data.authorUid !== uid) throw new Error('NOT_FOUND');
  return { reference, data };
}

/** Views counted by the blog, under each article's French slug (both languages share one counter). */
export async function viewsBySlug(slugs: string[]): Promise<Map<string, number>> {
  const unique = Array.from(new Set(slugs.filter((slug) => isSafeArticleId(slug))));
  if (!unique.length) return new Map();
  const db = getAdminDb();
  const snapshots = await db.getAll(...unique.map((slug) => db.collection('blog_articles').doc(slug)));
  return new Map(snapshots.map((snapshot) => [snapshot.id, Number(snapshot.data()?.views || 0)]));
}

/** True when another article already answers at this address. */
export async function slugTaken(slug: string, id: string): Promise<boolean> {
  const snapshot = await getAdminDb().collection('articles').where('slug', '==', slug).limit(2).get();
  return snapshot.docs.some((document) => document.id !== id);
}

/** A free address made from `base`: base, then base-2, base-3… */
export async function uniqueSlug(base: string, id: string): Promise<string> {
  const root = base || 'article';
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const candidate = attempt === 1 ? root : `${root.slice(0, WRITER_LIMITS.slug - 3).replace(/-$/, '')}-${attempt}`;
    if (!(await slugTaken(candidate, id))) return candidate;
  }
  return `${root.slice(0, WRITER_LIMITS.slug - 10).replace(/-$/, '')}-${Date.now().toString(36)}`;
}

export function writerError(error: unknown, request: NextRequest) {
  const code = error instanceof Error ? error.message : '';
  const status = code === 'UNAUTHORIZED' ? 401 : code === 'FORBIDDEN' ? 403 : code === 'NOT_FOUND' ? 404 : 500;
  if (status === 500) reportUserError(error, { request });
  const message = status === 401
    ? 'Votre session a expiré. Reconnectez-vous dans un autre onglet, puis réessayez : votre texte reste dans cette page.'
    : status === 403 ? 'Accès réservé à l’espace rédaction.'
      : status === 404 ? 'Article introuvable.'
        : 'Opération impossible pour le moment. Réessayez dans quelques instants.';
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
