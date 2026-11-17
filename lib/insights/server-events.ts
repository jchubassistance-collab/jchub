import 'server-only';

import { insightsDb, visitorId } from '@/lib/insights/db';
import { deviceOf } from '@/lib/insights/paths';
import { requestVisitor } from '@/lib/reports/server';

/**
 * Calls to the tools that work on the server (app/api/tools/*), recorded after the response with
 * their status and their real duration: the processing time and error rate of Control Center ›
 * Outils. Called from withReport (lib/reports/server.ts).
 */

/** API route → French slug of the tool it serves. The upload route serves every tool: left out. */
export const TOOL_ROUTES: Record<string, string> = {
  'images-to-pdf': 'images-en-pdf',
  'image-to-pdf': 'images-en-pdf',
  'pdf-compressor': 'compresser-pdf',
  'pdf-to-word': 'pdf-to-word',
  'word-to-pdf': 'word-to-pdf',
  'excel-to-csv': 'excel-vers-csv',
  'csv-to-excel': 'csv-vers-excel',
  'image-optimizer': 'optimiseur-convertisseur-webp-png',
  ocr: 'ocr-image-en-texte',
  'google-vision': 'ocr-image-en-texte',
};

/**
 * Route of an API address with its variable parts grouped, so /api/admin/resources/abc123 and
 * /api/admin/resources/def456 count as one route: ids, numbers and long tokens become ":id".
 * A long token needs a digit: slugs like cleanup-conversion-blobs stay readable.
 */
export function apiRoute(pathname: string): string {
  return pathname.split('/').map((part) => (/^\d+$/.test(part) || /^(?=.*\d)[A-Za-z0-9_-]{16,}$/.test(part) || /^[0-9a-f-]{20,}$/i.test(part) ? ':id' : part)).join('/').slice(0, 120);
}

/**
 * Every API call answered through withReport: status and real duration. Server tools are kept as
 * 'tool_api' with their tool; the other routes as 'api_call' (Control Center › Performance).
 */
export async function recordApiCall(request: Request, status: number, durationMs: number, summary?: string): Promise<void> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/') || url.pathname === '/api/track' || request.method === 'OPTIONS') return;
  const route = url.pathname.match(/^\/api\/tools\/([a-z0-9-]+)/)?.[1];
  const tool = route ? TOOL_ROUTES[route] : undefined;
  if (route === 'upload') return;
  const db = await insightsDb().catch(() => null);
  if (!db) return;
  const userAgent = request.headers.get('user-agent') || '';
  const location = requestVisitor(request.headers);
  const now = Date.now();
  await db.execute({
    sql: "INSERT INTO events (ts, type, name, path, visitor, country, city, device, tool, value, meta, origin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'server')",
    args: [now, tool ? 'tool_api' : 'api_call', String(status), tool ? url.pathname : apiRoute(url.pathname), visitorId(new Date(now).toISOString().slice(0, 10), location.ip || 'inconnue', userAgent), location.country || null, location.city || null, deviceOf(userAgent), tool ?? null, Math.round(durationMs), JSON.stringify({ method: request.method })],
  }).catch((error) => console.error('[insights] Appel d’API non enregistré :', error instanceof Error ? error.message : error));
  // A server error may be part of a burst: Control Center › Alertes counts the last hour.
  if (status >= 500) {
    const { onCronFailure, onServerError } = await import('@/lib/alerts/server');
    const logFailure = (error: unknown) => console.error('[alerts] Contrôle des erreurs impossible :', error instanceof Error ? error.message : error);
    await onServerError().catch(logFailure);
    if (url.pathname.startsWith('/api/cron/')) await onCronFailure(url.pathname, status, summary).catch(logFailure);
  }
}
