import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/compte/', '/checkout/'],
    },
    sitemap: 'https://jchub.dev/sitemap.xml',
  };
}