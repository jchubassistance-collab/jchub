import type { Metadata } from 'next';
import './globals.css';
import { AppChrome } from '@/components/layout/AppChrome';
import { headers } from 'next/headers';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev'),
  title: {
    default: 'JcHub — Outils pour développeurs',
    template: '%s · JcHub',
  },
  description:
    "L'écosystème pratique pour les développeurs : outils gratuits, automatisations et ressources utiles.",
  keywords: ['développeur', 'outils dev', 'apprentissage', 'ia'],
  authors: [{ name: 'JcHub' }],
  icons: {
    icon: [
      { url: '/favicon-blue.svg?v=2026-09-02', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon-blue.svg?v=2026-09-02',
    apple: '/favicon-blue.svg?v=2026-09-02',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://jchub.dev',
    siteName: 'JcHub',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const hostname = headers().get('host')?.split(':')[0].toLowerCase();
  const isAdminHost =
    hostname === 'admin.jchub.dev' || hostname === 'admin.localhost';

  return (
    <html lang="fr">
      <body>
        <AppChrome isAdminHost={isAdminHost}>{children}</AppChrome>
        <Analytics />
      </body>
    </html>
  );
}