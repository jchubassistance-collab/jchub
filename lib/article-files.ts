import { createHash } from 'node:crypto';
import path from 'node:path';
import matter from 'gray-matter';

/**
 * Published and scheduled articles are stored as Markdown files in the repository: the public
 * site reads them instead of Firestore. One file per language: content/articles/<id>.md for the
 * French text and content/articles/en/<id>.md for its English version. Drafts stay in Firestore.
 *
 * This module has no Next.js or Firebase import so that scripts/export-articles.mjs can use it.
 */

export const ARTICLES_DIRECTORY = 'content/articles';

/**
 * Absolute path on disk of content/articles or of one of its files. The folder is spelled out
 * here on purpose: the build traces the files each server function reads, and a path made from
 * a variable after process.cwd() makes it bundle the whole project (.env, .git and .next/lock,
 * which then fails the Vercel deploy).
 */
export function articlePathOnDisk(file: string = ARTICLES_DIRECTORY): string {
  return path.join(process.cwd(), 'content/articles', path.posix.relative(ARTICLES_DIRECTORY, file));
}

/** Fields of the French document written to the file, in this order. */
const FRENCH_FIELDS = ['slug', 'title', 'description', 'excerpt', 'category', 'keywords', 'tags', 'author', 'image', 'photo', 'readTime', 'status', 'publishedAt', 'scheduledFor', 'updatedAt'] as const;
const ENGLISH_FIELDS = ['slug', 'title', 'description', 'excerpt', 'keywords', 'sourceHash', 'translatedAt'] as const;
const DATE_FIELDS = new Set(['publishedAt', 'scheduledFor', 'updatedAt', 'translatedAt']);

/** Firestore ids become file names: anything else than letters, digits, - and _ is refused. */
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;

export function isPublicArticleStatus(status: unknown): boolean {
  return status === 'published' || status === 'scheduled';
}

export function isSafeArticleId(id: string): boolean {
  return SAFE_ID.test(id);
}

export function articleFilePaths(id: string): { fr: string; en: string } {
  return { fr: `${ARTICLES_DIRECTORY}/${id}.md`, en: `${ARTICLES_DIRECTORY}/en/${id}.md` };
}

/** Date, ISO string or Firestore Timestamp, as an ISO string. */
function isoDate(value: unknown): string {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString();
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date ? date.toISOString() : '';
  }
  return '';
}

function frontmatter(data: Record<string, unknown>, fields: readonly string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const value = DATE_FIELDS.has(field) ? isoDate(data[field]) : data[field];
    if (Array.isArray(value)) result[field] = value.map(String);
    else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      if (value !== '') result[field] = typeof value === 'string' ? value : String(value);
    }
  }
  return result;
}

const toLf = (text: string) => text.replace(/\r\n/g, '\n');

/** gray-matter adds a line break after the body: the reader removes exactly that one. */
function toMarkdown(content: string, data: Record<string, unknown>): string {
  return matter.stringify(toLf(content), data);
}

function fromMarkdown(text: string): { data: Record<string, unknown>; content: string } {
  const parsed = matter(toLf(text));
  return { data: parsed.data as Record<string, unknown>, content: parsed.content.replace(/\n$/, '') };
}

/**
 * Files of an article from its Firestore document, keyed by repository path. An article that is
 * not public gives no file: its existing files are then removed.
 */
export function buildArticleFiles(id: string, data: Record<string, unknown>): Record<string, string> {
  if (!isSafeArticleId(id) || !isPublicArticleStatus(data.status) || !String(data.content || '').trim()) return {};
  const paths = articleFilePaths(id);
  const files: Record<string, string> = {
    [paths.fr]: toMarkdown(String(data.content), frontmatter({ ...data, slug: data.slug || id }, FRENCH_FIELDS)),
  };
  const english = (data.translations as Record<string, unknown> | undefined)?.en as Record<string, unknown> | undefined;
  if (english && String(english.slug || '').trim() && String(english.title || '').trim() && String(english.content || '').trim()) {
    files[paths.en] = toMarkdown(String(english.content), frontmatter(english, ENGLISH_FIELDS));
  }
  return files;
}

/** The document shape lib/blog.ts reads, rebuilt from the files of one article. */
export function parseArticleFiles(id: string, french: string, english?: string | null): Record<string, unknown> {
  const fr = fromMarkdown(french);
  const en = english ? fromMarkdown(english) : null;
  return {
    ...fr.data,
    id,
    slug: fr.data.slug || id,
    content: fr.content,
    translations: en ? { en: { ...en.data, content: en.content } } : undefined,
  };
}

/** Git object id of a file, to compare it with the repository without downloading it. */
export function gitBlobSha(text: string): string {
  const bytes = Buffer.from(text, 'utf8');
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}
