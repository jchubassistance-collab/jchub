import { z } from 'zod';
import type { PublicationCopy, SocialSource, SocialPlatform } from './social-types';

function validatePlatformText(platform: SocialPlatform, text: string): string | null {
  const limits: Record<SocialPlatform, number> = { linkedin: 3000, facebook: 63206, github: 20000 };
  if (!text.trim()) return 'Le contenu ne peut pas être vide.';
  return text.length > limits[platform] ? `Le contenu dépasse la limite de ${platform}.` : null;
}

const copySchema = z.object({
  linkedin: z.string().trim().min(20).max(3000),
  facebook: z.string().trim().min(20).max(63206),
  github: z.string().trim().min(20).max(20000),
}).strict();

export function buildSocialCopyPrompt(source: SocialSource): string {
  return [
    'Tu es le rédacteur social francophone de JcHub. Adapte le contenu source avec précision; ne fabrique aucun fait, chiffre, résultat de test, citation ou expérience.',
    'Réponds uniquement en JSON valide avec les clés linkedin, facebook et github.',
    'LinkedIn: post professionnel avec accroche, valeur utile, 2 à 4 points concrets si pertinents, appel à l’action, URL source et 1 à 3 hashtags. Maximum 3000 caractères.',
    'Facebook: ton accessible et conversationnel, angle différent de LinkedIn, texte concis, question ou CTA naturel et URL source. Maximum 2 hashtags.',
    'GitHub: entrée Markdown autonome pour un journal de publications/changelog; titre, date source si connue, résumé factuel, lien et tags. Aucun issue, release, commande ou changement de code.',
    'Les trois textes doivent être distincts et utiles. Écris en français. N’inclus pas de texte hors JSON.',
    `Source:\n${JSON.stringify(source)}`,
  ].join('\n\n');
}

export function parseSocialCopies(raw: string, sourceUrl: string): PublicationCopy {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed = copySchema.parse(JSON.parse(cleaned));
  const values = [parsed.linkedin, parsed.facebook, parsed.github];
  if (new Set(values.map((value) => value.toLocaleLowerCase())).size !== values.length) {
    throw new Error('Les versions par plateforme doivent être distinctes.');
  }
  for (const platform of ['linkedin', 'facebook', 'github'] as const) {
    const issue = validatePlatformText(platform, parsed[platform]);
    if (issue) throw new Error(issue);
  }
  if (!parsed.linkedin.includes(sourceUrl) || !parsed.facebook.includes(sourceUrl) || !parsed.github.includes(sourceUrl)) {
    throw new Error('Chaque version doit inclure le lien de la source.');
  }
  return parsed;
}

export async function generateSocialCopies(
  source: SocialSource,
  generate: (prompt: string) => Promise<string>,
): Promise<PublicationCopy> {
  return parseSocialCopies(await generate(buildSocialCopyPrompt(source)), source.url);
}
