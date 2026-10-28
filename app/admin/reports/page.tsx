'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Activity, AlertTriangle, Bot, Globe2, Pause, Play, RefreshCw, Search } from 'lucide-react';
import { AdminPagination, useAdminPageSize, usePageParam } from '@/components/ui/Pagination';
import { cachedJson, fetchJson } from '@/lib/admin-cache';
import { countryName, type ErrorReport, type RequestKind, type RequestReport, type RequestStats } from '@/lib/reports/core';
import { KIND_LABELS, place, shortTime, StatusBadge } from './report-ui';

type Tab = 'requests' | 'errors';
type ListResponse<T> = { items: T[]; total: number; page: number; countries: string[]; truncated: boolean; generatedAt: number; stats?: RequestStats };
type Loaded = { key: string; tab: Tab; requests?: ListResponse<RequestReport>; errors?: ListResponse<ErrorReport> };

const REFRESH_MS = 15_000;
const PERIODS: Record<Tab, [string, string][]> = {
  requests: [['1h', '1 heure'], ['24h', '24 heures'], ['7d', '7 jours'], ['30d', '30 jours']],
  errors: [['24h', '24 heures'], ['7d', '7 jours'], ['30d', '30 jours'], ['90d', '90 jours']],
};
const KINDS: [RequestKind | '', string][] = [['', 'Tous les types'], ['page', 'Pages'], ['api', 'API'], ['admin', 'Admin'], ['cron', 'Tâches planifiées'], ['auth', 'Connexions']];
const STATUSES: [string, string][] = [['', 'Tous les statuts'], ['errors', 'Avec erreur'], ['ok', 'Réussies (2xx)'], ['redirect', 'Redirections (3xx)'], ['client', 'Refusées (4xx)'], ['server', 'Échecs (5xx)'], ['unknown', 'Statut inconnu']];
const control = 'h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

function ago(time: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - time) / 1000));
  return seconds < 60 ? `il y a ${seconds} s` : `il y a ${Math.round(seconds / 60)} min`;
}

export default function ReportsPage() {
  return <Suspense fallback={null}><Reports /></Suspense>;
}

