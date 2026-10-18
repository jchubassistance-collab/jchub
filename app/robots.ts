import type { MetadataRoute } from 'next';
import { getPublicBaseUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/compte/', '/en/account/'],
    },
    sitemap: `${getPublicBaseUrl()}/sitemap.xml`,
  };
}
