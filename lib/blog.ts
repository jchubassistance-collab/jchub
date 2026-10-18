import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import matter from 'gray-matter';
import { cache } from 'react';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { reportUserError } from '@/lib/user-error';
import { categoryLabel } from '@/lib/categories';
import { tools } from '@/lib/tools';
import type { Locale } from '@/i18n/routing';

export type BlogArticle = {
  /** Firestore document id (the French slug for articles created from the admin). */
  id: string;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  keywords: string[];
  category: string;
  author: string;
  image: string;
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
  if (locale === 'fr') return image;
  if (image.includes('/api/article-cover')) {
    try {
      const url = new URL(image, 'https://jchub.dev');
      const params = new URLSearchParams({ title, category: englishCoverLabel(url.searchParams.get('category') || 'JcHub'), lang: 'en' });
      return `/api/article-cover?${params}`;
    } catch {
      return image;
    }
  }
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
  const category = categoryLabel(String(data.category || 'Développement'), locale);
  const status = data.status === 'scheduled' || data.status === 'draft' ? data.status : 'published';
  const slugs = { fr: frenchSlug, en: translation?.slug || frenchSlug };
  return {
    id,
    slug: slugs[locale],
    title,
    description,
    excerpt: english?.excerpt ?? String(data.excerpt || data.description || ''),
    keywords,
    category,
    author: String(data.author || 'JcHub'),
    image: articleImage(String(data.image || '/blog/default.svg'), title, locale),
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

/** Markdown files shipped with the site, used when Firestore is unreachable. English copies live in content/blog/en. */
function getLocalFallback(locale: Locale): BlogArticle[] {
  const directory = path.join(process.cwd(), 'content', 'blog');
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((file) => /^\d{2}-.+\.md$/.test(file))
    .sort()
    .map((file) => {
      const parsed = matter(fs.readFileSync(path.join(directory, file), 'utf8'));
      const data = parsed.data as Record<string, unknown>;
      const englishFile = path.join(directory, 'en', file);
      const english = fs.existsSync(englishFile) ? matter(fs.readFileSync(englishFile, 'utf8')) : null;
      const slug = String(data.slug || file.replace(/\.md$/, ''));
      return toArticle({
        ...data,
        id: slug,
        slug,
        content: parsed.content,
        image: `/blog/${file.replace(/\.md$/, '.svg')}`,
        status: 'published',
        translations: english ? { en: { ...(english.data as Record<string, unknown>), content: english.content } } : undefined,
      }, locale);
    });
}

function fromDocument(document: { id: string; data: () => Record<string, unknown> | undefined }, locale: Locale) {
  const data = document.data() || {};
  return toArticle({ ...data, id: document.id, slug: data.slug || document.id }, locale);
}

/**
 * Published articles in every language from a single Firestore query. Shared by the
 * metadata and the page of one request, so a page view reads the collection once.
 */
export const getPublishedArticlesByLocale = cache(async (): Promise<Record<Locale, BlogArticle[]>> => {
  const fallback = () => ({ fr: getLocalFallback('fr'), en: getLocalFallback('en') });
  if (!hasFirebaseAdminConfig()) return fallback();
  try {
    const snapshot = await getAdminDb().collection('articles').where('status', '==', 'published').get();
    return {
      fr: snapshot.docs.map((document) => fromDocument(document, 'fr')),
      en: snapshot.docs.map((document) => fromDocument(document, 'en')),
    };
  } catch (error) {
    reportUserError();
    return fallback();
  }
});

export async function getPublishedArticles(locale: Locale = 'fr'): Promise<BlogArticle[]> {
  return (await getPublishedArticlesByLocale())[locale];
}

/**
 * Finds a published article by the slug of its address in `locale`. In English the
 * French slug is accepted too, so the page can redirect it to the English address.
 */
export const getPublishedArticleBySlug = cache(async (slug: string, locale: Locale = 'fr'): Promise<BlogArticle | null> => {
  const matches = (article: BlogArticle) => article.slug === slug || (locale === 'en' && article.slugs.fr === slug);
  if (!hasFirebaseAdminConfig()) return getLocalFallback(locale).find(matches) || null;
  try {
    const articles = getAdminDb().collection('articles');
    if (locale === 'en') {
      // One read for an English address; the French slug (redirected by the page) is the document id.
      // A single-field filter: Firestore indexes it automatically, no composite index to create.
      const english = await articles.where('translations.en.slug', '==', slug).limit(3).get();
      const published = english.docs.map((item) => fromDocument(item, locale)).find((item) => item.status === 'published');
      if (published) return published;
    }
    const document = await articles.doc(slug).get();
    if (document.exists) {
      const article = fromDocument(document, locale);
      if (article.status === 'published' && (article.slug === slug || article.slugs.fr === slug)) return article;
    }

    const snapshot = await articles.where('status', '==', 'published').get();
    const published = snapshot.docs.map((item) => fromDocument(item, locale));
    return published.find((item) => item.slug === slug) || published.find(matches) || null;
  } catch (error) {
    reportUserError();
    return getLocalFallback(locale).find(matches) || null;
  }
});

export async function getPublishedArticleSlugs() {
  const { fr, en } = await getPublishedArticlesByLocale();
  return [
    ...fr.map((article) => ({ locale: 'fr', slug: article.slug })),
    ...en.map((article) => ({ locale: 'en', slug: article.slug })),
  ];
}
