import { NextResponse } from 'next/server';
import type { Locale } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { getPublishedArticles } from '@/lib/blog';
import { getPublicBaseUrl } from '@/lib/site-url';

function escapeXml(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getPublishedDate(value?: string): Date | null {
  if (!value) return null;

  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp)
    ? null
    : new Date(timestamp);
}

const channelDescription: Record<Locale, string> = {
  fr: 'Articles, tutoriels et conseils pour développeurs.',
  en: 'Articles, tutorials and tips for developers.',
};

/** Blog feed of one language: /rss.xml in French, /en/rss.xml in English. */
export async function rssResponse(locale: Locale) {
  const baseUrl = getPublicBaseUrl().replace(/\/+$/, '');

  const articles = (await getPublishedArticles(locale))
    .filter((article) => article.slug?.trim())
    .map((article) => ({
      article,
      publishedDate: getPublishedDate(
        article.publishedAt || article.updatedAt,
      ),
    }))
    .sort(
      (a, b) =>
        (b.publishedDate?.getTime() || 0) -
        (a.publishedDate?.getTime() || 0),
    );

  const items = articles
    .map(({ article, publishedDate }) => {
      const link = `${baseUrl}${getPathname({ locale, href: { pathname: '/blog/[slug]', params: { slug: article.slug } } })}`;
      const description =
        article.description || article.excerpt || article.title;

      const pubDate = publishedDate
        ? `<pubDate>${publishedDate.toUTCString()}</pubDate>`
        : '';

      return `
        <item>
          <title>${escapeXml(article.title)}</title>
          <link>${escapeXml(link)}</link>
          <guid isPermaLink="true">${escapeXml(link)}</guid>
          <description>${escapeXml(description)}</description>
          ${pubDate}
        </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>JcHub | Blog</title>
    <link>${escapeXml(`${baseUrl}${getPathname({ locale, href: '/blog' })}`)}</link>
    <description>${channelDescription[locale]}</description>
    <language>${locale}</language>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
