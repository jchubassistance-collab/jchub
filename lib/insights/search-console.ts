import 'server-only';

import crypto from 'node:crypto';
import { cacheGet, cacheSet } from '@/lib/turso-store';
import { seoOpportunities } from '@/lib/insights/seo-audit';

/**
 * Google Search Console, read only (Control Center › SEO). The site signs in as the Google service
 * account (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, or the Firebase one),
 * which must be added as a user of the Search Console property. The answers are kept 6 hours in
 * Turso: Search Console data only changes once a day, and its quota is limited.
 */

const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const API = 'https://www.googleapis.com/webmasters/v3';
const CACHE_MS = 6 * 3600_000;
const DAY = 86400_000;
/** Search Console publishes a day's figures about two days later. */
const DELAY_DAYS = 2;

export type { SeoRow } from '@/lib/insights/seo-audit';
import type { SeoRow } from '@/lib/insights/seo-audit';
export type SeoData = {
  configured: true;
  site: string;
  range: { from: string; to: string };
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  previous: { clicks: number; impressions: number; ctr: number; position: number };
  daily: { day: string; clicks: number; impressions: number; ctr: number; position: number }[];
  queries: SeoRow[];
  pages: SeoRow[];
  countries: SeoRow[];
  devices: SeoRow[];
  opportunities: SeoRow[];
  sitemaps: { path: string; lastDownloaded: string | null; errors: number; warnings: number; submitted: number; pending: boolean }[];
  fetchedAt: number;
};
export type SeoUnavailable = { configured: false; reason: string; account?: string };

function credentials() {
  const clean = (value = '') => value.trim().replace(/^["']|["']$/g, '');
  const email = clean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL || '');
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || '';
  if (!email || !raw) return null;
  // Only the base64 body is kept, whatever the way the key was saved (quotes, literal "\n").
  const body = raw.replace(/\\n/g, '').replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/[^A-Za-z0-9+/=]/g, '');
  return { email, key: `-----BEGIN PRIVATE KEY-----\n${(body.match(/.{1,64}/g) ?? []).join('\n')}\n-----END PRIVATE KEY-----\n` };
}

export function searchConsoleAccount(): string | null {
  return credentials()?.email ?? null;
}

let token: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;
  const account = credentials();
  if (!account) throw new SeoError('Compte de service Google absent : ajoute GOOGLE_SERVICE_ACCOUNT_EMAIL et GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.');
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: string | Buffer) => Buffer.from(value).toString('base64url');
  const unsigned = `${encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${encode(JSON.stringify({ iss: account.email, scope: SCOPE, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }))}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(account.key);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${encode(signature)}` }),
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  const data = await response.json().catch(() => ({})) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!response.ok || !data.access_token) throw new SeoError(`Google a refusé la connexion du compte de service (${data.error_description || response.status}).`);
  token = { value: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
  return token.value;
}

export class SeoError extends Error {}