function Reports() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => (searchParams?.get('tab') === 'errors' ? 'errors' : 'requests'));
  const [page, setPage] = usePageParam();
  const [pageSize, setPageSize] = useAdminPageSize();
  const [period, setPeriod] = useState(tab === 'errors' ? '7d' : '24h');
  const [kind, setKind] = useState('');
  const [status, setStatus] = useState('');
  const [bots, setBots] = useState('');
  const [country, setCountry] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [live, setLive] = useState(true);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const controller = useRef<AbortController | null>(null);

  const params = new URLSearchParams({ tab, period, page: String(page), pageSize: String(pageSize) });
  if (kind) params.set('kind', kind);
  if (country) params.set('country', country);
  if (search) params.set('q', search);
  if (tab === 'requests' && status) params.set('status', status);
  if (tab === 'requests' && bots) params.set('bots', bots);
  const key = params.toString();

  const load = useCallback(async () => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    const url = `/api/admin/reports?${key}`;
    type Answer = ListResponse<RequestReport & ErrorReport> & { tab?: Tab };
    const toLoaded = (result: Answer): Loaded => result.tab === 'errors' ? { key, tab: 'errors', errors: result } : { key, tab: 'requests', requests: result };
    // Filters seen before in this tab show their last answer while the new one comes.
    const seen = cachedJson<Answer>(url);
    if (seen) setLoaded((previous) => previous?.key === key ? previous : toLoaded(seen));
    try {
      const result = await fetchJson<Answer>(url, 'Les rapports sont indisponibles.', current.signal);
      setLoaded(toLoaded(result));
      setError('');
      setNow(Date.now());
    } catch (cause) {
      if (!current.signal.aborted) setError(cause instanceof Error ? cause.message : 'Les rapports sont indisponibles.');
    }
  }, [key]);

  useEffect(() => { void load(); }, [load]);

  // Live view: a refresh every 15 s while the tab is visible, and one as soon as it comes back.
  useEffect(() => {
    if (!live) return;
    const refresh = () => { if (document.visibilityState === 'visible') void load(); };
    const timer = window.setInterval(refresh, REFRESH_MS);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [live, load]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput.trim() === search) return;
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput, search, setPage]);

  const chooseTab = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    setPage(1);
    if (!PERIODS[next].some(([value]) => value === period)) setPeriod(next === 'errors' ? '7d' : '24h');
    const url = new URL(window.location.href);
    if (next === 'errors') url.searchParams.set('tab', 'errors'); else url.searchParams.delete('tab');
    url.searchParams.delete('page');
    window.history.replaceState(null, '', url);
  };
  const change = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(1); };

  const current = loaded?.tab === tab ? loaded[tab] : undefined;
  const loading = !loaded || loaded.key !== key;
  const countries = current?.countries || [];
  const stats = loaded?.tab === 'requests' ? loaded.requests?.stats : undefined;

  return <main className="mx-auto w-full max-w-[1500px] min-w-0 space-y-4 pb-10">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">Surveillance du site</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Rapports</h1>
        <p className="mt-1 text-sm text-slate-500">Chaque requête reçue, ce qu’elle voulait faire, son résultat et les erreurs rencontrées.</p>
      </div>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <span className="flex min-w-0 flex-1 items-center gap-2 text-xs font-semibold text-slate-500 sm:flex-none" aria-live="polite">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${live ? 'animate-pulse bg-emerald-500' : 'bg-slate-300'}`} />
          <span className="truncate">{live ? 'En direct' : 'En pause'}{current ? ` · mis à jour ${ago(current.generatedAt, now)}` : ''}</span>
        </span>
        <button type="button" onClick={() => setLive((value) => !value)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-300" aria-pressed={live}>
          {live ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}<span className="hidden sm:inline">{live ? 'Pause' : 'Reprendre'}</span>
        </button>
        <button type="button" onClick={() => void load()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700" aria-label="Actualiser">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Actualiser</span>
        </button>
      </div>
    </header>

    <nav className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:inline-grid sm:w-auto" aria-label="Type de rapport">
      {([['requests', 'Requêtes', <Activity key="r" className="h-4 w-4" />], ['errors', 'Erreurs', <AlertTriangle key="e" className="h-4 w-4" />]] as [Tab, string, React.ReactNode][]).map(([value, label, icon]) => (
        <button key={value} type="button" onClick={() => chooseTab(value)} aria-current={tab === value ? 'page' : undefined} className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold ${tab === value ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{icon}{label}</button>
      ))}
    </nav>

    {stats && <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Requêtes" value={stats.total} />
      <Stat label="Avec erreur" value={stats.errors} tone={stats.errors ? 'text-red-600' : undefined} />
      <Stat label="Robots" value={stats.bots} />
      <article className="col-span-2 min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Globe2 className="h-3.5 w-3.5" />Pays principaux</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {stats.countries.length ? stats.countries.map((item) => <button key={item.code} type="button" onClick={() => change(setCountry)(country === item.code ? '' : item.code)} className={`inline-flex min-h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold ${country === item.code ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{countryName(item.code)} <b className="tabular-nums">{item.count}</b></button>) : <span className="text-xs text-slate-400">Aucun pays connu</span>}
        </div>
      </article>
    </section>}

    <section className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-3 xl:grid-cols-6" aria-label="Filtres">
      <label className="relative col-span-2 md:col-span-3 xl:col-span-2">
        <span className="sr-only">Rechercher</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={tab === 'errors' ? 'Message, chemin, IP…' : 'Chemin, IP, intention…'} className={`${control} pl-9`} />
      </label>
      <Select label="Période" value={period} onChange={change(setPeriod)} options={PERIODS[tab]} />
      <Select label="Type" value={kind} onChange={change(setKind)} options={KINDS} />
      {tab === 'requests' && <Select label="Statut" value={status} onChange={change(setStatus)} options={STATUSES} />}
      {tab === 'requests' && <Select label="Visiteurs" value={bots} onChange={change(setBots)} options={[['', 'Humains et robots'], ['humans', 'Humains'], ['bots', 'Robots']]} />}
      <Select label="Pays" value={country} onChange={change(setCountry)} options={[['', 'Tous les pays'], ...countries.map((code) => [code, countryName(code)] as [string, string]), ...(country && !countries.includes(country) ? [[country, countryName(country)] as [string, string]] : [])]} />
    </section>

    {error && <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700" role="alert">{error}</p>}
    {current?.truncated && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Période très chargée : seules les entrées les plus récentes de chaque jour sont lues. Réduis la période pour tout voir.</p>}

    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
      {current && (tab === 'requests'
        ? <RequestList items={(current as ListResponse<RequestReport>).items} now={now} />
        : <ErrorList items={(current as ListResponse<ErrorReport>).items} now={now} />)}
      {current && <div className="[&_button]:min-h-10 [&_button]:min-w-10 [&_select]:h-10">
        <AdminPagination page={current.page} pageSize={pageSize} total={current.total} noun={tab === 'errors' ? 'erreurs' : 'requêtes'} empty={tab === 'errors' ? 'Aucune erreur sur cette période.' : 'Aucune requête ne correspond.'} onPage={setPage} onPageSize={setPageSize} />
      </div>}
    </section>
  </main>;
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold text-slate-500">{label}</p>
    <p className={`mt-1 text-2xl font-black tabular-nums ${tone || 'text-slate-900'}`}>{value.toLocaleString('fr-FR')}</p>
  </article>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label className="min-w-0"><span className="sr-only">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className={control} aria-label={label}>
      {options.map(([optionValue, optionLabel]) => <option key={optionValue || 'all'} value={optionValue}>{optionLabel}</option>)}
    </select>
  </label>;
}

