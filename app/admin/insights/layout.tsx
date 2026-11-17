'use client';

import { Suspense, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Activity, BarChart3, Bell, FileDown, FileText, Gauge, Globe2, History, Radio, Search, Target, Wrench } from 'lucide-react';
import { PERIOD_LABELS, PERIODS, usePeriod } from '@/components/admin/insights/InsightsUI';

/** The sections of the Control Center. */
const SECTIONS = [
  { href: '/admin/insights', label: 'Vue d’ensemble', icon: BarChart3, ready: true },
  { href: '/admin/insights/trafic', label: 'Trafic & audience', icon: Globe2, ready: true },
  { href: '/admin/insights/outils', label: 'Outils', icon: Wrench, ready: true },
  { href: '/admin/insights/blog', label: 'Blog', icon: FileText, ready: true },
  { href: '/admin/insights/seo', label: 'SEO', icon: Search, ready: true },
  { href: '/admin/insights/performance', label: 'Performance', icon: Gauge, ready: true },
  { href: '/admin/insights/conversions', label: 'Conversions', icon: Target, ready: true },
  { href: '/admin/insights/live', label: 'Temps réel', icon: Radio, ready: true },
  { href: '/admin/insights/alertes', label: 'Alertes & logs', icon: Bell, ready: true },
  { href: '/admin/insights/rapports', label: 'Rapports', icon: FileDown, ready: true },
  { href: '/admin/insights/historique', label: 'Historique', icon: History, ready: true },
];

function Header() {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const params = useSearchParams();
  const days = usePeriod();
  const setDays = (value: number) => {
    const next = new URLSearchParams(params?.toString());
    next.set('days', String(value));
    router.replace(`${pathname}?${next.toString()}`);
  };
  const query = `?days=${days}`;
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.16em] text-blue-600"><Activity className="h-3.5 w-3.5" />Control Center</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{SECTIONS.find((section) => section.href === pathname)?.label ?? 'Control Center'}</h1>
        </div>
        <div className={`${pathname === '/admin/insights/historique' ? 'hidden' : 'inline-flex'} rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold shadow-sm`} role="group" aria-label="Période">
          {PERIODS.map((value) => (
            <button key={value} type="button" onClick={() => setDays(value)} aria-pressed={days === value} className={`rounded-lg px-3 py-1.5 ${days === value ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{PERIOD_LABELS[value]}</button>
          ))}
        </div>
      </div>
      <nav aria-label="Sections du Control Center" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {SECTIONS.map(({ href, label, icon: Icon, ready }) => {
          const active = pathname === href;
          const classes = `inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${active ? 'bg-slate-900 text-white' : ready ? 'border border-slate-200 bg-white text-slate-700 hover:border-blue-300' : 'border border-dashed border-slate-200 text-slate-400'}`;
          return ready
            ? <Link key={href} href={`${href}${query}`} aria-current={active ? 'page' : undefined} className={classes}><Icon className="h-3.5 w-3.5" />{label}</Link>
            : <span key={href} title="Lot suivant" className={classes}><Icon className="h-3.5 w-3.5" />{label}<span className="rounded bg-slate-100 px-1 text-[9px] font-semibold uppercase">bientôt</span></span>;
        })}
      </nav>
    </header>
  );
}

export default function InsightsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-[1600px] space-y-4 pb-10">
      <Suspense><Header /></Suspense>
      <Suspense>{children}</Suspense>
    </main>
  );
}
