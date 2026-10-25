import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { cache } from 'react';
import { articlePathOnDisk, parseArticleFiles } from '@/lib/article-files';
import { categoryLabel } from '@/lib/categories';
import { readPhoto } from '@/lib/photos';
import { tools } from '@/lib/tools';
import type { Locale } from '@/i18n/routing';

export type BlogArticle = {
  /** Firestore document id, also the file name in content/articles (the French slug for articles created from the admin). */
  id: string;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  keywords: string[];
  /** Category in the visitor's language. */
  category: string;
  /** Category as stored, in French: the key of its category page. */
  categoryKey: string;
  author: string;
  image: string;
  /** Photographer of the cover photo (Unsplash), credited under the cover. */
  imageCredit: { name: string; url: string } | null;
  content: string;
  status: 'published' | 'scheduled' | 'draft';
  publishedAt?: string;
  scheduledFor?: string;
  readTime: string;
  updatedAt?: string;
  tags: string[];
  locale: Locale;
  /** Address slug of the article in each language, for hreflang links and the language switch. */
  slugs: Record<Locale, string>;
  /** False when the English version is not written yet and the French text is shown instead. */
  translated: boolean;
};

/** English version stored on the article document, under translations.en. */
export type ArticleTranslation = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  content: string;
  keywords: string[];
  /** Fingerprint of the French text it was translated from: a change makes it stale. */
  sourceHash?: string;
  translatedAt?: string;
};

/** Fingerprint of the French text an English translation must follow. */
export function articleSourceHash(data: { title?: unknown; description?: unknown; content?: unknown }): string {
  return createHash('sha256').update(JSON.stringify([String(data.title || ''), String(data.description || ''), String(data.content || '')])).digest('hex').slice(0, 24);
}

function toIsoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date ? date.toISOString() : '';
  }
  return '';
}

export function toArticleTranslation(value: unknown): ArticleTranslation | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  const slug = String(data.slug || '').trim();
  const title = String(data.title || '').trim();
  const content = String(data.content || '').trim();
  if (!slug || !title || !content) return null;
  return {
    slug,
    title,
    description: String(data.description || ''),
    excerpt: String(data.excerpt || data.description || ''),
    content,
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    sourceHash: typeof data.sourceHash === 'string' ? data.sourceHash : undefined,
    translatedAt: toIsoDate(data.translatedAt) || undefined,
  };
}

/** Text shown on the generated cover: tool names and categories have an English version. */
function englishCoverLabel(label: string): string {
  const tool = tools.find((candidate) => candidate.name === label);
  return tool?.translations?.en?.name ?? categoryLabel(label, 'en');
}

/**
 * Cover of the article in `locale`. Generated covers are drawn again with the English
 * title; static covers have an English copy under /blog/en/.
 */
export function articleImage(image: string, title: string, locale: Locale): string {
  if (image.includes('/api/article-cover')) {
    try {
      const url = new URL(image, 'https://jchub.dev');
      // Generated covers are drawn by this site, whatever host was saved with the article.
      if (locale === 'fr') return `/api/article-cover?${url.searchParams}`;
      const params = new URLSearchParams({ title, category: englishCoverLabel(url.searchParams.get('category') || 'JcHub'), lang: 'en' });
      return `/api/article-cover?${params}`;
    } catch {
      return image;
    }
  }
  if (locale === 'fr') return image;
  if (/^\/blog\/[^/]+\.svg$/.test(image)) return image.replace('/blog/', '/blog/en/');
  return image;
}

