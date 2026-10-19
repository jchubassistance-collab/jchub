'use client';

import { useLocale } from 'next-intl';
import { CircleHelp, Home, Info, Mail, Menu, Wrench, X } from 'lucide-react';
import { useState } from 'react';
import { ToolFinder } from '@/components/layout/ToolFinder';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Link, usePathname } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import type { StaticPathname } from '@/i18n/routing';

const copy = bilingual({
  home: 'Accueil',
  about: 'À propos',
  tools: 'Outils',
  contact: 'Contact',
  homeLabel: 'יָהּ, accueil',
  openMenu: 'Ouvrir le menu',
  closeMenu: 'Fermer le menu',
  navigation: 'Navigation',
}, {
  home: 'Home',
  about: 'About',
  tools: 'Tools',
  contact: 'Contact',
  homeLabel: 'יָהּ, home',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  navigation: 'Navigation',
});

/** Pages with the light header. `pathname` is the French internal address of the page. */
export function isLightPage(pathname: string) {
  return pathname === '/' || pathname === '/a-propos' || pathname === '/outils' || pathname.startsWith('/outils/') || pathname.startsWith('/tools/') || pathname === '/aide' || pathname === '/contact' || pathname === '/blog' || pathname.startsWith('/blog/') || ['/cgu', '/cgv', '/confidentialite', '/mentions-legales'].includes(pathname);
}

export function Header() {
  const locale = useLocale();
  const t = copy[locale];
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const safePathname = pathname ?? '';
  const isHome = isLightPage(safePathname);
  const currentLinks: { href: StaticPathname; label: string; icon: typeof Home }[] = [
    { href: '/', label: t.home, icon: Home },
    { href: '/a-propos', label: t.about, icon: Info },
    { href: '/outils', label: t.tools, icon: Wrench },
    { href: '/contact', label: t.contact, icon: Mail },
  ];
  const closeMenus = () => setOpen(false);

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isHome ? 'border-blue-100 bg-[#eff6ff]/90 shadow-[0_8px_24px_rgba(37,99,235,.07)]' : 'border-white/10 bg-[#07162d]/80 shadow-[0_12px_30px_rgba(2,11,26,0.28)]'}`}>
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center" aria-label={t.homeLabel}>
          <span className="relative grid h-10 w-[3.7rem] shrink-0 place-items-center rounded-xl border border-[#12a8e8]/25 bg-white shadow-[0_4px_14px_rgba(16,28,175,.12)] transition duration-300 group-hover:-translate-y-0.5 group-hover:border-[#12a8e8]/55 group-hover:shadow-[0_8px_20px_rgba(16,28,175,.2)]">
            <span lang="he" dir="rtl" aria-hidden="true" className="font-serif text-[1.55rem] font-semibold leading-none tracking-[0.02em] transition duration-200 group-hover:scale-105" style={{ fontFamily: '"Noto Serif Hebrew", "Times New Roman", serif' }}>
              <span className="text-[#101caf]">יָ</span><span className="text-[#12a8e8]">הּ</span>
            </span>
          </span>
        </Link>

        <nav className={`hidden items-center gap-1 rounded-2xl border p-1 lg:flex ${isHome ? 'border-blue-100 bg-white/75' : 'border-white/10 bg-white/5'}`}>
          {currentLinks.map((link) => (
            <NavLink key={link.href} {...link} pathname={safePathname} isLight={isHome} />
          ))}
        </nav>

        <div className="hidden w-[19rem] items-center gap-3 xl:flex"><ToolFinder compact dark={!isHome}/></div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher light={isHome} />
          <button
            onClick={() => setOpen((value) => !value)}
            className={`rounded-xl border p-2.5 transition lg:hidden ${isHome ? 'border-blue-100 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50' : 'border-white/10 bg-white/5 text-slate-100 hover:border-[#9ccbff]/40 hover:bg-white/10'}`}
            aria-label={open ? t.closeMenu : t.openMenu}
            aria-expanded={open}
            type="button"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={closeMenus}
        aria-hidden={!open}
      />
      <nav
        className={`fixed left-0 top-0 z-50 h-screen w-[92vw] max-w-[22rem] overflow-y-auto border-r px-4 pb-8 pt-20 shadow-[0_20px_60px_rgba(2,8,23,0.2)] backdrop-blur-xl transition-transform duration-250 ease-out lg:hidden ${isHome ? 'border-blue-100 bg-white/95' : 'border-white/10 bg-[#081a2f]/95'} ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-hidden={!open}
        inert={!open}
      >
        <div className={`flex items-center justify-between border-b pb-4 ${isHome ? 'border-blue-100' : 'border-white/10'}`}>
          <span className={`text-xs font-bold uppercase tracking-[0.2em] ${isHome ? 'text-blue-700' : 'text-[#9ccbff]'}`}>{t.navigation}</span>
          <button
            type="button"
            onClick={closeMenus}
            className={`rounded-lg border p-2 transition ${isHome ? 'border-blue-100 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50' : 'border-white/10 bg-white/5 text-slate-100 hover:border-[#9ccbff]/40 hover:bg-white/10'}`}
            aria-label={t.closeMenu}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {currentLinks.map((link) => (
            <MobileNavLink key={link.href} {...link} pathname={safePathname} onClick={closeMenus} isLight={isHome} />
          ))}
        </div>
        <div className="mt-5"><ToolFinder dark={!isHome} onNavigate={closeMenus}/></div>
      </nav>
    </header>
  );
}

function NavLink({ href, label, icon: Icon, pathname, isLight = false }: { href: StaticPathname; label: string; icon: typeof Home; pathname: string; isLight?: boolean }) {
  const active = isCurrentNavLink(href, pathname);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${active ? (isLight ? 'bg-blue-600 text-white shadow-sm' : 'bg-white/10 text-white shadow-sm') : (isLight ? 'text-slate-700 hover:bg-blue-50 hover:text-blue-800' : 'text-slate-300 hover:bg-white/5 hover:text-white')}`}
    >
      <Icon className={`h-4 w-4 ${active ? (isLight ? 'text-white' : 'text-[#9ccbff]') : (isLight ? 'text-blue-700 group-hover:text-blue-800' : 'text-slate-300 group-hover:text-[#9ccbff]')}`} />
      {label}
      {active && <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#9ccbff]" />}
    </Link>
  );
}

function MobileNavLink({ href, label, icon: Icon, pathname, onClick, isLight = false }: { href: StaticPathname; label: string; icon: typeof Home; pathname: string; onClick: () => void; isLight?: boolean }) {
  const active = isCurrentNavLink(href, pathname);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${active ? (isLight ? 'bg-blue-50 text-blue-900' : 'bg-white/5 text-white') : (isLight ? 'text-slate-700 hover:bg-blue-50' : 'text-slate-200 hover:bg-white/5')}`}
    >
      <Icon className={`h-4 w-4 ${isLight ? 'text-blue-700' : 'text-[#9ccbff]'}`} />
      {label}
    </Link>
  );
}

function isCurrentNavLink(href: string, pathname: string) {
  if (pathname === href) return true;
  if (href === '/') return false;
  return pathname.startsWith(`${href}/`);
}
