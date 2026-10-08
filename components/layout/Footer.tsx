'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Mail, MapPin, Sparkles } from 'lucide-react';

const groups = [
  { title: 'Plateforme', links: [['Outils', '/outils']] },
  { title: 'JcHub', links: [['À propos', '/a-propos'], ['Contact', '/contact'], ['Blog', '/blog']] },
  { title: 'Légal', links: [['Conditions d’utilisation', '/cgu'], ['Conditions de vente', '/cgv'], ['Confidentialité', '/confidentialite'], ['Mentions légales', '/mentions-legales']] },
];

export function Footer() {
  const pathname = usePathname() ?? '';
  const isHome = pathname === '/';
  const isLightPage = isHome || pathname === '/a-propos' || pathname === '/outils' || pathname.startsWith('/outils/') || pathname.startsWith('/tools/') || pathname === '/contact' || pathname === '/blog' || pathname.startsWith('/blog/') || pathname === '/pricing' || ['/cgu', '/cgv', '/confidentialite', '/mentions-legales'].includes(pathname);
  const homeHref = '/';

  return (
    <footer className={`footer-shell relative ${isLightPage ? 'mt-0' : 'mt-16'} ${isLightPage ? 'border-t border-blue-100 bg-white text-slate-600' : 'bg-[#102a43] text-slate-300'} overflow-hidden`}>
      {!isLightPage && <div className="footer-glow footer-glow-one" aria-hidden="true" />}
      {!isLightPage && <div className="footer-glow footer-glow-two" aria-hidden="true" />}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className={`footer-cta flex flex-col gap-6 border-b py-10 sm:flex-row sm:items-end sm:justify-between lg:py-12 ${isLightPage ? 'border-blue-100' : 'border-white/10'}`}>
          <div className="max-w-2xl">
            <span className={`mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] ${isLightPage ? 'text-blue-700' : 'text-orange-300'}`}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              L’aventure continue
            </span>
            <p className={`text-2xl font-black leading-tight tracking-tight sm:text-3xl ${isLightPage ? 'text-[#0f172a]' : 'text-white'}`}>
              Des idées concrètes pour avancer, un outil à la fois.
            </p>
          </div>
          <Link href="/outils" className={`group inline-flex w-fit shrink-0 items-center gap-3 rounded-full px-5 py-3 text-sm font-bold transition duration-300 ${isLightPage ? 'bg-[#93c5fd] text-[#0f172a] hover:bg-[#60a5fa] hover:shadow-[0_10px_30px_rgba(37,99,235,.16)] focus-visible:outline-blue-500' : 'bg-orange-400 text-[#102a43] hover:bg-orange-300 hover:shadow-[0_10px_30px_rgba(251,146,60,0.25)] focus-visible:outline-orange-300'}`}>
            Explorer les outils
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:py-14">
          <div>
            <Link href={homeHref} className="group inline-flex items-center" aria-label="JcHub, accueil">
              <img src="/icone.svg" alt="JcHub" className="h-10 w-auto transition duration-300 group-hover:scale-[1.04] md:hidden" />
              <img src="/logo-blue.svg" alt="JcHub" className="hidden h-14 w-auto transition duration-300 group-hover:scale-[1.04] md:block" />
            </Link>
            <p className={`mt-5 max-w-sm text-sm leading-relaxed ${isLightPage ? 'text-slate-600' : 'text-slate-300'}`}>Une plateforme claire pour apprendre, utiliser des outils utiles et avancer dans ses projets numériques.</p>
            <div className="mt-6 space-y-3 text-sm">
              <a className={`group flex w-fit items-center gap-2 transition ${isLightPage ? 'hover:text-blue-800' : 'hover:text-white'}`} href="mailto:hello@jchub.dev">
                <Mail className={`h-4 w-4 transition-transform group-hover:-translate-y-0.5 ${isLightPage ? 'text-blue-600' : 'text-orange-400'}`} aria-hidden="true" />
                hello@jchub.dev
              </a>
              <span className="flex items-center gap-2"><MapPin className={`h-4 w-4 ${isLightPage ? 'text-blue-600' : 'text-orange-400'}`} aria-hidden="true" />Congo Brazzaville</span>
            </div>
          </div>
          {groups.map((group) => (
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
            </div>
          ))}
        </div>
      </div>
      <div className={`border-t ${isLightPage ? 'border-blue-100 bg-blue-50/60' : 'border-white/10 bg-[#0c2135]/70'}`}>
        <div className={`mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs sm:flex-row sm:justify-between sm:px-6 ${isLightPage ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>© {new Date().getFullYear()} JcHub. Tous droits réservés.</span>
          <span>Créé par Jessy Ngnambongo.</span>
        </div>
      </div>
    </footer>
  );
}
