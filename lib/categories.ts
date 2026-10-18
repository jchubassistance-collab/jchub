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