function toArticle(data: Record<string, unknown>, locale: Locale): BlogArticle {
  const id = String(data.id || data.slug || '');
  const frenchSlug = String(data.slug || id);
  const translation = toArticleTranslation((data.translations as Record<string, unknown> | undefined)?.en);
  const english = locale === 'en' && translation ? translation : null;
  const title = english?.title ?? String(data.title || (locale === 'en' ? 'JcHub article' : 'Article JcHub'));
  const description = english?.description ?? String(data.description || '');
  const keywords = english?.keywords.length ? english.keywords : Array.isArray(data.keywords) ? data.keywords.map(String) : [];
  const categoryKey = String(data.category || 'Développement');
  const category = categoryLabel(categoryKey, locale);
  const status = data.status === 'scheduled' || data.status === 'draft' ? data.status : 'published';
  const slugs = { fr: frenchSlug, en: translation?.slug || frenchSlug };
  // With a photo, the cover is drawn in the visitor's language over it; otherwise the saved image is used.
  const photo = readPhoto(data.photo);
  const photoCover = photo && `/api/article-cover?${new URLSearchParams({ title, category, photo: photo.url, ...(locale === 'en' ? { lang: 'en' } : {}) })}`;
  return {
    id,
    slug: slugs[locale],
    title,
    description,
    excerpt: english?.excerpt ?? String(data.excerpt || data.description || ''),
    keywords,
    category,
    categoryKey,
    author: String(data.author || 'JcHub'),
    image: photoCover || articleImage(String(data.image || '/blog/default.svg'), title, locale),
    imageCredit: photo && { name: photo.author, url: photo.authorUrl },
    content: english?.content ?? String(data.content || ''),
    status,
    publishedAt: toIsoDate(data.publishedAt),
    scheduledFor: toIsoDate(data.scheduledFor),
    readTime: String(data.readTime || '5 min'),
    updatedAt: toIsoDate(data.updatedAt),
    tags: Array.from(new Set([category, ...keywords.slice(0, 3)])),
    locale,
    slugs,
    translated: locale === 'fr' || Boolean(english),
  };
}

let articleRecords: Record<string, unknown>[] | null = null;

/**
 * Every article file of content/articles, in the order of their id like the former Firestore
 * query. The files only change with a deploy, so production reads them once per server.
 */
function readArticleRecords(): Record<string, unknown>[] {
  if (articleRecords && process.env.NODE_ENV === 'production') return articleRecords;
  const directory = articlePathOnDisk();
  const records = fs.existsSync(directory)
    ? fs.readdirSync(directory)
      .filter((file) => file.endsWith('.md'))
      .sort()
      .map((file) => {
        const englishFile = path.join(directory, 'en', file);
        return parseArticleFiles(
          file.slice(0, -3),
          fs.readFileSync(path.join(directory, file), 'utf8'),
          fs.existsSync(englishFile) ? fs.readFileSync(englishFile, 'utf8') : null,
        );
      })
    : [];
  articleRecords = records;
  return records;
}

/** Published articles, and scheduled ones whose date has come: they go live on time, before the cron. */
function publishedRecords(now = Date.now()): Record<string, unknown>[] {
  return readArticleRecords().flatMap((record) => {
    if (record.status === 'published') return [record];
    const scheduledFor = Date.parse(String(record.scheduledFor || ''));
    if (record.status !== 'scheduled' || !Number.isFinite(scheduledFor) || scheduledFor > now) return [];
    return [{ ...record, status: 'published', publishedAt: record.publishedAt || record.scheduledFor }];
  });
}

/** Published articles in every language, read from the files of content/articles. */
export const getPublishedArticlesByLocale = cache(async (): Promise<Record<Locale, BlogArticle[]>> => {
  const records = publishedRecords();
  return {
    fr: records.map((record) => toArticle(record, 'fr')),
    en: records.map((record) => toArticle(record, 'en')),
  };
});

export async function getPublishedArticles(locale: Locale = 'fr'): Promise<BlogArticle[]> {
  return (await getPublishedArticlesByLocale())[locale];
}

/**
 * Finds a published article by the slug of its address in `locale`. In English the
 * French slug is accepted too, so the page can redirect it to the English address.
 */
export const getPublishedArticleBySlug = cache(async (slug: string, locale: Locale = 'fr'): Promise<BlogArticle | null> => {
  const articles = (await getPublishedArticlesByLocale())[locale];
  return articles.find((article) => article.slug === slug)
    || (locale === 'en' ? articles.find((article) => article.slugs.fr === slug) : undefined)
    || null;
});

export async function getPublishedArticleSlugs() {
  const { fr, en } = await getPublishedArticlesByLocale();
  return [
    ...fr.map((article) => ({ locale: 'fr', slug: article.slug })),
    ...en.map((article) => ({ locale: 'en', slug: article.slug })),
  ];
}
