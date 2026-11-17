import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import '../globals.css';
import '../dark-theme.css';
import { THEME_BOOT_SCRIPT } from '@/lib/theme';
import { AppChrome } from '@/components/layout/AppChrome';
import { AnalyticsConsent } from '@/components/AnalyticsConsent';
import { PwaRegister } from '@/components/PwaRegister';
import { OG_LOCALE } from '@/i18n/copy';
import { isLocale, routing, type Locale } from '@/i18n/routing';
import { defaultSocialImage, SITE_METADATA } from '@/lib/seo';

/**
 * Root layout of the public site. It reads nothing from the request (no headers(), no nonce):
 * the pages are built once and served from the CDN instead of being rendered for every visit.
 * Every page and layout below calls setRequestLocale, so next-intl does not read the request
 * either. The admin has its own root layout (app/admin/layout.tsx).
 */
const defaults: Record<Locale, { title: string; description: string; keywords: string[]; manifest: string }> = {
  fr: {
    title: 'Outils pratiques pour développeurs | JcHub',
    description: 'JcHub regroupe des outils gratuits, des ressources utiles et des workflows pratiques pour développeurs, créateurs et équipes.',
    keywords: ['JcHub', 'développeur', 'outils dev', 'outils gratuits', 'ressources développeurs', 'IA', 'Jessy Ngnambongo'],
    manifest: '/fr/manifest.webmanifest',
  },
  en: {
    title: 'Practical tools for developers | JcHub',
    description: 'JcHub brings together free tools, useful resources and practical workflows for developers, creators and teams.',
    keywords: ['JcHub', 'developer', 'dev tools', 'free tools', 'developer resources', 'AI', 'Jessy Ngnambongo'],
    manifest: '/en/manifest.webmanifest',
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return SITE_METADATA;
  const image = defaultSocialImage(locale);
  return {
    ...SITE_METADATA,
    // absolute: the template must not add a second "| JcHub" to this default.
    title: { absolute: defaults[locale].title, template: '%s | JcHub' },
    description: defaults[locale].description,
    keywords: defaults[locale].keywords,
    manifest: defaults[locale].manifest,
    // Inherited by pages without their own openGraph, so no page-specific title or URL here
    // (they made every such page's link preview show the home page).
    openGraph: { type: 'website', locale: OG_LOCALE[locale], siteName: 'JcHub', images: [image] },
    twitter: { card: 'summary_large_image', images: [image.url] },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // An unknown first segment (/file.php) is answered by not-found.tsx in French, which reads
  // the language set here rather than the request.
  setRequestLocale(isLocale(locale) ? locale : routing.defaultLocale);
  if (!isLocale(locale)) notFound();

  const isVercelProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL === '1';

  return (
    // suppressHydrationWarning: THEME_BOOT_SCRIPT sets data-theme before React starts.
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <link rel="alternate" type="application/rss+xml" href={`/${locale}/rss.xml`} />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'JcHub',
              alternateName: locale === 'en' ? 'JcHub — Developer tools' : 'JcHub — Outils pour développeurs',
              url: `https://jchub.dev/${locale}`,
              inLanguage: locale,
              author: { '@type': 'Person', name: 'Jessy Ngnambongo' },
              creator: { '@type': 'Person', name: 'Jessy Ngnambongo' },
            }),
          }}
        />

        {/* Cookieless Vercel measurement needs no consent; GA4 and Metricool wait for an opt-in. */}
        {isVercelProduction && <Analytics />}
        {isVercelProduction && <SpeedInsights />}

        {/* Client components read the language with useLocale(). The page changes language
            only through a full page load (see LanguageSwitcher), so this stays in sync. */}
        <NextIntlClientProvider locale={locale}>
          <AnalyticsConsent />
          <PwaRegister />
          <AppChrome>{children}</AppChrome>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
