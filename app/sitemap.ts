import type { MetadataRoute } from 'next';
import { getPublishedArticles } from '@/lib/blog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev';
  const articles = await getPublishedArticles();
  return [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/blog`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/livres/pdf`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/livres/audio`, changeFrequency: 'weekly', priority: 0.8 },
    ...articles.map((article) => ({
      url: `${baseUrl}/blog/${article.slug}`,
      lastModified: article.updatedAt || article.publishedAt || undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
