import { NextRequest, NextResponse } from 'next/server';
import { requireCm } from '@/lib/admin-auth';
import { getPublishedArticles } from '@/lib/blog';
import { getPublishedTools } from '@/lib/tools';
import { cmError } from '@/lib/cm-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireCm(request);
    const articles = (await getPublishedArticles()).map(({ slug, title, description, excerpt, category, publishedAt, tags, image }) => ({ slug, title, description, excerpt, category, publishedAt, tags, image, url: `/blog/${encodeURIComponent(slug)}`, kind: 'Article' }));
    const publishedTools = (await getPublishedTools({ includeScheduled: true })).map(({ name, description, category, tags, path, slug, icon }) => ({ slug, title: name, description, category, tags, icon, url: path || `/outils/${encodeURIComponent(slug)}`, kind: 'Outil' }));
    return NextResponse.json({ content: [...publishedTools, ...articles] }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return cmError(error); }
}