function RequestList({ items, now }: { items: RequestReport[]; now: number }) {
  if (!items.length) return null;
  return <>
    <ul className="divide-y divide-slate-100 md:hidden">
      {items.map((item) => <li key={item.id}>
        <Link href={`/admin/reports/${item.id}`} className="block min-w-0 p-4 active:bg-slate-50">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <StatusBadge status={item.status} failed={item.errorIds.length > 0} />
            <span className="rounded-full bg-slate-100 px-2 py-1">{KIND_LABELS[item.kind]}</span>
            {item.bot && <Bot className="h-4 w-4 text-slate-400" aria-label="Robot" />}
            {item.errorIds.length > 0 && <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">{item.errorIds.length} erreur{item.errorIds.length > 1 ? 's' : ''}</span>}
            <span className="ml-auto shrink-0 tabular-nums">{shortTime(item.at, now)}</span>
          </span>
          <span className="mt-2 block text-sm font-bold leading-snug text-slate-900 [overflow-wrap:anywhere]">{item.intent}</span>
          <span className="mt-1 block truncate font-mono text-xs text-slate-500">{item.method} {item.path}{item.query ? `?${item.query}` : ''}</span>
          {item.result && <span className="mt-1 block text-xs text-slate-600 [overflow-wrap:anywhere]">{item.result}{item.durationMs !== null ? ` · ${item.durationMs} ms` : ''}</span>}
          <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500"><span>{place(item)}</span><span className="font-mono">{item.ip || 'IP inconnue'}</span><span>{item.device}</span></span>
        </Link>
      </li>)}
    </ul>
    <table className="hidden w-full table-fixed text-left text-xs md:table">
      <thead><tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
        <th className="w-24 px-4 py-3">Heure</th><th className="px-3 py-3">Intention et chemin</th><th className="w-[22%] px-3 py-3">Résultat</th><th className="w-[18%] px-3 py-3">Visiteur</th><th className="w-[13%] px-3 py-3">Appareil</th>
      </tr></thead>
      <tbody>{items.map((item) => <tr key={item.id} className="border-t border-slate-100 align-top hover:bg-blue-50/40">
        <td className="px-4 py-3 tabular-nums text-slate-500">{shortTime(item.at, now)}</td>
        <td className="min-w-0 px-3 py-3">
          <Link href={`/admin/reports/${item.id}`} className="block font-bold text-slate-900 hover:text-blue-700">{item.intent}</Link>
          <span className="mt-0.5 block truncate font-mono text-[11px] text-slate-500" title={`${item.path}${item.query ? `?${item.query}` : ''}`}>{item.method} {item.path}{item.query ? `?${item.query}` : ''}</span>
        </td>
        <td className="px-3 py-3"><span className="flex flex-wrap items-center gap-1.5"><StatusBadge status={item.status} failed={item.errorIds.length > 0} />{item.durationMs !== null && <span className="tabular-nums text-slate-500">{item.durationMs} ms</span>}{item.errorIds.length > 0 && <span className="rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-700">{item.errorIds.length} erreur{item.errorIds.length > 1 ? 's' : ''}</span>}</span>{item.result && <span className="mt-1 block text-slate-600 [overflow-wrap:anywhere]">{item.result}</span>}</td>
        <td className="px-3 py-3 text-slate-600"><span className="block truncate">{place(item)}</span><span className="block truncate font-mono text-[11px] text-slate-500">{item.ip || 'IP inconnue'}</span></td>
        <td className="px-3 py-3 text-slate-600"><span className="flex items-center gap-1">{item.bot && <Bot className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-label="Robot" />}<span className="truncate">{item.device}</span></span><span className="text-[11px] text-slate-400">{KIND_LABELS[item.kind]}{item.user ? ` · ${item.user}` : ''}</span></td>
      </tr>)}</tbody>
    </table>
  </>;
}

function ErrorList({ items, now }: { items: ErrorReport[]; now: number }) {
  if (!items.length) return null;
  return <>
    <ul className="divide-y divide-slate-100 md:hidden">
      {items.map((item) => <li key={item.id}>
        <Link href={`/admin/reports/${item.id}`} className="block min-w-0 p-4 active:bg-slate-50">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <StatusBadge status={item.status} failed />
            <span className="truncate">{item.name || 'Erreur'}{item.code ? ` · ${item.code}` : ''}</span>
            <span className="ml-auto shrink-0 tabular-nums">{shortTime(item.at, now)}</span>
          </span>
          <span className="mt-2 block text-sm font-bold leading-snug text-red-700 [overflow-wrap:anywhere]">{item.message}</span>
          <span className="mt-1 block text-xs text-slate-700 [overflow-wrap:anywhere]">{item.intent || 'Action inconnue'}</span>
          <span className="mt-1 block truncate font-mono text-xs text-slate-500">{item.method} {item.path || item.route || 'route inconnue'}</span>
          <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500"><span>{place(item)}</span><span className="font-mono">{item.ip || 'IP inconnue'}</span>{item.occurrence ? <span>occurrence n° {item.occurrence}</span> : null}</span>
        </Link>
      </li>)}
    </ul>
    <table className="hidden w-full table-fixed text-left text-xs md:table">
      <thead><tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
        <th className="w-24 px-4 py-3">Heure</th><th className="px-3 py-3">Erreur</th><th className="w-[26%] px-3 py-3">Où</th><th className="w-[18%] px-3 py-3">Visiteur</th><th className="w-20 px-3 py-3 text-right">Occur.</th>
      </tr></thead>
      <tbody>{items.map((item) => <tr key={item.id} className="border-t border-slate-100 align-top hover:bg-red-50/40">
        <td className="px-4 py-3 tabular-nums text-slate-500">{shortTime(item.at, now)}</td>
        <td className="min-w-0 px-3 py-3"><Link href={`/admin/reports/${item.id}`} className="block font-bold text-red-700 [overflow-wrap:anywhere] hover:underline">{item.message}</Link><span className="mt-0.5 block text-[11px] text-slate-500">{item.name || 'Erreur'}{item.code ? ` · ${item.code}` : ''}{item.status ? ` · ${item.status}` : ''} · {item.source || 'gérée'}{item.env ? ` · ${item.env}` : ''}</span></td>
        <td className="px-3 py-3"><span className="block text-slate-700 [overflow-wrap:anywhere]">{item.intent || 'Action inconnue'}</span><span className="block truncate font-mono text-[11px] text-slate-500">{item.method} {item.path || item.route || 'route inconnue'}</span></td>
        <td className="px-3 py-3 text-slate-600"><span className="block truncate">{place(item)}</span><span className="block truncate font-mono text-[11px] text-slate-500">{item.ip || 'IP inconnue'}</span></td>
        <td className="px-3 py-3 text-right tabular-nums font-bold text-slate-700">{item.occurrence ?? '—'}</td>
      </tr>)}</tbody>
    </table>
  </>;
}
