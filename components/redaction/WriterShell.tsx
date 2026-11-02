'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { BookOpen, CalendarDays, ChartNoAxesCombined, ChevronDown, ExternalLink, FileText, Home, Info, LogOut, Menu, PlusCircle, X } from 'lucide-react';
import { signOut } from '@/lib/firebase-auth';
import { prefetchPage } from '@/lib/admin-cache';

const navigation = [
  { href: '/admin/redaction', label: 'Tableau de bord', icon: Home },
  { href: '/admin/redaction/articles', label: 'Mes articles', icon: FileText },
  { href: '/admin/redaction/nouveau', label: 'Créer un article', icon: PlusCircle },
  { href: '/admin/redaction/calendrier', label: 'Calendrier éditorial', icon: CalendarDays },
  { href: '/admin/redaction/performances', label: 'Performances', icon: ChartNoAxesCombined },
  { href: '/admin/redaction/ressources', label: 'Ressources', icon: BookOpen },
];

export const publicSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').replace(/\/$/, '');

/** Writers are signed out after this long without touching the page; reading and thinking count, so longer than the admin's 10 minutes. */
const WRITER_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const WRITER_LAST_ACTIVITY_KEY = 'jchub_writer_last_activity';
/** Sent before signing out for inactivity: the editor keeps the text being written (ArticleEditor). */
export const WRITER_TIMEOUT_EVENT = 'jchub:writer-timeout';
export type WriterTimeoutEvent = CustomEvent<{ waitUntil: (task: Promise<unknown>) => void }>;

type WriterIdentity = { name: string; firstName: string; initials: string };
const WriterContext = createContext<WriterIdentity>({ name: '', firstName: '', initials: '' });

/** Name of the signed-in writer, as signed on their articles. */
export const useWriter = () => useContext(WriterContext);

