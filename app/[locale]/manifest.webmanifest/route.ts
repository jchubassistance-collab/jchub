import { NextResponse } from 'next/server';
import { isLocale, routing } from '@/i18n/routing';
import { webManifestResponse } from '@/lib/web-manifest';

// Built once per language: the manifest only changes with a deploy.
export const dynamic = 'force-static';
export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

/** App manifest of each language: /fr/manifest.webmanifest and /en/manifest.webmanifest. */
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new NextResponse('Not found', { status: 404 });
  return webManifestResponse(locale);
}
