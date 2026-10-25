'use client';

import { useLocale } from 'next-intl';
import { ChevronRight, Home, Info, Mail, Menu,Newspaper, Wrench, X } from 'lucide-react';
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
  blog: 'Blog', 
  contact: 'Contact',
  homeLabel: 'יָהּ, accueil',
  openMenu: 'Ouvrir le menu',
  closeMenu: 'Fermer le menu',
  navigation: 'Navigation',
}, {
  home: 'Home',
  about: 'About',
  tools: 'Tools',
  blog: 'Blog', 
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
    { href: '/blog', label: t.blog, icon: Newspaper },
    { href: '/contact', label: t.contact, icon: Mail },
  ];
  const closeMenus = () => setOpen(false);

  return (
    <>
      <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isHome ? 'border-blue-100 bg-[#eff6ff]/90 shadow-[0_8px_24px_rgba(37,99,235,.07)]' : 'border-white/10 bg-[#07162d]/80 shadow-[0_12px_30px_rgba(2,11,26,0.28)]'}`}>
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/" className="group flex shrink-0 items-center" aria-label={t.homeLabel}>
            <span className="relative hidden h-10 w-[3.7rem] shrink-0 place-items-center rounded-xl border border-[#12a8e8]/25 bg-white shadow-[0_4px_14px_rgba(16,28,175,.12)] transition duration-300 group-hover:-translate-y-0.5 group-hover:border-[#12a8e8]/55 group-hover:shadow-[0_8px_20px_rgba(16,28,175,.2)] md:grid">
              <span lang="he" dir="rtl" aria-hidden="true" className="font-serif text-[1.55rem] font-semibold leading-none tracking-[0.02em] transition duration-200 group-hover:scale-105" style={{ fontFamily: '"Noto Serif Hebrew", "Times New Roman", serif' }}>
                <span className="text-[#101caf]">יָ</span><span className="text-[#12a8e8]">הּ</span>
              </span>
            </span>
            <span className="md:hidden"><MobileBrand /></span>
          </Link>

          <nav className={`hidden items-center gap-1 rounded-2xl border p-1 md:flex ${isHome ? 'border-blue-100 bg-white/75' : 'border-white/10 bg-white/5'}`}>
            {currentLinks.map((link) => (
              <NavLink key={link.href} {...link} pathname={safePathname} isLight={isHome} />
            ))}
          </nav>

          <div className="hidden w-[19rem] items-center gap-3 xl:flex"><ToolFinder compact dark={!isHome}/></div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block"><LanguageSwitcher light={isHome} /></div>
            <button
              onClick={() => setOpen((value) => !value)}
              className={`rounded-xl border p-2.5 transition md:hidden ${isHome ? 'border-blue-100 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50' : 'border-white/10 bg-white/5 text-slate-100 hover:border-[#9ccbff]/40 hover:bg-white/10'}`}
              aria-label={open ? t.closeMenu : t.openMenu}
              aria-expanded={open}
              type="button"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Outside the header: its backdrop blur would make it the box of these fixed layers, and the
          closed menu, pushed off to the right, would then widen the page on phones. */}
      <div
        className={`fixed inset-0 z-[60] bg-slate-950/30 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={closeMenus}
        aria-hidden={!open}
      />
      <nav
        className={`fixed right-0 top-0 z-[70] flex h-[100dvh] w-[min(82vw,24rem)] flex-col overflow-y-auto rounded-l-2xl bg-white px-5 pb-6 pt-6 text-slate-900 shadow-[-16px_0_50px_rgba(15,23,42,.15)] transition-transform duration-300 ease-out md:hidden ${open ? 'translate-x-0' : 'translate-x-full'}`}
        aria-label={t.navigation}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <Link href="/" onClick={closeMenus} aria-label={t.homeLabel} className="rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369fb]">
            <MobileBrand />
          </Link>
          <button
            type="button"
            onClick={closeMenus}
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#0369fb]"
            aria-label={t.closeMenu}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 flex flex-col gap-1">
          {currentLinks.map((link, index) => (
            <MobileNavLink key={link.href} {...link} pathname={safePathname} onClick={closeMenus} index={index} open={open} />
          ))}
        </div>
        <div className="mt-3 flex justify-start border-t border-slate-100 pt-3">
          <LanguageSwitcher light small />
        </div>
        <div className="mt-auto w-full pt-6"><ToolFinder menu onNavigate={closeMenus}/></div>
      </nav>
    </>
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

function MobileNavLink({ href, label, icon: Icon, pathname, onClick, index, open }: { href: StaticPathname; label: string; icon: typeof Home; pathname: string; onClick: () => void; index: number; open: boolean }) {
  const active = isCurrentNavLink(href, pathname);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      style={{ transitionDelay: open ? `${index * 45}ms` : '0ms' }}
      className={`group flex items-center gap-3 rounded-xl px-0 py-3 text-sm font-medium transition-[opacity,transform,background-color,color] duration-300 ${open ? 'translate-x-0 opacity-100' : 'translate-x-3 opacity-0'} ${active ? 'bg-blue-50 text-[#0369fb]' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'}`}
    >
      <Icon className={`h-6 w-6 shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-[#0369fb]' : 'text-slate-500 group-hover:text-slate-800'}`} strokeWidth={1.8} />
      <span className="min-w-0 flex-1 whitespace-nowrap">{label}</span>
      <ChevronRight className="ml-auto h-4 w-4 text-slate-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#0369fb]" strokeWidth={1.7} />
    </Link>
  );
}

function MobileBrand() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img src="/jchub-icon-192.png" alt="" aria-hidden="true" className="h-9 w-9 rounded-xl shadow-[0_4px_12px_rgba(15,23,42,.15)]" />
      <span className="text-2xl font-extrabold leading-none tracking-tight text-[#0369fb]">
        JcHub
      </span>
    </span>
  );
}

function isCurrentNavLink(href: string, pathname: string) {
  if (pathname === href) return true;
  if (href === '/') return false;
  return pathname.startsWith(`${href}/`);
}