export function WriterShell({ name, children }: { name: string; children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const words = name.split(/\s+/).filter(Boolean);
  const identity = { name, firstName: words[0] || name, initials: words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join('') || 'J' };

  useEffect(() => { setOpen(false); setMenuOpen(false); }, [pathname]);

  // Signs the writer out after WRITER_IDLE_TIMEOUT_MS without activity, in every tab of the space.
  useEffect(() => {
    let lastActivity = Number(sessionStorage.getItem(WRITER_LAST_ACTIVITY_KEY)) || Date.now();
    let timer: number;
    let expired = false;

    const expire = async () => {
      if (expired) return;
      expired = true;
      sessionStorage.removeItem(WRITER_LAST_ACTIVITY_KEY);
      const tasks: Promise<unknown>[] = [];
      window.dispatchEvent(new CustomEvent(WRITER_TIMEOUT_EVENT, { detail: { waitUntil: (task: Promise<unknown>) => tasks.push(task) } }));
      // The text being written is saved first, for 8 seconds at most.
      await Promise.race([Promise.allSettled(tasks), new Promise((resolve) => setTimeout(resolve, 8000))]);
      await Promise.allSettled([signOut(), fetch('/api/admin/session', { method: 'DELETE' })]);
      window.location.replace('/admin/login?reason=timeout');
    };
    const check = () => {
      const remaining = WRITER_IDLE_TIMEOUT_MS - (Date.now() - lastActivity);
      if (remaining <= 0) { void expire(); return; }
      window.clearTimeout(timer);
      timer = window.setTimeout(check, remaining);
    };
    const record = () => {
      if (Date.now() - lastActivity >= WRITER_IDLE_TIMEOUT_MS) { void expire(); return; }
      lastActivity = Date.now();
      sessionStorage.setItem(WRITER_LAST_ACTIVITY_KEY, String(lastActivity));
      check();
    };

    sessionStorage.setItem(WRITER_LAST_ACTIVITY_KEY, String(lastActivity));
    check();
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((name) => window.addEventListener(name, record, { passive: true }));
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    return () => {
      window.clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, record));
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKey); };
  }, [open]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('pointerdown', onPointer); window.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  const leave = async () => {
    await Promise.allSettled([signOut(), fetch('/api/admin/session', { method: 'DELETE' })]);
    // A full reload drops every state kept in memory after signing out.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/admin/login');
  };

  const isActive = (href: string) => href === '/admin/redaction' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return <WriterContext.Provider value={identity}>
    <div className="min-h-screen overflow-x-clip bg-[#f4f7fb] text-slate-800 md:flex">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[256px] max-w-[calc(100vw-1rem)] flex-col bg-[#0f1c3f] text-white transition-transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-6">
          <Link href="/admin/redaction" className="flex items-center gap-3 text-[26px] font-extrabold tracking-tight text-white"><img src="/jchub-icon-192.png" alt="" className="h-10 w-10 rounded-xl" />JcHub</Link>
          <button className="grid h-10 w-10 place-items-center rounded-lg text-slate-300 hover:bg-white/10 md:hidden" onClick={() => setOpen(false)} aria-label="Fermer le menu"><X className="h-5 w-5" /></button>
        </div>
        <nav aria-label="Espace rédaction" className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = isActive(href) || (href === '/admin/redaction/articles' && pathname.startsWith('/admin/redaction/articles/'));
            return <Link key={href} href={href} onPointerEnter={() => prefetchPage(href)} onFocus={() => prefetchPage(href)} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3.5 rounded-lg px-4 py-3 text-[15px] font-medium transition ${active ? 'bg-[#1f6feb] text-white shadow-lg shadow-blue-950/30' : 'text-slate-200 hover:bg-white/10 hover:text-white'}`}><Icon className="h-5 w-5 shrink-0" />{label}</Link>;
          })}
        </nav>
        <div className="shrink-0 px-6 pb-7 pt-4">
          <p className="flex items-center gap-2 text-lg font-extrabold"><img src="/jchub-icon-192.png" alt="" className="h-6 w-6 rounded-md" />JcHub</p>
          <p className="mt-2 text-xs leading-5 text-slate-300">Des outils et des contenus pour mieux utiliser la technologie.</p>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} aria-label="Fermer le menu" />}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col md:ml-[256px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/95 px-3 backdrop-blur-xl sm:px-5 md:h-[76px] md:px-8">
          <button className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 md:hidden" onClick={() => setOpen(true)} aria-label="Ouvrir le menu"><Menu className="h-5 w-5" /></button>
          <Link href="/admin/redaction" className="flex items-center gap-2 text-lg font-extrabold text-[#0f1c3f] md:hidden"><img src="/jchub-icon-192.png" alt="" className="h-8 w-8 rounded-lg" />JcHub</Link>
          <div className="mx-auto hidden items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/70 px-4 py-2 lg:flex">
            <Info className="h-5 w-5 shrink-0 text-blue-600" />
            <p className="text-xs leading-5 text-slate-600"><strong className="block text-[13px] font-semibold text-blue-800">Espace rédaction</strong>Vous pouvez créer, modifier et publier vos articles.</p>
          </div>
          <div ref={menuRef} className="relative ml-auto lg:ml-0">
            <button onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-haspopup="menu" className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 hover:bg-slate-50">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#2563eb] text-sm font-bold text-white">{identity.initials}</span>
              <span className="hidden text-left sm:block"><strong className="block max-w-[160px] truncate text-sm font-semibold text-slate-900">{name}</strong><small className="text-xs text-slate-500">Rédaction</small></span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {menuOpen && <div role="menu" className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
              <a role="menuitem" href={publicSiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"><ExternalLink className="h-4 w-4" />Voir le site</a>
              <button role="menuitem" onClick={() => void leave()} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Déconnexion</button>
            </div>}
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 max-md:[&_input:not([type=checkbox]):not([type=radio])]:text-base max-md:[&_select]:text-base max-md:[&_textarea]:text-base sm:px-6 md:px-10 md:py-9">{children}</main>
        <footer className="px-4 pb-6 text-center text-xs text-slate-500">JcHub — Espace rédaction <span className="mx-2 text-slate-300">|</span><a href={publicSiteUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-blue-700">{publicSiteUrl}</a></footer>
      </div>
    </div>
  </WriterContext.Provider>;
}
