import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NewsletterConfirmation } from '@/components/NewsletterConfirmation';
import { bilingual } from '@/i18n/copy';
import { isLocale } from '@/i18n/routing';

const copy = bilingual({
  metaTitle: 'Confirmation de l’inscription à la newsletter',
}, {
  metaTitle: 'Newsletter subscription confirmation',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  // A personal link: kept out of search engines.
  return { title: copy[locale].metaTitle, robots: { index: false, follow: false } };
}

/**
 * Page of the link mailed by /api/newsletter (double opt-in, see lib/newsletter.ts). It is shown
 * without the site's header and footer (components/layout/AppChrome.tsx).
 */
export default async function NewsletterConfirmationPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { token } = await searchParams;
  return <NewsletterConfirmation token={typeof token === 'string' ? token : ''} />;
}
