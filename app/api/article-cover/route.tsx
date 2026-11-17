import { createHash } from 'node:crypto';
import { NextRequest, NextResponse, after } from 'next/server';
import { get, put } from '@vercel/blob';
import { articleCoverPath, readArticleCover } from '@/lib/article-cover';
import { isUnsplashImage } from '@/lib/photos';
import { renderSocialCardJpeg } from '@/lib/social-card';
import { withReport } from '@/lib/reports/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=3600, s-maxage=86400',
  'CDN-Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
};

/** Raise it when the card template changes, so the stored covers are drawn again. */
const COVER_VERSION = 'v1';

/**
 * Drawing a card costs ~0.7 s of CPU, and the CDN cache is per region and emptied by every
 * deployment. So each cover is drawn once and kept in Blob, under a name derived from its
 * (signed) address; afterwards it is only read back, which costs almost no CPU.
 */
function storedCoverPath(canonicalQuery: string): string {
  const key = createHash('sha256').update(`${COVER_VERSION}:${canonicalQuery}`).digest('hex').slice(0, 32);
  return `article-covers/${COVER_VERSION}/${key}.jpg`;
}

function storeEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readStoredCover(pathname: string): Promise<ReadableStream<Uint8Array> | null> {
  try {
    const result = await get(pathname, { access: 'private' });
    return result?.statusCode === 200 ? result.stream : null;
  } catch (error) {
    console.warn('Couverture non relue depuis Blob.', error instanceof Error ? error.message : error);
    return null;
  }
}

function coverResponse(body: BodyInit) {
  return new Response(body, {
    headers: {
      'Content-Type': 'image/jpeg',
      ...CACHE_HEADERS,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

/**
 * Shared 1200×630 social card, drawn by the same template as the publication kits.
 * Without parameters it is the site-wide default image. Texts and photo are only drawn from
 * an address signed by lib/article-cover.ts, and `photo` only accepts an images.unsplash.com
 * address: the server never fetches anything else.
 */
export const GET = withReport(async function GET(request: NextRequest) {
  const cover = readArticleCover(request.nextUrl.searchParams);
  // Unsigned texts or extra parameters are sent to the address actually drawn, which the CDN
  // keeps: inventing new addresses no longer costs a render each.
  const canonical = new URL(articleCoverPath(cover), request.url);
  if (canonical.searchParams.toString() !== request.nextUrl.searchParams.toString()) {
    const response = NextResponse.redirect(canonical, 307);
    for (const [name, value] of Object.entries(CACHE_HEADERS)) response.headers.set(name, value);
    return response;
  }

  const pathname = storedCoverPath(canonical.searchParams.toString());
  if (storeEnabled()) {
    const stored = await readStoredCover(pathname);
    if (stored) return coverResponse(stored);
  }

  const english = cover.lang === 'en';
  const photo = cover.photo || '';
  // JPEG: also shown as the article cover on the site, where a PNG with a photo weighs ~900 KB.
  const jpeg = await renderSocialCardJpeg({
    title: cover.title || (english ? 'Free, practical tools for developers' : 'Outils pratiques et gratuits pour développeurs'),
    subtitle: '',
    badge: cover.category || 'JcHub',
    footer: [english ? 'Free guides and tools' : 'Guides et outils gratuits', 'jchub.dev'],
    photo: isUnsplashImage(photo) ? photo : null,
  }, 'landscape', 82);

  if (storeEnabled()) {
    after(() => put(pathname, Buffer.from(jpeg), {
      access: 'private',
      contentType: 'image/jpeg',
      addRandomSuffix: false,
      allowOverwrite: true,
    }).catch((error) => console.warn('Couverture non enregistrée dans Blob.', error instanceof Error ? error.message : error)));
  }

  return coverResponse(jpeg);
});
