'use client';

import { useLocale } from 'next-intl';
import { ArrowUpRight, Mail, MapPin, Sparkles } from 'lucide-react';
import { OPEN_CONSENT_EVENT } from '@/components/AnalyticsConsent';
import { isLightPage as isLightHeaderPage } from '@/components/layout/Header';
import { Link, usePathname } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import type { StaticPathname } from '@/i18n/routing';

const copy = bilingual({
  groups: [
    { title: 'Plateforme', links: [['Outils', '/outils'], ['Centre d’aide', '/aide']] },
    { title: 'JcHub', links: [['À propos', '/a-propos'], ['Contact', '/contact'], ['Blog', '/blog']] },
    { title: 'Légal', links: [['Conditions d’utilisation', '/cgu'], ['Conditions de vente', '/cgv'], ['Confidentialité', '/confidentialite'], ['Mentions légales', '/mentions-legales']] },
  ] as { title: string; links: [string, StaticPathname][] }[],
  eyebrow: 'L’aventure continue',
  tagline: 'Des idées concrètes pour avancer, un outil à la fois.',
  explore: 'Explorer les outils',
  homeLabel: 'JcHub, accueil',
  about: 'Une plateforme claire pour apprendre, utiliser des outils utiles et avancer dans ses projets numériques.',
  location: 'Congo Brazzaville',
  socialLabel: 'Réseaux sociaux JcHub',
  socialTitle: 'Social',
  legalGroup: 'Légal',
  onFacebook: 'JcHub sur Facebook',
  onInstagram: 'JcHub sur Instagram',
  rights: 'Tous droits réservés.',
  cookies: 'Gérer les cookies',
  createdBy: 'Créé par Jessy Ngnambongo.',
}, {
  groups: [
    { title: 'Platform', links: [['Tools', '/outils'], ['Help center', '/aide']] },
    { title: 'JcHub', links: [['About', '/a-propos'], ['Contact', '/contact'], ['Blog', '/blog']] },
    { title: 'Legal', links: [['Terms of use', '/cgu'], ['Terms of sale', '/cgv'], ['Privacy', '/confidentialite'], ['Legal notice', '/mentions-legales']] },
  ],
  eyebrow: 'The adventure continues',
  tagline: 'Concrete ideas to move forward, one tool at a time.',
  explore: 'Explore the tools',
  homeLabel: 'JcHub, home',
  about: 'A clear platform to learn, use helpful tools and move your digital projects forward.',
  location: 'Congo-Brazzaville',
  socialLabel: 'JcHub social networks',
  socialTitle: 'Social',
  legalGroup: 'Legal',
  onFacebook: 'JcHub on Facebook',
  onInstagram: 'JcHub on Instagram',
  rights: 'All rights reserved.',
  cookies: 'Manage cookies',
  createdBy: 'Created by Jessy Ngnambongo.',
});

