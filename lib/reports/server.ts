/**
 * Recording of the reports, on the server: the proxy writes one entry per request, the routes add
 * what happened (status, duration, summary, admin account) and every error is stored with its
 * request and emailed to the administrator. Nothing here may slow down or break a response: the
 * writes run after it (after / waitUntil), each has a time limit and failures are only logged.
 */
import { after, type NextRequest } from 'next/server';
import { clientIpFromHeaders, isCloudflareIp } from '@/lib/client-ip';
import {
  buildRequestEntry, compactEntry, describeCause, describeIntent, errorEmail, errorFingerprint, errorReport,
  isReportId, newReportId, redactPath, reportIdTime, requestKind, requestPath, routePattern, sanitizeContext, shouldEmailError,
  shouldTrackRequest, toolPageSlug, truncate, visitorLocation, type StoredError, type StoredFingerprint, type StoredRequest,
} from '@/lib/reports/core';
import { hasReportsDatabase, increment, rtdbGet, rtdbUpdate } from '@/lib/reports/rtdb';
import type { UserErrorContext } from '@/lib/user-error';

export const REQUEST_ID_HEADER = 'x-request-id';

type HeaderReader = { get(name: string): string | null };
type Outcome = { status?: number; summary?: string; user?: string };

function environment(): string {
  return process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
}

/** Reports are written when the database is configured, never while `next build` prerenders pages. */
export function reportsEnabled(): boolean {
  return process.env.NEXT_PHASE !== 'phase-production-build' && hasReportsDatabase();
}

function warn(message: string, error: unknown) {
  console.warn(message, error instanceof Error ? error.message : error);
}

/** Runs `task` once the response is sent, and keeps the function alive until it ends. */
function schedule(task: () => Promise<unknown>) {
  const run = () => task().catch((error) => warn('Rapport non enregistré.', error));
  try {
    after(run);
  } catch {
    // Outside a request (a script, a background task): run it now.
    void run();
  }
}

/** Id of the entry the proxy opened for this request, or '' (request not logged). */
export function requestIdOf(request: { headers: HeaderReader }): string {
  const id = request.headers.get(REQUEST_ID_HEADER) || '';
  return isReportId(id, 'r') ? id : '';
}

function visitor(headers: HeaderReader) {
  const peer = headers.get('x-real-ip')?.trim() || '';
  const viaCloudflare = Boolean(peer && isCloudflareIp(peer));
  return { ip: clientIpFromHeaders(headers), viaCloudflare, ...visitorLocation(headers, viaCloudflare) };
}

