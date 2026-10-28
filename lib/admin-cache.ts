/**
 * Data of the admin, CM and writing spaces, kept in memory while the tab stays open. A page opened
 * again shows what it had at once and refreshes it in the background; hovering a link starts its
 * page's requests early. No page waits behind a loading screen.
 *
 * Nothing is written to the browser's storage: the messages, subscribers and accounts shown here
 * stay in this tab, and signing out (a full reload) empties the cache.
 */

const cache = new Map<string, unknown>();
const pending = new Map<string, Promise<unknown>>();

export class AdminFetchError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** The last answer this tab received from an address, if any. */
export function cachedJson<T>(url: string): T | undefined {
  return cache.get(url) as T | undefined;
}

/** Keeps an answer received another way, such as the article an editor just saved. */
export function rememberJson(url: string, data: unknown) {
  cache.set(url, data);
}

/** Fetches a JSON address and remembers its answer. A request already running for it is shared. */
export function fetchJson<T>(url: string, fallbackError = 'Chargement impossible.', signal?: AbortSignal): Promise<T> {
  const running = signal ? undefined : pending.get(url);
  if (running) return running as Promise<T>;
  const request = (async () => {
    const response = await fetch(url, { cache: 'no-store', signal });
    const data = await response.json().catch(() => null) as { error?: string } | null;
    if (!response.ok) throw new AdminFetchError(data?.error || fallbackError, response.status);
    cache.set(url, data);
    return data as T;
  })();
  if (!signal) {
    pending.set(url, request);
    request.then(() => pending.delete(url), () => pending.delete(url));
  }
  return request;
}

/** Addresses each page reads first, started as soon as a link to the page is hovered. */
const PAGE_DATA: [prefix: string, urls: string[]][] = [
  ['/admin/redaction', ['/api/redaction/articles']],
  ['/admin/users', ['/api/admin/users']],
  ['/admin/content', ['/api/admin/content']],
  ['/admin/analytics', ['/api/admin/analytics']],
  ['/admin/tools', ['/api/admin/tools']],
  ['/admin/agent', ['/api/admin/agent/drafts']],
  ['/admin/cm', ['/api/cm/reports', '/api/cm/catalog', '/api/cm/kits']],
  ['/admin/inbox', ['/api/admin/inbox']],
  ['/admin/settings', ['/api/admin/settings']],
];

export function prefetchPage(href: string) {
  const path = href.split('#')[0];
  const urls = path === '/admin' ? ['/api/admin/stats'] : PAGE_DATA.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))?.[1] || [];
  // A page opened again refreshes its own data: only what this tab never received is started early.
  urls.filter((url) => !cache.has(url) && !pending.has(url)).forEach((url) => { fetchJson(url).catch(() => undefined); });
}
