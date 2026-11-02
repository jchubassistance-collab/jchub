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

/** Title length the review aims for: long enough to say the subject, short enough for Google. */
export const REVIEW_TITLE_LENGTH = { min: 30, max: 70 } as const;
export const REVIEW_MIN_KEYWORDS = 3;
/** One ## subtitle at least every this many words. */
export const REVIEW_WORDS_PER_SUBTITLE = 400;

export type ReviewIssue = 'title-length' | 'no-subtitles' | 'few-subtitles' | 'main-heading' | 'long-subtitle' | 'few-keywords';

/**
 * What the review at publication fixes in the title, subtitles and keywords. An empty list means
 * the article goes online as written.
 */
export function reviewIssues(article: { title: string; content: string; keywords: string[] }): ReviewIssue[] {
  const issues: ReviewIssue[] = [];
  const title = article.title.trim().length;
  if (title < REVIEW_TITLE_LENGTH.min || title > REVIEW_TITLE_LENGTH.max) issues.push('title-length');
  // A # inside a code block is a shell comment, not a heading.
  const text = article.content.replace(/```[\s\S]*?```/g, '');
  const subtitles = text.match(/^##\s.+$/gm) || [];
  if (!subtitles.length) issues.push('no-subtitles');
  else if (subtitles.length < Math.floor(wordCount(article.content) / REVIEW_WORDS_PER_SUBTITLE)) issues.push('few-subtitles');
  if (/^#\s/m.test(text)) issues.push('main-heading');
  if ((text.match(/^#{2,6}\s.+$/gm) || []).some((heading) => heading.replace(/^#+\s/, '').length > 90)) issues.push('long-subtitle');
  if (article.keywords.length < REVIEW_MIN_KEYWORDS) issues.push('few-keywords');
  return issues;
}

/** The text without its heading lines, spaces tidied: what the review must leave untouched. */
function bodyWithoutHeadings(markdown: string): string {
  let inCode = false;
  return markdown.split('\n').filter((line) => {
    if (line.trim().startsWith('```')) inCode = !inCode;
    return inCode || !/^#{1,6}\s/.test(line.trim());
  }).join(' ').replace(/\s+/g, ' ').trim();
}

/** True when `revised` only changes, adds or removes heading lines of `original`. */
export function onlyHeadingsChanged(original: string, revised: string): boolean {
  return bodyWithoutHeadings(original) === bodyWithoutHeadings(revised);
}

/** Past this, a review that never finished no longer hides the article. */
export const REVIEW_PENDING_MAX_MS = 10 * 60_000;

/** Whether the blog must still hide this article because its review is running. */
export function reviewPending(data: Record<string, unknown>, now = Date.now()): boolean {
  const review = data.aiReview as { status?: unknown; startedAt?: unknown } | undefined;
  if (review?.status !== 'pending') return false;
  const startedAt = Date.parse(String(review.startedAt || ''));
  return Number.isFinite(startedAt) && now - startedAt < REVIEW_PENDING_MAX_MS;
}
