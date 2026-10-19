import type { MetadataRoute } from 'next';
import { NextResponse } from 'next/server';
import type { Locale } from '@/i18n/routing';

// `id` keeps the identity the apps had when it came from their start address (/ for French,
// before the /fr prefix): an app already installed is updated, not seen as another one.
const texts: Record<Locale, Pick<MetadataRoute.Manifest, 'id' | 'name' | 'description' | 'start_url'>> = {
  fr: { id: '/', name: 'JcHub - Outils pour développeurs', description: "L'écosystème pratique pour les développeurs.", start_url: '/fr' },
  en: { id: '/en', name: 'JcHub - Developer tools', description: 'The practical ecosystem for developers.', start_url: '/en' },
};

/** Installed app of one language: it opens on the home page the visitor installed it from. */
export function webManifestResponse(locale: Locale) {
  const manifest: MetadataRoute.Manifest = {
    ...texts[locale],
    short_name: 'JcHub',
    display: 'standalone',
    background_color: '#081426',
    theme_color: '#123f8c',
    lang: locale,
    icons: [
      {
        src: '/jchub-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/jchub-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
  return NextResponse.json(manifest, { headers: { 'Content-Type': 'application/manifest+json' } });
}
