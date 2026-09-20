'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, BookOpen, Bot, ChevronDown, FileText, Home, LineChart, LogOut, Menu, Settings, Users, Wrench, X } from 'lucide-react';
import { useState } from 'react';
import { signOut } from '@/lib/firebase-auth';

const navigation = [
  { href: '/admin', label: 'Vue d’ensemble', icon: BarChart3 },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/content', label: 'Contenu', icon: FileText },
  { href: '/admin/analytics', label: 'Analytics', icon: LineChart },
  { href: '/admin/tools', label: 'Outils', icon: Wrench },
  { href: '/admin/guides', label: 'Guides', icon: BookOpen },
  { href: '/admin/agent', label: 'Agent éditorial', icon: Bot },
  { href: '/admin/settings', label: 'Paramètres', icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (pathname === '/admin/login' || pathname === '/admin/register' || pathname === '/login') {
    return <>{children}</>;
  }

  const leaveAdmin = async () => {
    await Promise.all([signOut(), fetch('/api/admin/session', { method: 'DELETE' })]);
    window.location.assign(`${publicSiteUrl}/compte`);
  };

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-slate-900 md:flex">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto bg-[#07142b] p-4 text-slate-300 transition-transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex shrink-0 items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3 text-white font-bold">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2d67f6] text-lg shadow-lg shadow-blue-950/40">J</span>
            <span>JcHub <small className="block text-[10px] tracking-[0.18em] text-blue-300">ADMIN</small></span>
          </Link>
          <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Fermer le menu"><X /></button>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${pathname === href ? 'bg-[#2d67f6] text-white shadow-lg shadow-blue-950/30' : 'hover:bg-white/10 hover:text-white'}`}>
              <Icon className="h-5 w-5" /> {label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 shrink-0 space-y-2 border-t border-white/10 pt-4">
          <a href={publicSiteUrl} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-white/10"><Home className="h-4 w-4" /> Voir le site</a>
          <button onClick={leaveAdmin} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10"><LogOut className="h-4 w-4" /> Déconnexion</button>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-slate-950/50 md:hidden" onClick={() => setOpen(false)} aria-label="Fermer le menu" />}
      <div className="min-w-0 flex-1 md:ml-64">
        <header className="sticky top-0 z-20 flex h-[76px] items-center gap-4 border-b border-slate-200 bg-white px-4 md:px-8">
          <button className="rounded-lg p-2 hover:bg-slate-100 md:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir le menu"><Menu className="h-5 w-5" /></button>
          <div className="flex min-w-0 flex-1 items-center gap-6"><div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#315de2]">Espace privé</p><p className="text-sm font-medium text-slate-500">Administration JcHub</p></div><div className="hidden h-10 max-w-md flex-1 items-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-400 lg:flex">Rechercher dans l’administration...</div></div>
          <div className="hidden items-center gap-2 text-sm font-semibold text-slate-600 sm:flex">Admin <ChevronDown className="h-4 w-4" /></div>
        </header>
        <main className="p-4 md:p-7">{children}</main>
      </div>
    </div>
  );
}
