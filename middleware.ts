import { NextRequest, NextResponse } from 'next/server';

const ADMIN_HOSTS = ['admin.jchub.dev', 'admin.localhost'];

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0].toLowerCase();
  if (!hostname || !ADMIN_HOSTS.includes(hostname)) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? '/admin' : `/admin${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
