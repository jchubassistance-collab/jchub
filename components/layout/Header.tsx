'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, BookOpen, ChevronDown, FileText, Headphones, Home, Info, LayoutDashboard, LogOut, Mail, Menu, Settings, Sparkles, UserCircle, Wrench, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { onAuthChange, signOut } from '@/lib/firebase-auth';

const links = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/a-propos', label: 'À propos', icon: Info },
  { href: '/outils', label: 'Outils', icon: Wrench },
  { href: '/contact', label: 'Contact', icon: Mail },
];

const libraryLinks = [
  { href: '/livres/pdf', label: 'Livres PDF', description: 'Lire et télécharger des ressources', icon: FileText },
  { href: '/livres/audio', label: 'Livres audio', description: 'Découvrir et écouter des livres', icon: Headphones },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authUser, setAuthUser] = useState<{ displayName: string | null; email: string | null; photoURL: string | null } | null>(null);
  const safePathname = pathname ?? '';
  const libraryActive = safePathname.startsWith('/livres');

  useEffect(() => onAuthChange((user) => setAuthUser(user ? {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  } : null)), []);

  const profileName = authUser?.displayName || authUser?.email?.split('@')[0] || 'Mon profil';
  const profileInitial = profileName.charAt(0).toUpperCase();
  const closeMenus = () => {
    setOpen(false);
    setProfileOpen(false);
    setLibraryOpen(false);
  };
  const handleSignOut = async () => {
    await signOut();
    closeMenus();
  };

  return <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl">
    <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
      <Link href="/" className="group flex shrink-0 items-center" aria-label="JcHub, accueil"><img src="/logo-sunset.svg" alt="JcHub" className="h-11 w-auto transition duration-300 group-hover:scale-[1.04]" /></Link>
      <nav className="hidden items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1 lg:flex">
        {links.slice(0, 3).map((link) => <NavLink key={link.href} {...link} pathname={safePathname} />)}
        <div className="relative" onMouseEnter={() => setLibraryOpen(true)} onMouseLeave={() => setLibraryOpen(false)}>
          <button type="button" onClick={() => setLibraryOpen((value) => !value)} aria-expanded={libraryOpen} aria-haspopup="menu" className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${libraryActive ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:bg-white/70 hover:text-slate-950'}`}><BookOpen className={`h-4 w-4 ${libraryActive ? 'text-orange-600' : 'text-slate-400 group-hover:text-orange-500'}`} />Bibliothèque<ChevronDown className={`h-3.5 w-3.5 transition ${libraryOpen ? 'rotate-180' : ''}`} />{libraryActive && <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-orange-500" />}</button>
          {libraryOpen && <div className="absolute left-1/2 top-full w-72 -translate-x-1/2 pt-3" role="menu"><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10">{libraryLinks.map((link) => <LibraryLink key={link.href} {...link} onClick={() => setLibraryOpen(false)} />)}</div></div>}
        </div>
        <NavLink {...links[3]} pathname={safePathname} />
      </nav>
      <div className="flex items-center gap-2">{authUser ? <div className="relative hidden sm:block"><button type="button" onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen} aria-haspopup="menu" className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-left transition hover:border-orange-300 hover:bg-orange-50"><span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#17324d] to-orange-500 text-sm font-black text-white">{authUser.photoURL ? <img src={authUser.photoURL} alt="" className="h-full w-full object-cover" /> : profileInitial}</span><span className="max-w-24 truncate text-sm font-bold text-slate-700">{profileName}</span><ChevronDown className={`h-4 w-4 text-slate-400 transition ${profileOpen ? 'rotate-180' : ''}`} /></button>{profileOpen && <ProfileMenu onClose={() => setProfileOpen(false)} onSignOut={handleSignOut} />}</div> : <Link href="/compte" className="hidden rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-orange-50 hover:text-orange-700 sm:inline">Se connecter</Link>}<Link href="/pricing" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-orange-500/35"><Sparkles className="h-4 w-4" />Premium<ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link><button onClick={() => setOpen((value) => !value)} className="rounded-xl border border-slate-200 p-2.5 text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 lg:hidden" aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>
    </div>
    {open && <><button type="button" aria-label="Fermer le menu" onClick={closeMenus} className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] lg:hidden" /><nav className="fixed right-0 top-0 z-50 h-full w-[min(90vw,24rem)] overflow-y-auto border-l border-slate-200 bg-white px-4 pb-6 pt-24 shadow-2xl shadow-slate-950/20 lg:hidden"><div className="mx-auto max-w-7xl space-y-1">{authUser ? <div className="mb-3 rounded-2xl bg-slate-50 p-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#17324d] to-orange-500 font-black text-white">{authUser.photoURL ? <img src={authUser.photoURL} alt="" className="h-full w-full object-cover" /> : profileInitial}</span><div className="min-w-0"><p className="truncate text-sm font-black text-slate-900">{profileName}</p><p className="truncate text-xs text-slate-500">{authUser.email}</p></div></div><div className="mt-3 grid gap-1">{profileLinks.map((link) => <Link key={link.href} href={link.href} onClick={closeMenus} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white hover:text-orange-700"><link.icon className="h-4 w-4 text-orange-500" />{link.label}</Link>)}<button type="button" onClick={handleSignOut} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Déconnexion</button></div></div> : <MobileNavLink href="/compte" label="Se connecter" icon={UserCircle} pathname={safePathname} onClick={closeMenus} />}{links.slice(0, 3).map((link) => <MobileNavLink key={link.href} {...link} pathname={safePathname} onClick={closeMenus} />)}<Link href="/pricing" onClick={closeMenus} className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 px-3 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20"><span className="flex items-center gap-3"><Sparkles className="h-4 w-4" />Premium</span><ArrowUpRight className="h-4 w-4" /></Link><button type="button" onClick={() => setLibraryOpen((value) => !value)} aria-expanded={libraryOpen} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-700"><span className="flex items-center gap-3"><BookOpen className="h-4 w-4 text-orange-500" />Bibliothèque</span><ChevronDown className={`h-4 w-4 transition ${libraryOpen ? 'rotate-180' : ''}`} /></button>{libraryOpen && <div className="ml-7 space-y-1 border-l border-orange-200 pl-3">{libraryLinks.map((link) => <Link key={link.href} href={link.href} onClick={closeMenus} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-700"><link.icon className="h-4 w-4 text-orange-500" />{link.label}</Link>)}</div>}<MobileNavLink {...links[3]} pathname={safePathname} onClick={closeMenus} /></div></nav></>}
  </header>;
}

