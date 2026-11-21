/** @type {import('next').NextConfig} */
import { withWorkflow } from 'workflow/next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// Same defaults as proxy.ts.
const ADMIN_HOST = (process.env.ADMIN_HOST || 'admin.jchub.dev').toLowerCase();
const PUBLIC_HOST = (process.env.PUBLIC_HOST || 'jchub.dev').toLowerCase();

const facebookRedirectUri = process.env.FACEBOOK_REDIRECT_URI || process.env.META_REDIRECT_URI;
let facebookOAuthHost;
try {
  const redirect = new URL(facebookRedirectUri);
  if (redirect.protocol === 'https:') facebookOAuthHost = redirect.hostname;
} catch {
  facebookOAuthHost = undefined;
}

const nextConfig = {
  experimental: {
    agentUpgrade: 'security',
    // Two root layouts (app/[locale] and app/admin): the 404 of an unknown address is
    // app/global-not-found.tsx.
    globalNotFound: true,
  },
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
    '/api/article-cover': ['./assets/fonts/**', './public/jchub-icon-192.png'],
  },
  async redirects() {
    // Former paid-offer pages: keep any indexed links and backlinks useful.
    return [
      // The home page, first address of most visits: redirected by Vercel's routing before the
      // proxy, so no function runs (proxy.ts still covers the other unprefixed addresses).
      // Limited to the public host: admin.jchub.dev/ is handled by proxy.ts.
      { source: '/', has: [{ type: 'host', value: 'jchub\\.dev' }], destination: '/fr', permanent: true },
      // The admin host served a full copy of the public site, crawled by Google as duplicate
      // pages. Its public addresses now lead to the public host; /admin, the API, Next.js assets
      // and files (robots.txt, images…) stay on it. / is handled by proxy.ts.
      {
        source: '/:path((?!admin(?:/|$)|api/|_next/|.*[.][^/]+$).+)',
        has: [{ type: 'host', value: ADMIN_HOST.replaceAll('.', '\\.') }],
        destination: `https://${PUBLIC_HOST}/:path`,
        permanent: true,
      },
      { source: '/about', destination: '/fr/a-propos', permanent: true },
      { source: '/pricing', destination: '/fr/outils', permanent: true },
      { source: '/checkout', destination: '/fr/outils', permanent: true },
      { source: '/paiement/:path*', destination: '/fr/outils', permanent: true },
      { source: '/compte/abonnement', destination: '/fr/compte', permanent: true },
      { source: '/fr/compte/abonnement', destination: '/fr/compte', permanent: true },
      { source: '/guides', destination: '/fr/blog', permanent: true },
      // Former French addresses of the manifest and the feed, answered without a function.
      { source: '/manifest.webmanifest', destination: '/fr/manifest.webmanifest', permanent: true },
      { source: '/rss.xml', destination: '/fr/rss.xml', permanent: true },
      // Background remover, withdrawn in November 2026: its pages lead to the catalog.
      { source: '/fr/outils/supprimer-arriere-plan-image', destination: '/fr/outils', permanent: true },
      { source: '/outils/supprimer-arriere-plan-image', destination: '/fr/outils', permanent: true },
      { source: '/en/tools/background-remover', destination: '/en/tools', permanent: true },
      { source: '/en/tools/supprimer-arriere-plan-image', destination: '/en/tools', permanent: true },
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
        // The social cards, the public tool catalog and the public API (/api/public) set their own CDN cache headers.
        source: '/api/:path((?!article-cover$|tool-assistant$|kit-image/|public/).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

export default withWorkflow(withNextIntl(nextConfig));
