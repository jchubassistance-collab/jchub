import type { Locale } from '@/i18n/routing';

/** Tool and article categories are stored in French; the site shows them in the visitor's language. */
const CATEGORY_LABELS_EN: Record<string, string> = {
  Développement: 'Development',
  Design: 'Design',
  Document: 'Document',
  Productivité: 'Productivity',
  Sécurité: 'Security',
  Texte: 'Text',
  Encodage: 'Encoding',
  Autre: 'Other',
  Informatique: 'Computer science',
  Frontend: 'Frontend',
  Technologie: 'Technology',
  'Base de données': 'Database',
  Produit: 'Product',
  Numérique: 'Digital',
};

export function categoryLabel(category: string, locale: Locale): string {
  return locale === 'en' ? CATEGORY_LABELS_EN[category] ?? category : category;
}

/** Address segment of a category page: its label in that language, e.g. Sécurité → securite / security. */
export function categorySlug(category: string, locale: Locale): string {
  return categoryLabel(category, locale)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** The stored (French) category whose page address in `locale` is `slug`, among `categories`. */
export function categoryFromSlug(slug: string, locale: Locale, categories: string[]): string | undefined {
  return categories.find((category) => categorySlug(category, locale) === slug);
}

/** Categories in order of first appearance, with how many items each one has. */
export function countByCategory(categories: string[]): { category: string; count: number }[] {
  const counts = new Map<string, number>();
  categories.forEach((category) => counts.set(category, (counts.get(category) ?? 0) + 1));
  return Array.from(counts, ([category, count]) => ({ category, count }));
}
