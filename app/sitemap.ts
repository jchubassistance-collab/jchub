import type { MetadataRoute } from 'next';
import { getPublishedArticles } from '@/lib/blog';
import { getPublishedTools } from '@/lib/tools';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev';
  const baseUrl = configuredBaseUrl.replace(/^https:\/\/www\./, 'https://').replace(/\/$/, '');
  const [articles, tools] = await Promise.all([getPublishedArticles(), getPublishedTools()]);
  const publicPages = [
    { path: '', changeFrequency: 'weekly' as const, priority: 1 },
    { path: '/blog', changeFrequency: 'daily' as const, priority: 0.8 },
    { path: '/a-propos', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/outils', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/pricing', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.5 },
    { path: '/cgu', changeFrequency: 'yearly' as const, priority: 0.2 },
    { path: '/cgv', changeFrequency: 'yearly' as const, priority: 0.2 },
    { path: '/confidentialite', changeFrequency: 'yearly' as const, priority: 0.2 },
    { path: '/mentions-legales', changeFrequency: 'yearly' as const, priority: 0.2 },
  ];

  return [
    ...publicPages.map((page) => ({
      url: `${baseUrl}${page.path}`,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...articles.map((article) => ({
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: article.updatedAt || article.publishedAt || undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...tools.map((tool) => ({
      url: `${baseUrl}/outils/${tool.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
