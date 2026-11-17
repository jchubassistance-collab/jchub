import 'server-only';

import { z } from 'zod';
import { generateConfiguredText } from '@/lib/content-agent';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { slugify } from '@/lib/resource-schema';

/**
 * Weekly research of the resource agent (workflows/resource-agent.ts): what people look for,
 * from three free sources, then the topics the AI picks from it. Each source may fail on its
 * own; the research only stops when none answers.
 */

/** One document per run of the agent: its status, the topics proposed and the drafts written. */
export const RESOURCE_AGENT_RUNS = 'resource_agent_runs';

export type DemandSignal = { source: 'site' | 'google' | 'stackoverflow'; term: string; weight: number };
export type ResourceTopic = { topic: string; kind: 'cheatsheet' | 'checklist'; reason: string; signals: string[] };

/** Drafts written each week, "at least two": RESOURCE_AGENT_WEEKLY_COUNT, between 2 and 5. */
export function weeklyResourceCount(): number {
  const configured = Number(process.env.RESOURCE_AGENT_WEEKLY_COUNT);
  return Number.isInteger(configured) ? Math.min(5, Math.max(2, configured)) : 2;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(12_000), headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Source indisponible (${response.status}) : ${new URL(url).hostname}`);
  return response.json() as Promise<T>;
}

/** What visitors typed in the site's search over 30 days: the most direct demand. */
async function siteSearches(): Promise<DemandSignal[]> {
  if (!hasFirebaseAdminConfig()) return [];
  const since = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const snapshot = await getAdminDb().collection('nav_search_terms').where('date', '>=', since).get();
  const totals = new Map<string, number>();
  for (const document of snapshot.docs) {
    const data = document.data();
    const term = String(data.term || '');
    if (term) totals.set(term, (totals.get(term) || 0) + Number(data.count || 0));
  }
  return Array.from(totals, ([term, count]) => ({ source: 'site' as const, term, weight: count })).sort((a, b) => b.weight - a.weight).slice(0, 40);
}

const SUGGEST_SEEDS: { query: string; hl: 'fr' | 'en' }[] = [
  { query: 'aide-mémoire informatique', hl: 'fr' },
  { query: 'aide mémoire commandes', hl: 'fr' },
  { query: 'aide-mémoire excel', hl: 'fr' },
  { query: 'checklist sécurité', hl: 'fr' },
  { query: 'liste des commandes', hl: 'fr' },
  { query: 'raccourcis clavier', hl: 'fr' },
  { query: 'checklist site web', hl: 'fr' },
  { query: 'checklist', hl: 'fr' },
  { query: 'cheat sheet', hl: 'en' },
  { query: 'commands cheat sheet', hl: 'en' },
  { query: 'checklist for', hl: 'en' },
];

/** Google suggestions, ranked by popularity: the first ones are the most searched. */
async function googleSuggestions(): Promise<DemandSignal[]> {
  const results = await Promise.allSettled(SUGGEST_SEEDS.map(async ({ query, hl }) => {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ie=utf-8&oe=utf-8&hl=${hl}&q=${encodeURIComponent(`${query} `)}`;
    const [, suggestions] = await fetchJson<[string, string[]]>(url);
    return (suggestions ?? []).slice(0, 10).map((term, index) => ({ source: 'google' as const, term, weight: 10 - index }));
  }));
  const signals = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
  if (!signals.length && results.every((result) => result.status === 'rejected')) throw new Error('Suggestions Google indisponibles.');
  return signals;
}

/** The technologies developers ask the most questions about. */
async function stackOverflowTags(): Promise<DemandSignal[]> {
  const data = await fetchJson<{ items?: { name?: string; count?: number }[] }>('https://api.stackexchange.com/2.3/tags?order=desc&sort=popular&site=stackoverflow&pagesize=30');
  return (data.items ?? []).filter((tag): tag is { name: string; count: number } => Boolean(tag.name)).map((tag) => ({ source: 'stackoverflow' as const, term: tag.name, weight: tag.count ?? 0 }));
}

