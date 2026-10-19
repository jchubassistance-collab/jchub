import { NextResponse } from 'next/server';

/** Former address of the French manifest. */
export function GET(request: Request) {
  return NextResponse.redirect(new URL('/fr/manifest.webmanifest', request.url), 308);
}
