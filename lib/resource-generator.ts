import 'server-only';

import { NextResponse } from 'next/server';
import { generateConfiguredText } from '@/lib/content-agent';
import { reportUserError } from '@/lib/user-error';
import { editableResourceSchema, uniqueSlug, validationMessages, type EditableResource } from '@/lib/resource-schema';
import type { Resource } from '@/lib/resources';

export class ResourceGenerationError extends Error {}

/** Answer of the admin routes of the resources when something fails. */
export function resourceAdminError(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  if (code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN') return NextResponse.json({ error: 'Accès administrateur requis.' }, { status: 401 });
  if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  if (error instanceof ResourceGenerationError) return NextResponse.json({ error: error.message }, { status: 502 });
  reportUserError(error);
  return NextResponse.json({ error: 'L’opération a échoué. Réessaie dans un instant.' }, { status: 500 });
}

const KIND_RULES = {
  cheatsheet: `un AIDE-MÉMOIRE : 5 à 8 parties de 3 à 7 lignes. "term" est la commande, la syntaxe ou le nom exact (code recopiable tel quel), "text" explique en une phrase ce que ça fait, avec un piège courant quand il y en a un.`,
  checklist: `une CHECKLIST : 5 à 8 parties de 3 à 6 lignes. "term" est le point à vérifier en 2 à 5 mots, "text" dit en une phrase comment vérifier ou pourquoi c’est important.`,
} as const;

function buildPrompt(input: { topic: string; kind: EditableResource['kind']; notes: string; existing: string[]; tools: string[] }) {
  return `Tu rédiges une ressource gratuite pour JcHub (jchub.dev), un site d’outils et de conseils pour développeurs, indépendants et petites entreprises, surtout en Afrique francophone.

Sujet demandé : ${input.topic}
${input.notes ? `Consignes de l’administrateur : ${input.notes}\n` : ''}Type : ${KIND_RULES[input.kind]}

Règles de rédaction :
- Français : tutoie le lecteur, phrases courtes et simples, aucun jargon inutile. Les exemples peuvent citer des villes ou usages d’Afrique francophone (Brazzaville, Dakar, Mobile Money) quand c’est naturel.
- Anglais : la même ressource adaptée pour un lecteur anglophone, pas une traduction mot à mot. Exactement les mêmes parties, dans le même ordre, avec le même nombre de lignes dans chaque partie.
- Exactitude d’abord : uniquement des informations vraies et vérifiables, valables aujourd’hui. Pas d’invention de commande, d’option ou de chiffre. Si une syntaxe varie selon le logiciel, dis-le.
- "text" : 160 caractères au plus. "term" : 120 caractères au plus. Pas d’emoji, pas de Markdown, pas de caractère " | ".
- N’écris rien qui fasse doublon avec ces ressources existantes : ${input.existing.join(', ') || 'aucune'}.
- Ne recopie pas le travail de ces outils JcHub ; tu peux en revanche les citer dans une explication quand ils aident : ${input.tools.join(', ') || 'aucun'}.
- "code" vaut true seulement si les "term" sont du code ou des commandes.
- "slug" : minuscules, sans accent, mots séparés par des tirets (ex. "aide-memoire-git" / "git-cheat-sheet").
- "seoTitle" : 50 à 70 caractères, avec les mots qu’on taperait dans Google. "seoDescription" : 120 à 160 caractères. "summary" : une phrase qui dit ce que contient la ressource.

Réponds uniquement avec ce JSON, sans texte autour :
{"code":false,"fr":{"slug":"","title":"","summary":"","seoTitle":"","seoDescription":"","sections":[{"title":"","rows":[{"term":"","text":""}]}]},"en":{"slug":"","title":"","summary":"","seoTitle":"","seoDescription":"","sections":[{"title":"","rows":[{"term":"","text":""}]}]}}`;
}

const cleanJson = (raw: string) => raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

export async function generateResource(input: { topic: string; kind: EditableResource['kind']; notes: string; existing: Resource[]; tools: string[] }): Promise<{ resource: EditableResource; provider: string }> {
  const { text, provider } = await generateConfiguredText(buildPrompt({
    ...input,
    existing: input.existing.map((resource) => resource.fr.title),
  }));
  let raw: unknown;
  try {
    raw = JSON.parse(cleanJson(text));
  } catch {
    throw new ResourceGenerationError('L’IA n’a pas renvoyé un contenu lisible. Relance la génération.');
  }
  const draft = raw as Partial<EditableResource>;
  const taken = new Set(input.existing.flatMap((resource) => [resource.fr.slug, resource.en.slug]));
  const candidate = {
    kind: input.kind,
    code: draft.code === true,
    fr: { ...draft.fr, slug: uniqueSlug(String(draft.fr?.slug ?? ''), String(draft.fr?.title ?? input.topic), taken) },
    en: { ...draft.en, slug: uniqueSlug(String(draft.en?.slug ?? ''), String(draft.en?.title ?? input.topic), taken) },
  };
  const parsed = editableResourceSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new ResourceGenerationError(`Le contenu proposé par l’IA est incomplet (${validationMessages(parsed.error).join(' ; ')}). Relance la génération.`);
  }
  return { resource: parsed.data, provider };
}
