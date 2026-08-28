import type { Metadata } from 'next';
import './globals.css';
import { AppChrome } from '@/components/layout/AppChrome';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev'),
  title: {
    default: 'JcHub — Outils & livres audio pour développeurs',
    template: '%s · JcHub',
  },
  description:
    "L'écosystème d'apprentissage intelligent pour les développeurs. Outils gratuits, livres audio premium, et assistant IA personnalisé.",
  keywords: ['développeur', 'outils dev', 'livre audio', 'apprentissage', 'ia'],
  authors: [{ name: 'JcHub' }],
  icons: {
    icon: [
      { url: '/favicon-sunset.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon-sunset.svg',
    apple: '/favicon-sunset.svg',
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
      </body>
    </html>
  );
}