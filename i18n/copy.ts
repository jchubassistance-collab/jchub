import type { Locale } from '@/i18n/routing';

/**
 * French and English texts of one component, kept side by side with its markup.
 * TypeScript refuses an English version with a missing or an extra key, so both
 * languages always show the same interface: `const t = copy[locale]`.
 */
export function bilingual<T>(fr: T, en: NoInfer<T>): Record<Locale, T> {
  return { fr, en };
}

/** BCP 47 tags for Intl formatting and Open Graph. */
export const INTL_LOCALE: Record<Locale, string> = { fr: 'fr-FR', en: 'en-US' };
export const OG_LOCALE: Record<Locale, string> = { fr: 'fr_FR', en: 'en_US' };
