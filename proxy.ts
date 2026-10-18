import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const handleLocale = createIntlMiddleware(routing);

const ADMIN_HOST = process.env.ADMIN_HOST || 'admin.jchub.dev';
const PUBLIC_HOST = process.env.PUBLIC_HOST || 'jchub.dev';
const WWW_HOST = `www.${PUBLIC_HOST}`;

function getContentSecurityPolicy(nonce: string) {
  const developmentEval = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '';
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}'${developmentEval} https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://accounts.google.com https://static.cloudflareinsights.com https://tracker.metricool.com https://giscus.app`,
    "connect-src 'self' blob: https://vercel.com https://*.blob.vercel-storage.com https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://api.cloudinary.com https://tracker.metricool.com https://cloudflareinsights.com",
    "img-src 'self' data: blob: https:",
    "style-src 'self' 'unsafe-inline' https://giscus.app",
    "font-src 'self' data: https:",
    "frame-src 'self' https://accounts.google.com https://giscus.app",
    "media-src 'self' blob: https:",
  ].join('; ');
}

/**
 * Public pages get a language: /outils is served by app/[locale] as French, /en/tools as
 * English. API routes, the admin, Next.js internals and files (anything with an extension)
 * keep their address untouched.
 */
function isLocalizedPage(pathname: string) {
  return !pathname.startsWith('/api/')
    && !pathname.startsWith('/_next/')
    && !pathname.startsWith('/.well-known/')
    && !/\.[^/]+$/.test(pathname);
}

function getClientIp(request: NextRequest) {
  // x-forwarded-for can contain values supplied by the client. Use only
  // headers written by the configured hosting proxy.
  return request.headers.get('cf-connecting-ip')?.trim() || request.headers.get('x-real-ip')?.trim() || '';
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const hostname = request.nextUrl.hostname;
  const requestHeaders = new Headers(request.headers);
  const nonce = crypto.randomUUID();
  const contentSecurityPolicy = getContentSecurityPolicy(nonce);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-is-admin-path', isAdminPath ? '1' : '0');
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);

  if (hostname === WWW_HOST) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.hostname = PUBLIC_HOST;
    canonicalUrl.protocol = 'https:';
    const response = NextResponse.redirect(canonicalUrl, 308);
    response.headers.set('Content-Security-Policy', contentSecurityPolicy);
    return response;
  }

  if (isAdminPath && hostname === PUBLIC_HOST) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.hostname = ADMIN_HOST;
    adminUrl.protocol = 'https:';
    const response = NextResponse.redirect(adminUrl);
    response.headers.set('Content-Security-Policy', contentSecurityPolicy);
    return response;
  }

  if (isAdminPath) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('Content-Security-Policy', contentSecurityPolicy);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    response.headers.set('CDN-Cache-Control', 'no-store');

    const allowedIps = (process.env.ADMIN_ALLOWED_IPS || '')
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean);

    if (allowedIps.length === 0) return response;

    const clientIp = getClientIp(request);
    if (allowedIps.includes(clientIp)) return response;

    const deniedResponse = NextResponse.json({ error: 'Accès admin non autorisé depuis cette adresse IP.' }, { status: 403 });
    deniedResponse.headers.set('Content-Security-Policy', contentSecurityPolicy);
    return deniedResponse;
  }

  // The locale proxy forwards the headers of the request it receives: give it the nonce and the CSP.
  const response = isLocalizedPage(pathname)
    ? handleLocale(new NextRequest(request, { headers: requestHeaders }))
    : NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|rss.xml).*)'],
};
