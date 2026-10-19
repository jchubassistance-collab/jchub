/** @type {import('next').NextConfig} */
import { withWorkflow } from 'workflow/next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const facebookRedirectUri = process.env.FACEBOOK_REDIRECT_URI || process.env.META_REDIRECT_URI;
let facebookOAuthHost;
try {
  const redirect = new URL(facebookRedirectUri);
  if (redirect.protocol === 'https:') facebookOAuthHost = redirect.hostname;
} catch {
  facebookOAuthHost = undefined;
}

const nextConfig = {
  allowedDevOrigins: ['127.0.0.1', ...(facebookOAuthHost ? [facebookOAuthHost] : [])],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: false,
  serverExternalPackages: ['@napi-rs/canvas', '@adobe/pdfservices-node-sdk', 'gray-matter'],
  outputFileTracingIncludes: {
    // Articles are read from these files at request time by the blog, sitemap, RSS and agents.
    '/**': ['./content/articles/**/*.md'],
    '/api/tools/pdf-to-word': ['./node_modules/pdfjs-dist/standard_fonts/**'],
    '/api/cm/kits/[id]/image': ['./assets/fonts/**', './public/jchub-icon-192.png'],
    '/api/kit-image/[id]': ['./assets/fonts/**', './public/jchub-icon-192.png'],
  },
  async redirects() {
    // Former paid-offer pages: keep any indexed links and backlinks useful.
    return [
      { source: '/about', destination: '/fr/a-propos', permanent: true },
      { source: '/pricing', destination: '/fr/outils', permanent: true },
      { source: '/checkout', destination: '/fr/outils', permanent: true },
      { source: '/paiement/:path*', destination: '/fr/outils', permanent: true },
      { source: '/compte/abonnement', destination: '/fr/compte', permanent: true },
      { source: '/fr/compte/abonnement', destination: '/fr/compte', permanent: true },
      { source: '/guides', destination: '/fr/blog', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=()' },
        ],
      },
      {
        // The social cards and the public tool catalog set their own CDN cache headers.
        source: '/api/:path((?!article-cover$|tool-assistant$|kit-image/).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

export default withWorkflow(withNextIntl(nextConfig));
