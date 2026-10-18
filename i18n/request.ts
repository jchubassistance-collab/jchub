import { getRequestConfig } from 'next-intl/server';
import { isLocale, routing } from '@/i18n/routing';

// Texts live next to the components that show them (see i18n/copy.ts), so no message catalog here.
// Admin pages and API routes do not go through the locale proxy and fall back to French.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  return {
    locale: isLocale(requested) ? requested : routing.defaultLocale,
    messages: {},
    timeZone: 'Africa/Lagos',
  };
});
