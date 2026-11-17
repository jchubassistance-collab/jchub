/**
 * The part of the reports the proxy uses: opening an entry per request and writing it after the
 * response. It runs before every request in every region, so it only imports what it needs
 * (the pure helpers of core.ts, the REST client of rtdb.ts, the IP reading): importing
 * lib/reports/server.ts made the proxy carry firebase-admin, Firestore and the Control Center.
 */
import type { NextRequest } from 'next/server';
import { clientIpFromHeaders, isCloudflareIp } from '@/lib/client-ip';
import {
  buildRequestEntry, isReportId, newReportId, redactPath, reportIdTime, requestPath, shouldTrackRequest, truncate,
  visitorLocation, type StoredRequest,
} from '@/lib/reports/core';
import { hasReportsDatabase, rtdbUpdate } from '@/lib/reports/rtdb';

export const REQUEST_ID_HEADER = 'x-request-id';

type HeaderReader = { get(name: string): string | null };

export function reportsEnvironment(): string {
  return process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
}

/** Reports are written when the database is configured, never while `next build` prerenders pages. */
export function reportsEnabled(): boolean {
  return process.env.NEXT_PHASE !== 'phase-production-build' && hasReportsDatabase();
}

/** Id of the entry the proxy opened for this request, or '' (request not logged). */
export function requestIdOf(request: { headers: HeaderReader }): string {
  const id = request.headers.get(REQUEST_ID_HEADER) || '';
  return isReportId(id, 'r') ? id : '';
}

/** IP and location of the visitor, read the same way for the reports and the Control Center. */
export function requestVisitor(headers: HeaderReader) {
  const peer = headers.get('x-real-ip')?.trim() || '';
  const viaCloudflare = Boolean(peer && isCloudflareIp(peer));
  return { ip: clientIpFromHeaders(headers), viaCloudflare, ...visitorLocation(headers, viaCloudflare) };
}

/** Proxy: the id of a new entry for this request, or '' when it is not logged. */
export function startRequestReport(request: NextRequest): string {
  if (!reportsEnabled()) return '';
  const tracked = shouldTrackRequest({ pathname: request.nextUrl.pathname, method: request.method, get: (name) => request.headers.get(name) });
  return tracked ? newReportId('r') : '';
}

/**
 * Proxy, after the response: writes the entry (who, from where, what they wanted). A tool page
 * is described by its address (« images-en-pdf »): looking up its name loaded the whole catalog.
 */
export async function writeRequestReport(request: NextRequest, response: Response, id: string): Promise<void> {
  try {
    const { search } = request.nextUrl;
    const pathname = redactPath(request.nextUrl.pathname);
    const location = requestVisitor(request.headers);
    const entry: StoredRequest = buildRequestEntry({
      time: reportIdTime(id),
      method: request.method,
      pathname,
      search,
      host: request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host,
      headers: request.headers,
      ip: location.ip,
      viaCloudflare: location.viaCloudflare,
      env: reportsEnvironment(),
    });
    // A response made by the proxy itself (a redirect) is final; next() and rewrites go on to the route.
    if (!response.headers.has('x-middleware-next') && !response.headers.has('x-middleware-rewrite')) {
      const target = response.headers.get('location');
      entry.st = response.status;
      entry.ms = Math.max(0, Date.now() - entry.t);
      entry.rs = target ? `Redirigé vers ${truncate(target.replace(/^https?:\/\/[^/]+/, ''), 150)}` : `Réponse ${response.status} du proxy`;
    }
    await rtdbUpdate(requestPath(id), entry, 4000);
  } catch (error) {
    console.warn('Requête non journalisée.', error instanceof Error ? error.message : error);
  }
}
