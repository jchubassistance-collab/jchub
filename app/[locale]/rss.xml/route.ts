import { NextResponse } from 'next/server';
import { rssResponse } from '@/lib/rss';

export const dynamic = 'force-dynamic';

/** English feed at /en/rss.xml; the French one stays at /rss.xml. */
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'en') return new NextResponse('Not found', { status: 404 });
  return rssResponse('en');
}
