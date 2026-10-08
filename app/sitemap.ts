import type { MetadataRoute } from 'next';
import { getPublishedArticles } from '@/lib/blog';
import { getPublishedTools } from '@/lib/tools';
import { getPublicBaseUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicBaseUrl();
  const [articles, tools] = await Promise.all([getPublishedArticles(), getPublishedTools()]);
  const publicPages = [
    { path: '', changeFrequency: 'weekly' as const, priority: 1 },
    { path: '/blog', changeFrequency: 'daily' as const, priority: 0.8 },
    { path: '/a-propos', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/outils', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/guides', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/pricing', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/cgu', changeFrequency: 'yearly' as const, priority: 0.2 },
    { path: '/cgv', changeFrequency: 'yearly' as const, priority: 0.2 },
    { path: '/confidentialite', changeFrequency: 'yearly' as const, priority: 0.2 },
    { path: '/mentions-legales', changeFrequency: 'yearly' as const, priority: 0.2 },
  ];

  const entries: MetadataRoute.Sitemap = [
    ...publicPages.map((page) => ({
      url: `${baseUrl}${page.path}`,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...articles.filter((article) => article.slug.trim()).map((article) => ({
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: article.updatedAt || article.publishedAt || undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...tools.filter((tool) => tool.slug.trim()).map((tool) => ({
      url: `${baseUrl}${tool.path ?? `/outils/${tool.slug}`}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];

  const uniqueEntries = new Map(entries.map((entry) => [entry.url, entry]));
  return Array.from(uniqueEntries.values());
}
