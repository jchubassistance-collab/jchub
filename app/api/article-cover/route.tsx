import { NextRequest, NextResponse } from 'next/server';
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
  return new Response(jpeg, {
    headers: {
      'Content-Type': 'image/jpeg',
      ...CACHE_HEADERS,
      'X-Content-Type-Options': 'nosniff',
    },
  });
});
