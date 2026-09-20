import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';
import './globals.css';
import { AppChrome } from '@/components/layout/AppChrome';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { PwaRegister } from '@/components/PwaRegister';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev'),
  alternates: {
    canonical: 'https://jchub.dev',
  },
  title: {
    default: 'JcHub | Outils pratiques pour développeurs',
    template: '%s | JcHub',
  },
  description:
    'JcHub regroupe des outils gratuits, des ressources utiles et des workflows pratiques pour développeurs, créateurs et équipes.',
  keywords: ['JcHub', 'développeur', 'outils dev', 'outils gratuits', 'ressources développeurs', 'ia', 'Jessy Ngnambongo'],
  authors: [{ name: 'Jessy Ngnambongo' }],
  creator: 'Jessy Ngnambongo',
  publisher: 'Jessy Ngnambongo',
  verification: {
    google: 'CHtgc4pbKQbkrHEYgwyHs--a3JugPZMg3WTy87vcJm0',
  },
  icons: {
    icon: [
      { url: '/favicon-blue.png?v=2026-09-13', type: 'image/png', sizes: '192x192' },
    ],
    shortcut: '/favicon-blue.png?v=2026-09-13',
    apple: '/favicon-blue.png?v=2026-09-13',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://jchub.dev',
    siteName: 'JcHub',
    title: 'JcHub | Outils pratiques pour développeurs',
    description:
      'JcHub regroupe des outils gratuits, des ressources utiles et des workflows pratiques pour développeurs, créateurs et équipes.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JcHub | Outils pratiques pour développeurs',
    description:
      'JcHub regroupe des outils gratuits, des ressources utiles et des workflows pratiques pour développeurs, créateurs et équipes.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const hostname = headers().get('host')?.split(':')[0].toLowerCase();
  const isAdminHost =
    hostname === 'admin.jchub.dev' || hostname === 'admin.localhost';
  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <html lang="fr">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'JcHub',
              alternateName: 'JcHub — Outils pour développeurs',
              url: 'https://jchub.dev',
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
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" data-turnstile="true" />
        {isProduction && <Analytics />}
        {isProduction && <SpeedInsights />}
        <GoogleAnalytics />
        <PwaRegister />
        <AppChrome isAdminHost={isAdminHost}>{children}</AppChrome>
      </body>
    </html>
  );
}