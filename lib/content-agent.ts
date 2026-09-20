import 'server-only';

import { getAdminDb } from '@/lib/firebase-admin';
import { collectTrends } from '@/lib/content-sources';
import { getPublishedArticles } from '@/lib/blog';
import { getPublishedTools } from '@/lib/tools';
import type { TrendCandidate } from '@/lib/content-sources';
import { reportUserError } from '@/lib/user-error';

export { collectTrends } from '@/lib/content-sources';

export type AiProvider = 'gemini' | 'ollama';

export type EditorialDraft = {
  title: string;
  slug: string;
  description: string;
  article: string;
  posts: {
    x: string;
    linkedin: string;
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
  return process.env.AI_PROVIDER?.trim().toLowerCase() === 'ollama' ? 'ollama' : 'gemini';
}

function getFallbackProvider(): AiProvider | null {
  const provider = process.env.AI_FALLBACK_PROVIDER?.trim().toLowerCase();
  return provider === 'ollama' || provider === 'gemini' ? provider : null;
}

function buildPrompt(candidates: TrendCandidate[], catalog: CatalogItem[], recentlyPromoted: string[]): string {
  return `Tu es l'éditeur technique de JcHub. Tu dois promouvoir un élément existant de JcHub et proposer des idées de nouveaux contenus à partir des tendances observées.

Règles obligatoires:
- Choisis exactement un élément dans le catalogue JcHub pour la promotion.
- Utilise exactement son nom, son slug et son URL. N'invente jamais de lien.
- Évite les éléments dont les identifiants sont dans la liste récemment promus, sauf si tout le catalogue y figure.
- Les textes X, LinkedIn et Dev.to doivent parler de l'élément promu et contenir son URL.
- Les recommandations doivent être des idées distinctes d'outils ou d'articles que JcHub pourrait créer.
- Écris comme un rédacteur technique francophone naturel, précis et utile, avec des exemples concrets.
- Ne mentionne jamais une IA, un modèle, un prompt, une génération automatique ou tes consignes.
- N'ajoute pas de formule comme "en tant qu'IA", "voici une réponse générée", ni de section méta.
- Ne fabrique aucune expérience personnelle, citation, statistique ou résultat de test.
- L'article doit être directement publiable en Markdown, sans JSON, frontmatter ou commentaire destiné à l'éditeur.
- Réponds uniquement avec un JSON valide.

Tendances Internet:
${JSON.stringify(candidates, null, 2)}

Catalogue JcHub:
${JSON.stringify(catalog, null, 2)}

Identifiants récemment promus:
${JSON.stringify(recentlyPromoted)}

Structure JSON exacte:
{"title":"...","slug":"...","description":"...","article":"Markdown de 700 à 1000 mots lié à la tendance et à l'élément promu","promotion":{"type":"tool|article","slug":"slug exact du catalogue","name":"nom exact","url":"URL exacte du catalogue"},"recommendations":[{"type":"tool|article","title":"...","reason":"...","suggestedSlug":"..."}],"posts":{"x":"moins de 280 caractères avec l'URL exacte","linkedin":"publication professionnelle avec l'URL exacte","devto":"introduction Dev.to avec l'URL exacte"}}`;
}

function parseDraft(text: string, sources: TrendCandidate[], catalog: CatalogItem[]): EditorialDraft {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(cleaned) as Omit<EditorialDraft, 'sources'>;
  const promoted = catalog.find((item) => item.slug === parsed.promotion?.slug && item.type === parsed.promotion?.type);
  if (!parsed.title || !parsed.slug || !parsed.description || !parsed.article || !parsed.posts?.x || !parsed.posts.linkedin || !parsed.posts.devto || !promoted) {
    throw new Error('La réponse IA ne respecte pas le format éditorial attendu.');
  }
  return { ...parsed, promotion: { type: promoted.type, slug: promoted.slug, name: promoted.title, url: promoted.url }, sources };
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
  });
  const data = await response.json() as { response?: string; error?: string };
  if (!response.ok) throw new Error(data.error || `Ollama a répondu ${response.status}.`);
  if (!data.response) throw new Error('Ollama n’a renvoyé aucun contenu.');
  return data.response;
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
    const response = provider === 'ollama' ? await generateWithOllama(prompt) : await generateWithGemini(prompt);
    return parseDraft(response, candidates, catalog);
  } catch (error) {
    const fallback = getFallbackProvider();
    if (!fallback || fallback === provider) throw error;
    reportUserError();
    const response = fallback === 'ollama' ? await generateWithOllama(prompt) : await generateWithGemini(prompt);
    return parseDraft(response, candidates, catalog);
  }
}

export async function saveEditorialDraft(draft: EditorialDraft) {
  const reference = await getAdminDb().collection('agent_drafts').add({
    ...draft,
    provider: getProvider(),
    promotion: draft.promotion,
    recommendations: draft.recommendations,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return reference.id;
}