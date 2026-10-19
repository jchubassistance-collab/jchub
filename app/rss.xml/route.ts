import { NextResponse } from 'next/server';

/** Former address of the French feed: feed readers follow the permanent redirect. */
export function GET(request: Request) {
  return NextResponse.redirect(new URL('/fr/rss.xml', request.url), 308);
}
