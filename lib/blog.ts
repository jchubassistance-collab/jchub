import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { reportUserError } from '@/lib/user-error';

export type BlogArticle = {
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
};

function toIsoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date ? date.toISOString() : '';
  }
  return '';
}

function toArticle(data: Record<string, unknown>): BlogArticle {
  const keywords = Array.isArray(data.keywords) ? data.keywords.map(String) : [];
  const category = String(data.category || 'Développement');
  const status = data.status === 'scheduled' || data.status === 'draft' ? data.status : 'published';
  return {
    slug: String(data.slug || ''),
    title: String(data.title || 'Article JcHub'),
    description: String(data.description || ''),
    excerpt: String(data.excerpt || data.description || ''),
    keywords,
    category,
    author: String(data.author || 'JcHub'),
    image: String(data.image || '/blog/default.svg'),
    content: String(data.content || ''),
    status,
    publishedAt: toIsoDate(data.publishedAt),
    scheduledFor: toIsoDate(data.scheduledFor),
    readTime: String(data.readTime || '5 min'),
    updatedAt: toIsoDate(data.updatedAt),
    tags: Array.from(new Set([category, ...keywords.slice(0, 3)])),
  };
}

function getLocalFallback(): BlogArticle[] {
  const directory = path.join(process.cwd(), 'content', 'blog');
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((file) => /^\d{2}-.+\.md$/.test(file))
    .sort()
    .map((file) => {
      const parsed = matter(fs.readFileSync(path.join(directory, file), 'utf8'));
      const data = parsed.data as Record<string, unknown>;
      return toArticle({
        ...data,
        slug: data.slug || file.replace(/\.md$/, ''),
        content: parsed.content,
        image: `/blog/${file.replace(/\.md$/, '.svg')}`,
        status: 'published',
      });
    });
}

export async function getPublishedArticles(): Promise<BlogArticle[]> {
  if (!hasFirebaseAdminConfig()) return getLocalFallback();
  try {
    const snapshot = await getAdminDb().collection('articles').where('status', '==', 'published').get();
    return snapshot.docs.map((document) => toArticle(document.data() as Record<string, unknown>));
  } catch (error) {
    reportUserError();
    return getLocalFallback();
  }
}

export async function getPublishedArticleBySlug(slug: string): Promise<BlogArticle | null> {
  if (!hasFirebaseAdminConfig()) return getLocalFallback().find((article) => article.slug === slug) || null;
  try {
    const document = await getAdminDb().collection('articles').doc(slug).get();
    if (!document.exists) return null;
    const article = toArticle(document.data() as Record<string, unknown>);
    return article.status === 'published' ? article : null;
  } catch (error) {
    reportUserError();
    return null;
  }
}

export async function getPublishedArticleSlugs() {
  return (await getPublishedArticles()).map((article) => ({ slug: article.slug }));
}
