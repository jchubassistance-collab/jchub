/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
          { key: 'Content-Security-Policy-Report-Only', value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://accounts.google.com https://challenges.cloudflare.com https://static.cloudflareinsights.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.google-analytics.com https://region1.google-analytics.com https://api.cloudinary.com https://challenges.cloudflare.com; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data: https:; frame-src 'self' https://accounts.google.com https://challenges.cloudflare.com; media-src 'self' blob: https:;" },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
  experimental: {
    typedRoutes: false,
    serverComponentsExternalPackages: ['@napi-rs/canvas'],
    outputFileTracingIncludes: {
      '/api/tools/pdf-to-word': ['./node_modules/pdfjs-dist/standard_fonts/**'],
    },
  },
};

export default nextConfig;
