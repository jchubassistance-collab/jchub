'use client';

import { usePathname } from 'next/navigation';

/**
 * Last resort when the root layout itself fails: it replaces the whole document, so the
 * global styles and the language provider are not there. The language comes from the address.
 */
const copy = {
  fr: { lang: 'fr', title: 'Une erreur est survenue', text: 'Le site n’a pas pu s’afficher. Réessaie dans un instant.', retry: 'Réessayer', home: 'Retour à l’accueil', homeHref: '/fr' },
  en: { lang: 'en', title: 'Something went wrong', text: 'The site could not be displayed. Try again in a moment.', retry: 'Try again', home: 'Back to home', homeHref: '/en' },
};

const button = { display: 'inline-block', margin: '0 6px', padding: '12px 22px', borderRadius: 999, fontSize: 14, fontWeight: 700, textDecoration: 'none', cursor: 'pointer' } as const;

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const pathname = usePathname() ?? '';
  const t = pathname === '/en' || pathname.startsWith('/en/') ? copy.en : copy.fr;
  return (
    <html lang={t.lang}>
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#eff6ff', color: '#0f172a', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', padding: 16 }}>
        <title>{`${t.title} | JcHub`}</title>
        <main style={{ maxWidth: 560, width: '100%', textAlign: 'center', background: '#fff', border: '1px solid #dbeafe', borderRadius: 32, padding: '48px 24px', boxShadow: '0 24px 70px rgba(29,78,216,.10)' }}>
          <p aria-hidden="true" style={{ margin: 0, fontSize: 96, fontWeight: 900, lineHeight: 0.9, letterSpacing: '-0.08em', color: '#2563eb' }}>500</p>
          <h1 style={{ margin: '28px 0 0', fontSize: 26, fontWeight: 800 }}>{t.title}</h1>
          <p style={{ margin: '12px auto 0', maxWidth: 420, fontSize: 15, lineHeight: 1.6, color: '#475569' }}>{t.text}</p>
          <div style={{ marginTop: 28 }}>
            <button type="button" onClick={() => retry()} style={{ ...button, border: 0, background: '#2563eb', color: '#fff' }}>{t.retry}</button>
            {/* A plain link: the app's navigation is not available without the root layout. */}
            <a href={t.homeHref} style={{ ...button, border: '1px solid #bfdbfe', background: '#fff', color: '#17324d' }}>{t.home}</a>
          </div>
          {error.digest && <p style={{ marginTop: 24, fontSize: 12, color: '#94a3b8' }}>Ref. <code>{error.digest}</code></p>}
        </main>
      </body>
    </html>
  );
}
