
import { NextResponse } from 'next/server';
import { getPublishedArticles } from '@/lib/blog';
import { getPublicBaseUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

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

export async function GET() {
  const baseUrl = getPublicBaseUrl().replace(/\/+$/, '');

  const articles = (await getPublishedArticles())
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
      const link = `${baseUrl}/blog/${encodeURIComponent(article.slug)}`;
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
    <link>${escapeXml(`${baseUrl}/blog`)}</link>
    <description>Articles, tutoriels et conseils pour développeurs.</description>
    <language>fr</language>
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
