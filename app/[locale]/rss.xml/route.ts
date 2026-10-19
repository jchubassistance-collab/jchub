import { NextResponse } from 'next/server';
import { isLocale } from '@/i18n/routing';
import { rssResponse } from '@/lib/rss';

export const dynamic = 'force-dynamic';

/** Blog feed of each language: /fr/rss.xml and /en/rss.xml. */
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new NextResponse('Not found', { status: 404 });
  return rssResponse(locale);
}
