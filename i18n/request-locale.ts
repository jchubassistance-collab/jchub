import { isLocale, type Locale } from '@/i18n/routing';

/** Header the site's own fetch calls send so API routes answer in the visitor's language. */
export const LOCALE_HEADER = 'X-Locale';

/**
 * Language of an API request: the X-Locale header, else the address of the page that
 * made the call (same-origin requests carry it as Referer), else French.
 */
export function requestLocale(request: Request): Locale {
  const header = request.headers.get(LOCALE_HEADER);
  if (isLocale(header)) return header;
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const { pathname } = new URL(referer);
      if (pathname === '/en' || pathname.startsWith('/en/')) return 'en';
    } catch { /* Not a URL: keep the default. */ }
  }
  return 'fr';
}
