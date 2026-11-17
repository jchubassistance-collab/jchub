/**
 * Checks of the pages' own SEO (Control Center › SEO), without Search Console: title and
 * description lengths, cover, length of the text, keywords, English version. Pure functions, so
 * tests/insights-batch3.test.js can check them.
 */

export type SeoIssue = { level: 'error' | 'warning'; text: string };
export type AuditedPage = { kind: 'article' | 'outil'; locale: 'fr' | 'en'; title: string; path: string; issues: SeoIssue[] };

export type AuditInput = {
  title: string;
  description: string;
  path: string;
  locale: 'fr' | 'en';
  kind: 'article' | 'outil';
  image?: string;
  words?: number;
  keywords?: number;
  translated?: boolean;
  /** Text the page template adds after the title in the <title> tag (" | JcHub" for articles): it counts in what Google shows. */
  titleSuffix?: string;
};

/** Google shows about 60 characters of a title and 155 of a description. */
export const TITLE_RANGE = [30, 65] as const;
export const DESCRIPTION_RANGE = [70, 160] as const;

export function auditPage(page: AuditInput): AuditedPage {
  const issues: SeoIssue[] = [];
  const title = page.title.trim();
  const description = page.description.trim();
  const shownLength = title.length + (page.titleSuffix?.length ?? 0);
  const suffixNote = page.titleSuffix ? `, avec « ${page.titleSuffix.trim()} »` : '';
  if (!title) issues.push({ level: 'error', text: 'Titre manquant' });
  else if (shownLength > TITLE_RANGE[1]) issues.push({ level: 'warning', text: `Titre trop long (${shownLength} caractères${suffixNote}, coupé par Google au-delà de ${TITLE_RANGE[1]})` });
  else if (shownLength < TITLE_RANGE[0]) issues.push({ level: 'warning', text: `Titre court (${shownLength} caractères${suffixNote})` });
  if (!description) issues.push({ level: 'error', text: 'Description manquante' });
  else if (description.length > DESCRIPTION_RANGE[1]) issues.push({ level: 'warning', text: `Description trop longue (${description.length} caractères)` });
  else if (description.length < DESCRIPTION_RANGE[0]) issues.push({ level: 'warning', text: `Description courte (${description.length} caractères)` });
  if (page.kind === 'article') {
    if (!page.image) issues.push({ level: 'warning', text: 'Pas d’image de couverture' });
    if (page.words !== undefined && page.words < 300) issues.push({ level: 'warning', text: `Texte court (${page.words} mots)` });
    if (page.keywords === 0) issues.push({ level: 'warning', text: 'Aucun mot-clé' });
    if (page.locale === 'en' && page.translated === false) issues.push({ level: 'warning', text: 'Pas encore traduit en anglais' });
  }
  return { kind: page.kind, locale: page.locale, title: title || page.path, path: page.path, issues };
}

export function wordCount(markdown: string): number {
  return markdown.replace(/```[\s\S]*?```/g, ' ').replace(/[#>*_`[\]()!-]/g, ' ').split(/\s+/).filter(Boolean).length;
}

/** Pages with at least one problem, errors first; with the share of pages without any. */
export function auditSummary(pages: AuditedPage[]) {
  const withIssues = pages.filter((page) => page.issues.length);
  const errors = withIssues.filter((page) => page.issues.some((issue) => issue.level === 'error')).length;
  return {
    checked: pages.length,
    healthy: pages.length - withIssues.length,
    score: pages.length ? Math.round(((pages.length - withIssues.length) / pages.length) * 100) : 100,
    errors,
    warnings: withIssues.length - errors,
    pages: withIssues.sort((a, b) => Number(b.issues.some((issue) => issue.level === 'error')) - Number(a.issues.some((issue) => issue.level === 'error')) || b.issues.length - a.issues.length),
  };
}

/** One row of Search Console: a search, a page, a country… */
export type SeoRow = { key: string; clicks: number; impressions: number; ctr: number; position: number };

/**
 * Searches that show the site often but bring few clicks: position 4 to 20, at least 20
 * impressions, a click rate below what that position usually gets. Improving the title or the
 * description of the page, or the page itself, is what brings them up.
 */
export function seoOpportunities(queries: SeoRow[]): SeoRow[] {
  const expected = (position: number) => (position <= 5 ? 6 : position <= 10 ? 2.5 : 1);
  return queries
    .filter((item) => item.impressions >= 20 && item.position >= 4 && item.position <= 20 && item.ctr < expected(item.position))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);
}
