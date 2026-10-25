import { NextRequest } from 'next/server';
import { isUnsplashImage } from '@/lib/photos';
import { renderSocialCard } from '@/lib/social-card';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Shared 1200×630 social card, drawn by the same template as the publication kits.
 * Without parameters it is the site-wide default image. `photo` only accepts an
 * images.unsplash.com address: the server never fetches anything else.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const english = params.get('lang') === 'en';
  const photo = params.get('photo') || '';
  return renderSocialCard({
    title: params.get('title') || (english ? 'Free, practical tools for developers' : 'Outils pratiques et gratuits pour développeurs'),
    subtitle: '',
    badge: params.get('category') || 'JcHub',
    footer: [english ? 'Free guides and tools' : 'Guides et outils gratuits', 'jchub.dev'],
    photo: isUnsplashImage(photo) ? photo : null,
  }, 'landscape', {
    'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    'CDN-Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    'X-Content-Type-Options': 'nosniff',
  });
}
