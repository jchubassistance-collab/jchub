import { NextResponse } from 'next/server';
import { isLocale, routing } from '@/i18n/routing';
import { publicJson, publicTools } from '@/lib/public-api';

// Built once and refreshed at most every hour: the catalog changes rarely.
export const revalidate = 3600;
export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

/** Public tool catalog: /api/public/v1/fr/tools and /api/public/v1/en/tools. */
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return NextResponse.json({ error: 'Unknown locale' }, { status: 404 });
  return publicJson(locale, 'tools', await publicTools(locale));
}
