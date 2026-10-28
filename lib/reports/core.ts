/**
 * Site reports: what each request wanted, what it got, and the errors it hit. This file holds the
 * pure part (identifiers, intents, sanitizing, filters) shared by the proxy, the routes, the admin
 * and the tests. It imports nothing, so `node --test` loads it as is.
 *
 * Entries are stored in the Realtime Database with short keys (a month of traffic stays small):
 *   reports/requests/{YYYY-MM-DD}/{r…}  one request (UTC day, so a whole day is purged at once)
 *   reports/errors/{e…}                 one error, linked to its request
 *   reports/fingerprints/{hash}         occurrences of the same error and when it was last emailed
 */

export type RequestKind = 'page' | 'api' | 'admin' | 'cron' | 'auth';
export const REQUEST_KINDS: RequestKind[] = ['page', 'api', 'admin', 'cron', 'auth'];

export const REQUEST_RETENTION_DAYS = 30;
export const ERROR_RETENTION_DAYS = 90;
export const ERROR_EMAIL_INTERVAL_MS = 30 * 60 * 1000;
export const STACK_MAX_LENGTH = 4000;

/** A request as stored. */
export type StoredRequest = {
  t: number; m: string; p: string; k: RequestKind; i: string;
  q?: string; h?: string; l?: string; al?: string; ip?: string; cc?: string; rg?: string; ci?: string;
  ua?: string; rf?: string; b?: boolean; env?: string;
  /** Known once the route answered: status, duration, what happened, admin account. */
  st?: number; ms?: number; rs?: string; u?: string;
  er?: Record<string, boolean>;
};

/** An error as stored. */
export type StoredError = {
  t: number; msg: string; fp: string;
  rid?: string; m?: string; p?: string; k?: RequestKind; i?: string; rt?: string; src?: string;
  nm?: string; sk?: string; cd?: string; st?: number; n?: number;
  cx?: Record<string, string | number | boolean>;
  ip?: string; cc?: string; rg?: string; ci?: string; ua?: string; u?: string; env?: string;
};

export type StoredFingerprint = { n?: number; first?: number; last?: number; mailed?: number; quiet?: number; eid?: string; msg?: string; route?: string };

export type RequestReport = {
  id: string; at: number; method: string; path: string; query: string; host: string; locale: string;
  browserLanguage: string; ip: string; country: string; region: string; city: string; userAgent: string;
  device: string; referer: string; bot: boolean; kind: RequestKind; intent: string; env: string;
  status: number | null; durationMs: number | null; result: string; user: string; errorIds: string[];
};

export type ErrorReport = {
  id: string; at: number; requestId: string; method: string; path: string; kind: RequestKind | '';
  intent: string; route: string; source: string; message: string; name: string; stack: string; code: string;
  status: number | null; context: Record<string, string | number | boolean>; fingerprint: string;
  occurrence: number | null; ip: string; country: string; region: string; city: string; userAgent: string;
  device: string; user: string; env: string;
};

// ---------------------------------------------------------------------------------------------
// Identifiers: a prefix, the time in base 36 and a random part. Keys sort by time, so the
// database can read a time range without an index, and the id gives the day of its entry.

const ID_PATTERN = /^[re][0-9a-z]{9}[0-9a-z]{6}$/;

function timePart(time: number): string {
  const text = Math.max(0, Math.floor(time)).toString(36);
  return text.length >= 9 ? text.slice(-9) : `000000000${text}`.slice(-9);
}

export function newReportId(prefix: 'r' | 'e', time = Date.now(), random: () => number = Math.random): string {
  let suffix = '';
  for (let index = 0; index < 6; index += 1) suffix += Math.floor(random() * 36).toString(36);
  return `${prefix}${timePart(time)}${suffix}`;
}

/** Smallest key of `prefix` at `time`: the start of a time range. */
export function reportKeyAt(prefix: 'r' | 'e', time: number): string {
  return `${prefix}${timePart(time)}`;
}

export function isReportId(value: unknown, prefix?: 'r' | 'e'): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value) && (!prefix || value[0] === prefix);
}

export function reportIdTime(id: string): number {
  return parseInt(id.slice(1, 10), 36);
}

