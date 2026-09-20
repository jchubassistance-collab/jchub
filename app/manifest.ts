import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JcHub - Outils pour développeurs',
    short_name: 'JcHub',
    description: "L'écosystème pratique pour les développeurs.",
    start_url: '/',
    display: 'standalone',
    background_color: '#081426',
    theme_color: '#123f8c',
    lang: 'fr',
    icons: [
      {
        src: '/favicon-blue.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/favicon-blue.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}