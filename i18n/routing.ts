import { defineRouting } from 'next-intl/routing';

/**
 * Each language has its prefix: French under /fr (jchub.dev/fr/outils), English under /en with
 * translated addresses (jchub.dev/en/tools). The former French addresses without prefix are
 * redirected for good by proxy.ts. The keys of `pathnames` are the folders of app/[locale].
 */
export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'always',
  // The address alone decides the language: no redirect from the browser language or a cookie,
  // so search engines and shared links always land on the version they point to.
  localeDetection: false,
  localeCookie: false,
  // hreflang links come from each page's metadata, which knows the translated slugs.
  alternateLinks: false,
  pathnames: {
    '/': '/',
    '/a-propos': { fr: '/a-propos', en: '/about' },
    '/aide': { fr: '/aide', en: '/help' },
    '/auth/action': '/auth/action',
    '/blog': '/blog',
    '/blog/[slug]': '/blog/[slug]',
    '/blog/categorie/[category]': { fr: '/blog/categorie/[category]', en: '/blog/category/[category]' },
    '/cgu': { fr: '/cgu', en: '/terms' },
    '/cgv': { fr: '/cgv', en: '/terms-of-sale' },
    '/compte': { fr: '/compte', en: '/account' },
    '/compte/dashboard': { fr: '/compte/dashboard', en: '/account/dashboard' },
    '/compte/favoris': { fr: '/compte/favoris', en: '/account/favorites' },
    '/compte/parametres': { fr: '/compte/parametres', en: '/account/settings' },
    '/confidentialite': { fr: '/confidentialite', en: '/privacy' },
    '/contact': '/contact',
    '/mentions-legales': { fr: '/mentions-legales', en: '/legal-notice' },
    '/outils': { fr: '/outils', en: '/tools' },
    '/outils/[slug]': { fr: '/outils/[slug]', en: '/tools/[slug]' },
    '/outils/categorie/[category]': { fr: '/outils/categorie/[category]', en: '/tools/category/[category]' },
    '/outils/apercu/[component]': { fr: '/outils/apercu/[component]', en: '/tools/preview/[component]' },
    '/suppression-donnees': { fr: '/suppression-donnees', en: '/data-deletion' },
    '/tools/api-cost-calculator': '/tools/api-cost-calculator',
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;
/** Addresses without a dynamic segment: what a plain Link href accepts. */
export type StaticPathname = Exclude<AppPathname, `${string}[${string}]${string}`>;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (routing.locales as readonly string[]).includes(value);
}