/** UTC day of a time, the folder of its request entries. */
export function dayKey(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

export function requestPath(id: string): string {
  return `reports/requests/${dayKey(reportIdTime(id))}/${id}`;
}

// ---------------------------------------------------------------------------------------------
// Text helpers

export function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/**
 * Cloudflare and Vercel send header values as Latin-1 bytes: a city such as "Brazzaville" is
 * fine, "Pointe-Noire" too, but "Béjaïa" arrives as UTF-8 read as Latin-1. Decode it back.
 */
export function headerText(value: string | null | undefined): string {
  const text = (value || '').trim();
  if (!text || !/[\u0080-ÿ]/.test(text) || /[^\u0000-ÿ]/.test(text)) return text;
  try {
    const bytes = new Uint8Array(text.length);
    for (let index = 0; index < text.length; index += 1) bytes[index] = text.charCodeAt(index);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return text;
  }
}

const SECRET_PARAMS = /([?&;](?:code|state|token|access_token|id_token|refresh_token|oobcode|apikey|api_key|key|secret|client_secret|signature|sig|password|session|auth)=)[^&\s#;]+/gi;

/** Secrets an error message, a stack or an address can carry, replaced before anything is stored. */
export function redactSecrets(text: string): string {
  return text
    .replace(/-----BEGIN [A-Z ]+-----[\s\S]*?-----END [A-Z ]+-----/g, '[clé masquée]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [masqué]')
    .replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g, '[jeton masqué]')
    .replace(SECRET_PARAMS, '$1[masqué]')
    .replace(/\b(api[-_ ]?key|secret|password|passwd|token|authorization|private[-_ ]?key)(["']?\s*[:=]\s*["']?)([^\s"',;&]{4,})/gi, '$1$2[masqué]')
    .replace(/\b(sk|pk|rk)[-_](live|test|proj)?[-_]?[A-Za-z0-9]{16,}\b/g, '[clé masquée]')
    .replace(/([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})/g, '$1…@$2');
}

/** The query string of an address, secrets masked. */
export function redactQuery(search: string): string {
  const query = search.startsWith('?') ? search.slice(1) : search;
  return query ? redactSecrets(`?${query}`).slice(1) : '';
}

/** An address path: workflow webhook addresses carry their secret token in the path itself. */
export function redactPath(pathname: string): string {
  return pathname.replace(/^(\/\.well-known\/workflow\/v1\/webhook\/)[^/]+/, '$1[masqué]');
}

/** Referer without its query (it can carry another site's tokens). */
export function cleanReferer(value: string | null | undefined): string {
  if (!value) return '';
  try {
    const url = new URL(value);
    return truncate(`${url.origin}${url.pathname}`, 200);
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------------------------
// Which requests are logged, their kind and what the visitor wanted

const ASSET_EXTENSION = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|bmp|css|m?js|map|woff2?|ttf|otf|eot|webmanifest|mp3|mp4|webm|ogg|wasm|onnx|pdf|zip)$/i;
const SUSPICIOUS_PATH = /(?:\.(?:php\d?|aspx?|jsp|cgi|env|git|svn|sql|bak|old|ini|ya?ml|config|DS_Store)(?:$|\/))|(?:^|\/)(?:wp-[a-z-]+|wordpress|phpmyadmin|pma|cgi-bin|xmlrpc|vendor\/phpunit|\.aws|\.ssh|actuator|server-status|boaform|HNAP1|owa|autodiscover)(?:$|\/)/i;

export function isSuspiciousPath(pathname: string): boolean {
  return SUSPICIOUS_PATH.test(pathname);
}

export function isReportsPath(pathname: string): boolean {
  return /^\/(?:api\/)?admin\/reports(?:\/|$)/.test(pathname);
}

/**
 * Requests worth an entry. Left out: the Rapports section itself (each look would log itself),
 * link prefetches (nobody opened the page), CORS preflights, Next.js internals and the files of
 * public/ (icons, fonts): they say nothing about what the visitor did.
 */
export function shouldTrackRequest(input: { pathname: string; method: string; get(name: string): string | null }): boolean {
  const { pathname, method } = input;
  if (method === 'OPTIONS') return false;
  if (isReportsPath(pathname)) return false;
  if (pathname.startsWith('/_next/') || pathname.startsWith('/__nextjs')) return false;
  if (ASSET_EXTENSION.test(pathname) && !isSuspiciousPath(pathname)) return false;
  const purpose = `${input.get('sec-purpose') || ''} ${input.get('purpose') || ''}`;
  if (input.get('next-router-prefetch') === '1' || /prefetch/i.test(purpose)) return false;
  return true;
}

export function requestKind(pathname: string): RequestKind {
  if (pathname.startsWith('/api/cron/')) return 'cron';
  if (pathname.startsWith('/api/auth/') || pathname === '/api/admin/session' || /^\/admin\/(?:login|register)(?:\/|$)/.test(pathname)) return 'auth';
  if (/^\/(?:api\/)?admin(?:\/|$)/.test(pathname) || pathname.startsWith('/api/cm/')) return 'admin';
  if (pathname.startsWith('/api/')) return 'api';
  return 'page';
}

const BOT_USER_AGENT = /bot\b|bot\/|crawl|spider|slurp|archiver|facebookexternalhit|facebookcatalog|embedly|preview|whatsapp|telegram|discord|skype|curl|wget|python|httpx|aiohttp|go-http-client|java\/|okhttp|axios|node-fetch|undici|libwww|scrapy|headless|phantomjs|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|scanner|zgrab|masscan|nmap|nikto|sqlmap|censys|shodan|vercel-(?:screenshot|favicon)/i;

/** A robot, by its user agent (or its lack of one), or a scan of paths a visitor never opens. */
export function isBotRequest(userAgent: string, pathname = ''): boolean {
  return !userAgent.trim() || BOT_USER_AGENT.test(userAgent) || isSuspiciousPath(pathname);
}

/** "Chrome · Android", "Safari · iPhone"… */
export function deviceLabel(userAgent: string): string {
  if (!userAgent) return 'Inconnu';
  if (BOT_USER_AGENT.test(userAgent)) {
    const name = userAgent.match(/([A-Za-z][\w.-]*(?:bot|crawler|spider))/i)?.[1];
    return name ? `Robot · ${name}` : 'Robot';
  }
  const system = /iPhone/.test(userAgent) ? 'iPhone'
    : /iPad/.test(userAgent) ? 'iPad'
      : /Android/.test(userAgent) ? (/Mobile/.test(userAgent) ? 'Android' : 'Tablette Android')
        : /Windows NT/.test(userAgent) ? 'Windows'
          : /CrOS/.test(userAgent) ? 'ChromeOS'
            : /Mac OS X|Macintosh/.test(userAgent) ? 'macOS'
              : /Linux/.test(userAgent) ? 'Linux' : '';
  const browser = /Edg(?:A|iOS)?\//.test(userAgent) ? 'Edge'
    : /OPR\/|Opera/.test(userAgent) ? 'Opera'
      : /SamsungBrowser/.test(userAgent) ? 'Samsung Internet'
        : /Firefox\/|FxiOS/.test(userAgent) ? 'Firefox'
          : /CriOS|Chrome\//.test(userAgent) ? 'Chrome'
            : /Safari\//.test(userAgent) ? 'Safari' : '';
  return [browser, system].filter(Boolean).join(' · ') || truncate(userAgent, 40);
}

const API_INTENTS: Record<string, string | Record<string, string>> = {
  '/api/tools/pdf-to-word': 'Conversion PDF → Word',
  '/api/tools/word-to-pdf': 'Conversion Word → PDF',
  '/api/tools/csv-to-excel': 'Conversion CSV → Excel',
  '/api/tools/excel-to-csv': 'Conversion Excel → CSV',
  '/api/tools/image-optimizer': 'Optimisation et conversion d’une image',
  '/api/tools/images-to-pdf': 'Conversion d’images en PDF',
  '/api/tools/ocr': 'Extraction du texte d’un document (OCR)',
  '/api/tools/pdf-compressor': 'Compression d’un PDF',
  '/api/tools/upload': { POST: 'Envoi d’un fichier à traiter', DELETE: 'Suppression d’un fichier temporaire' },
  '/api/contact': 'Envoi du formulaire de contact',
  '/api/newsletter': 'Inscription à la newsletter',
  '/api/tool-assistant': { GET: 'Chargement des outils de l’assistant', POST: 'Question à l’assistant des outils' },
  '/api/nav-search': { POST: 'Enregistrement d’une recherche' },
  '/api/article-cover': 'Image de couverture d’un article',
  '/api/admin/session': { POST: 'Connexion à l’administration', DELETE: 'Déconnexion de l’administration', GET: 'Vérification de la session admin' },
};

const CRON_LABELS: Record<string, string> = {
  'editorial-agent': 'agent éditorial de la semaine',
  'translate-content': 'traduction des contenus',
  'publish-scheduled': 'publication des contenus programmés',
  'publish-tool-devto': 'publication d’un outil sur DEV',
  'publish-social': 'publication sur les réseaux sociaux',
  'cm-weekly-insights': 'bilan hebdomadaire de l’espace CM',
  'cleanup-conversion-blobs': 'nettoyage des fichiers temporaires',
  'cleanup-reports': 'nettoyage des rapports',
  'notify-newsletter': 'envoi de la newsletter',
  'sync-audiobooks': 'synchronisation des livres audio',
};

const ADMIN_SECTIONS: Record<string, string> = {
  '': 'tableau de bord', inbox: 'boîte de réception', analytics: 'acquisition', content: 'contenus', tools: 'outils',
  users: 'utilisateurs', settings: 'réglages', social: 'réseaux sociaux', agent: 'agent éditorial', cm: 'espace CM',
  'cm-access': 'accès CM', 'cm-accounts': 'comptes CM', login: 'connexion', register: 'inscription', guides: 'guides',
  stats: 'statistiques', reports: 'rapports', catalog: 'catalogue', editorial: 'calendrier éditorial',
  kits: 'kits de publication', publishing: 'publications', stream: 'flux en direct',
};

const PAGE_LABELS: Record<string, string> = {
  '': 'Visite de l’accueil', blog: 'Consultation du blog', outils: 'Catalogue des outils', tools: 'Catalogue des outils',
  contact: 'Page de contact', 'a-propos': 'Page « À propos »', about: 'Page « À propos »', aide: 'Centre d’aide',
  help: 'Centre d’aide', cgu: 'Lecture des CGU', terms: 'Lecture des CGU', cgv: 'Lecture des CGV',
  'terms-of-sale': 'Lecture des CGV', confidentialite: 'Lecture de la politique de confidentialité',
  privacy: 'Lecture de la politique de confidentialité', 'mentions-legales': 'Lecture des mentions légales',
  'legal-notice': 'Lecture des mentions légales', compte: 'Espace compte', account: 'Espace compte',
  'suppression-donnees': 'Demande de suppression des données', 'data-deletion': 'Demande de suppression des données',
  auth: 'Action d’authentification (lien reçu par e-mail)',
};

const ACTION_VERBS: Record<string, string> = { GET: 'consultation', HEAD: 'consultation', POST: 'action', PUT: 'modification', PATCH: 'modification', DELETE: 'suppression' };

function decodeSegment(segment: string): string {
  try { return decodeURIComponent(segment); } catch { return segment; }
}

/** The tool slug of a tool page (/fr/outils/<slug>, /en/tools/<slug>), or null. */
export function toolPageSlug(pathname: string): { locale: 'fr' | 'en'; slug: string } | null {
  const match = pathname.match(/^\/(fr|en)\/(?:outils|tools)\/([^/]+)\/?$/);
  if (!match || ['categorie', 'category', 'apercu', 'preview'].includes(match[2])) return null;
  return { locale: match[1] as 'fr' | 'en', slug: decodeSegment(match[2]) };
}

/** What the visitor wanted, in a sentence an admin reads at a glance. */
export function describeIntent(input: { method: string; pathname: string; search?: string; toolName?: string }): string {
  const method = input.method.toUpperCase();
  const pathname = input.pathname.replace(/\/+$/, '') || '/';
  if (isSuspiciousPath(pathname)) return `Sonde automatique sur ${truncate(pathname, 80)}`;

  if (pathname === '/api/nav-search' && method !== 'POST') {
    const query = new URLSearchParams(input.search || '').get('q')?.trim();
    return query ? `Recherche « ${truncate(query, 60)} »` : 'Recherche dans le site';
  }
  const api = API_INTENTS[pathname];
  if (api) return typeof api === 'string' ? api : api[method] || api.GET || Object.values(api)[0];
  const segments = pathname.split('/').filter(Boolean).map(decodeSegment);

  if (pathname.startsWith('/api/cron/')) return `Tâche planifiée : ${CRON_LABELS[segments[2]] || segments[2]}`;
  if (pathname.startsWith('/api/auth/')) {
    const provider = segments[2] ? segments[2][0].toUpperCase() + segments[2].slice(1) : 'OAuth';
    return segments[3] === 'callback' ? `Retour de connexion ${provider} (espace CM)` : `Connexion ${provider} (espace CM)`;
  }
  if (pathname.startsWith('/api/blog/') && segments[3] === 'view') return `Lecture comptée de l’article « ${truncate(segments[2], 80)} »`;
  if (pathname.startsWith('/api/kit-image/')) return 'Image d’un kit de publication';
  if (pathname.startsWith('/api/admin/') || pathname.startsWith('/api/cm/')) {
    const area = segments[1] === 'cm' ? 'Espace CM' : 'Admin';
    const section = ADMIN_SECTIONS[segments[2]] || segments[2];
    const detail = segments.length > 3 ? ` (${truncate(segments.slice(3).join(' / '), 60)})` : '';
    return `${area} · ${section}${detail} : ${ACTION_VERBS[method] || method.toLowerCase()}`;
  }
  if (pathname.startsWith('/api/')) return `Appel de l’API ${truncate(pathname, 80)}`;

  if (segments[0] === 'admin') {
    const section = ADMIN_SECTIONS[segments[1] || ''] || segments[1];
    return `Admin · page ${section}${segments.length > 2 ? ` (${truncate(segments.slice(2).join(' / '), 60)})` : ''}`;
  }

  const hasLocale = segments[0] === 'fr' || segments[0] === 'en';
  const rest = hasLocale ? segments.slice(1) : segments;
  const action = method === 'GET' || method === 'HEAD' ? '' : ` (${method})`;
  if (!rest.length) return `${PAGE_LABELS['']}${action}`;
  if (rest[0] === 'blog' && rest[1] && rest[1] !== 'categorie' && rest[1] !== 'category') return `Lecture de l’article ${truncate(pathname, 120)}${action}`;
  if ((rest[1] === 'categorie' || rest[1] === 'category') && rest[2]) {
    return `${rest[0] === 'blog' ? 'Articles' : 'Outils'} de la catégorie « ${truncate(rest[2], 60)} »${action}`;
  }
  if ((rest[0] === 'outils' || rest[0] === 'tools') && rest[1]) {
    if ((rest[1] === 'apercu' || rest[1] === 'preview') && rest[2]) return `Aperçu du composant d’outil ${rest[2]}`;
    return `Ouverture de l’outil ${input.toolName || `« ${truncate(rest[1], 80)} »`}${action}`;
  }
  const label = PAGE_LABELS[rest[0]];
  if (label) return `${label}${rest.length > 1 ? ` · ${truncate(rest.slice(1).join(' / '), 60)}` : ''}${action}`;
  return `Visite de ${truncate(pathname, 120)}${action}`;
}

// ---------------------------------------------------------------------------------------------
// Entries

type HeaderReader = { get(name: string): string | null };

/**
 * Where the visitor is. Behind Cloudflare the cf-* headers describe the visitor (the city needs
 * the "Add visitor location headers" managed transform), while Vercel's x-vercel-ip-* describe
 * the Cloudflare server that called Vercel: they are only used for requests sent to Vercel directly.
 */
export function visitorLocation(headers: HeaderReader, viaCloudflare: boolean): { country: string; region: string; city: string } {
  if (viaCloudflare) {
    return {
      country: headerText(headers.get('cf-ipcountry')).toUpperCase().slice(0, 2),
      region: truncate(headerText(headers.get('cf-region')), 60),
      city: truncate(headerText(headers.get('cf-ipcity')), 60),
    };
  }
  let city = headers.get('x-vercel-ip-city') || '';
  try { city = decodeURIComponent(city); } catch { /* Kept as received. */ }
  return {
    country: headerText(headers.get('x-vercel-ip-country')).toUpperCase().slice(0, 2),
    region: truncate(headerText(headers.get('x-vercel-ip-country-region')), 60),
    city: truncate(headerText(city), 60),
  };
}

/** The entry without its empty fields: nothing stored for what is unknown. */
export function compactEntry<T extends Record<string, unknown>>(value: T): Partial<T> {
  const result: Record<string, unknown> = {};
  Object.keys(value).forEach((key) => {
    const item = value[key];
    if (item === undefined || item === '' || item === null || item === false) return;
    if (typeof item === 'object' && !Object.keys(item as object).length) return;
    result[key] = item;
  });
  return result as Partial<T>;
}

export function buildRequestEntry(input: {
  time: number; method: string; pathname: string; search: string; host: string; headers: HeaderReader;
  ip: string; viaCloudflare: boolean; toolName?: string; env?: string;
}): StoredRequest {
  const { headers, pathname } = input;
  const userAgent = headers.get('user-agent') || '';
  const location = visitorLocation(headers, input.viaCloudflare);
  const locale = pathname.match(/^\/(fr|en)(?:\/|$)/)?.[1] || '';
  const browserLanguage = (headers.get('accept-language') || '').split(',')[0].split(';')[0].trim().slice(0, 16);
  return compactEntry({
    t: input.time,
    m: input.method.toUpperCase().slice(0, 10),
    p: truncate(pathname, 300),
    q: truncate(redactQuery(input.search), 300),
    h: truncate(input.host.toLowerCase(), 80),
    l: locale,
    al: browserLanguage,
    ip: input.ip,
    cc: location.country,
    rg: location.region,
    ci: location.city,
    ua: truncate(userAgent, 300),
    rf: cleanReferer(headers.get('referer')),
    b: isBotRequest(userAgent, pathname),
    k: requestKind(pathname),
    i: truncate(describeIntent({ method: input.method, pathname, search: input.search, toolName: input.toolName }), 200),
    env: input.env && input.env !== 'production' ? input.env : '',
  }) as StoredRequest;
}

const text = (value: unknown) => (typeof value === 'string' ? value : '');
const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

export function requestReport(id: string, stored: Partial<StoredRequest> | null | undefined): RequestReport {
  const entry = stored || {};
  const userAgent = text(entry.ua);
  const path = text(entry.p);
  return {
    id,
    at: num(entry.t) ?? reportIdTime(id),
    method: text(entry.m) || 'GET',
    path,
    query: text(entry.q),
    host: text(entry.h),
    locale: text(entry.l),
    browserLanguage: text(entry.al),
    ip: text(entry.ip),
    country: text(entry.cc),
    region: text(entry.rg),
    city: text(entry.ci),
    userAgent,
    device: deviceLabel(userAgent),
    referer: text(entry.rf),
    bot: entry.b === true,
    kind: REQUEST_KINDS.includes(entry.k as RequestKind) ? entry.k as RequestKind : requestKind(path),
    intent: text(entry.i) || (path ? describeIntent({ method: text(entry.m) || 'GET', pathname: path }) : 'Requête'),
    env: text(entry.env),
    status: num(entry.st),
    durationMs: num(entry.ms),
    result: text(entry.rs),
    user: text(entry.u),
    errorIds: entry.er && typeof entry.er === 'object' ? Object.keys(entry.er).filter((key) => isReportId(key, 'e')).sort() : [],
  };
}

export function errorReport(id: string, stored: Partial<StoredError> | null | undefined): ErrorReport {
  const entry = stored || {};
  const userAgent = text(entry.ua);
  const context: Record<string, string | number | boolean> = {};
  if (entry.cx && typeof entry.cx === 'object') {
    Object.keys(entry.cx).forEach((key) => {
      const value = (entry.cx as Record<string, unknown>)[key];
      if (['string', 'number', 'boolean'].includes(typeof value)) context[key] = value as string | number | boolean;
    });
  }
  return {
    id,
    at: num(entry.t) ?? reportIdTime(id),
    requestId: isReportId(entry.rid, 'r') ? entry.rid : '',
    method: text(entry.m),
    path: text(entry.p),
    kind: REQUEST_KINDS.includes(entry.k as RequestKind) ? entry.k as RequestKind : '',
    intent: text(entry.i),
    route: text(entry.rt),
    source: text(entry.src),
    message: text(entry.msg) || 'Erreur sans message',
    name: text(entry.nm),
    stack: text(entry.sk),
    code: text(entry.cd),
    status: num(entry.st),
    context,
    fingerprint: text(entry.fp),
    occurrence: num(entry.n),
    ip: text(entry.ip),
    country: text(entry.cc),
    region: text(entry.rg),
    city: text(entry.ci),
    userAgent,
    device: deviceLabel(userAgent),
    user: text(entry.u),
    env: text(entry.env),
  };
}

// ---------------------------------------------------------------------------------------------
// Errors

/** The message, name, stack and code of whatever was thrown, secrets masked. */
export function describeCause(cause: unknown): { message: string; name: string; stack: string; code: string; status: number | null } {
  if (cause instanceof Error) {
    const details = cause as Error & { code?: unknown; status?: unknown; statusCode?: unknown; cause?: unknown; digest?: unknown };
    let stack = details.stack || '';
    if (details.cause instanceof Error) stack += `\nCause : ${details.cause.stack || details.cause.message}`;
    const status = num(details.status) ?? num(details.statusCode);
    const code = typeof details.code === 'string' || typeof details.code === 'number' ? String(details.code) : typeof details.digest === 'string' ? `digest ${details.digest}` : '';
    return {
      message: truncate(redactSecrets(details.message || details.name || 'Erreur sans message'), 500),
      name: truncate(details.name || 'Error', 80),
      stack: truncate(redactSecrets(stack), STACK_MAX_LENGTH),
      code: truncate(redactSecrets(code), 80),
      status: status && status >= 100 && status < 600 ? status : null,
    };
  }
  if (cause === undefined || cause === null) return { message: 'Erreur signalée sans détail', name: '', stack: '', code: '', status: null };
  let message: string;
  try { message = typeof cause === 'string' ? cause : JSON.stringify(cause); } catch { message = String(cause); }
  return { message: truncate(redactSecrets(message || 'Erreur sans message'), 500), name: typeof cause, stack: '', code: '', status: null };
}

const SECRET_KEY = /secret|token|password|passwd|authorization|cookie|api[-_]?key|private|credential|signature/i;

/**
 * Context worth keeping with an error (tool, file size, provider…): plain values only, short,
 * secrets dropped, never a file's content.
 */
export function sanitizeContext(details: Record<string, unknown> | undefined): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  if (!details) return result;
  Object.keys(details).slice(0, 20).forEach((rawKey) => {
    if (SECRET_KEY.test(rawKey)) return;
    const key = rawKey.replace(/[.$#[\]/]/g, '_').slice(0, 40);
    const value = details[rawKey];
    if (typeof value === 'number' && Number.isFinite(value)) result[key] = value;
    else if (typeof value === 'boolean') result[key] = value;
    else if (typeof value === 'string') result[key] = truncate(redactSecrets(value), 200);
    else if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) result[key] = `[${value.byteLength} octets]`;
    else if (value !== null && value !== undefined && typeof value === 'object') {
      try { result[key] = truncate(redactSecrets(JSON.stringify(value)), 200); } catch { /* Not serializable: left out. */ }
    }
  });
  return result;
}

/** The message without what changes between two occurrences of the same error (ids, numbers, quoted values). */
export function normalizeErrorMessage(message: string): string {
  return message.toLowerCase()
    .replace(/https?:\/\/\S+/g, '<url>')
    .replace(/["'«“‘][^"'»”’]{0,200}["'»”’]/g, '<texte>')
    .replace(/\b[0-9a-f]{8,}\b/g, '<id>')
    .replace(/\d+/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

/** A path with its ids replaced, so /api/cm/kits/abc123def and /api/cm/kits/xyz789uvw count as one route. */
export function routePattern(path: string): string {
  return path.split('?')[0].split('/').map((segment) => (
    segment.length > 40 || (segment.length > 6 && /\d/.test(segment) && /[a-z]/i.test(segment)) || /^\d+$/.test(segment) ? ':id' : segment
  )).join('/');
}

function fnv1a(value: string, seed: number): string {
  let hash = seed >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `00000000${hash.toString(16)}`.slice(-8);
}

/** Same route and same normalized message: the same error, emailed at most every 30 minutes. */
export function errorFingerprint(route: string, message: string): string {
  const key = `${routePattern(route)}|${normalizeErrorMessage(message)}`;
  return `${fnv1a(key, 0x811c9dc5)}${fnv1a(key, 0x01000193)}`;
}

/** Whether an occurrence of an error should be emailed, given when the last email went out. */
export function shouldEmailError(lastEmailAt: number | null | undefined, now: number): boolean {
  return !lastEmailAt || now - lastEmailAt >= ERROR_EMAIL_INTERVAL_MS;
}

// ---------------------------------------------------------------------------------------------
// Admin lists

export type ReportPeriod = '1h' | '24h' | '7d' | '30d' | '90d';
export const PERIODS: Record<ReportPeriod, number> = { '1h': 3600e3, '24h': 86400e3, '7d': 7 * 86400e3, '30d': 30 * 86400e3, '90d': 90 * 86400e3 };

export function parsePeriod(value: string | null | undefined, fallback: ReportPeriod = '24h'): ReportPeriod {
  return value && value in PERIODS ? value as ReportPeriod : fallback;
}

export type StatusFilter = '' | 'ok' | 'redirect' | 'client' | 'server' | 'errors' | 'unknown';

export type RequestFilters = { kind?: RequestKind | ''; status?: StatusFilter; bots?: '' | 'humans' | 'bots'; country?: string; search?: string };

export function matchesRequest(report: RequestReport, filters: RequestFilters): boolean {
  if (filters.kind && report.kind !== filters.kind) return false;
  if (filters.bots === 'humans' && report.bot) return false;
  if (filters.bots === 'bots' && !report.bot) return false;
  if (filters.country && report.country !== filters.country.toUpperCase()) return false;
  const status = report.status;
  switch (filters.status) {
    case 'ok': if (!status || status >= 300) return false; break;
    case 'redirect': if (!status || status < 300 || status >= 400) return false; break;
    case 'client': if (!status || status < 400 || status >= 500) return false; break;
    case 'server': if (!status || status < 500) return false; break;
    case 'errors': if (!report.errorIds.length && !(status && status >= 500)) return false; break;
    case 'unknown': if (status) return false; break;
    default: break;
  }
  const search = (filters.search || '').trim().toLowerCase();
  if (search) {
    const haystack = `${report.path}?${report.query} ${report.ip} ${report.intent} ${report.result} ${report.city} ${report.user}`.toLowerCase();
    if (!haystack.includes(search)) return false;
  }
  return true;
}

export function matchesError(report: ErrorReport, filters: { kind?: RequestKind | ''; country?: string; search?: string }): boolean {
  if (filters.kind && report.kind !== filters.kind) return false;
  if (filters.country && report.country !== filters.country.toUpperCase()) return false;
  const search = (filters.search || '').trim().toLowerCase();
  if (search && !`${report.path} ${report.ip} ${report.intent} ${report.message} ${report.name} ${report.code}`.toLowerCase().includes(search)) return false;
  return true;
}

export type RequestStats = { total: number; errors: number; bots: number; countries: { code: string; count: number }[]; kinds: Record<string, number> };

export function requestStats(reports: RequestReport[]): RequestStats {
  const countries: Record<string, number> = {};
  const kinds: Record<string, number> = {};
  let errors = 0;
  let bots = 0;
  reports.forEach((report) => {
    if (report.errorIds.length || (report.status && report.status >= 500)) errors += 1;
    if (report.bot) bots += 1;
    kinds[report.kind] = (kinds[report.kind] || 0) + 1;
    if (report.country) countries[report.country] = (countries[report.country] || 0) + 1;
  });
  return {
    total: reports.length,
    errors,
    bots,
    countries: Object.keys(countries).map((code) => ({ code, count: countries[code] })).sort((a, b) => b.count - a.count || a.code.localeCompare(b.code)).slice(0, 6),
    kinds,
  };
}

const regionNames = (() => {
  try { return new Intl.DisplayNames(['fr'], { type: 'region' }); } catch { return null; }
})();

/** "Congo", "France"… from a two-letter code (XX: unknown, T1: Tor). */
export function countryName(code: string): string {
  if (!code) return '';
  if (code === 'XX') return 'Inconnu';
  if (code === 'T1') return 'Réseau Tor';
  try { return regionNames?.of(code) || code; } catch { return code; }
}

/** "28 oct. 2026, 14:32:05" in Lagos time (the site's reference time zone). */
export function formatLagosTime(time: number, style: 'short' | 'long' = 'short'): string {
  return new Intl.DateTimeFormat('fr-FR', style === 'long'
    ? { timeZone: 'Africa/Lagos', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }
    : { timeZone: 'Africa/Lagos', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(time));
}

// ---------------------------------------------------------------------------------------------
// The email sent to the administrator when an error is recorded. Plain tables and inline styles:
// email clients ignore style sheets, and a single column reads well on a phone.

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character);
}

export type ErrorEmailInput = {
  error: ErrorReport;
  request?: RequestReport | null;
  /** Address of the report in the admin. */
  link: string;
  /** Occurrences since the fingerprint was first seen, and those not emailed since the last email. */
  occurrences: number;
  quiet: number;
  firstAt?: number;
};

function place(error: ErrorReport): string {
  return [error.city, error.region, countryName(error.country)].filter(Boolean).join(', ') || 'Lieu inconnu';
}

function stackExcerpt(stack: string): string {
  return stack.split('\n').slice(0, 14).join('\n');
}

export function errorEmail(input: ErrorEmailInput): { subject: string; html: string; text: string } {
  const { error, request, link } = input;
  const where = `${error.method || request?.method || ''} ${error.path || request?.path || 'route inconnue'}`.trim();
  const intent = error.intent || request?.intent || 'Action inconnue';
  const when = formatLagosTime(error.at, 'long');
  const who = [error.ip || 'IP inconnue', place(error), error.device].filter(Boolean).join(' · ');
  const repeat = input.occurrences > 1
    ? `${input.occurrences} occurrences${input.firstAt ? ` depuis le ${formatLagosTime(input.firstAt)}` : ''}${input.quiet ? `, dont ${input.quiet} sans e-mail depuis le dernier envoi` : ''}`
    : 'Première occurrence';
  const rows: [string, string][] = [
    ['Quoi', intent],
    ['Où', where],
    ['Quand', `${when} (heure de Lagos)`],
    ['Qui', who],
    ...(error.user ? [['Compte admin', error.user] as [string, string]] : []),
    ...(error.status ? [['Statut', String(error.status)] as [string, string]] : []),
    ...(error.code ? [['Code', error.code] as [string, string]] : []),
    ['Répétition', repeat],
    ...(error.env ? [['Environnement', error.env] as [string, string]] : []),
  ];
  const contextRows = Object.keys(error.context).map((key) => [key, String(error.context[key])] as [string, string]);
  const subject = `[JcHub] Erreur : ${truncate(error.message.replace(/\s+/g, ' '), 70)} · ${truncate(error.path || 'route inconnue', 50)}`;

  const row = ([label, value]: [string, string]) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eef2f7;vertical-align:top;width:104px;color:#64748b;font-size:13px;font-weight:600">${escapeHtml(label)}</td><td style="padding:8px 0 8px 8px;border-bottom:1px solid #eef2f7;color:#0f172a;font-size:14px;line-height:1.45;word-break:break-word">${escapeHtml(value)}</td></tr>`;
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9"><tr><td align="center" style="padding:16px 10px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
<tr><td style="background:#b91c1c;padding:14px 20px;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">JcHub · Rapport d’erreur</td></tr>
<tr><td style="padding:20px 20px 4px">
<p style="margin:0 0 6px;color:#64748b;font-size:13px">${escapeHtml(error.name || 'Erreur')}${error.source ? ` · ${escapeHtml(error.source)}` : ''}</p>
<h1 style="margin:0;color:#0f172a;font-size:19px;line-height:1.35;word-break:break-word">${escapeHtml(error.message)}</h1>
</td></tr>
<tr><td style="padding:12px 20px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.map(row).join('')}</table></td></tr>
${contextRows.length ? `<tr><td style="padding:14px 20px 0"><p style="margin:0 0 4px;color:#0f172a;font-size:14px;font-weight:700">Contexte</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${contextRows.map(row).join('')}</table></td></tr>` : ''}
${error.stack ? `<tr><td style="padding:14px 20px 0"><p style="margin:0 0 6px;color:#0f172a;font-size:14px;font-weight:700">Pile d’appels (extrait)</p><pre style="margin:0;padding:12px;background:#0f172a;color:#e2e8f0;border-radius:10px;font-family:Menlo,Consolas,monospace;font-size:11px;line-height:1.5;white-space:pre-wrap;word-break:break-all">${escapeHtml(stackExcerpt(error.stack))}</pre></td></tr>` : ''}
<tr><td align="center" style="padding:22px 20px 8px"><a href="${escapeHtml(link)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 26px;border-radius:999px">Ouvrir le rapport complet</a></td></tr>
<tr><td style="padding:8px 20px 20px;color:#94a3b8;font-size:12px;line-height:1.5;text-align:center">${error.userAgent || request?.userAgent ? `${escapeHtml(truncate(error.userAgent || request?.userAgent || '', 160))}<br>` : ''}Une même erreur déclenche au plus un e-mail toutes les 30 minutes ; les autres occurrences sont comptées dans le rapport.</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `Erreur : ${error.message}`,
    ...rows.map(([label, value]) => `${label} : ${value}`),
    ...contextRows.map(([label, value]) => `${label} : ${value}`),
    '',
    error.stack ? stackExcerpt(error.stack) : '',
    '',
    `Rapport complet : ${link}`,
  ].join('\n');
  return { subject, html, text };
}
