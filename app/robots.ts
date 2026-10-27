import type { MetadataRoute } from 'next';
import { getPublicBaseUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // Article covers are the og:image of every page: X and Google Images respect robots.txt.
      allow: ['/', '/api/article-cover'],
      disallow: ['/admin/', '/api/', '/fr/compte/', '/en/account/'],
    },
    sitemap: `${getPublicBaseUrl()}/sitemap.xml`,
  };
}
