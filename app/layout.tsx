
import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from 'next-intl/server';
import './globals.css';
import { AppChrome } from '@/components/layout/AppChrome';
import { AnalyticsConsent } from '@/components/AnalyticsConsent';
import { PwaRegister } from '@/components/PwaRegister';
import { headers } from 'next/headers';
import { getPublicBaseUrl } from '@/lib/site-url';
import { DEFAULT_SOCIAL_IMAGE } from '@/lib/seo';

// French defaults, used as is by the admin. Public pages get their language's
// version from app/[locale]/layout.tsx.
export const metadata: Metadata = {
  metadataBase: new URL(getPublicBaseUrl()),

  title: {
    default: 'Outils pratiques pour développeurs | JcHub',
    template: '%s | JcHub',
  },

  description:
    'JcHub regroupe des outils gratuits, des ressources utiles et des workflows pratiques pour développeurs, créateurs et équipes.',

  keywords: [
    'JcHub',
    'développeur',
    'outils dev',
    'outils gratuits',
    'ressources développeurs',
    'IA',
    'Jessy Ngnambongo',
  ],

  manifest: '/manifest.webmanifest',

  authors: [{ name: 'Jessy Ngnambongo' }],
  creator: 'Jessy Ngnambongo',
  publisher: 'Jessy Ngnambongo',

  verification: {
    google: 'CHtgc4pbKQbkrHEYgwyHs--a3JugPZMg3WTy87vcJm0',
  },

  icons: {
    icon: [
      {
        url: '/jchub-icon-192.png',
        type: 'image/png',
        sizes: '192x192',
      },
      {
        url: '/jchub-icon-512.png',
        type: 'image/png',
        sizes: '512x512',
      },
    ],
    shortcut: '/jchub-icon-192.png',
    apple: '/jchub-icon-192.png',
  },

  // Inherited by pages without their own openGraph, so no page-specific title or URL here
  // (they made every such page's link preview show the home page).
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'JcHub',
    images: [DEFAULT_SOCIAL_IMAGE],
  },

  twitter: {
    card: 'summary_large_image',
    images: [DEFAULT_SOCIAL_IMAGE.url],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  // Set by the locale proxy for public pages; French for the admin.
  const locale = await getLocale();

  const hostname = requestHeaders
    .get('host')
    ?.split(':')[0]
    .toLowerCase();

  const nonce = requestHeaders.get('x-nonce') || undefined;
  const isAdminPath = requestHeaders.get('x-is-admin-path') === '1';

  const isAdminHost =
    hostname === 'admin.jchub.dev' ||
    hostname === 'admin.localhost';

  const isProduction = process.env.NODE_ENV === 'production';
  const isVercelDeployment = process.env.VERCEL === '1';

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <head>
        <link rel="alternate" type="application/rss+xml" href={locale === 'en' ? '/en/rss.xml' : '/rss.xml'} />
      </head>
      <body>
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'JcHub',
              alternateName: locale === 'en' ? 'JcHub — Developer tools' : 'JcHub — Outils pour développeurs',
              url: locale === 'en' ? 'https://jchub.dev/en' : 'https://jchub.dev',
              inLanguage: locale,
              author: {
                '@type': 'Person',
                name: 'Jessy Ngnambongo',
              },
              creator: {
                '@type': 'Person',
                name: 'Jessy Ngnambongo',
              },
            }),
          }}
        />

        {/* Cookieless Vercel measurement needs no consent; GA4 and Metricool wait for an opt-in. */}
        {isProduction && isVercelDeployment && <Analytics />}

        {isProduction && isVercelDeployment && <SpeedInsights />}

        {/* Client components read the language with useLocale(). The page changes language
            only through a full page load (see LanguageSwitcher), so this stays in sync. */}
        <NextIntlClientProvider locale={locale}>
          {!isAdminHost && !isAdminPath && <AnalyticsConsent nonce={nonce} />}

          <PwaRegister />

          <AppChrome isAdminHost={isAdminHost}>
            {children}
          </AppChrome>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