async function toolName(pathname: string): Promise<string | undefined> {
  const page = toolPageSlug(pathname);
  if (!page) return undefined;
  try {
    const { tools } = await import('@/lib/tools');
    const tool = tools.find((item) => (page.locale === 'en' ? (item.translations?.en?.slug || item.slug) : item.slug) === page.slug);
    return tool?.name;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------------------------
// Proxy

/** Proxy: the id of a new entry for this request, or '' when it is not logged. */
export function startRequestReport(request: NextRequest): string {
  if (!reportsEnabled()) return '';
  const tracked = shouldTrackRequest({ pathname: request.nextUrl.pathname, method: request.method, get: (name) => request.headers.get(name) });
  return tracked ? newReportId('r') : '';
}

/** Proxy, after the response: writes the entry (who, from where, what they wanted). */
export async function writeRequestReport(request: NextRequest, response: Response, id: string): Promise<void> {
  try {
    const { search } = request.nextUrl;
    const pathname = redactPath(request.nextUrl.pathname);
    const location = visitor(request.headers);
    const entry: StoredRequest = buildRequestEntry({
      time: reportIdTime(id),
      method: request.method,
      pathname,
      search,
      host: request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host,
      headers: request.headers,
      ip: location.ip,
      viaCloudflare: location.viaCloudflare,
      toolName: await toolName(pathname),
      env: environment(),
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
    warn('Requête non journalisée.', error);
  }
}

// ---------------------------------------------------------------------------------------------
// Outcomes

const pendingOutcomes = new WeakMap<Request, Outcome>();
const actors = new WeakMap<Request, string>();

async function writeOutcome(request: Request, id: string, outcome: Outcome) {
  const url = new URL(request.url);
  const values: Partial<StoredRequest> = {
    // Repeated from the proxy's entry, so the entry stays readable if that write was lost.
    t: reportIdTime(id),
    m: request.method,
    p: truncate(redactPath(url.pathname), 300),
    k: requestKind(url.pathname),
  };
  if (outcome.status) {
    values.st = outcome.status;
    values.ms = Math.max(0, Date.now() - reportIdTime(id));
  }
  if (outcome.summary) values.rs = truncate(outcome.summary, 200);
  if (outcome.user) values.u = truncate(outcome.user, 120);
  await rtdbUpdate(requestPath(id), values, 4000);
}

/**
 * What the route did for this request: status, a short summary ("3 pages converties", "limite
 * atteinte"), the admin account. Inside withReport it is merged into the final write.
 */
export function reportOutcome(request: Request, outcome: Outcome): void {
  if (outcome.user) actors.set(request, outcome.user);
  const id = requestIdOf(request);
  if (!id || !reportsEnabled()) return;
  const pending = pendingOutcomes.get(request);
  if (pending) {
    Object.assign(pending, Object.fromEntries(Object.entries(outcome).filter(([, value]) => value !== undefined && value !== '')));
    return;
  }
  schedule(() => writeOutcome(request, id, outcome));
}

const FILE_TYPES: Record<string, string> = {
  'application/pdf': 'PDF', 'text/csv': 'CSV', 'image/png': 'PNG', 'image/jpeg': 'JPEG', 'image/webp': 'WebP', 'image/avif': 'AVIF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel', 'application/zip': 'ZIP',
};

function responseSummary(response: Response): string {
  const type = (response.headers.get('content-type') || '').split(';')[0].trim();
  const size = Number(response.headers.get('content-length') || 0);
  const sizeText = size ? `, ${size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} Ko` : `${(size / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`}` : '';
  if (FILE_TYPES[type] || /attachment/i.test(response.headers.get('content-disposition') || '')) return `Fichier ${FILE_TYPES[type] || type} renvoyé${sizeText}`;
  if (response.status >= 300 && response.status < 400) return `Redirigé (${response.status})`;
  if (type === 'text/event-stream') return 'Flux en direct ouvert';
  return response.status < 400 ? `Réponse ${response.status}` : `Échec ${response.status}`;
}

/**
 * Wraps a route handler: once it answered, the request's entry gets the status, the duration and
 * a summary (the route's own, or the error message the visitor saw, or the kind of file sent).
 * An exception still reaches Next.js, which reports it through instrumentation.ts.
 */
export function withReport<Args extends unknown[]>(handler: (request: NextRequest, ...args: Args) => Promise<Response>) {
  return async function reportedHandler(request: NextRequest, ...args: Args): Promise<Response> {
    const id = requestIdOf(request);
    if (!id || !reportsEnabled()) return handler(request, ...args);
    const outcome: Outcome = {};
    pendingOutcomes.set(request, outcome);
    let response: Response | null = null;
    try {
      response = await handler(request, ...args);
      return response;
    } finally {
      pendingOutcomes.delete(request);
      const status = response?.status ?? 500;
      // The visitor's error message is the best summary of a failure; read from a copy after the response.
      const errorCopy = response && status >= 400 && /json/i.test(response.headers.get('content-type') || '') ? response.clone() : null;
      const fallback = response ? responseSummary(response) : 'Exception non gérée';
      schedule(async () => {
        let summary = outcome.summary;
        if (!summary && errorCopy) {
          const body = await errorCopy.json().catch(() => null) as { error?: unknown } | null;
          if (typeof body?.error === 'string') summary = body.error;
        }
        await writeOutcome(request, id, { ...outcome, status: outcome.status ?? status, summary: summary || fallback });
      });
    }
  };
}

// ---------------------------------------------------------------------------------------------
// Errors

export type ErrorRecordContext = UserErrorContext & {
  /** Headers, method and path when there is no Request object (onRequestError). */
  headers?: HeaderReader;
  method?: string;
  path?: string;
  /** Route file (/[locale]/blog/[slug]) and how the error surfaced. */
  route?: string;
  source?: string;
};

/** Stores an error with its request and visitor, counts its occurrences and emails it (at most every 30 min). */
export async function recordError(cause: unknown, context: ErrorRecordContext = {}): Promise<string | null> {
  if (!reportsEnabled()) return null;
  try {
    const now = Date.now();
    const id = newReportId('e', now);
    const headers: HeaderReader | undefined = context.request?.headers ?? context.headers;
    const requestId = headers ? requestIdOf({ headers }) : '';
    let path = context.path || '';
    let search = '';
    let method = context.method || '';
    if (context.request) {
      const url = new URL(context.request.url);
      path = redactPath(url.pathname);
      search = url.search;
      method = context.request.method;
    }
    const described = describeCause(cause);
    const env = environment();
    const where = context.route || path;
    const fingerprint = errorFingerprint(`${env === 'production' ? '' : `${env}:`}${where}`, `${described.name} ${described.message}`);
    const location = headers ? visitor(headers) : null;
    const userAgent = headers?.get('user-agent') || '';
    const status = context.status ?? described.status ?? (context.source === 'non gérée' ? 500 : undefined);
    const user = context.request ? actors.get(context.request) : undefined;

    const previous = await rtdbGet<StoredFingerprint>(`reports/fingerprints/${fingerprint}`, undefined, 4000).catch(() => null);
    const occurrence = (previous?.n || 0) + 1;
    // Only from production (previews also run with NODE_ENV=production): one email per error every 30 minutes.
    const email = environment() === 'production' && shouldEmailError(previous?.mailed, now);

    const entry = compactEntry({
      t: now,
      msg: described.message,
      fp: fingerprint,
      rid: requestId,
      m: method.toUpperCase().slice(0, 10),
      p: truncate(path, 300),
      k: path ? requestKind(path) : undefined,
      i: truncate(context.action || (path ? describeIntent({ method: method || 'GET', pathname: path, search }) : ''), 200),
      rt: context.route ? truncate(context.route, 200) : path ? routePattern(path) : '',
      src: context.source || 'gérée',
      nm: described.name,
      sk: described.stack,
      cd: described.code,
      st: status,
      n: occurrence,
      cx: sanitizeContext(context.details),
      ip: location?.ip,
      cc: location?.country,
      rg: location?.region,
      ci: location?.city,
      ua: truncate(userAgent, 300),
      u: user,
      env: env === 'production' ? '' : env,
    }) as StoredError;

    const fingerprintPath = `reports/fingerprints/${fingerprint}`;
    const values: Record<string, unknown> = {
      [`reports/errors/${id}`]: entry,
      [`${fingerprintPath}/n`]: increment(),
      [`${fingerprintPath}/last`]: now,
      [`${fingerprintPath}/eid`]: id,
      [`${fingerprintPath}/msg`]: truncate(described.message, 200),
      [`${fingerprintPath}/route`]: entry.rt || '',
      [`${fingerprintPath}/quiet`]: email ? 0 : increment(),
    };
    if (!previous?.first) values[`${fingerprintPath}/first`] = now;
    if (email) values[`${fingerprintPath}/mailed`] = now;
    if (requestId) {
      values[`${requestPath(requestId)}/er/${id}`] = true;
      if (context.source === 'non gérée') values[`${requestPath(requestId)}/st`] = 500;
    }
    await rtdbUpdate('', values, 5000);

    if (email) await sendErrorEmail(id, entry, { occurrences: occurrence, quiet: previous?.quiet || 0, firstAt: previous?.first });
    return id;
  } catch (error) {
    // Never through reportUserError: a failing report must not report itself again.
    warn('Erreur non enregistrée dans les rapports.', error);
    return null;
  }
}

/** Address of a report in the admin. */
export function reportLink(id: string): string {
  return `https://${(process.env.ADMIN_HOST || 'admin.jchub.dev').trim()}/admin/reports/${id}`;
}

async function sendErrorEmail(id: string, entry: StoredError, counts: { occurrences: number; quiet: number; firstAt?: number }) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const sender = process.env.BREVO_SENDER_EMAIL?.trim();
  const recipient = process.env.ADMIN_ALERT_EMAIL?.trim() || process.env.CONTACT_NOTIFICATION_EMAIL?.trim();
  if (!apiKey || !sender || !recipient) return;
  const email = errorEmail({ error: errorReport(id, entry), link: reportLink(id), ...counts });
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { email: sender, name: process.env.BREVO_SENDER_NAME?.trim() || 'JcHub' },
      to: [{ email: recipient }],
      subject: email.subject,
      htmlContent: email.html,
      textContent: email.text,
      tags: ['rapport-erreur'],
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) warn('E-mail d’erreur non envoyé.', `Brevo ${response.status}`);
}

/** reportUserError's server side: records the error once the response is sent. */
export function installErrorReporter(): void {
  (globalThis as { __jchubReportError?: (cause: unknown, context: UserErrorContext) => void }).__jchubReportError = (cause, context) => {
    if (!reportsEnabled()) return;
    schedule(() => recordError(cause, context));
  };
}
installErrorReporter();

/** Errors Next.js caught itself (thrown from a page, a route, an action or the proxy): see instrumentation.ts. */
export async function recordUnhandledError(
  error: unknown,
  request: { path: string; method: string; headers: Record<string, string | string[] | undefined> },
  context: { routePath?: string; routeType?: string },
): Promise<void> {
  const digest = typeof error === 'object' && error !== null && 'digest' in error ? String((error as { digest?: unknown }).digest) : '';
  // Redirects, notFound() and dynamic rendering bail-outs travel as errors but are not failures.
  if (/^(NEXT_|DYNAMIC_SERVER_USAGE|BAILOUT_TO_CLIENT_SIDE_RENDERING)/.test(digest)) return;
  const headers: HeaderReader = {
    get: (name) => {
      const value = request.headers[name.toLowerCase()];
      return Array.isArray(value) ? value.join(', ') : value ?? null;
    },
  };
  const source = { render: 'rendu de page', route: 'route API', action: 'action serveur', proxy: 'proxy' }[context.routeType || ''] || 'serveur';
  await recordError(error, {
    headers,
    method: request.method,
    path: redactPath(request.path.split('?')[0]),
    route: context.routePath,
    source: 'non gérée',
    details: { étape: source },
  });
}
