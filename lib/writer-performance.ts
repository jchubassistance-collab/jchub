/**
 * Performance of a writer's articles (/admin/redaction/performances and the dashboard): the
 * figures of /api/redaction/performance, built from Google Analytics rows, the all-time view
 * counters and the comments.
 *
 * This module has no Next.js or Firebase import so that the tests and the browser can use it.
 */

export const PERFORMANCE_RANGES = [7, 30, 90] as const;
export type PerformanceRange = (typeof PERFORMANCE_RANGES)[number];

export type Lang = 'fr' | 'en';

/** One day of the period: views of the French and English pages, comments posted. */
export type DailyPoint = { date: string; fr: number; en: number; comments: number };

export type ArticlePerformance = {
  id: string;
  title: string;
  slug: string;
  image: string;
  status: string;
  publishedAt: string | null;
  words: number;
  readTime: string;
  /** Views counted by the site since publication, both languages. */
  allTimeViews: number;
  /** Views of the period, then of the period before, from Google Analytics. */
  views: number;
  previousViews: number;
  fr: number;
  en: number;
  readers: number;
  /** Average engaged reading time per view, in seconds. */
  readSeconds: number;
  comments: number;
  /** Views per day over the period, oldest first. */
  trend: number[];
};

export type Share = { name: string; views: number };

export type WriterPerformance = {
  /** False when Google Analytics does not answer: the site's daily counters draw the curves, without readers, reading time, devices, channels nor countries. */
  analytics: boolean;
  days: PerformanceRange;
  /** First and last day of the period (YYYY-MM-DD); the last one is yesterday. */
  start: string;
  end: string;
  totals: { views: number; previousViews: number; readers: number; readSeconds: number; comments: number; previousComments: number; allTimeViews: number; published: number };
  daily: DailyPoint[];
  articles: ArticlePerformance[];
  devices: Share[];
  channels: Share[];
  countries: Share[];
  /** Articles published per month over the last 12 months, oldest first (YYYY-MM). */
  monthly: { month: string; count: number }[];
  /** When the figures were computed (ISO). */
  computedAt: string;
};

/** Local day as YYYY-MM-DD. */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** The days of the period ending yesterday, oldest first. */
export function periodDays(days: number, today = new Date()): string[] {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days + index);
    return dayKey(date);
  });
}

/** GA4 dates come as YYYYMMDD. */
export function fromGaDate(value: string): string {
  return /^\d{8}$/.test(value) ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}` : value;
}

/** The pages of an article: its French address (with and without the /fr prefix) and its English one. */
export function articlePaths(slug: string, englishSlug?: string | null): { path: string; lang: Lang }[] {
  const paths: { path: string; lang: Lang }[] = [{ path: `/fr/blog/${slug}`, lang: 'fr' }, { path: `/blog/${slug}`, lang: 'fr' }];
  if (englishSlug) paths.push({ path: `/en/blog/${englishSlug}`, lang: 'en' });
  return paths;
}

/** Change from `previous` to `current`, in percent; null when there was nothing before. */
export function change(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Reading time as « 2 min 05 s » or « 45 s ». */
export function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  if (total < 60) return `${total} s`;
  return `${Math.floor(total / 60)} min ${String(total % 60).padStart(2, '0')} s`;
}

/** Names GA4 gives devices and channels, in the writer's words. */
const LABELS: Record<string, string> = {
  desktop: 'Ordinateur', mobile: 'Téléphone', tablet: 'Tablette', smarttv: 'Télévision',
  'Organic Search': 'Recherche Google et autres', Direct: 'Accès direct', Referral: 'Autres sites', 'Organic Social': 'Réseaux sociaux',
  'Paid Search': 'Annonces', Email: 'E-mail', Unassigned: 'Non identifié', 'Organic Video': 'Vidéo', 'Cross-network': 'Plusieurs réseaux',
  France: 'France', 'United States': 'États-Unis', Belgium: 'Belgique', Canada: 'Canada', Switzerland: 'Suisse', Morocco: 'Maroc',
  Senegal: 'Sénégal', "Côte d'Ivoire": 'Côte d’Ivoire', Cameroon: 'Cameroun', Gabon: 'Gabon', Congo: 'Congo', 'Congo - Kinshasa': 'RD Congo',
  Algeria: 'Algérie', Tunisia: 'Tunisie', Germany: 'Allemagne', 'United Kingdom': 'Royaume-Uni', India: 'Inde', Spain: 'Espagne', '(not set)': 'Inconnu',
};

export function shareLabel(name: string): string {
  return LABELS[name] ?? name;
}

/** Shares sorted by views, the small ones folded into « Autres » past `keep`. */
export function foldShares(shares: Share[], keep: number): Share[] {
  const sorted = shares.filter((share) => share.views > 0).map((share) => ({ name: shareLabel(share.name), views: share.views })).sort((a, b) => b.views - a.views);
  if (sorted.length <= keep) return sorted;
  const others = sorted.slice(keep).reduce((sum, share) => sum + share.views, 0);
  return [...sorted.slice(0, keep), { name: 'Autres', views: others }];
}
