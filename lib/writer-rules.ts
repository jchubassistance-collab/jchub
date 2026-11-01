/**
 * Rules of the writing space (/admin/redaction): what a writer may store on an article and what an
 * article needs before it goes online. The editor shows the same checks the server enforces.
 *
 * This module has no Next.js or Firebase import so that the tests and the browser can use it.
 */

/** Categories every writer starts with: each one has its English label in lib/categories.ts. Writers add others (writer_categories). */
export const WRITER_CATEGORIES = ['Développement', 'Technologie', 'Informatique', 'Réseau', 'Sécurité', 'Productivité', 'Frontend', 'Base de données', 'Design', 'Numérique'] as const;
export type WriterCategory = (typeof WRITER_CATEGORIES)[number];

export const WRITER_LIMITS = { title: 140, description: 500, content: 100_000, category: 50, keyword: 40, keywords: 8, slug: 90 } as const;
export const MIN_TITLE_LENGTH = 10;
export const MIN_DESCRIPTION_LENGTH = 50;
export const MIN_PUBLISHED_WORDS = 300;

/** A writer edits drafts and their own published articles; archived or scheduled ones belong to the admin. */
export const WRITER_EDITABLE_STATUSES = ['draft', 'published'] as const;

/** Article of the writer as the space lists it. Dates are ISO strings, plannedFor a YYYY-MM-DD day. */
export type WriterArticleSummary = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  status: string;
  image: string;
  plannedFor: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  views: number;
  words: number;
};

export type WriterArticle = WriterArticleSummary & {
  content: string;
  keywords: string[];
  /** True once the writer typed the address: it no longer follows the title. */
  customSlug: boolean;
};

export function isWriterCategory(value: unknown): value is WriterCategory {
  return (WRITER_CATEGORIES as readonly unknown[]).includes(value);
}

export function isValidWriterCategory(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= WRITER_LIMITS.category;
}

/** Category as stored: trimmed, single spaces, first letter in capital. */
export function normalizeCategory(value: string): string {
  const name = value.trim().replace(/\s+/g, ' ').slice(0, WRITER_LIMITS.category).trim();
  return name.charAt(0).toLocaleUpperCase('fr-FR') + name.slice(1);
}

/** Same category whatever its case or accents: « reseau » is « Réseau ». */
export function categoryKey(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Address segment made from a title or typed by the writer: same rule as the admin editor. */
export function slugify(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '').slice(0, WRITER_LIMITS.slug).replace(/-$/, '');
}

/** Words of the text, accented Latin letters included; Markdown signs are not words. */
export function wordCount(markdown: string): number {
  return markdown.match(/[A-Za-z0-9À-ÖØ-öø-ÿŒœ][A-Za-z0-9À-ÖØ-öø-ÿŒœ'’-]*/g)?.length ?? 0;
}

/** Reading time shown on the article, at 200 words a minute. */
export function readTime(markdown: string): string {
  return `${Math.max(1, Math.round(wordCount(markdown) / 200))} min`;
}

/** Keywords typed as "a, b, c": trimmed, without duplicates, within the limits. */
export function parseKeywords(value: string): string[] {
  const seen = new Set<string>();
  return value.split(',').map((keyword) => keyword.trim().slice(0, WRITER_LIMITS.keyword)).filter((keyword) => {
    const key = keyword.toLowerCase();
    if (!keyword || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, WRITER_LIMITS.keywords);
}

export type PublicationCheck = { id: 'title' | 'description' | 'content' | 'category'; label: string; ok: boolean };

/** What an article needs to be published, met or not. */
export function publicationChecks(article: { title: string; description: string; content: string; category: string }): PublicationCheck[] {
  const words = wordCount(article.content);
  return [
    { id: 'title', label: `Un titre d’au moins ${MIN_TITLE_LENGTH} caractères`, ok: article.title.trim().length >= MIN_TITLE_LENGTH },
    { id: 'description', label: `Un résumé d’au moins ${MIN_DESCRIPTION_LENGTH} caractères`, ok: article.description.trim().length >= MIN_DESCRIPTION_LENGTH },
    { id: 'content', label: `Au moins ${MIN_PUBLISHED_WORDS} mots (${words} pour l’instant)`, ok: words >= MIN_PUBLISHED_WORDS },
    { id: 'category', label: 'Une catégorie', ok: isValidWriterCategory(article.category) },
  ];
}

/** Advice that does not block publication. */
export function writingTips(article: { title: string; description: string; content: string }): string[] {
  const tips: string[] = [];
  if (article.title.trim().length > 70) tips.push('Le titre dépasse 70 caractères : Google risque de le couper.');
  const description = article.description.trim().length;
  if (description >= MIN_DESCRIPTION_LENGTH && (description < 120 || description > 160)) tips.push('Un résumé de 120 à 160 caractères s’affiche en entier dans Google.');
  if (article.content.trim() && !/^##\s/m.test(article.content)) tips.push('Ajoutez des sous-titres (## Sous-titre) pour structurer le texte.');
  if (/^#\s/m.test(article.content)) tips.push('Le titre de l’article est déjà le titre principal : utilisez ## pour les sous-titres, pas #.');
  return tips;
}
