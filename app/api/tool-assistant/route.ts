import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getPublishedTools, localizeTool, toolPath, type Tool } from '@/lib/tools';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { enforceDailyToolAssistantQuota } from '@/lib/rate-limit';
import { ASSISTANT_PROMPT_VERSION, recommendToolsWithAi, type ToolAssistantAnswer } from '@/lib/tool-assistant';
import { findToolsByKeywords, type KeywordMatch } from '@/lib/tool-search';
import { bilingual } from '@/i18n/copy';
import { isLocale, type Locale } from '@/i18n/routing';
import { requestLocale } from '@/i18n/request-locale';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const copy = bilingual({
  weakMatch: 'Voici ce qui s’en rapproche le plus dans le catalogue.',
  oneMatch: 'Cet outil correspond à ta recherche.',
  manyMatches: 'Voici les outils les plus proches de ta recherche.',
  emptyQuery: 'Écris ce que tu veux faire pour chercher un outil.',
  invalidQuery: 'La demande de recherche est invalide.',
  queryLength: 'Ta demande doit contenir entre 2 et 500 caractères.',
  noTool: 'Je n’ai pas encore d’outil adapté à cette demande.',
  unavailable: 'La recherche assistée est temporairement indisponible.',
  retry: 'Je n’arrive pas à trouver un outil pour le moment. Réessaie dans quelques instants.',
}, {
  weakMatch: 'Here is the closest match in the catalog.',
  oneMatch: 'This tool matches your search.',
  manyMatches: 'Here are the tools closest to your search.',
  emptyQuery: 'Write what you want to do to search for a tool.',
  invalidQuery: 'The search request is invalid.',
  queryLength: 'Your request must be between 2 and 500 characters long.',
  noTool: 'I don’t have a tool for this request yet.',
  unavailable: 'Assisted search is temporarily unavailable.',
  retry: 'I can’t find a tool right now. Try again in a moment.',
});

/** Published tools in the visitor's language, each with its address in that language. */
async function localizedCatalog(locale: Locale): Promise<(Tool & { href: string })[]> {
  return (await getPublishedTools()).map((tool) => ({ ...localizeTool(tool, locale), href: toolPath(tool, locale) }));
}

function catalogAnswer(tools: (Tool & { href: string })[], confident: boolean, locale: Locale) {
  const t = copy[locale];
  const suggestions = tools.map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
    href: tool.href,
    reason: tool.description,
    icon: tool.icon,
  }));
  // A weak match served because the AI could not answer must not claim to fit the request.
  const message = !confident ? t.weakMatch : tools.length === 1 ? t.oneMatch : t.manyMatches;
  return NextResponse.json({ message, suggestions, source: 'catalog' }, { headers: { 'Cache-Control': 'private, no-store' } });
}

function present(answer: ToolAssistantAnswer, catalog: (Tool & { href: string })[]) {
  const bySlug = new Map(catalog.map((tool) => [tool.slug, tool]));
  const seen = new Set<string>();
  const suggestions = answer.suggestions.flatMap((suggestion) => {
    const tool = bySlug.get(suggestion.slug);
    if (!tool || seen.has(tool.slug)) return [];
    seen.add(tool.slug);
    return [{
      slug: tool.slug,
      name: tool.name,
      description: tool.description,
      href: tool.href,
      reason: suggestion.reason.trim().slice(0, 240) || tool.description,
      icon: tool.icon,
    }];
  });
  return { message: answer.message.trim().slice(0, 400), suggestions };
}

/**
 * Public catalog for the instant search: the browser matches keywords on every keystroke
 * without calling the server, and only asks the AI (POST) when the catalog cannot answer.
 * ?lang=en returns the English names, keywords and addresses.
 */
