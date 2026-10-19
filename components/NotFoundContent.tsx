import type { Metadata } from 'next';
import { ArrowRight, Home, Wrench } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';

const copy = bilingual({
  eyebrow: 'Erreur 404',
  title: 'Cette page est introuvable',
  text: 'Le lien a peut-être changé ou cette page n’existe plus. Retourne à l’accueil ou découvre les outils JcHub.',
  home: 'Retour à l’accueil',
  tools: 'Explorer les outils',
  toolsLink: 'Outils',
  about: 'À propos',
  contact: 'Contact',
}, {
  eyebrow: 'Error 404',
  title: 'Page not found',
  text: 'The link may have changed or this page may no longer exist. Head home or explore the JcHub tools.',
  home: 'Back to home',
  tools: 'Explore the tools',
  toolsLink: 'Tools',
  about: 'About',
  contact: 'Contact',
});

/** Tab title and description of the 404 page, in the visitor's language. */
export function notFoundMetadata(locale: Locale): Metadata {
  return { title: copy[locale].title, description: copy[locale].text };
}

export function NotFoundContent({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <section className="relative isolate flex min-h-[68vh] items-center justify-center overflow-hidden bg-[#eff6ff] px-4 py-16 text-[#0f172a] sm:px-6" aria-labelledby="not-found-title" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-200/50 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl" />

      <div className="relative w-full max-w-3xl rounded-[2rem] border border-blue-100 bg-white/90 px-6 py-10 text-center shadow-[0_24px_70px_rgba(29,78,216,.10)] backdrop-blur sm:px-12 sm:py-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-blue-700">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_0_4px_rgba(6,182,212,.12)]" />
          {t.eyebrow}
        </span>
        <h1 aria-hidden="true" className="mt-7 bg-gradient-to-br from-[#102a68] via-blue-600 to-cyan-500 bg-clip-text text-[clamp(6rem,22vw,11rem)] font-black leading-[.82] tracking-[-.09em] text-transparent" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>
          404
        </h1>
        <h2 id="not-found-title" className="mt-7 text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.title}</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{t.text}</p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" locale={locale} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(37,99,235,.2)] transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_12px_24px_rgba(37,99,235,.26)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            <Home className="h-4 w-4" aria-hidden="true" />
            {t.home}
          </Link>
          <Link href="/outils" locale={locale} className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-blue-200 bg-white px-6 py-3 text-sm font-bold text-[#17324d] transition hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
            <Wrench className="h-4 w-4 text-blue-700" aria-hidden="true" />
            {t.tools}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        <nav aria-label={t.title} className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-semibold text-slate-500">
          <Link href="/outils" locale={locale} className="transition hover:text-blue-700">{t.toolsLink}</Link>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-blue-300" />
          <Link href="/a-propos" locale={locale} className="transition hover:text-blue-700">{t.about}</Link>
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-blue-300" />
          <Link href="/contact" locale={locale} className="transition hover:text-blue-700">{t.contact}</Link>
        </nav>
      </div>
    </section>
  );
}
