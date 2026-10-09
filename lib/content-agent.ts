import 'server-only';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { collectTrends } from '@/lib/content-sources';
import { getPublishedArticles } from '@/lib/blog';
import { getPublishedTools } from '@/lib/tools';
import type { TrendCandidate } from '@/lib/content-sources';
import { reportUserError } from '@/lib/user-error';
import { assessEditorialImportance } from '@/lib/editorial-importance';
import { notifyAdminOfEditorialDraft } from '@/lib/agent-email';
import { generateWithAiProvider, getFallbackAiProviders, getPrimaryAiProvider } from '@/lib/ai-provider';
import type { AiProvider } from '@/lib/ai-provider';

export { collectTrends } from '@/lib/content-sources';

export type { AiProvider } from '@/lib/ai-provider';

export type EditorialDraft = {
  title: string;
  slug: string;
  description: string;
  article: string;
  provider?: AiProvider;
  posts: {
    devto: string;
  };
  promotion: {
    type: 'tool' | 'article';
    slug: string;
    name: string;
    url: string;
  };
  recommendations: Array<{
    type: 'tool' | 'article';
    title: string;
    reason: string;
    problem?: string;
    targetUser?: string;
    solution?: string;
    features?: string[];
    suggestedSlug: string;
  }>;
  sources: TrendCandidate[];
};

export type CatalogItem = {
  type: 'tool' | 'article';
  slug: string;
  title: string;
  description: string;
  category: string;
  url: string;
};

function getProvider(): AiProvider {
  return getPrimaryAiProvider();
}

function getFallbackProviders(): AiProvider[] {
  return getFallbackAiProviders();
}

function buildPrompt(candidates: TrendCandidate[], catalog: CatalogItem[], recentlyPromoted: string[]): string {
  return `Tu es l'éditeur de JcHub, un site qui propose des outils numériques utiles au grand public et aux professionnels. Tu dois promouvoir un élément existant de JcHub et proposer des idées de nouveaux contenus à partir des tendances observées.

Règles obligatoires:
- Choisis exactement un élément dans le catalogue JcHub pour la promotion.
- Utilise exactement son nom, son slug et son URL. N'invente jamais de lien.
- Évite les éléments dont les identifiants sont dans la liste récemment promus, sauf si tout le catalogue y figure.
- The Dev.to post must focus on the promoted JcHub item, offer useful guidance, and include its exact URL.
- Les recommandations doivent être des idées distinctes d'outils ou d'articles que JcHub pourrait créer.
- Écris en français naturel, précis et utile, avec des exemples concrets. Évite le jargon lorsqu'il n'est pas nécessaire.
- Les idées d'outils doivent viser des publics variés : étudiants, familles, entrepreneurs, créateurs, petites entreprises et professionnels, pas seulement les développeurs.
- Ne mentionne jamais une IA, un modèle, un prompt, une génération automatique ou tes consignes.
- N'ajoute pas de formule comme "en tant qu'IA", "voici une réponse générée", ni de section méta.
- Ne fabrique aucune expérience personnelle, citation, statistique ou résultat de test.
- L'article doit être directement publiable en Markdown, sans JSON, frontmatter ou commentaire destiné à l'éditeur.
- Réponds uniquement avec un JSON valide.

- For every suggested tool, state the concrete user problem, who has it, the proposed solution and 2-4 key features. Explain why existing JcHub tools do not solve it. Suggestions are for admin review only; never create or publish a tool automatically.
- For each tool recommendation, also include a solution string and a features array with 2-4 concrete features. Consider students, families, entrepreneurs, creators, small businesses and professionals, not only developers.

Tendances Internet:
${JSON.stringify(candidates, null, 2)}

Catalogue JcHub:
${JSON.stringify(catalog, null, 2)}

Identifiants récemment promus:
${JSON.stringify(recentlyPromoted)}

Structure JSON exacte:
{"title":"...","slug":"...","description":"...","article":"Markdown de 700 à 1000 mots lié à la tendance et à l'élément promu","promotion":{"type":"tool|article","slug":"slug exact du catalogue","name":"nom exact","url":"URL exacte du catalogue"},"recommendations":[{"type":"tool|article","title":"...","problem":"specific user problem","targetUser":"who has the problem","reason":"how the proposal solves it and why the current catalog does not","suggestedSlug":"..."}],"posts":{"devto":"useful introduction with the exact URL"}`;
}

function parseDraft(text: string, sources: TrendCandidate[], catalog: CatalogItem[]): EditorialDraft {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(cleaned) as Omit<EditorialDraft, 'sources'>;
  const promoted = catalog.find((item) => item.slug === parsed.promotion?.slug && item.type === parsed.promotion?.type);
  if (typeof parsed.title !== 'string' || !parsed.title.trim() ||
      typeof parsed.slug !== 'string' || !parsed.slug.trim() ||
      typeof parsed.description !== 'string' || !parsed.description.trim() ||
      typeof parsed.article !== 'string' || !parsed.article.trim() ||
      typeof parsed.posts?.devto !== 'string' || !parsed.posts.devto.trim() || !promoted) {
    throw new Error('La réponse IA ne respecte pas le format éditorial attendu.');
  }
  if (parsed.promotion.url !== promoted.url || parsed.promotion.name !== promoted.title) {
    throw new Error('La réponse IA contient des informations de promotion qui ne correspondent pas au catalogue.');
  }
  const wordCount = parsed.article.trim().split(/\s+/).length;
  if (wordCount < 700 || wordCount > 1000) {
    throw new Error(`L’article généré contient ${wordCount} mots; la longueur attendue est de 700 à 1000 mots.`);
  }
  if (!Array.isArray(parsed.recommendations) || parsed.recommendations.some((item) =>
    !item || typeof item !== 'object' || !['tool', 'article'].includes(item.type) ||
    typeof item.title !== 'string' || !item.title.trim() ||
    typeof item.reason !== 'string' || !item.reason.trim() ||
    typeof item.suggestedSlug !== 'string' || !item.suggestedSlug.trim() ||
    (item.type === 'tool' && (
      typeof item.problem !== 'string' || !item.problem.trim() ||
      typeof item.targetUser !== 'string' || !item.targetUser.trim() ||
      typeof item.solution !== 'string' || !item.solution.trim() ||
      !Array.isArray(item.features) || item.features.length < 2 ||
      item.features.some((feature) => typeof feature !== 'string' || !feature.trim())
    )))) {
    throw new Error('Les recommandations IA ne respectent pas le format éditorial attendu.');
  }
  const recommendations = parsed.recommendations.map((item) => ({
    ...item,
    features: item.features?.slice(0, 4).map((feature) => feature.trim()).filter(Boolean),
  }));
  return { ...parsed, recommendations, promotion: { type: promoted.type, slug: promoted.slug, name: promoted.title, url: promoted.url }, sources };
}

