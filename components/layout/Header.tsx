'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Info, Mail, Menu, Search, Wrench, X } from 'lucide-react';
import { useState } from 'react';

const links = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/a-propos', label: 'À propos', icon: Info },
  { href: '/outils', label: 'Outils', icon: Wrench },
  { href: '/contact', label: 'Contact', icon: Mail },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const safePathname = pathname ?? '';
  const isHome = safePathname === '/' || safePathname === '/a-propos' || safePathname === '/outils' || safePathname.startsWith('/outils/') || safePathname.startsWith('/tools/') || safePathname === '/contact' || safePathname === '/blog' || safePathname.startsWith('/blog/') || safePathname === '/pricing' || ['/cgu', '/cgv', '/confidentialite', '/mentions-legales'].includes(safePathname);
  const homeHref = '/';
  const currentLinks = links;
  const closeMenus = () => setOpen(false);

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isHome ? 'border-blue-100 bg-[#eff6ff]/90 shadow-[0_8px_24px_rgba(37,99,235,.07)]' : 'border-white/10 bg-[#07162d]/80 shadow-[0_12px_30px_rgba(2,11,26,0.28)]'}`}>
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href={homeHref} className="group flex shrink-0 items-center" aria-label="JcHub, accueil">
          <img src="/icone.svg" alt="JcHub" width="64" height="64" className="h-9 w-auto transition duration-300 group-hover:scale-[1.04] lg:hidden" />
          <img src="/logo-blue.svg" alt="JcHub" width="320" height="100" className="hidden h-11 w-auto transition duration-300 group-hover:scale-[1.04] lg:block" />
        </Link>

        <nav className={`hidden items-center gap-1 rounded-2xl border p-1 lg:flex ${isHome ? 'border-blue-100 bg-white/75' : 'border-white/10 bg-white/5'}`}>
          {currentLinks.map((link) => (
            <NavLink key={link.href} {...link} pathname={safePathname} isLight={isHome} />
          ))}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          <form action="/outils" className={`flex items-center gap-2 rounded-full border px-3 py-2 ${isHome ? 'border-blue-100 bg-white/80' : 'border-white/10 bg-white/5'}`}>
            <Search className={`h-4 w-4 ${isHome ? 'text-blue-600' : 'text-slate-300'}`} />
            <input name="q" aria-label="Rechercher un outil" placeholder="Rechercher un outil..." className={`w-36 bg-transparent text-xs outline-none placeholder:opacity-60 ${isHome ? 'text-slate-800 placeholder:text-slate-500' : 'text-white placeholder:text-slate-300'}`} />
          </form>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen((value) => !value)}
            className={`rounded-xl border p-2.5 transition lg:hidden ${isHome ? 'border-blue-100 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50' : 'border-white/10 bg-white/5 text-slate-100 hover:border-[#9ccbff]/40 hover:bg-white/10'}`}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
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
          <span className={`text-xs font-bold uppercase tracking-[0.2em] ${isHome ? 'text-blue-700' : 'text-[#9ccbff]'}`}>Navigation</span>
          <button
            type="button"
            onClick={closeMenus}
            className={`rounded-lg border p-2 transition ${isHome ? 'border-blue-100 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50' : 'border-white/10 bg-white/5 text-slate-100 hover:border-[#9ccbff]/40 hover:bg-white/10'}`}
            aria-label="Fermer le menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {currentLinks.map((link) => (
            <MobileNavLink key={link.href} {...link} pathname={safePathname} onClick={closeMenus} isLight={isHome} />
          ))}
        </div>
        <form action="/outils" className={`mt-5 flex items-center gap-2 rounded-xl border px-3 py-3 ${isHome ? 'border-blue-100 bg-blue-50' : 'border-white/10 bg-white/5'}`}>
          <Search className={`h-4 w-4 ${isHome ? 'text-blue-600' : 'text-slate-300'}`} />
          <input name="q" aria-label="Rechercher un outil" placeholder="Rechercher un outil..." className={`min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:opacity-60 ${isHome ? 'text-slate-800 placeholder:text-slate-500' : 'text-white placeholder:text-slate-300'}`} />
        </form>
      </nav>
    </header>
  );
}

function NavLink({ href, label, icon: Icon, pathname, isLight = false }: { href: string; label: string; icon: typeof Home; pathname: string; isLight?: boolean }) {
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

function MobileNavLink({ href, label, icon: Icon, pathname, onClick, isLight = false }: { href: string; label: string; icon: typeof Home; pathname: string; onClick: () => void; isLight?: boolean }) {
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
