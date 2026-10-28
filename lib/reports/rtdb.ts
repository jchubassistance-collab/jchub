/**
 * Server access to the Realtime Database that holds the reports. Its rules refuse every client:
 * the server signs in as the Firebase service account (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY),
 * whose token bypasses the rules.
 *
 * The REST API is used rather than the SDK's database client: that client keeps a WebSocket open
 * per instance, which serverless functions freeze between requests (writes then hang until it
 * reconnects), and it would weigh on the proxy that runs before every page. Here each write is
 * one short HTTPS call with its own time limit, and the access token is kept for its lifetime.
 */

type TokenCache = { token: string; expiresAt: number; pending?: Promise<string> };

const TOKEN_SCOPES = 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email';
const globalCache = globalThis as typeof globalThis & { __jchubReportsToken?: TokenCache };

function databaseUrl(): string {
  return (process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '').trim().replace(/\/+$/, '');
}

function credentials() {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  return clientEmail && privateKey ? { clientEmail, privateKey } : null;
}

/** False when the database or the service account is not configured: reports are then skipped. */
export function hasReportsDatabase(): boolean {
  return Boolean(databaseUrl().startsWith('https://') && credentials());
}

function base64Url(bytes: Uint8Array | string): string {
  const data = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes;
  let binary = '';
  for (let index = 0; index < data.length; index += 1) binary += String.fromCharCode(data[index]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signedAssertion(clientEmail: string, privateKey: string): Promise<string> {
  const pem = privateKey.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (character) => character.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64Url(JSON.stringify({
    iss: clientEmail, scope: TOKEN_SCOPES, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  }))}`;
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
}

async function accessToken(timeoutMs: number): Promise<string> {
  const cache = globalCache.__jchubReportsToken;
  if (cache?.token && cache.expiresAt > Date.now() + 60_000) return cache.token;
  if (cache?.pending) return cache.pending;
  const account = credentials();
  if (!account) throw new Error('Compte de service Firebase absent.');
  const pending = (async () => {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: await signedAssertion(account.clientEmail, account.privateKey) }),
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });
    const result = await response.json().catch(() => null) as { access_token?: string; expires_in?: number } | null;
    if (!response.ok || !result?.access_token) throw new Error(`Jeton Google refusé (${response.status}).`);
    globalCache.__jchubReportsToken = { token: result.access_token, expiresAt: Date.now() + (result.expires_in || 3600) * 1000 };
    return result.access_token;
  })();
  globalCache.__jchubReportsToken = { token: cache?.token || '', expiresAt: cache?.expiresAt || 0, pending };
  try {
    return await pending;
  } catch (error) {
    globalCache.__jchubReportsToken = undefined;
    throw error;
  }
}

async function call(method: 'GET' | 'PATCH', path: string, options: { query?: Record<string, string | number | boolean>; body?: unknown; timeoutMs?: number } = {}) {
  const timeoutMs = options.timeoutMs ?? 5000;
  const token = await accessToken(timeoutMs);
  const url = new URL(`${databaseUrl()}/${path.replace(/^\/+/, '')}.json`);
  Object.keys(options.query || {}).forEach((key) => {
    const value = options.query![key];
    // Query values are JSON: strings between quotes, numbers and booleans as they are.
    url.searchParams.set(key, key === 'shallow' || typeof value !== 'string' ? String(value) : JSON.stringify(value));
  });
  const response = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${token}`, ...(options.body === undefined ? {} : { 'content-type': 'application/json' }) },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    if (response.status === 401) globalCache.__jchubReportsToken = undefined;
    throw new Error(`Realtime Database : ${method} ${path} a échoué (${response.status}).`);
  }
  return response.json() as Promise<unknown>;
}

/** Reads a node. `query` takes orderBy, startAt, endAt, limitToLast… ("$key" ordering needs no index). */
export function rtdbGet<T = unknown>(path: string, query?: Record<string, string | number | boolean>, timeoutMs?: number): Promise<T | null> {
  return call('GET', path, { query, timeoutMs }) as Promise<T | null>;
}

/** Writes the given children of `path` and leaves the others alone. Keys may be deep paths; null deletes. */
export async function rtdbUpdate(path: string, values: Record<string, unknown>, timeoutMs?: number): Promise<void> {
  if (!Object.keys(values).length) return;
  await call('PATCH', path, { body: values, timeoutMs });
}

/** Server value that adds `by` to a counter, atomically. */
export function increment(by = 1) {
  return { '.sv': { increment: by } };
}
