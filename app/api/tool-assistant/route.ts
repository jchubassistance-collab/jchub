import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getPublishedTools, type Tool } from '@/lib/tools';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { enforceDailyToolAssistantQuota } from '@/lib/rate-limit';
import { ASSISTANT_PROMPT_VERSION, recommendToolsWithAi, type ToolAssistantAnswer } from '@/lib/tool-assistant';
import { findToolsByKeywords, type KeywordMatch } from '@/lib/tool-search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function catalogAnswer(tools: Tool[], confident: boolean) {
  const suggestions = tools.map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
    href: tool.path || `/outils/${encodeURIComponent(tool.slug)}`,
    reason: tool.description,
    icon: tool.icon,
  }));
  // A weak match served because the AI could not answer must not claim to fit the request.
  const message = !confident ? 'Voici ce qui s’en rapproche le plus dans le catalogue.' : tools.length === 1 ? 'Cet outil correspond à ta recherche.' : 'Voici les outils les plus proches de ta recherche.';
  return NextResponse.json({ message, suggestions, source: 'catalog' }, { headers: { 'Cache-Control': 'private, no-store' } });
}

function present(answer: ToolAssistantAnswer, catalog: Tool[]) {
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
      href: tool.path || `/outils/${encodeURIComponent(tool.slug)}`,
      reason: suggestion.reason.trim().slice(0, 240) || tool.description,
      icon: tool.icon,
    }];
  });
  return { message: answer.message.trim().slice(0, 400), suggestions };
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Écris ce que tu veux faire pour chercher un outil.' }, { status: 400 }); }
  if (!body || typeof body !== 'object' || !('query' in body) || typeof body.query !== 'string') {
    return NextResponse.json({ error: 'La demande de recherche est invalide.' }, { status: 400 });
  }
  const query = body.query.trim().replace(/\s+/g, ' ');
  if (query.length < 2 || query.length > 500) return NextResponse.json({ error: 'Ta demande doit contenir entre 2 et 500 caractères.' }, { status: 400 });

  // Weak keyword matches are kept as a fallback when the AI cannot answer.
  let keywordMatch: KeywordMatch = { tools: [], confident: false };
  try {
    const catalog = await getPublishedTools();
    keywordMatch = findToolsByKeywords(query, catalog);
    if (keywordMatch.confident) return catalogAnswer(keywordMatch.tools, true);

    const fingerprint = createHash('sha256').update(JSON.stringify(catalog.map((tool) => [tool.slug, tool.name, tool.description, tool.path, tool.tags]))).digest('hex').slice(0, 16);
    // Ignore case, accents and sentence punctuation so "Regex email ?" reuses the answer to "regex email"; keep symbols like C++ / C#.
    const cacheQuery = query.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s?!.,;:'"\u2019\u00ab\u00bb()]+/g, ' ').trim();
    // The prompt version invalidates cached answers when the instructions given to the AI change.
    const cacheId = createHash('sha256').update(`${ASSISTANT_PROMPT_VERSION}:${fingerprint}:${cacheQuery}`).digest('hex');
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
    if (limited) return keywordMatch.tools.length ? catalogAnswer(keywordMatch.tools, false) : limited;
    const answer = present(await recommendToolsWithAi(query, catalog), catalog);
    if (!answer.suggestions.length) answer.message = answer.message || 'Je n’ai pas encore d’outil adapté à cette demande.';
    if (db) {
      try {
        await db.collection('_toolAssistantCache').doc(cacheId).set({ answer: { message: answer.message, suggestions: answer.suggestions.map(({ slug, reason }) => ({ slug, reason })) }, expiresAt: new Date(Date.now() + 7 * 86400_000), createdAt: FieldValue.serverTimestamp() });
      } catch { /* The answer remains usable if cache persistence is unavailable. */ }
    }
    return NextResponse.json({ ...answer, source: 'ai' }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[tool-assistant] Request failed:', error instanceof Error ? error.message.replaceAll(process.env.MISTRAL_API_KEY || '\u0000', '[redacted]').replaceAll(process.env.OPENROUTER_API_KEY || '\u0000', '[redacted]').replaceAll(process.env.GROQ_API_KEY || '\u0000', '[redacted]').slice(0, 240) : 'unknown error');
    // The closest catalog matches are more useful to the visitor than an error.
    if (keywordMatch.tools.length) return catalogAnswer(keywordMatch.tools, false);
    const quotaUnavailable = error instanceof Error && /Firebase Admin|Firestore/i.test(error.message);
    return NextResponse.json({ error: quotaUnavailable ? 'La recherche assistée est temporairement indisponible.' : 'Je n’arrive pas à trouver un outil pour le moment. Réessaie dans quelques instants.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