function NavLink({ href, label, icon: Icon, pathname }: { href: string; label: string; icon: typeof Home; pathname: string }) {
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
  return <Link href={href} className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:bg-white/70 hover:text-slate-950'}`}><Icon className={`h-4 w-4 ${active ? 'text-orange-600' : 'text-slate-400 group-hover:text-orange-500'}`} />{label}{active && <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-orange-500" />}</Link>;
}

function MobileNavLink({ href, label, icon: Icon, pathname, onClick }: { href: string; label: string; icon: typeof Home; pathname: string; onClick: () => void }) {
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
  return <Link href={href} onClick={onClick} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${active ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50'}`}><Icon className="h-4 w-4 text-orange-500" />{label}</Link>;
}

function LibraryLink({ href, label, description, icon: Icon, onClick }: { href: string; label: string; description: string; icon: typeof FileText; onClick: () => void }) {
  return <Link href={href} onClick={onClick} role="menuitem" className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-orange-50"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-600"><Icon className="h-5 w-5" /></span><span><span className="block text-sm font-black text-slate-900">{label}</span><span className="mt-0.5 block text-xs leading-5 text-slate-500">{description}</span></span><ArrowUpRight className="ml-auto mt-1 h-4 w-4 text-slate-300" /></Link>;
}

const profileLinks = [
  { href: '/compte/dashboard', label: 'Mon dashboard', icon: LayoutDashboard },
  { href: '/compte/bibliotheque', label: 'Ma bibliothèque', icon: BookOpen },
  { href: '/compte/favoris', label: 'Mes favoris', icon: Sparkles },
  { href: '/compte/parametres', label: 'Paramètres', icon: Settings },
];

function ProfileMenu({ onClose, onSignOut }: { onClose: () => void; onSignOut: () => Promise<void> }) {
  return <div className="absolute right-0 top-full z-50 mt-3 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/15" role="menu">{profileLinks.map((link) => <Link key={link.href} href={link.href} onClick={onClose} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-orange-50 hover:text-orange-700" role="menuitem"><link.icon className="h-4 w-4 text-orange-500" />{link.label}</Link>)}<div className="my-1 border-t border-slate-100" /><button type="button" onClick={onSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"><LogOut className="h-4 w-4" />Déconnexion</button></div>;
}
