import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { NextIntlClientProvider } from 'next-intl';
import '../globals.css';
import { AdminShell } from '@/components/admin/AdminShell';
import { AppChrome } from '@/components/layout/AppChrome';
import { PwaRegister } from '@/components/PwaRegister';
import { SITE_METADATA } from '@/lib/seo';

export const metadata: Metadata = {
  ...SITE_METADATA,
  title: { default: 'Administration | JcHub', template: '%s | JcHub' },
  manifest: '/fr/manifest.webmanifest',
  robots: { index: false, follow: false },
};

/**
 * Root layout of the admin, in French. Unlike the public site it is rendered for every request:
 * proxy.ts gives the admin a nonce-based CSP, and Next.js only adds that nonce to its scripts
 * while rendering a request, so these pages must never be built ahead of time.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const isVercelProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL === '1';

  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body>
        {isVercelProduction && <Analytics />}
        {isVercelProduction && <SpeedInsights />}
        <NextIntlClientProvider locale="fr">
          <PwaRegister />
          <AppChrome isAdminHost>
            <AdminShell>{children}</AdminShell>
          </AppChrome>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