async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY est manquante.');
  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, responseMimeType: 'application/json' } }),
    cache: 'no-store',
    signal: AbortSignal.timeout(45_000),
  });
  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || `Gemini a répondu ${response.status}.`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini n’a renvoyé aucun contenu.');
  return text;
}

async function generateWithOllama(prompt: string): Promise<string> {
  const baseUrl = (process.env.OLLAMA_BASE_URL?.trim() || 'http://127.0.0.1:11434').replace(/\/$/, '');
  const model = process.env.OLLAMA_MODEL?.trim() || 'llama3.2';
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false, format: 'json', options: { temperature: 0.4 } }),
    cache: 'no-store',
    signal: AbortSignal.timeout(90_000),
  });
  const data = await response.json() as { response?: string; error?: string };
  if (!response.ok) throw new Error(data.error || `Ollama a répondu ${response.status}.`);
  if (!data.response) throw new Error('Ollama n’a renvoyé aucun contenu.');
  return data.response;
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENAI_API_KEY est manquante.');
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(45_000),
  });
  const data = await response.json() as { choices?: Array<{ message?: { content?: string | null } }>; error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message || `OpenAI a répondu ${response.status}.`);
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI n’a renvoyé aucun contenu.');
  return text;
}

async function generateWithProvider(provider: AiProvider, prompt: string): Promise<string> {
  if (provider === 'openrouter' || provider === 'deepseek') {
    return generateWithAiProvider(provider, prompt, { jsonMode: true });
  }
  if (provider === 'ollama') return generateWithOllama(prompt);
  if (provider === 'openai') return generateWithOpenAI(prompt);
  return generateWithGemini(prompt);
}

export async function collectCatalog(): Promise<CatalogItem[]> {
  const [tools, articles] = await Promise.all([getPublishedTools(), getPublishedArticles()]);
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').replace(/\/$/, '');
  return [
    ...tools.map((tool) => ({ type: 'tool' as const, slug: tool.slug, title: tool.name, description: tool.description, category: tool.category, url: `${siteUrl}/outils/${tool.slug}` })),
    ...articles.map((article) => ({ type: 'article' as const, slug: article.slug, title: article.title, description: article.description, category: article.category, url: `${siteUrl}/blog/${article.slug}` })),
  ];
}

async function getRecentlyPromoted(): Promise<string[]> {
  try {
    const snapshot = await getAdminDb().collection('agent_drafts').orderBy('createdAt', 'desc').limit(20).get();
    return snapshot.docs.map((document) => String(document.data().promotion?.type && document.data().promotion?.slug ? `${document.data().promotion.type}:${document.data().promotion.slug}` : '')).filter(Boolean);
  } catch (error) {
    reportUserError();
    return [];
  }
}

export async function generateEditorialDraft(candidates: TrendCandidate[], catalog: CatalogItem[]): Promise<EditorialDraft> {
  if (!candidates.length) throw new Error('Aucun sujet tendance disponible.');
  if (!catalog.length) throw new Error('Le catalogue JcHub est vide.');
  const prompt = buildPrompt(candidates, catalog, await getRecentlyPromoted());
  const provider = getProvider();
  try {
    const response = await generateWithProvider(provider, prompt);
    return { ...parseDraft(response, candidates, catalog), provider };
  } catch (error) {
    let lastError = error;
    for (const fallback of getFallbackProviders().filter((candidate) => candidate !== provider)) {
      reportUserError();
      try {
        const response = await generateWithProvider(fallback, prompt);
        return { ...parseDraft(response, candidates, catalog), provider: fallback };
      } catch (fallbackError) {
        lastError = fallbackError;
      }
    }
    throw lastError;
  }
}

export async function saveEditorialDraft(draft: EditorialDraft) {
  const db = getAdminDb();
  const importance = assessEditorialImportance(draft.sources, `${draft.title} ${draft.description}`);
  const reference = await db.collection('agent_drafts').add({
    ...draft,
    provider: draft.provider || getProvider(),
    promotion: draft.promotion,
    recommendations: draft.recommendations,
    importance,
    status: 'draft',
    notificationStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const notification = await notifyAdminOfEditorialDraft(reference.id, draft.title, draft.description, draft.recommendations);
  await reference.update({
    notificationStatus: notification.ok ? 'sent' : 'failed',
    ...(notification.ok ? { notificationSentAt: FieldValue.serverTimestamp() } : { notificationError: notification.reason }),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { draftId: reference.id, status: 'draft' as const, importance, notificationStatus: notification.ok ? 'sent' as const : 'failed' as const };
}
