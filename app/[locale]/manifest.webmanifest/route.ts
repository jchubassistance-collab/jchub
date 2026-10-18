import { NextResponse } from 'next/server';
import { webManifestResponse } from '@/lib/web-manifest';

/** English app manifest at /en/manifest.webmanifest; the French one stays at the root. */
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'en') return new NextResponse('Not found', { status: 404 });
  return webManifestResponse('en');
}
