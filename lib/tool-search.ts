import type { Tool } from '@/lib/tools';

// French function words and request phrasing: they say nothing about the tool wanted, and
// short ones such as "de" used to match multi-word tags like "mot de passe".
const STOP_WORDS = new Set([
  'au', 'aux', 'avec', 'ce', 'ces', 'cet', 'cette', 'dans', 'de', 'des', 'du', 'en', 'et', 'la', 'le', 'les', 'leur', 'leurs',
  'ma', 'mais', 'me', 'mes', 'moi', 'mon', 'ne', 'nos', 'notre', 'nous', 'ou', 'par', 'pas', 'pour', 'qu', 'que', 'qui', 'quoi',
  'quel', 'quelle', 'quels', 'quelles', 'quand', 'sa', 'sans', 'se', 'ses', 'si', 'son', 'sur', 'ta', 'te', 'tes', 'toi', 'ton',
  'tu', 'un', 'une', 'vos', 'votre', 'vous', 'je', 'il', 'elle', 'on', 'ils', 'elles', 'est', 'sont', 'suis', 'ai', 'as', 'avoir',
  'etre', 'faire', 'fait', 'veux', 'voudrais', 'voulais', 'peux', 'pouvoir', 'dois', 'doit', 'savoir', 'sais', 'besoin', 'aide',
  'aider', 'aidez', 'comment', 'pourquoi', 'outil', 'outils', 'truc', 'chose', 'moyen', 'facon', 'plus', 'moins', 'tres', 'bien',
  'tout', 'tous', 'toute', 'toutes', 'bonjour', 'salut', 'merci', 'stp', 'svp', 'clair', 'simple', 'rapide', 'gratuit', 'ligne',
]);
// Short technical terms worth matching despite having fewer than three letters.
const SHORT_TERMS = new Set(['qr', 'js', 'ts', 'ip', 'id', 'md', 'ui', 'ux', 'db', 'ia', 'go']);

export function normalizeSearchText(value: string): string {
  return value.toLocaleLowerCase('fr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

export type KeywordMatch = {
  tools: Tool[];
  /** False when the best match is weak: the AI should judge the request instead. */
  confident: boolean;
};

/** Catalog search without AI, used before spending an AI request. */
export function findToolsByKeywords(query: string, catalog: Tool[]): KeywordMatch {
  const normalizedQuery = normalizeSearchText(query);
  const terms = Array.from(new Set(normalizedQuery.split(' ').filter((term) => (term.length >= 3 || SHORT_TERMS.has(term)) && !STOP_WORDS.has(term))));
  if (!terms.length) return { tools: [], confident: false };

  const scored = catalog.map((tool) => {
    const name = normalizeSearchText(tool.name);
    const nameWords = new Set(name.split(' '));
    const tags = [...tool.tags, ...tool.seo.keywords].map(normalizeSearchText);
    const tagWords = new Set(tags.flatMap((tag) => tag.split(' ')).filter((word) => !STOP_WORDS.has(word)));
    const descriptionWords = new Set(normalizeSearchText(`${tool.description} ${tool.category}`).split(' '));
    let score = normalizedQuery.length > 2 && name.includes(normalizedQuery) ? 8 : 0;
    let matchedTerms = 0;
    for (const term of terms) {
      let termScore = 0;
      if (nameWords.has(term)) termScore += 3;
      if (tagWords.has(term)) termScore += 3;
      else if (term.length >= 4 && tags.some((tag) => tag.includes(term))) termScore += 1;
      if (descriptionWords.has(term)) termScore += 1;
      if (termScore) matchedTerms += 1;
      score += termScore;
    }
    // Direction matters for converters: "csv pour excel" should rank "CSV vers Excel" before
    // "Excel vers CSV", so name words found in the request's order earn a small bonus.
    const namePositions = name.split(' ').map((word) => terms.indexOf(word)).filter((position) => position !== -1);
    if (namePositions.length >= 2 && namePositions.every((position, index) => index === 0 || position > namePositions[index - 1])) score += 1;
    return { tool, score, matchedTerms };
  }).filter((item) => item.score >= 3).sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best) return { tools: [], confident: false };
  return {
    // Only tools close to the best one: a single shared word should not pad the list.
    tools: scored.filter((item) => item.score >= best.score * 0.6).slice(0, 3).map((item) => item.tool),
    // Every meaningful word matched, or a strong hit covering at least half of them. A long
    // sentence where only "api" is recognised goes to the AI, which understands the request.
    confident: best.matchedTerms === terms.length || (best.score >= 6 && best.matchedTerms * 2 >= terms.length),
  };
}
