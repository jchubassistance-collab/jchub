// lib/pricing.ts — Tarification en FCFA (Congo Brazzaville)
// 5 tiers : Free → Day → Month → Year → Lifetime

export type Plan = {
  id: 'free' | 'day' | 'monthly' | 'yearly' | 'lifetime';
  name: string;
  priceXAF: number;
  priceDisplay: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  saveBadge?: string;
  cta: string;
  ctaLink: string;
  highlight?: boolean;
  ctaStyle: 'ghost' | 'primary' | 'gradient';
  tier: 'entry' | 'core' | 'value';
};

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceXAF: 0,
    priceDisplay: '0 FCFA',
    period: 'pour toujours',
    description: 'Découvre JcHub sans engagement.',
    features: [
      'Accès aux outils gratuits',
      '3 livres audio libres (CC)',
      'Newsletter hebdo',
      'Essai de la plateforme',
    ],
    cta: 'Créer un compte',
    ctaLink: '/compte',
    ctaStyle: 'ghost',
    tier: 'entry',
  },
  {
    id: 'day',
    name: 'Day Pass',
    priceXAF: 99,
    priceDisplay: '99 FCFA',
    period: '24 heures',
    description: 'Teste le produit sans risque pendant une journée.',
    features: [
      'Accès complet pendant 24h',
      'Tous les livres audio premium',
      'Assistant IA inclus',
      'Sans engagement',
    ],
    cta: 'Essayer 24h',
    ctaLink: '/checkout?plan=day',
    ctaStyle: 'ghost',
    saveBadge: 'Déclic',
    tier: 'entry',
  },
  {
    id: 'monthly',
    name: 'JcHub+',
    priceXAF: 999,
    priceDisplay: '999 FCFA',
    period: 'par mois',
    description: 'Le plan idéal pour progresser régulièrement.',
    features: [
      'Accès illimité aux livres audio',
      'Tutoriels et outils premium',
      'Assistant IA sans limite',
      'Support prioritaire',
    ],
    cta: "S'abonner maintenant",
    ctaLink: '/checkout?plan=monthly',
    ctaStyle: 'gradient',
    popular: true,
    saveBadge: 'Le + populaire',
    tier: 'core',
  },
  {
    id: 'yearly',
    name: 'JcHub+ Annuel',
    priceXAF: 8999,
    priceDisplay: '8 999 FCFA',
    period: 'par an',
    description: 'Le meilleur rapport qualité/prix pour un apprentissage continu.',
    features: [
      'Tout du plan mensuel',
      'Économie de 3 000 FCFA',
      'Accès anticipé aux nouveautés',
      'Support VIP',
    ],
    cta: "S'abonner annuellement",
    ctaLink: '/checkout?plan=yearly',
    ctaStyle: 'primary',
    saveBadge: 'Économise 25%',
    tier: 'value',
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    priceXAF: 49900,
    priceDisplay: '49 900 FCFA',
    period: 'à vie',
    description: 'Accès illimité à vie pour les vrais bâtisseurs.',
    features: [
      'Accès illimité à vie',
      'Tout le catalogue premium',
      'Support prioritaire permanent',
      'Accès aux prochains packs exclusifs',
    ],
    cta: 'Devenir lifetime',
    ctaLink: '/checkout?plan=lifetime',
    ctaStyle: 'primary',
    saveBadge: 'VIP',
    tier: 'value',
  },
];

// Prix des livres audio (en FCFA)
export const bookPricing = {
  small: 499,    // < 100 pages
  medium: 999,   // 100-250 pages
  large: 1999,   // > 250 pages
};

export function getBookPrice(pageCount: number): number {
  if (pageCount < 100) return bookPricing.small;
  if (pageCount <= 250) return bookPricing.medium;
  return bookPricing.large;
}

export function formatXAF(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}
