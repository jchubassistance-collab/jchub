import { NextResponse } from 'next/server';
import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getPublishedArticles } from '@/lib/blog';
import { getPublishedTools, localizeTool, toolPath } from '@/lib/tools';
import { getPublicBaseUrl } from '@/lib/site-url';

/**
 * Public read-only API (/api/public/v1/<locale>/tools|articles), used by /embed.js and by
 * anyone who wants to list JcHub's tools or articles on their own site. Only what the public
 * pages already show is exposed: no article body (the full text stays on jchub.dev, for SEO).
 */

export const PUBLIC_API_VERSION = 1;

export type PublicTool = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tags: string[];
  url: string;
};

export type PublicArticle = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  readTime: string;
  author: string;
  publishedAt: string | null;
  url: string;
};

function absolute(baseUrl: string, value: string): string {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

export async function publicTools(locale: Locale): Promise<PublicTool[]> {
  const baseUrl = getPublicBaseUrl();
  return (await getPublishedTools()).map((tool) => {
    const local = localizeTool(tool, locale);
    return {
      id: tool.slug,
      name: local.name,
      description: local.description,
      icon: local.icon,
      category: local.category,
      tags: local.tags.slice(0, 8),
      url: absolute(baseUrl, toolPath(tool, locale)),
    };
  }).sort((a, b) => a.name.localeCompare(b.name, locale));
}

export async function publicArticles(locale: Locale): Promise<PublicArticle[]> {
  const baseUrl = getPublicBaseUrl();
  return (await getPublishedArticles(locale))
    .filter((article) => article.slug?.trim())
    .map((article) => {
      const date = Date.parse(article.publishedAt || article.updatedAt || '');
      return {
        id: article.id,
        title: article.title,
        excerpt: article.excerpt || article.description,
        category: article.category,
        image: absolute(baseUrl, article.image),
        readTime: article.readTime,
        author: article.author,
        publishedAt: Number.isFinite(date) ? new Date(date).toISOString() : null,
        url: absolute(baseUrl, getPathname({ locale, href: { pathname: '/blog/[slug]', params: { slug: article.slug } } })),
      };
    })
    .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
}

/**
 * JSON readable from any site (CORS *), cached by the CDN: the routes are rebuilt at most once
 * an hour, so embeds on other sites cost no function call per visit.
 */
export function publicJson(locale: Locale, key: 'tools' | 'articles', items: unknown[]) {
  return NextResponse.json(
    { version: PUBLIC_API_VERSION, locale, source: getPublicBaseUrl(), count: items.length, [key]: items },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'X-Robots-Tag': 'noindex',
      },
    },
  );
}
