import { NextResponse } from 'next/server';
import { getPublishedArticles } from '@/lib/blog';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev';
  const articles = await getPublishedArticles();
  const items = articles.map((article) => `<item><title><![CDATA[${article.title}]]></title><link>${baseUrl}/blog/${article.slug}</link><guid>${baseUrl}/blog/${article.slug}</guid><description><![CDATA[${article.description}]]></description><pubDate>${new Date(article.publishedAt || Date.now()).toUTCString()}</pubDate><author>${article.author}</author></item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>JcHub Blog</title><link>${baseUrl}/blog</link><description>Articles, tutoriels et conseils pour développeurs.</description><language>fr</language>${items}</channel></rss>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } });
}
