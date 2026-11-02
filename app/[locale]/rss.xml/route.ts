import { NextResponse } from 'next/server';
import { isLocale, routing } from '@/i18n/routing';
import { rssResponse } from '@/lib/rss';

// Rebuilt at most every 30 minutes: feed readers poll it often, articles change rarely.
export const revalidate = 1800;
export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

/** Blog feed of each language: /fr/rss.xml and /en/rss.xml. */
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new NextResponse('Not found', { status: 404 });
  return rssResponse(locale);
}