export async function collectDemandSignals(): Promise<{ signals: DemandSignal[]; failures: string[] }> {
  const sources = [['site', siteSearches], ['google', googleSuggestions], ['stackoverflow', stackOverflowTags]] as const;
  const results = await Promise.allSettled(sources.map(([, collect]) => collect()));
  const failures = results.flatMap((result, index) => result.status === 'rejected' ? [`${sources[index][0]} : ${result.reason instanceof Error ? result.reason.message : 'erreur'}`] : []);
  const signals = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
  if (!signals.length) throw new Error(`Aucune source de demande n’a répondu (${failures.join(' ; ')}).`);
  return { signals, failures };
}

const topicsSchema = z.object({
  topics: z.array(z.object({
    topic: z.string().trim().min(3).max(160),
    kind: z.enum(['cheatsheet', 'checklist']),
    reason: z.string().trim().min(3).max(400),
    signals: z.array(z.string().trim().max(120)).max(8).default([]),
  })).min(1).max(10),
});

const cleanJson = (raw: string) => raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

/**
 * Ranked topics, more than needed so a failed draft can be replaced. Topics already covered
 * or proposed lately are dropped, by the AI and again here by their words.
 */
export async function chooseResourceTopics(input: { signals: DemandSignal[]; existing: string[]; recentTopics: string[]; tools: string[]; count: number }): Promise<ResourceTopic[]> {
  const list = (source: DemandSignal['source']) => input.signals.filter((signal) => signal.source === source).map((signal) => `${signal.term} (${signal.weight})`).join(', ') || 'aucune donnée';
  const wanted = input.count + 3;
  const prompt = `Tu choisis les prochaines ressources gratuites de JcHub (jchub.dev) : des aide-mémoire et des checklists téléchargeables en PDF, en français et en anglais, pour développeurs, indépendants et petites entreprises, surtout en Afrique francophone.

Voici ce que les gens cherchent (entre parenthèses, le poids de la demande) :
- Recherches des visiteurs sur JcHub, 30 derniers jours (le signal le plus fort : ce sont nos lecteurs) : ${list('site')}
- Suggestions de recherche Google, les premières sont les plus tapées : ${list('google')}
- Technologies les plus demandées sur Stack Overflow : ${list('stackoverflow')}

Ressources déjà en ligne ou en brouillon : ${input.existing.join(', ') || 'aucune'}.
Sujets déjà proposés ces dernières semaines : ${input.recentTopics.join(', ') || 'aucun'}.
Outils JcHub (ne pas refaire leur travail) : ${input.tools.join(', ') || 'aucun'}.

Propose ${wanted} sujets, classés du plus demandé au moins demandé. Règles :
- Ignore les termes sans rapport avec le numérique, le développement, la bureautique ou la gestion d’une petite entreprise (santé, mots fléchés, démarches personnelles…).
- Un sujet précis et utile tous les jours, qui tient sur 1 à 2 pages (« Commandes Git essentielles », pas « Tout sur Git »).
- Jamais un sujet déjà couvert ou proposé, même formulé autrement.
- "kind" : "cheatsheet" pour des commandes, une syntaxe, des raccourcis ; "checklist" pour des vérifications à faire.
- "reason" : en une ou deux phrases en français, pourquoi ce sujet est demandé, en citant les signaux.
- "signals" : les termes de recherche qui justifient le choix, recopiés depuis les listes ci-dessus.

Réponds uniquement avec ce JSON :
{"topics":[{"topic":"","kind":"cheatsheet","reason":"","signals":[""]}]}`;
  const { text } = await generateConfiguredText(prompt);
  let parsed;
  try {
    parsed = topicsSchema.parse(JSON.parse(cleanJson(text)));
  } catch {
    throw new Error('L’IA n’a pas renvoyé de sujets lisibles.');
  }
  const seen = new Set([...input.existing, ...input.recentTopics].map(slugify));
  return parsed.topics.filter((topic) => {
    const key = slugify(topic.topic);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
