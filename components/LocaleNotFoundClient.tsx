'use client';

import { useLocale } from 'next-intl';
import { NotFoundContent, notFoundMetadata } from '@/components/NotFoundContent';
import { isLocale, routing } from '@/i18n/routing';

/**
 * 404 of app/[locale]. The language comes from the layout's NextIntlClientProvider: the server's
 * getLocale() reads the request headers, which a static (ISR) page may not do, and a notFound()
 * of an unknown tool or article then answered 500 instead of 404.
 */
export function LocaleNotFoundClient() {
  const current = useLocale();
  const locale = isLocale(current) ? current : routing.defaultLocale;
  const { title } = notFoundMetadata(locale);
  return (
    <>
      <title>{String(title)}</title>
      <NotFoundContent locale={locale} />
    </>
  );
}
