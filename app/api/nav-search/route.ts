import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getPublishedArticles } from '@/lib/blog';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { getGa4ContentViews } from '@/lib/ga4';
import { getPublishedTools, localizeTool, toolPath, type Tool } from '@/lib/tools';
import { findToolsByKeywords, normalizeSearchText, STOP_WORDS } from '@/lib/tool-search';
import { isLocale, type Locale } from '@/i18n/routing';
import { enforceRateLimit } from '@/lib/rate-limit';
import { withReport } from '@/lib/reports/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SearchItem = { id: string; title: string; description: string; href: string; icon: string; type: 'article' | 'tool'; tags: string[] };
type SearchIndex = {
  items: SearchItem[];
  tools: Tool[];
  /** What visitors typed over the last 30 days, most frequent first. */
  terms: Array<{ term: string; count: number }>;
  views: Record<string, number>;
  previousViews: Record<string, number>;
};

// Visitors only see one ranked list: matching, searched terms, page views and trends are
// combined here. Firestore and GA4 are read every few minutes, not on each keystroke.
const INDEX_TTL_MS = 5 * 60_000;
const indexes: Partial<Record<Locale, { expires: number; index: Promise<SearchIndex> }>> = {};

async function searchedTerms(): Promise<SearchIndex['terms']> {
  if (!hasFirebaseAdminConfig()) return [];
  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const snapshot = await getAdminDb().collection('nav_search_terms').where('date', '>=', since).get();
  const totals = new Map<string, number>();
  for (const doc of snapshot.docs) { const data = doc.data(); const term = String(data.term || ''); if (term) totals.set(term, (totals.get(term) || 0) + Number(data.count || 0)); }
  return Array.from(totals, ([term, count]) => ({ term, count })).sort((a, b) => b.count - a.count).slice(0, 500);
}

async function buildIndex(locale: Locale): Promise<SearchIndex> {
  const [articles, published] = await Promise.all([getPublishedArticles(locale), getPublishedTools()]);
  const tools = published.map((tool) => ({ ...localizeTool(tool, locale), href: toolPath(tool, locale) }));
  const items: SearchItem[] = [
    ...articles.map((article) => ({ id: `article:${article.id}`, title: article.title, description: article.excerpt || article.description, href: `/${locale}/blog/${article.slug}`, icon: '📰', type: 'article' as const, tags: [...article.keywords, ...article.tags] })),
    ...tools.map((tool) => ({ id: `tool:${tool.slug}`, title: tool.name, description: tool.description, href: tool.href, icon: tool.icon, type: 'tool' as const, tags: [...tool.tags, ...tool.seo.keywords] })),
  ];
  // Audience signals only reorder results: search keeps working when they are unavailable.
  const [terms, views] = await Promise.all([
    searchedTerms().catch(() => []),
    getGa4ContentViews(Array.from(new Set(items.map((item) => item.href)))).catch(() => ({ current: {}, previous: {} })),
  ]);
  return { items, tools, terms, views: views.current, previousViews: views.previous };
}

function searchIndex(locale: Locale): Promise<SearchIndex> {
  const cached = indexes[locale];
  if (cached && cached.expires > Date.now()) return cached.index;
  const next = { expires: Date.now() + INDEX_TTL_MS, index: buildIndex(locale) };
  if (!cached) {
    indexes[locale] = next;
    next.index.catch(() => { if (indexes[locale] === next) delete indexes[locale]; });
    return next.index;
  }
  // The previous index answers while the new one loads.
  cached.expires = next.expires;
  next.index.then(() => { indexes[locale] = next; }, () => undefined);
  return cached.index;
}

const searchWords = (text: string) => Array.from(new Set(normalizeSearchText(text).split(' ').filter((word) => word.length >= 2 && !STOP_WORDS.has(word))));

function rank(index: SearchIndex, query: string) {
  const words = searchWords(query);
  if (!words.length) return [];
  // Longer searches other visitors started the same way: the pages they were after rise.
  const related = index.terms.filter(({ term }) => term !== query && term.startsWith(query)).slice(0, 5).map(({ term, count }) => ({ words: searchWords(term), weight: 0.25 * Math.log10(1 + count) }));
  return index.items.map((item) => {
    const title = normalizeSearchText(item.title), text = normalizeSearchText(`${item.description} ${item.tags.join(' ')}`);
    const relevance = words.reduce((total, word) => total + (title.includes(word) ? 5 : 0) + (text.includes(word) ? 1 : 0), 0);
    if (!relevance) return { item, score: 0 };
    // Audience bonuses stay below the gap between a title match and a description match.
    const views = index.views[item.href] || 0, previous = index.previousViews[item.href] || 0;
    const popular = 0.5 * Math.log10(1 + views);
    const trending = views > previous ? 0.75 * Math.min(1, (views - previous) / Math.max(previous, 1)) : 0;
    const searched = Math.min(1, related.reduce((total, term) => total + (term.words.length && term.words.every((word) => title.includes(word) || text.includes(word)) ? term.weight : 0), 0));
    return { item, score: relevance + popular + trending + searched };
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title)).slice(0, 6);
}

export const GET = withReport(async function GET(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get('lang');
  const locale: Locale = isLocale(lang) ? lang : 'fr';
  const rawQuery = (request.nextUrl.searchParams.get('q') || '').slice(0, 100);
  const query = normalizeSearchText(rawQuery);
  if (query.length < 2) return NextResponse.json({ items: [], confident: false }, { headers: { 'Cache-Control': 'private, no-store' } });
  try {
    const index = await searchIndex(locale);
    const items = rank(index, query).map(({ item: { id, title, description, href, icon, type } }) => ({ id, title, description, href, icon, type }));
    // Confident: the catalog answers on its own, the visitor's AI quota is not needed.
    const confident = findToolsByKeywords(rawQuery, index.tools).confident;
    return NextResponse.json({ items, confident }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ items: [], confident: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
});

export const POST = withReport(async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'nav-search-term', 60, 60_000);
  if (limited) return limited;
  if (!hasFirebaseAdminConfig()) return NextResponse.json({ ok: false }, { status: 503 });
  const body = await request.json().catch(() => null) as { query?: unknown } | null;
  const rawTerm = typeof body?.query === 'string' ? body.query.trim().slice(0, 100) : '';
  const term = normalizeSearchText(rawTerm);
  if (term.length < 2 || term.length > 80 || /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(rawTerm) || /\d{7,}/.test(rawTerm)) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const date = new Date().toISOString().slice(0, 10);
    const id = `${date}_${createHash('sha256').update(term).digest('hex').slice(0, 24)}`;
    await getAdminDb().collection('nav_search_terms').doc(id).set({ date, term, count: FieldValue.increment(1) }, { merge: true });
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
});
