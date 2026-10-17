/** @type {import('next').NextConfig} */
import { withWorkflow } from 'workflow/next';

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
    '/api/tools/pdf-to-word': ['./node_modules/pdfjs-dist/standard_fonts/**'],
  },
  async redirects() {
    // Former paid-offer pages: keep any indexed links and backlinks useful.
    return [
      { source: '/about', destination: '/a-propos', permanent: true },
      { source: '/pricing', destination: '/outils', permanent: true },
      { source: '/checkout', destination: '/outils', permanent: true },
      { source: '/paiement/:path*', destination: '/outils', permanent: true },
      { source: '/compte/abonnement', destination: '/compte', permanent: true },
      { source: '/guides', destination: '/blog', permanent: true },
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
        // The social card and the public tool catalog set their own CDN cache headers.
        source: '/api/:path((?!article-cover$|tool-assistant$).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

export default withWorkflow(nextConfig);
