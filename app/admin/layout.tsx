import type { Metadata } from 'next';
import { connection } from 'next/server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';
import { getAdminAuth } from '@/lib/firebase-admin';
import { ADMIN_PATH_HEADER, PUBLIC_ADMIN_PATHS } from '@/lib/admin-path';
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

  // Without a valid session, no admin page is sent, not even its menu: only the sign-in page.
  // The session cookie is created only for admin, CM and writer accounts; each /api/admin route
  // still checks the role and revocation before giving out data.
  const requestHeaders = await headers();
  const path = requestHeaders.get(ADMIN_PATH_HEADER) || '';
  if (!PUBLIC_ADMIN_PATHS.includes(path)) {
    const sessionCookie = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
    const signedIn = sessionCookie
      ? await getAdminAuth().verifySessionCookie(sessionCookie).then(() => true, () => false)
      : false;
    if (!signedIn) redirect('/admin/login');
  }
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