export async function GET(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get('lang');
  const locale: Locale = isLocale(lang) ? lang : 'fr';
  try {
    const tools = (await localizedCatalog(locale)).map((tool) => ({
      slug: tool.slug,
      path: tool.path,
      href: tool.href,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      icon: tool.icon,
      tags: tool.tags,
      component: '',
      seo: { title: '', description: '', keywords: tool.seo.keywords },
    }));
    return NextResponse.json({ tools }, { headers: { 'Cache-Control': 'public, max-age=60', 'CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } });
  } catch {
    return NextResponse.json({ tools: [] }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function POST(request: NextRequest) {
  const locale = requestLocale(request);
  const t = copy[locale];
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: t.emptyQuery }, { status: 400 }); }
  if (!body || typeof body !== 'object' || !('query' in body) || typeof body.query !== 'string') {
    return NextResponse.json({ error: t.invalidQuery }, { status: 400 });
  }
  const query = body.query.trim().replace(/\s+/g, ' ');
  if (query.length < 2 || query.length > 500) return NextResponse.json({ error: t.queryLength }, { status: 400 });

  // Weak keyword matches are kept as a fallback when the AI cannot answer.
  let keywordMatch: KeywordMatch = { tools: [], confident: false };
  let catalog: (Tool & { href: string })[] = [];
  try {
    catalog = await localizedCatalog(locale);
    keywordMatch = findToolsByKeywords(query, catalog);
    if (keywordMatch.confident) return catalogAnswer(keywordMatch.tools as (Tool & { href: string })[], true, locale);

    const fingerprint = createHash('sha256').update(JSON.stringify(catalog.map((tool) => [tool.slug, tool.name, tool.description, tool.path, tool.tags]))).digest('hex').slice(0, 16);
    // Ignore case, accents and sentence punctuation so "Regex email ?" reuses the answer to "regex email"; keep symbols like C++ / C#.
    const cacheQuery = query.toLocaleLowerCase('fr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s?!.,;:'"’«»()]+/g, ' ').trim();
    // The prompt version invalidates cached answers when the instructions given to the AI change.
    // English answers get their own keys; French keys keep their earlier form so cached answers stay valid.
    const cacheId = createHash('sha256').update(`${ASSISTANT_PROMPT_VERSION}:${locale === 'en' ? 'en:' : ''}${fingerprint}:${cacheQuery}`).digest('hex');
    const db = hasFirebaseAdminConfig() ? getAdminDb() : null;
    if (db) {
      try {
        const cached = await db.collection('_toolAssistantCache').doc(cacheId).get();
        const expiresAt = cached.data()?.expiresAt?.toDate?.();
        if (cached.exists && expiresAt instanceof Date && expiresAt.getTime() > Date.now()) {
          return NextResponse.json({ ...present(cached.data()?.answer as ToolAssistantAnswer, catalog), source: 'cache' }, { headers: { 'Cache-Control': 'private, no-store' } });
        }
      } catch { /* A cache miss must not block discovery. */ }
    }

    const limited = await enforceDailyToolAssistantQuota(request);
    if (limited) return keywordMatch.tools.length ? catalogAnswer(keywordMatch.tools as (Tool & { href: string })[], false, locale) : limited;
    const answer = present(await recommendToolsWithAi(query, catalog, locale), catalog);
    if (!answer.suggestions.length) answer.message = answer.message || t.noTool;
    if (db) {
      try {
        await db.collection('_toolAssistantCache').doc(cacheId).set({ answer: { message: answer.message, suggestions: answer.suggestions.map(({ slug, reason }) => ({ slug, reason })) }, expiresAt: new Date(Date.now() + 7 * 86400_000), createdAt: FieldValue.serverTimestamp() });
      } catch { /* The answer remains usable if cache persistence is unavailable. */ }
    }
    return NextResponse.json({ ...answer, source: 'ai' }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[tool-assistant] Request failed:', error instanceof Error ? error.message.replaceAll(process.env.MISTRAL_API_KEY || '\u0000', '[redacted]').replaceAll(process.env.OPENROUTER_API_KEY || '\u0000', '[redacted]').replaceAll(process.env.GROQ_API_KEY || '\u0000', '[redacted]').slice(0, 240) : 'unknown error');
    // The closest catalog matches are more useful to the visitor than an error.
    if (keywordMatch.tools.length) return catalogAnswer(keywordMatch.tools as (Tool & { href: string })[], false, locale);
    const quotaUnavailable = error instanceof Error && /Firebase Admin|Firestore/i.test(error.message);
    return NextResponse.json({ error: quotaUnavailable ? t.unavailable : t.retry }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
