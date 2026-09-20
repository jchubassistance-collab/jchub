import { NextRequest, NextResponse } from 'next/server';

const ADMIN_HOST = process.env.ADMIN_HOST || 'admin.jchub.dev';
const PUBLIC_HOST = process.env.PUBLIC_HOST || 'jchub.dev';
const WWW_HOST = `www.${PUBLIC_HOST}`;

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') || '';
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const hostname = request.nextUrl.hostname;

  if (hostname === WWW_HOST) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.hostname = PUBLIC_HOST;
    canonicalUrl.protocol = 'https:';
    return NextResponse.redirect(canonicalUrl, 308);
  }

  if (isAdminPath && hostname === PUBLIC_HOST) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.hostname = ADMIN_HOST;
    adminUrl.protocol = 'https:';
    return NextResponse.redirect(adminUrl);
  }

  if (isAdminPath) {
    const response = NextResponse.next();
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

    return NextResponse.json({ error: 'Accès admin non autorisé depuis cette adresse IP.' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
