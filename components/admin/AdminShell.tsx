'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BookOpen, Home, LogOut, Menu, Upload, Users, Wrench, X } from 'lucide-react';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const navigation = [
  { href: '/admin', label: 'Vue d’ensemble', icon: BarChart3 },
  { href: '/admin/upload', label: 'Ajouter un livre', icon: Upload },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users, disabled: true },
  { href: '/admin/books', label: 'Catalogue', icon: BookOpen, disabled: true },
  { href: '/admin/tools', label: 'Outils', icon: Wrench, disabled: true },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (pathname === '/admin/login' || pathname === '/admin/register' || pathname === '/login') {
    return <>{children}</>;
  }

  const leaveAdmin = async () => {
    await createSupabaseBrowserClient().auth.signOut();
    window.location.assign(`${publicSiteUrl}/compte`);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 md:flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-950 text-slate-300 p-5 transition-transform md:static md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-10">
          <Link href="/admin" className="flex items-center gap-3 text-white font-bold">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500 text-lg">J</span>
            <span>JcHub <small className="block text-[10px] tracking-[0.18em] text-indigo-300">ADMIN</small></span>
          </Link>
          <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Fermer le menu"><X /></button>
        </div>
        <nav className="space-y-1">
          {navigation.map(({ href, label, icon: Icon, disabled }) => (
            <Link key={href} href={disabled ? '#' : href} onClick={() => setOpen(false)} aria-disabled={disabled}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${disabled ? 'cursor-not-allowed opacity-40' : pathname === href ? 'bg-indigo-500 text-white shadow-lg' : 'hover:bg-white/10 hover:text-white'}`}>
              <Icon className="h-5 w-5" /> {label}{disabled && <span className="ml-auto text-[10px]">Bientôt</span>}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 space-y-2">
          <a href={publicSiteUrl} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-white/10"><Home className="h-4 w-4" /> Voir le site</a>
          <button onClick={leaveAdmin} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10"><LogOut className="h-4 w-4" /> Déconnexion</button>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-slate-950/50 md:hidden" onClick={() => setOpen(false)} aria-label="Fermer le menu" />}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-4 md:px-8">
          <button className="rounded-lg p-2 hover:bg-slate-100 md:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir le menu"><Menu className="h-5 w-5" /></button>
          <div><p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Espace privé</p><p className="text-sm font-medium text-slate-500">Administration JcHub</p></div>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
