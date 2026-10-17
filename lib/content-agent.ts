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

export { collectTrends } from '@/lib/content-sources';

export type AiProvider = 'gemini' | 'openai' | 'openrouter' | 'deepseek' | 'ollama';

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
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase();
  return provider === 'openai' || provider === 'openrouter' || provider === 'deepseek' || provider === 'ollama'
    ? provider
    : 'gemini';
}

function getFallbackProviders(): AiProvider[] {
  const configured = process.env.AI_FALLBACK_PROVIDER;
  const values = configured === undefined ? ['openrouter', 'openai', 'deepseek'] : configured.split(',');
  const supported: AiProvider[] = ['gemini', 'openai', 'openrouter', 'deepseek', 'ollama'];
  return Array.from(new Set(values
    .map((value) => value.trim().toLowerCase())
    .map((value) => supported.find((provider) => provider === value))
    .filter((provider): provider is AiProvider => provider !== undefined)));
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

- For every suggested tool, all fields are mandatory: a concrete user problem, the specific target user, a practical solution, 2 to 4 distinct non-empty features, a reason why existing JcHub tools do not solve it, and a URL-safe suggestedSlug. Never omit a field or use an empty value. Suggestions are for admin review only; never create or publish a tool automatically.

Tendances Internet:
${JSON.stringify(candidates, null, 2)}

Catalogue JcHub:
${JSON.stringify(catalog, null, 2)}

Identifiants récemment promus:
${JSON.stringify(recentlyPromoted)}

Structure JSON exacte (ne retire aucune propriété; pour un article, les champs spécifiques à un outil peuvent être omis):
{"title":"...","slug":"...","description":"...","article":"Article Markdown en français de 700 à 1000 mots, utile et vérifiable","promotion":{"type":"tool|article","slug":"slug exact du catalogue","name":"nom exact","url":"URL exacte du catalogue"},"recommendations":[{"type":"tool","title":"...","problem":"problème concret rencontré par un utilisateur","targetUser":"public précis concerné","solution":"solution pratique proposée","features":["fonctionnalité concrète 1","fonctionnalité concrète 2"],"reason":"pourquoi les outils JcHub actuels ne résolvent pas ce problème","suggestedSlug":"slug-url-valide"}],"posts":{"devto":"introduction utile avec l'URL exacte"}}`;
}

function parseDraft(text: string, sources: TrendCandidate[], catalog: CatalogItem[]): EditorialDraft {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(cleaned) as Omit<EditorialDraft, 'sources'>;
  const promoted = catalog.find((item) => item.slug === parsed.promotion?.slug && item.type === parsed.promotion?.type);
  if (!parsed.title || !parsed.slug || !parsed.description || !parsed.article || !parsed.posts?.devto || !promoted) {
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
    !item || !['tool', 'article'].includes(item.type) ||
    typeof item.title !== 'string' || !item.title.trim() ||
    typeof item.reason !== 'string' || !item.reason.trim() ||
    typeof item.suggestedSlug !== 'string' || !item.suggestedSlug.trim() ||
    (item.type === 'tool' && (
      typeof item.problem !== 'string' || !item.problem.trim() ||
      typeof item.targetUser !== 'string' || !item.targetUser.trim() ||
      typeof item.solution !== 'string' || !item.solution.trim() ||
      !Array.isArray(item.features) || item.features.length < 2 || item.features.length > 4 ||
      item.features.some((feature) => typeof feature !== 'string' || !feature.trim())
    )))) {
    throw new Error('Les recommandations IA ne respectent pas le format éditorial attendu.');
  }
  return {
    ...parsed,
    promotion: { type: promoted.type, slug: promoted.slug, name: promoted.title, url: promoted.url },
    recommendations: parsed.recommendations.map((item) => ({
      ...item,
      features: item.features?.slice(0, 4).map((feature) => feature.trim()).filter(Boolean),
    })),
    sources,
  };
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

async function generateWithCompatibleProvider(provider: 'openai' | 'openrouter' | 'deepseek', prompt: string): Promise<string> {
  const configuration = {
    openai: {
      apiKey: process.env.OPENAI_API_KEY?.trim(),
      model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
      url: 'https://api.openai.com/v1/chat/completions',
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY?.trim(),
      model: process.env.OPENROUTER_MODEL?.trim() || 'openrouter/free',
      url: 'https://openrouter.ai/api/v1/chat/completions',
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY?.trim() || process.env.DEEPSEEK_API?.trim(),
      model: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat',
      url: 'https://api.deepseek.com/chat/completions',
    },
  }[provider];
  if (!configuration.apiKey) {
    const keyName = provider === 'deepseek' ? 'DEEPSEEK_API_KEY ou DEEPSEEK_API' : `${provider.toUpperCase()}_API_KEY`;
    throw new Error(`${keyName} est manquante.`);
  }

  const response = await fetch(configuration.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${configuration.apiKey}`,
      ...(provider === 'openrouter' ? {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev',
        'X-Title': 'JcHub',
      } : {}),
    },
    body: JSON.stringify({
      model: configuration.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      // Bound provider cost and avoid OpenRouter's much larger implicit default.
      // 3,000 tokens is sufficient for the CM kit, planning assist and social copies.
      ...(provider === 'openrouter' ? { max_tokens: 3000 } : {}),
      response_format: { type: 'json_object' },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(45_000),
  });
  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string | null }; finish_reason?: string | null }>;
    error?: string | { message?: string };
  };
  if (!response.ok) {
    const message = typeof data.error === 'string' ? data.error : data.error?.message;
    throw new Error(message || `${provider} a répondu ${response.status}.`);
  }
  const choice = data.choices?.[0];
  if (choice?.finish_reason === 'length') {
    throw new Error(`${provider.toUpperCase()}_OUTPUT_TRUNCATED`);
  }
  const text = choice?.message?.content;
  if (!text) throw new Error(`${provider} n’a renvoyé aucun contenu.`);
  return text;
}

async function generateWithProvider(provider: AiProvider, prompt: string): Promise<string> {
  if (provider === 'ollama') return generateWithOllama(prompt);
  if (provider === 'gemini') return generateWithGemini(prompt);
  return generateWithCompatibleProvider(provider, prompt);
}

export async function generateOpenRouterText(prompt: string): Promise<string> {
  return generateWithCompatibleProvider('openrouter', prompt);
}

export async function generateConfiguredText(prompt: string): Promise<{ text: string; provider: AiProvider }> {
  const provider = getProvider();
  let lastError: unknown;
  const candidates = [provider, ...getFallbackProviders().filter((fallback) => fallback !== provider)];
  for (const candidate of candidates) {
    try {
      return { text: await generateWithProvider(candidate, prompt), provider: candidate };
    } catch (error) {
      lastError = error;
      if (candidate !== candidates[candidates.length - 1]) reportUserError();
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Aucun fournisseur IA disponible.');
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
