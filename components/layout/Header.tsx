'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Info, Mail, Menu, Wrench, X } from 'lucide-react';
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
  const closeMenus = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07162d]/80 shadow-[0_12px_30px_rgba(2,11,26,0.28)] backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center" aria-label="JcHub, accueil">
          <img src="/icone.svg" alt="JcHub" className="h-9 w-auto transition duration-300 group-hover:scale-[1.04] lg:hidden" />
          <img src="/logo-blue.svg" alt="JcHub" className="hidden h-11 w-auto transition duration-300 group-hover:scale-[1.04] lg:block" />
        </Link>

        <nav className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 lg:flex">
          {links.map((link) => (
            <NavLink key={link.href} {...link} pathname={safePathname} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen((value) => !value)}
            className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-100 transition hover:border-[#9ccbff]/40 hover:bg-white/10 lg:hidden"
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
        className={`fixed left-0 top-0 z-50 h-screen w-[92vw] max-w-[22rem] overflow-y-auto border-r border-white/10 bg-[#081a2f]/95 px-4 pb-8 pt-20 shadow-[0_20px_60px_rgba(2,8,23,0.7)] backdrop-blur-xl transition-transform duration-250 ease-out lg:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#9ccbff]">Navigation</span>
          <button
            type="button"
            onClick={closeMenus}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-100 transition hover:border-[#9ccbff]/40 hover:bg-white/10"
            aria-label="Fermer le menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {links.map((link) => (
            <MobileNavLink key={link.href} {...link} pathname={safePathname} onClick={closeMenus} />
          ))}
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, label, icon: Icon, pathname }: { href: string; label: string; icon: typeof Home; pathname: string }) {
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${active ? 'bg-white/10 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
    >
      <Icon className={`h-4 w-4 ${active ? 'text-[#9ccbff]' : 'text-slate-300 group-hover:text-[#9ccbff]'}`} />
      {label}
      {active && <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#9ccbff]" />}
    </Link>
  );
}

function MobileNavLink({ href, label, icon: Icon, pathname, onClick }: { href: string; label: string; icon: typeof Home; pathname: string; onClick: () => void }) {
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${active ? 'bg-white/5 text-white' : 'text-slate-200 hover:bg-white/5'}`}
    >
      <Icon className="h-4 w-4 text-[#9ccbff]" />
      {label}
    </Link>
  );
}
