import type { Metadata } from 'next';
import './globals.css';
import { NotFoundContent, notFoundMetadata } from '@/components/NotFoundContent';
import { SITE_METADATA } from '@/lib/seo';

/**
 * 404 of an address that matches no route at all. The site has two root layouts (app/[locale]
 * and app/admin), so this page brings its own document. Public addresses without a language
 * are sent to /fr/… by the proxy and get app/[locale]/not-found.tsx; what lands here is
 * mostly files that do not exist, answered in French.
 */
export const metadata: Metadata = { ...SITE_METADATA, ...notFoundMetadata('fr') };

export default function GlobalNotFound() {
  return (
    <html lang="fr">
      <body>
        <NotFoundContent locale="fr" />
      </body>
    </html>
  );
}
