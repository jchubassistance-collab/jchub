
import { NextRequest, NextResponse, type NextFetchEvent } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { legacyFrenchPath } from '@/i18n/legacy-paths';
import { REQUEST_ID_HEADER, startRequestReport, writeRequestReport } from '@/lib/reports/server';

const handleLocale = createIntlMiddleware(routing);

const ADMIN_HOST = (process.env.ADMIN_HOST || 'admin.jchub.dev').toLowerCase();
const PUBLIC_HOST = (process.env.PUBLIC_HOST || 'jchub.dev').toLowerCase();
const WWW_HOST = `www.${PUBLIC_HOST}`;

function getContentSecurityPolicy(nonce: string) {
  const developmentEval =
    process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '';

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    // wasm-unsafe-eval only lets WebAssembly compile (background remover model), not eval().
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${developmentEval} https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://accounts.google.com https://static.cloudflareinsights.com https://tracker.metricool.com`,
    "connect-src 'self' blob: https://vercel.com https://*.blob.vercel-storage.com https://*.googleapis.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://api.cloudinary.com https://tracker.metricool.com https://cloudflareinsights.com https://huggingface.co https://*.hf.co",
    "worker-src 'self'",
    "img-src 'self' data: blob: https:",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data: https:",
    "frame-src 'self' https://accounts.google.com",
    "media-src 'self' blob: https:",
  ].join('; ');
}

/**
 * Les pages publiques peuvent être localisées.
 * Les API, les chemins admin, les ressources Next.js et les fichiers
 * ne passent pas par la redirection de langue.
 */
function isLocalizedPage(pathname: string) {
  return (
    !pathname.startsWith('/api/')
    && !pathname.startsWith('/_next/')
    && !pathname.startsWith('/.well-known/')
    && !/\.[^/]+$/.test(pathname)
  );
}

/**
 * Each request gets an entry in the site reports (lib/reports), written once the response is
 * sent. Its id goes to the routes in x-request-id, so they can add their result and errors to it.
 */
export function proxy(request: NextRequest, event: NextFetchEvent) {
  const requestId = startRequestReport(request);
  const response = routeRequest(request, requestId);
  if (requestId) event.waitUntil(writeRequestReport(request, response, requestId));
  return response;
}

function routeRequest(request: NextRequest, requestId: string) {
  const pathname = request.nextUrl.pathname;
  const hostname = request.nextUrl.hostname.toLowerCase();

  const isAdminPath =
    pathname === '/admin'
    || pathname.startsWith('/admin/')
    || pathname === '/api/admin'
    || pathname.startsWith('/api/admin/');

  const requestHeaders = new Headers(request.headers);
  const nonce = crypto.randomUUID();
  const contentSecurityPolicy = getContentSecurityPolicy(nonce);

  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-is-admin-path', isAdminPath ? '1' : '0');
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);
  // Only the proxy names the entry: a value sent by the visitor is dropped.
  if (requestId) requestHeaders.set(REQUEST_ID_HEADER, requestId);
  else requestHeaders.delete(REQUEST_ID_HEADER);

  // Canonicaliser www.jchub.dev vers jchub.dev.
  if (hostname === WWW_HOST) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.hostname = PUBLIC_HOST;
    canonicalUrl.protocol = 'https:';

    const response = NextResponse.redirect(canonicalUrl, 308);
    response.headers.set('Content-Security-Policy', contentSecurityPolicy);

    return response;
  }

  // Rediriger les chemins admin du domaine public vers le sous-domaine admin.
  if (isAdminPath && hostname === PUBLIC_HOST) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.hostname = ADMIN_HOST;
    adminUrl.protocol = 'https:';

    const response = NextResponse.redirect(adminUrl, 307);
    response.headers.set('Content-Security-Policy', contentSecurityPolicy);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store');

    return response;
  }

  // Sur le sous-domaine admin, / redirige vers /admin.
  // La requête conserve ses paramètres éventuels.
  if (hostname === ADMIN_HOST && pathname === '/') {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = '/admin';
    adminUrl.protocol = 'https:';

    const response = NextResponse.redirect(adminUrl, 307);
    response.headers.set('Content-Security-Policy', contentSecurityPolicy);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'private, no-store');

    return response;
  }

  // Les pages et API d'administration restent privées et ne sont pas mises en cache.
  if (isAdminPath) {
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    response.headers.set('Content-Security-Policy', contentSecurityPolicy);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set(
      'Cache-Control',
      'private, no-store, no-cache, must-revalidate',
    );
    response.headers.set('CDN-Cache-Control', 'no-store');

    return response;
  }

  // Conserver les anciennes URL françaises.
  const frenchPath = isLocalizedPage(pathname)
    ? legacyFrenchPath(pathname)
    : null;

  if (frenchPath) {
    const frenchUrl = request.nextUrl.clone();
    frenchUrl.pathname = frenchPath;

    const response = NextResponse.redirect(frenchUrl, 308);
    response.headers.set('Content-Security-Policy', contentSecurityPolicy);

    return response;
  }

  // Appliquer le middleware de langue uniquement aux pages publiques.
  const response = isLocalizedPage(pathname)
    ? handleLocale(new NextRequest(request, { headers: requestHeaders }))
    : NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set('Content-Security-Policy', contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|rss.xml).*)',
  ],
};