export function Footer() {
  const locale = useLocale();
  const t = copy[locale];
  const pathname = usePathname() ?? '';
  const isLightPage = isLightHeaderPage(pathname);

  return (
    <footer className={`footer-shell relative ${isLightPage ? 'mt-0' : 'mt-16'} ${isLightPage ? 'border-t border-blue-100 bg-white text-slate-600' : 'bg-white text-slate-700 md:bg-[#102a43] md:text-slate-300'} overflow-hidden`}>
      {!isLightPage && <div className="footer-glow footer-glow-one hidden md:block" aria-hidden="true" />}
      {!isLightPage && <div className="footer-glow footer-glow-two hidden md:block" aria-hidden="true" />}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className={`footer-cta hidden flex-col gap-6 border-b py-10 sm:flex-row sm:items-end sm:justify-between md:flex lg:py-12 ${isLightPage ? 'border-blue-100' : 'border-white/10'}`}>
          <div className="max-w-2xl">
            <span className={`mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] ${isLightPage ? 'text-blue-700' : 'text-orange-300'}`}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t.eyebrow}
            </span>
            <p className={`text-2xl font-black leading-tight tracking-tight sm:text-3xl ${isLightPage ? 'text-[#0f172a]' : 'text-white'}`}>
              {t.tagline}
            </p>
          </div>
          <Link href="/outils" className={`group inline-flex w-fit shrink-0 items-center gap-3 rounded-full px-5 py-3 text-sm font-bold transition duration-300 ${isLightPage ? 'bg-[#93c5fd] text-[#0f172a] hover:bg-[#60a5fa] hover:shadow-[0_10px_30px_rgba(37,99,235,.16)] focus-visible:outline-blue-500' : 'bg-orange-400 text-[#102a43] hover:bg-orange-300 hover:shadow-[0_10px_30px_rgba(251,146,60,0.25)] focus-visible:outline-orange-300'}`}>
            {t.explore}
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="relative isolate mx-auto max-w-sm overflow-hidden px-2 py-10 md:hidden">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-10 -z-10 h-44 w-44 rounded-full bg-[#0369fb]/[0.07] blur-3xl" />
          <Link href="/" className="group inline-flex items-center gap-3 rounded-2xl border border-blue-100/80 bg-white/90 px-3 py-2 shadow-sm shadow-blue-900/5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md" aria-label={t.homeLabel}>
            <img src="/jchub-icon-192.png" alt="" className="h-9 w-9 rounded-lg transition-transform duration-300 group-hover:rotate-[-3deg] group-hover:scale-105" />
            <span className="text-lg font-extrabold tracking-tight text-[#0369fb]">JcHub</span>
          </Link>
          <div aria-hidden="true" className="mt-8 h-px w-full bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
          <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-10">
            {t.groups.map((group, groupIndex) => (
              <section key={group.title}>
                <h2 className="mb-3 inline-flex items-center gap-2 text-xs font-semibold leading-4 tracking-wide text-slate-500">
                  <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${['bg-[#0369fb]', 'bg-[#12a8e8]', 'bg-violet-500'][groupIndex % 3]}`} />
                  {group.title}
                </h2>
                <ul className="space-y-2.5 text-sm leading-5 text-slate-800">
                  {group.links.map(([label, href], linkIndex) => (
                    <li key={href} className="flex items-center gap-2">
                      {groupIndex === 0 && <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-[2px] ${['bg-orange-400', 'bg-pink-400', 'bg-emerald-400', 'bg-amber-300', 'bg-blue-500'][linkIndex % 5]}`} />}
                      <Link href={href} className="inline-flex items-center rounded-sm transition duration-200 hover:translate-x-0.5 hover:text-[#0369fb] hover:underline hover:underline-offset-4">{label}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <section>
              <h2 className="mb-3 inline-flex items-center gap-2 text-xs font-semibold leading-4 tracking-wide text-slate-500">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                {t.socialTitle}
              </h2>
              <nav aria-label={t.socialLabel} className="flex flex-col items-start gap-2">
                <a href="https://www.facebook.com/1393952223791842" target="_blank" rel="noopener noreferrer" aria-label={t.onFacebook} title="Facebook" className="group relative inline-flex h-11 w-11 items-center justify-center text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"><span aria-hidden="true" className="absolute h-8 w-8 rounded-full bg-gradient-to-br from-[#1686ff] via-[#1877f2] to-[#3834b8] shadow-[0_4px_10px_rgba(24,80,220,.24)] transition-transform duration-300 group-hover:scale-105" /><FacebookBrandMark className="relative z-10 h-5 w-5" /></a>
                <a href="https://www.instagram.com/jchub.tech/" target="_blank" rel="noopener noreferrer" aria-label={t.onInstagram} title="Instagram" className="group relative inline-flex h-11 w-11 items-center justify-center text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-pink-500"><span aria-hidden="true" className="absolute h-8 w-8 rounded-full bg-gradient-to-tr from-[#7438ef] via-[#f83387] to-[#ffd43b] shadow-[0_4px_10px_rgba(225,48,108,.22)] transition-transform duration-300 group-hover:scale-105" /><InstagramBrandMark className="relative z-10 h-6 w-6" /></a>
              </nav>
            </section>
          </div>
        </div>

        <div className="hidden gap-10 py-12 md:grid md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:py-14">
          <div>
            <Link href="/" className="group inline-flex items-center" aria-label={t.homeLabel}>
              <img src="/jchub-icon-192.png" alt="JcHub" className="h-10 w-auto transition duration-300 group-hover:scale-[1.04] md:hidden" />
              <img src="/logo-blue.svg" alt="JcHub" className="hidden h-14 w-auto transition duration-300 group-hover:scale-[1.04] md:block" />
            </Link>
            <p className={`mt-5 max-w-sm text-sm leading-relaxed ${isLightPage ? 'text-slate-600' : 'text-slate-300'}`}>{t.about}</p>
            <div className="mt-6 space-y-3 text-sm">
              <a className={`group flex w-fit items-center gap-2 transition ${isLightPage ? 'hover:text-blue-800' : 'hover:text-white'}`} href="mailto:hello@jchub.dev">
                <Mail className={`h-4 w-4 transition-transform group-hover:-translate-y-0.5 ${isLightPage ? 'text-blue-600' : 'text-orange-400'}`} aria-hidden="true" />
                hello@jchub.dev
              </a>
              <span className="flex items-center gap-2"><MapPin className={`h-4 w-4 ${isLightPage ? 'text-blue-600' : 'text-orange-400'}`} aria-hidden="true" />{t.location}</span>
            </div>
          </div>
          {t.groups.map((group) => (
            <div key={group.title}>
              <h2 className={`mb-4 text-xs font-bold uppercase tracking-[0.18em] ${isLightPage ? 'text-blue-800' : 'text-orange-200'}`}>{group.title}</h2>
              <ul className="space-y-3 text-sm">
                {group.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className={`group inline-flex items-center gap-1.5 transition hover:translate-x-1 ${isLightPage ? 'text-slate-600 hover:text-blue-800' : 'text-slate-300 hover:text-white'}`}>
                      {label}
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
              {group.title === t.legalGroup && (
                <nav aria-label={t.socialLabel} className="mt-5 flex items-center gap-2.5">
                  <a href="https://www.facebook.com/1393952223791842" target="_blank" rel="noopener noreferrer" aria-label={t.onFacebook} title="Facebook" className="group relative inline-flex h-10 w-10 items-center justify-center text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"><span aria-hidden="true" className="absolute h-7 w-7 rounded-full bg-gradient-to-br from-[#1686ff] via-[#1877f2] to-[#3834b8] shadow-[0_3px_9px_rgba(24,80,220,.22)] transition-transform duration-300 group-hover:scale-105" /><FacebookBrandMark className="relative z-10 h-[1.1rem] w-[1.1rem]" /></a>
                  <a href="https://www.instagram.com/jchub.tech/" target="_blank" rel="noopener noreferrer" aria-label={t.onInstagram} title="Instagram" className="group relative inline-flex h-10 w-10 items-center justify-center text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-pink-500"><span aria-hidden="true" className="absolute h-7 w-7 rounded-full bg-gradient-to-tr from-[#7438ef] via-[#f83387] to-[#ffd43b] shadow-[0_3px_9px_rgba(225,48,108,.2)] transition-transform duration-300 group-hover:scale-105" /><InstagramBrandMark className="relative z-10 h-5 w-5" /></a>
                </nav>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className={`border-t ${isLightPage ? 'border-blue-100 bg-blue-50/60' : 'border-slate-200 bg-white md:border-white/10 md:bg-[#0c2135]/70'}`}>
        <div className={`mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs sm:flex-row sm:justify-between ${isLightPage ? 'text-slate-500' : 'text-slate-500 md:text-slate-400'}`}>
          <span>© {new Date().getFullYear()} JcHub. {t.rights}</span>
          <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))} className={`text-left underline-offset-2 hover:underline ${isLightPage ? 'hover:text-blue-800' : 'hover:text-blue-800 md:hover:text-white'}`}>
            {t.cookies}
          </button>
          <span>{t.createdBy}</span>
        </div>
      </div>
    </footer>
  );
}

function FacebookBrandMark({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 32" className={className} fill="currentColor">
      <path d="M14.4 29V17.9h3.7l.55-4.3H14.4v-2.75c0-1.25.35-2.1 2.14-2.1h2.28V4.9c-.4-.05-1.83-.18-3.47-.18-3.43 0-5.78 2.1-5.78 5.95v2.93H5.7v4.3h3.87V29h4.83Z" />
    </svg>
  );
}

function InstagramBrandMark({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="4" y="4" width="24" height="24" rx="7" />
      <circle cx="16" cy="16" r="5.5" />
      <circle cx="23.2" cy="8.9" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