async function call<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { authorization: `Bearer ${await accessToken()}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json().catch(() => ({})) as T & { error?: { message?: string } };
  if (response.status === 403) throw new SeoError(`Le compte de service ${searchConsoleAccount()} n’a pas accès à la propriété Search Console. Ajoute-le dans Search Console › Paramètres › Utilisateurs et autorisations (accès « Restreint » suffit).`);
  if (!response.ok) throw new SeoError(`Search Console a répondu ${response.status} : ${data.error?.message || 'erreur inconnue'}.`);
  return data;
}

/** The property of the site: GSC_SITE_URL, or the one of the account that covers jchub.dev. */
async function siteUrl(): Promise<string> {
  const configured = process.env.GSC_SITE_URL?.trim();
  if (configured) return configured;
  const host = new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://jchub.dev').hostname.replace(/^www\./, '');
  const { siteEntry = [] } = await call<{ siteEntry?: { siteUrl: string; permissionLevel: string }[] }>('/sites');
  const usable = siteEntry.filter((entry) => entry.permissionLevel !== 'siteUnverifiedUser');
  const match = usable.find((entry) => entry.siteUrl === `sc-domain:${host}`) ?? usable.find((entry) => entry.siteUrl.includes(host));
  if (!match) throw new SeoError(`Aucune propriété Search Console pour ${host} n’est partagée avec ${searchConsoleAccount()}. Ajoute ce compte comme utilisateur de la propriété.`);
  return match.siteUrl;
}

type ApiRow = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };

async function analytics(site: string, from: string, to: string, dimensions: string[], rowLimit = 250): Promise<ApiRow[]> {
  const { rows = [] } = await call<{ rows?: ApiRow[] }>(`/sites/${encodeURIComponent(site)}/searchAnalytics/query`, { startDate: from, endDate: to, dimensions, rowLimit, dataState: 'final' });
  return rows;
}

const round = (value: number, digits = 1) => Number(value.toFixed(digits));
function row(item: ApiRow, key = item.keys?.[0] ?? ''): SeoRow {
  return { key, clicks: item.clicks, impressions: item.impressions, ctr: round(item.ctr * 100), position: round(item.position) };
}
function totalsOf(rows: ApiRow[]) {
  const clicks = rows.reduce((sum, item) => sum + item.clicks, 0);
  const impressions = rows.reduce((sum, item) => sum + item.impressions, 0);
  // Average position weighted by impressions, as Search Console shows it.
  const position = impressions ? rows.reduce((sum, item) => sum + item.position * item.impressions, 0) / impressions : 0;
  return { clicks, impressions, ctr: impressions ? round((clicks / impressions) * 100) : 0, position: round(position) };
}
const isoDay = (time: number) => new Date(time).toISOString().slice(0, 10);

/** Search Console figures of the last `days` days available, and the same length just before. */
export async function searchConsole(days: number, options: { fresh?: boolean } = {}): Promise<SeoData | SeoUnavailable> {
  const account = searchConsoleAccount();
  if (!account) return { configured: false, reason: 'Compte de service Google absent : ajoute GOOGLE_SERVICE_ACCOUNT_EMAIL et GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY sur Vercel.' };
  const key = `gsc:${days}`;
  if (!options.fresh) {
    const cached = await cacheGet<SeoData>(key);
    if (cached) return cached;
  }
  try {
    const site = await siteUrl();
    const end = Date.now() - DELAY_DAYS * DAY;
    const from = isoDay(end - (days - 1) * DAY);
    const to = isoDay(end);
    const previousFrom = isoDay(end - (2 * days - 1) * DAY);
    const previousTo = isoDay(end - days * DAY);
    const [daily, previousDaily, queries, pages, countries, devices, sitemaps] = await Promise.all([
      analytics(site, from, to, ['date'], days + 5),
      analytics(site, previousFrom, previousTo, ['date'], days + 5),
      analytics(site, from, to, ['query'], 500),
      analytics(site, from, to, ['page'], 100),
      analytics(site, from, to, ['country'], 30),
      analytics(site, from, to, ['device'], 5),
      call<{ sitemap?: { path: string; lastDownloaded?: string; errors?: string; warnings?: string; isPending?: boolean; contents?: { submitted?: string }[] }[] }>(`/sites/${encodeURIComponent(site)}/sitemaps`).catch(() => ({ sitemap: [] })),
    ]);
    const queryRows = queries.map((item) => row(item));
    const data: SeoData = {
      configured: true,
      site,
      range: { from, to },
      totals: totalsOf(daily),
      previous: totalsOf(previousDaily),
      daily: daily.map((item) => ({ day: item.keys?.[0] ?? '', clicks: item.clicks, impressions: item.impressions, ctr: round(item.ctr * 100), position: round(item.position) })).sort((a, b) => a.day.localeCompare(b.day)),
      queries: queryRows.slice(0, 100),
      pages: pages.map((item) => row(item, (item.keys?.[0] ?? '').replace(/^https?:\/\/[^/]+/, '') || '/')),
      countries: countries.map((item) => row(item, (item.keys?.[0] ?? '').toUpperCase())),
      devices: devices.map((item) => row(item)),
      opportunities: seoOpportunities(queryRows),
      sitemaps: (sitemaps.sitemap ?? []).map((item) => ({
        path: item.path,
        lastDownloaded: item.lastDownloaded ?? null,
        errors: Number(item.errors || 0),
        warnings: Number(item.warnings || 0),
        submitted: (item.contents ?? []).reduce((sum, content) => sum + Number(content.submitted || 0), 0),
        pending: Boolean(item.isPending),
      })),
      fetchedAt: Date.now(),
    };
    await cacheSet(key, data, CACHE_MS);
    return data;
  } catch (error) {
    if (error instanceof SeoError) return { configured: false, reason: error.message, account };
    throw error;
  }
}

export type SeoSummary = { configured: true; site: string; totals: SeoData['totals']; daily: { day: string; clicks: number; impressions: number }[]; queries: SeoRow[]; pages: SeoRow[] };

/** Totals, top searches and top pages between two days (YYYY-MM-DD): the monthly report. */
export async function searchConsoleSummary(from: string, to: string): Promise<SeoSummary | SeoUnavailable> {
  const account = searchConsoleAccount();
  if (!account) return { configured: false, reason: 'Compte de service Google absent.' };
  const key = `gsc-range:v2:${from}:${to}`;
  const cached = await cacheGet<SeoSummary>(key);
  if (cached) return cached;
  try {
    const site = await siteUrl();
    const [daily, queries, pages] = await Promise.all([
      analytics(site, from, to, ['date'], 40),
      analytics(site, from, to, ['query'], 20),
      analytics(site, from, to, ['page'], 20),
    ]);
    const data: SeoSummary = {
      configured: true,
      site,
      totals: totalsOf(daily),
      daily: daily.map((item) => ({ day: item.keys?.[0] ?? '', clicks: item.clicks, impressions: item.impressions })).sort((a, b) => a.day.localeCompare(b.day)),
      queries: queries.map((item) => row(item)),
      pages: pages.map((item) => row(item, (item.keys?.[0] ?? '').replace(/^https?:\/\/[^/]+/, '') || '/')),
    };
    await cacheSet(key, data, CACHE_MS);
    return data;
  } catch (error) {
    if (error instanceof SeoError) return { configured: false, reason: error.message, account };
    throw error;
  }
}

export type SeoHistory = {
  configured: true;
  site: string;
  daily: { day: string; clicks: number; impressions: number; ctr: number; position: number }[];
  totals: SeoData['totals'];
  queries: SeoRow[];
  pages: SeoRow[];
  countries: SeoRow[];
  devices: SeoRow[];
};

/** Everything Search Console keeps between two days (YYYY-MM-DD), for the history (not cached: it is stored). */
export async function searchConsoleHistory(from: string, to: string): Promise<SeoHistory | SeoUnavailable> {
  const account = searchConsoleAccount();
  if (!account) return { configured: false, reason: 'Compte de service Google absent : ajoute GOOGLE_SERVICE_ACCOUNT_EMAIL et GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.' };
  try {
    const site = await siteUrl();
    const [daily, queries, pages, countries, devices] = await Promise.all([
      analytics(site, from, to, ['date'], 500),
      analytics(site, from, to, ['query'], 500),
      analytics(site, from, to, ['page'], 500),
      analytics(site, from, to, ['country'], 100),
      analytics(site, from, to, ['device'], 5),
    ]);
    return {
      configured: true,
      site,
      daily: daily.map((item) => ({ day: item.keys?.[0] ?? '', clicks: item.clicks, impressions: item.impressions, ctr: round(item.ctr * 100), position: round(item.position) })).sort((a, b) => a.day.localeCompare(b.day)),
      totals: totalsOf(daily),
      queries: queries.map((item) => row(item)),
      pages: pages.map((item) => row(item, (item.keys?.[0] ?? '').replace(/^https?:\/\/[^/]+/, '') || '/')),
      countries: countries.map((item) => row(item, (item.keys?.[0] ?? '').toUpperCase())),
      devices: devices.map((item) => row(item)),
    };
  } catch (error) {
    if (error instanceof SeoError) return { configured: false, reason: error.message, account };
    throw error;
  }
}
