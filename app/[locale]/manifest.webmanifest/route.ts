import { NextResponse } from 'next/server';
import { isLocale } from '@/i18n/routing';
import { webManifestResponse } from '@/lib/web-manifest';

/** App manifest of each language: /fr/manifest.webmanifest and /en/manifest.webmanifest. */
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return new NextResponse('Not found', { status: 404 });
  return webManifestResponse(locale);
}
