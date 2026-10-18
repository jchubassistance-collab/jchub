import type { routing } from '@/i18n/routing';

// Types useLocale(), getLocale() and the localized Link/redirect hrefs with the site's locales.
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
  }
}
