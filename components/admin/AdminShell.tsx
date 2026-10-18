'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Bot, ChevronDown, ClipboardList, FileText, Home, LineChart, LogOut, Menu, Settings, Users, Wrench, X, Send, Inbox, Bell, Search, ExternalLink, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { signOut } from '@/lib/firebase-auth';

const ADMIN_IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const ADMIN_LAST_ACTIVITY_KEY = 'jchub_admin_last_activity';

const navigation = [
  { href: '/admin', label: 'Tableau de bord', icon: BarChart3 },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/cm-access', label: 'Accès CM', icon: Users },
  { href: '/admin/content', label: 'Contenu', icon: FileText },
  { href: '/admin/analytics', label: 'Analytics', icon: LineChart },
  { href: '/admin/tools', label: 'Outils', icon: Wrench },
  { href: '/admin/agent', label: 'Agent éditorial', icon: Bot },
  { href: '/admin/cm', label: 'Espace CM', icon: BarChart3 },
  { href: '/admin/inbox', label: 'Messages & newsletter', icon: Inbox },
  { href: '/admin/settings', label: 'Paramètres', icon: Settings },
];

const cmNavigation = [
  { href: '/admin/cm#dashboard', label: 'Tableau de bord', icon: BarChart3 },
  { href: '/admin/cm#articles', label: 'Articles', icon: FileText },
  { href: '/admin/cm#tools', label: 'Outils', icon: Wrench },
  { href: '/admin/cm#kits', label: 'Kits de publication', icon: Sparkles },
  { href: '/admin/cm#reports', label: 'Rapports', icon: ClipboardList },
  { href: '/admin/cm#compare', label: 'Comparatifs', icon: LineChart },
  { href: '/admin/cm#performance', label: 'Performances', icon: BarChart3 },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCmPage = Boolean(pathname?.startsWith('/admin/cm'));
  const [open, setOpen] = useState(false);
  const [cmTab, setCmTab] = useState('dashboard');
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const isAdminPage = Boolean(pathname?.startsWith('/admin') && pathname !== '/admin/login' && !pathname.startsWith('/admin/cm'));

  useEffect(() => {
    if (!isAdminPage) return;

    let lastActivity = Number(sessionStorage.getItem(ADMIN_LAST_ACTIVITY_KEY)) || Date.now();
    let timer: number;
    let expired = false;

    const expireSession = async () => {
      if (expired) return;
      expired = true;
      sessionStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
      await Promise.allSettled([
        fetch('/api/admin/session', { method: 'DELETE' }),
        signOut(),
      ]);
      window.location.replace('/admin/login?reason=timeout');
    };

    const checkIdle = () => {
      const remaining = ADMIN_IDLE_TIMEOUT_MS - (Date.now() - lastActivity);
      if (remaining <= 0) {
        void expireSession();
        return;
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(checkIdle, remaining);
    };

    const recordActivity = () => {
      if (Date.now() - lastActivity >= ADMIN_IDLE_TIMEOUT_MS) {
        void expireSession();
        return;
      }
      lastActivity = Date.now();
      sessionStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(lastActivity));
      checkIdle();
    };

    const verifySession = async () => {
      try {
        const response = await fetch('/api/admin/session', { cache: 'no-store' });
        if (!response.ok && (response.status === 401 || response.status === 403)) {
          void expireSession();
        }
      } catch {
        // A temporary network failure should not sign the administrator out.
      }
    };

    if (Date.now() - lastActivity >= ADMIN_IDLE_TIMEOUT_MS) {
      void expireSession();
    } else {
      sessionStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(lastActivity));
      checkIdle();
      void verifySession();
    }

    const activityEvents: Array<keyof WindowEventMap> = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));
    const onVisibilityChange = () => { if (document.visibilityState === 'visible') checkIdle(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', checkIdle);

    return () => {
      window.clearTimeout(timer);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', checkIdle);
    };
  }, [isAdminPage]);

  useEffect(() => {
    if (!isCmPage) return;
    const updateTab = () => setCmTab(window.location.hash.slice(1) || 'dashboard');
    updateTab();
    window.addEventListener('hashchange', updateTab);
    return () => window.removeEventListener('hashchange', updateTab);
  }, [isCmPage]);

  if (pathname === '/admin/login' || pathname === '/login') return <>{children}</>;

  const leaveAdmin = async () => {
    await Promise.allSettled([signOut(), fetch('/api/admin/session', { method: 'DELETE' })]);
    sessionStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
    window.location.assign('/admin/login');
  };

  return (
    <div className={`min-h-screen text-slate-800 md:flex ${isCmPage?'bg-[#f4f6fb]':'bg-[#f4f6fb]'}`}>
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] max-w-[calc(100vw-1rem)] flex-col border-r px-4 py-5 transition-transform md:translate-x-0 ${isCmPage?'border-slate-800 bg-[#111927]':'border-slate-100 bg-white'} ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-7 flex shrink-0 items-center justify-between px-1">
          <Link href={isCmPage?'/admin/cm':'/admin'} className={`flex items-center gap-2.5 font-extrabold tracking-tight ${isCmPage?'text-white':'text-slate-900'}`}>
            {isCmPage?<img src="/jchub-icon-192.png" alt="" className="h-9 w-9 rounded-xl object-cover"/>:<span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#f5c842] to-[#1d64d8] text-lg text-white shadow-sm">J</span>}
            <span className="text-[17px]">JcHub <small className={`mt-0.5 block text-[9px] font-bold uppercase tracking-[0.2em] ${isCmPage?'text-slate-400':'text-slate-400'}`}>{isCmPage?'Espace CM':'Administration'}</small></span>
          </Link>
          <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden" onClick={() => setOpen(false)} aria-label="Fermer le menu"><X className="h-5 w-5" /></button>
        </div>
        <div className={`mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] ${isCmPage?'text-slate-500':'text-slate-400'}`}>Espace de travail</div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {(isCmPage ? cmNavigation : navigation).map(({ href, label, icon: Icon }) => {
            const active = isCmPage ? cmTab === href.split('#')[1] : pathname === href || (href !== '/admin' && pathname?.startsWith(`${href}/`));
            const className = `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${isCmPage ? active ? 'bg-[#1e3766] text-[#4387ff]' : 'text-slate-300 hover:bg-slate-800 hover:text-white' : active ? 'bg-[#eaf0ff] text-[#2859c5]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`;
            if (isCmPage) return <a key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined} className={className}><Icon className="h-[17px] w-[17px]" />{label}</a>;
            return <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined} className={className}><Icon className="h-[17px] w-[17px]" />{label}</Link>;
          })}
        </nav>
        <div className={`mt-5 shrink-0 rounded-2xl p-3 ${isCmPage?'border border-slate-700 bg-[#172233]':'bg-[#f7f8fc]'}`}>
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#d9e5ff] to-[#9bb8ff] text-sm font-black text-[#2859c5]">{isCmPage?'C':'A'}</span><span className="min-w-0"><strong className={`block truncate text-xs ${isCmPage?'text-white':'text-slate-800'}`}>{isCmPage?'Community Manager':'Admin JcHub'}</strong><small className="text-[10px] text-slate-400">{isCmPage?'Espace CM':'Compte administrateur'}</small></span></div>
        </div>
        <div className={`mt-3 shrink-0 space-y-1 border-t pt-3 ${isCmPage?'border-slate-800':'border-slate-100'}`}>
          {!isCmPage&&<a href={publicSiteUrl} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"><Home className="h-4 w-4" />Voir le site<ExternalLink className="ml-auto h-3.5 w-3.5" /></a>}
          <button onClick={leaveAdmin} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold ${isCmPage?'text-slate-300 hover:bg-slate-800 hover:text-white':'text-slate-500 hover:bg-red-50 hover:text-red-600'}`}><LogOut className="h-4 w-4" />Déconnexion</button>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} aria-label="Fermer le menu" />}
      <div className="min-w-0 flex-1 md:ml-[248px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-slate-100 bg-white/95 px-4 backdrop-blur-xl md:px-8">
          <button className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 md:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir le menu"><Menu className="h-5 w-5" /></button>
          <div className="relative hidden max-w-[430px] flex-1 sm:block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label={isCmPage?'Rechercher un article ou un outil':'Rechercher dans l’administration'} placeholder={isCmPage?'Rechercher un article, un outil...':'Rechercher quelque chose…'} className="h-10 w-full rounded-full border border-slate-100 bg-[#f7f8fb] pl-10 pr-4 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-200 focus:bg-white" /></div>
          {!isCmPage&&<div className="ml-auto hidden items-center gap-5 text-[11px] font-semibold text-slate-500 lg:flex"><a href="/admin/cm#kits" className="hover:text-blue-700">Social</a><a href="/blog" target="_blank" rel="noreferrer" className="hover:text-blue-700">Blog</a><a href="/contact" target="_blank" rel="noreferrer" className="hover:text-blue-700">Contact</a></div>}
          {!isCmPage&&<Link href="/admin/inbox" aria-label="Ouvrir les messages" className="relative ml-auto grid h-9 w-9 place-items-center rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-700 lg:ml-2"><Bell className="h-4 w-4" /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-500 ring-2 ring-white" /></Link>}
          <span className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#2457c5] text-[11px] font-bold text-white">{isCmPage?'C':'A'}</span><span className="hidden text-xs font-bold text-slate-700 sm:block">{isCmPage?'CM':'Admin'}</span>{!isCmPage&&<ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block"/>}</span>
        </header>
        <main className="min-w-0 p-3 sm:p-4 md:p-7 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
