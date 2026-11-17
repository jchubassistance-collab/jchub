'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertCircle, AlertTriangle, Bot, Eye, FileText, Inbox, Mail, RefreshCw, Sparkles, Users, Wrench } from 'lucide-react';
import { AdminFetchError, cachedJson, fetchJson } from '@/lib/admin-cache';
import { percentChange } from '@/lib/dashboard-health';
import type { DashboardData } from '@/lib/admin-dashboard';
import { Change, EditorialTimeline, formatNumber, Gauge, KpiCard, nf, Panel, TrafficHeatmap, type CalendarItem } from '@/components/admin/dashboard/Widgets';
import { WorldMap } from '@/components/admin/dashboard/WorldMap';

type Days = 7 | 28 | 90 | 365;
type Lang = 'all' | 'fr' | 'en';
type Analytics = Extract<DashboardData['analytics'], { configured: true }>;

const PERIOD_LABELS: Record<Days, string> = { 7: '7 derniers jours', 28: '28 derniers jours', 90: '90 derniers jours', 365: '12 derniers mois' };
const STATUS = [
  { key: 'published', label: 'Publiés', color: '#16a34a' },
  { key: 'scheduled', label: 'Programmés', color: '#2563eb' },
  { key: 'draft', label: 'Brouillons', color: '#f59e0b' },
  { key: 'archived', label: 'Archivés', color: '#94a3b8' },
] as const;
const CHANNELS: Record<string, string> = { Direct: 'Accès direct', Referral: 'Sites référents', 'Organic Search': 'Recherche (Google…)', 'Organic Social': 'Réseaux sociaux', 'Paid Search': 'Recherche payante', Email: 'E-mail', Unassigned: 'Non attribué', 'Organic Video': 'Vidéo' };
const CHANNEL_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#9333ea', '#ef4444', '#06b6d4', '#64748b'];
const AGENT_STATUS: Record<string, { label: string; tone: string }> = {
  done: { label: 'Terminé', tone: 'bg-emerald-50 text-emerald-700' },
  failed: { label: 'Échec', tone: 'bg-red-50 text-red-700' },
  'bloqué': { label: 'Bloqué', tone: 'bg-red-50 text-red-700' },
  running: { label: 'En cours', tone: 'bg-blue-50 text-blue-700' },
  writing: { label: 'En cours', tone: 'bg-blue-50 text-blue-700' },
  started: { label: 'En cours', tone: 'bg-blue-50 text-blue-700' },
  'jamais lancé': { label: 'Jamais lancé', tone: 'bg-slate-100 text-slate-600' },
};

const gaDate = (value: string) => new Date(Date.UTC(Number(value.slice(0, 4)), Number(value.slice(4, 6)) - 1, Number(value.slice(6, 8))));
const shortDate = (date: Date) => date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', timeZone: 'UTC' });
const dateTime = (value: string | null) => value ? new Date(value).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const duration = (seconds: number) => `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, '0')} s`;
const tooltipStyle = { fontSize: 11, borderRadius: 10, border: '1px solid #e2e8f0' };

/** Every day of the period, with zero on the days Google Analytics recorded nothing. */
function dailySeries(analytics: Analytics, days: number) {
  const current = new Map(analytics.daily.map((row) => [row.date, row]));
  const previous = new Map(analytics.dailyPrevious.map((row) => [row.date, row]));
  const yesterday = new Date();
  yesterday.setUTCHours(0, 0, 0, 0);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const key = (date: Date) => date.toISOString().slice(0, 10).replace(/-/g, '');
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(yesterday.getTime() - (days - 1 - index) * 86400_000);
    const before = new Date(date.getTime() - days * 86400_000);
    return { label: shortDate(date), visiteurs: current.get(key(date))?.visitors ?? 0, 'période précédente': previous.get(key(before))?.visitors ?? 0 };
  });
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [days, setDays] = useState<Days>(28);
  const [lang, setLang] = useState<Lang>('all');
  const [calendarFilter, setCalendarFilter] = useState<'all' | CalendarItem['type']>('all');
  const [topTab, setTopTab] = useState<'articles' | 'tools'>('articles');
  const url = `/api/admin/dashboard?days=${days}&lang=${lang}`;
  const [data, setData] = useState<DashboardData | null>(() => cachedJson<DashboardData>(url) ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [denied, setDenied] = useState(false);

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchJson<DashboardData>(refresh ? `${url}&refresh=1` : url, 'Impossible de charger le tableau de bord.'));
    } catch (cause) {
      if (cause instanceof AdminFetchError && (cause.status === 401 || cause.status === 403)) { setDenied(true); router.replace('/admin/login'); }
      setError(cause instanceof Error ? cause.message : 'Impossible de charger le tableau de bord.');
    } finally {
      setLoading(false);
    }
  }, [router, url]);

  useEffect(() => { void load(); }, [load]);

  const analytics = data?.analytics.configured ? data.analytics as Analytics : null;
  const daily = useMemo(() => analytics ? dailySeries(analytics, days) : [], [analytics, days]);
  const lastRecorded = useMemo(() => {
    const dates = (analytics?.daily ?? []).filter((row) => row.visitors > 0).map((row) => row.date).sort();
    return dates.length ? gaDate(dates[dates.length - 1]) : null;
  }, [analytics]);
  const analyticsSilent = Boolean(analytics) && (!lastRecorded || Date.now() - lastRecorded.getTime() > 4 * 86400_000);

  if (denied) return <div className="mx-auto grid min-h-[55vh] max-w-lg place-items-center text-center"><div><AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" /><h1 className="text-2xl font-black text-slate-900">Accès refusé</h1><p className="mt-2 text-sm text-slate-500">Reconnecte-toi avec un compte administrateur.</p></div></div>;

  const k = data?.kpis;
  const statusData = STATUS.map((status) => ({ name: status.label, value: data?.content.statusCounts[status.key] ?? 0, color: status.color }));
  const totalContent = statusData.reduce((total, item) => total + item.value, 0);
  const goal = data?.content.monthGoal;
  const goalData = goal ? [
    { name: 'Publiés', value: goal.published, color: '#16a34a' },
    { name: 'Programmés', value: goal.scheduled, color: '#2563eb' },
    { name: 'À prévoir', value: Math.max(0, goal.target - goal.published - goal.scheduled), color: '#e2e8f0' },
  ] : [];
  const months = (analytics?.blogMonthly ?? []).map((row) => ({ mois: new Date(Date.UTC(Number(row.month.slice(0, 4)), Number(row.month.slice(4)) - 1, 1)).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit', timeZone: 'UTC' }), vues: row.views }));
  const channelTotal = (analytics?.channels ?? []).reduce((total, channel) => total + channel.sessions, 0);
  const mobileVisitors = analytics?.devices.filter((device) => device.device !== 'desktop').reduce((total, device) => total + device.visitors, 0) ?? 0;
  const deviceTotal = analytics?.devices.reduce((total, device) => total + device.visitors, 0) ?? 0;
  const top = topTab === 'articles' ? (data?.topArticles ?? []).map((item) => ({ name: item.title, vues: item.views })) : (data?.topTools ?? []).map((item) => ({ name: item.name, vues: item.views }));

  return (
    <main className="mx-auto max-w-[1600px] space-y-4 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Tableau de bord</h1>
          <p className="mt-1 text-sm text-slate-500">Audience, contenus, agents IA et santé de JcHub, comparés à la période précédente.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[11px] font-semibold text-slate-500">Période
            <select value={days} onChange={(event) => setDays(Number(event.target.value) as Days)} className="ml-1.5 h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800">
              {(Object.keys(PERIOD_LABELS) as unknown as Days[]).map((value) => <option key={value} value={value}>{PERIOD_LABELS[value]}</option>)}
            </select>
          </label>
          <label className="text-[11px] font-semibold text-slate-500">Langue
            <select value={lang} onChange={(event) => setLang(event.target.value as Lang)} className="ml-1.5 h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800">
              <option value="all">Toutes</option><option value="fr">Français</option><option value="en">Anglais</option>
            </select>
          </label>
          <button type="button" onClick={() => void load(true)} disabled={loading} className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-3.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Actualiser</button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {analyticsSilent && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Google Analytics n’a enregistré aucune visite {lastRecorded ? `depuis le ${lastRecorded.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' })}` : 'sur cette période'} : il ne compte que les visiteurs qui acceptent les cookies. Le site, lui, a servi {formatNumber(data?.server.humanPages24h)} page(s) à des visiteurs humains ces dernières 24 h.</span>
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-8">
        <KpiCard label="Visiteurs" value={formatNumber(k?.visitors?.value)} icon={<Users className="h-5 w-5" />} tone="bg-blue-50 text-blue-600" footer={<Change value={k?.visitors?.change} />} />
        <KpiCard label="Pages vues" value={formatNumber(k?.pageViews?.value)} icon={<Eye className="h-5 w-5" />} tone="bg-indigo-50 text-indigo-600" footer={<span className="text-[11px] text-slate-400">{formatNumber(data?.server.humanPages24h)} servies en 24 h</span>} />
        <KpiCard label="Articles publiés" value={formatNumber(k?.articles.value)} icon={<FileText className="h-5 w-5" />} tone="bg-emerald-50 text-emerald-600" footer={<span className="text-[11px] text-slate-500">+{formatNumber(k?.articles.period)} sur la période</span>} />
        <KpiCard label="Outils en ligne" value={formatNumber(k?.tools.value)} icon={<Wrench className="h-5 w-5" />} tone="bg-cyan-50 text-cyan-600" footer={<span className="text-[11px] text-slate-500">{formatNumber(k?.tools.upcoming)} à venir</span>} />
        <KpiCard label="Abonnés newsletter" value={formatNumber(k?.newsletter.value)} icon={<Mail className="h-5 w-5" />} tone="bg-violet-50 text-violet-600" footer={<span className="text-[11px] text-slate-500">+{formatNumber(k?.newsletter.period)} sur la période</span>} />
        <KpiCard label="Messages à traiter" value={formatNumber(k?.messages.value)} icon={<Inbox className="h-5 w-5" />} tone="bg-amber-50 text-amber-600" footer={<Link href="/admin/inbox" className="text-[11px] font-semibold text-blue-600 hover:underline">Ouvrir la boîte</Link>} />
        <KpiCard label="Brouillons IA à relire" value={formatNumber(k?.drafts.value)} icon={<Sparkles className="h-5 w-5" />} tone="bg-fuchsia-50 text-fuchsia-600" footer={<span className="text-[11px] text-slate-500">articles et ressources</span>} />
        <KpiCard label="Erreurs du site" value={formatNumber(k?.errors.value)} icon={<AlertTriangle className="h-5 w-5" />} tone="bg-red-50 text-red-600" footer={<span className="text-[11px] text-slate-500">{formatNumber(k?.errors.distinct)} différentes</span>} />
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Panel title="Calendrier éditorial" subtitle="2 semaines passées, 10 semaines à venir" className="xl:col-span-5" action={
          <select value={calendarFilter} onChange={(event) => setCalendarFilter(event.target.value as typeof calendarFilter)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700">
            <option value="all">Tout</option><option value="article">Articles</option><option value="tool">Outils</option><option value="agent">Agents IA</option>
          </select>
        }>
          <EditorialTimeline items={(data?.calendar ?? []) as CalendarItem[]} filter={calendarFilter} />
        </Panel>

        <Panel title="Contenus par statut" subtitle={`${nf.format(totalContent)} articles`} className="xl:col-span-2">
          <div className="relative h-40">
            <ResponsiveContainer><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>{statusData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer>
            <span className="pointer-events-none absolute inset-0 grid place-items-center text-xl font-black text-slate-900">{nf.format(totalContent)}</span>
          </div>
          <ul className="mt-2 space-y-1 text-[11px]">{statusData.map((item) => <li key={item.name} className="flex justify-between"><span className="inline-flex items-center gap-1.5 text-slate-600"><span className="h-2 w-2 rounded-full" style={{ background: item.color }} />{item.name}</span><strong>{item.value}</strong></li>)}</ul>
        </Panel>

        <Panel title="Visiteurs" subtitle={`${PERIOD_LABELS[days]} comparés à la période précédente`} className="xl:col-span-3">
          <div className="h-56">
            <ResponsiveContainer><LineChart data={daily} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}><CartesianGrid stroke="#f1f5f9" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={20} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} /><Line type="monotone" dataKey="visiteurs" stroke="#2563eb" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="période précédente" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1.5} dot={false} /></LineChart></ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Articles par rubrique" subtitle="Publiés et programmés" className="xl:col-span-2">
          <div className="h-56">
            <ResponsiveContainer><BarChart data={(data?.content.byCategory ?? []).slice(0, 8)} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}><XAxis type="number" hide allowDecimals={false} /><YAxis type="category" dataKey="category" width={92} tick={{ fontSize: 10 }} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="published" name="Publiés" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} /><Bar dataKey="scheduled" name="Programmés" stackId="a" fill="#93c5fd" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Panel title="Quand viennent tes visiteurs" subtitle="Pages vues par jour et par tranche horaire (UTC)" className="xl:col-span-3">
          <TrafficHeatmap cells={analytics?.heatmap ?? []} />
        </Panel>

        <Panel title="Objectif du mois" subtitle={goal ? `${goal.target} articles visés (2 par semaine)` : ''} className="xl:col-span-2">
          <div className="relative h-36">
            <ResponsiveContainer><PieChart><Pie data={goalData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={64} startAngle={90} endAngle={-270}>{goalData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer>
            <span className="pointer-events-none absolute inset-0 grid place-items-center text-center"><span className="text-xl font-black text-slate-900">{goal ? goal.published + goal.scheduled : '—'}<span className="text-xs font-semibold text-slate-400">/{goal?.target ?? '—'}</span></span></span>
          </div>
          <ul className="mt-2 space-y-1 text-[11px]">{goalData.map((item) => <li key={item.name} className="flex justify-between"><span className="inline-flex items-center gap-1.5 text-slate-600"><span className="h-2 w-2 rounded-full" style={{ background: item.color }} />{item.name}</span><strong>{item.value}</strong></li>)}</ul>
        </Panel>

        <Panel title="Pages vues du blog" subtitle="12 derniers mois" className="xl:col-span-4">
          <div className="h-56">
            <ResponsiveContainer><AreaChart data={months} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}><defs><linearGradient id="blogViews" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#f1f5f9" vertical={false} /><XAxis dataKey="mois" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} /><Tooltip contentStyle={tooltipStyle} /><Area type="monotone" dataKey="vues" stroke="#2563eb" strokeWidth={2.5} fill="url(#blogViews)" /></AreaChart></ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Sources de trafic" subtitle="Part des visites par canal" className="xl:col-span-3">
          <ul className="space-y-2.5">
            {(analytics?.channels ?? []).map((channel, index) => {
              const share = channelTotal ? Math.round((channel.sessions / channelTotal) * 100) : 0;
              return (
                <li key={channel.channel}>
                  <div className="mb-1 flex justify-between text-[11px]"><span className="text-slate-600">{CHANNELS[channel.channel] ?? channel.channel}</span><span className="font-bold text-slate-900">{share} % <span className="font-normal text-slate-400">({nf.format(channel.sessions)})</span></span></div>
                  <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full" style={{ width: `${share}%`, background: CHANNEL_COLORS[index % CHANNEL_COLORS.length] }} /></div>
                </li>
              );
            })}
            {!analytics?.channels.length && <li className="text-xs text-slate-400">Aucune visite mesurée sur la période.</li>}
          </ul>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Panel title="Santé du site" subtitle="Sur 100, détail des points retirés" className="xl:col-span-3">
          <Gauge value={data?.health.score ?? null} label="Score de santé" color={(data?.health.score ?? 100) >= 80 ? '#16a34a' : (data?.health.score ?? 100) >= 50 ? '#f59e0b' : '#ef4444'} />
          <ul className="mt-2 space-y-1 text-[11px]">
            {data?.health.items.map((item) => <li key={item.label} className="flex justify-between gap-2" title={item.detail}><span className="truncate text-slate-600">{item.label}</span><strong className="shrink-0 text-red-600">−{item.penalty}</strong></li>)}
            {data && !data.health.items.length && <li className="text-emerald-700">Rien à signaler.</li>}
          </ul>
        </Panel>

        <Panel title="Audience" subtitle="Comparée à la période précédente" className="xl:col-span-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Nouveaux visiteurs', value: analytics ? nf.format(analytics.current.newUsers) : '—', change: analytics ? percentChange(analytics.current.newUsers, analytics.previous.newUsers) : null },
              { label: 'Sessions', value: analytics ? nf.format(analytics.current.sessions) : '—', change: analytics ? percentChange(analytics.current.sessions, analytics.previous.sessions) : null },
              { label: 'Durée moyenne', value: analytics ? duration(analytics.current.averageSessionDuration) : '—', change: analytics ? percentChange(analytics.current.averageSessionDuration, analytics.previous.averageSessionDuration) : null },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-50 p-2.5">
                <p className="text-[10px] font-semibold text-slate-500">{item.label}</p>
                <p className="mt-1 text-base font-black text-slate-900">{item.value}</p>
                <Change value={item.change} label="" />
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Gauge value={analytics ? analytics.current.bounceRate : null} label="Taux de rebond" suffix=" %" color={(analytics?.current.bounceRate ?? 0) > 70 ? '#ef4444' : '#f59e0b'} />
            <Gauge value={deviceTotal ? Math.round((mobileVisitors / deviceTotal) * 100) : null} label="Visiteurs sur mobile" suffix=" %" color="#9333ea" />
          </div>
        </Panel>

        <Panel title="Agents IA et ressources" subtitle="Dernière exécution de chaque agent" className="xl:col-span-3">
          <ul className="space-y-2">
            {(data?.agents ?? []).map((agent) => {
              const state = AGENT_STATUS[agent.status] ?? { label: agent.status, tone: 'bg-slate-100 text-slate-600' };
              return (
                <li key={agent.name} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-violet-600"><Bot className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><strong className="block truncate text-xs text-slate-800">{agent.name}</strong><small className="text-[10px] text-slate-500">{dateTime(agent.lastRun)} · {agent.toReview} à relire</small></span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${state.tone}`}>{state.label}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[['Ressources', data?.resources.total], ['Demandes de modèles', data?.resources.requests], ['Téléchargements', data?.resources.downloads]].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-slate-100 p-2"><p className="text-base font-black text-slate-900">{formatNumber(value as number | undefined)}</p><p className="text-[10px] text-slate-500">{label}</p></div>
            ))}
          </div>
        </Panel>

        <Panel title="Top 5" subtitle="Les plus consultés sur la période" className="xl:col-span-3" action={
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-[11px] font-semibold">
            {(['articles', 'tools'] as const).map((tab) => <button key={tab} type="button" onClick={() => setTopTab(tab)} className={`rounded-md px-2 py-1 ${topTab === tab ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>{tab === 'articles' ? 'Articles' : 'Outils'}</button>)}
          </div>
        }>
          <ol className="space-y-2.5">
            {top.map((item, index) => {
              const max = Math.max(1, ...top.map((entry) => entry.vues));
              return (
                <li key={item.name}>
                  <div className="mb-1 flex justify-between gap-2 text-[11px]"><span className="truncate text-slate-700" title={item.name}>{index + 1}. {item.name}</span><strong className="shrink-0">{nf.format(item.vues)}</strong></div>
                  <div className="h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${(item.vues / max) * 100}%` }} /></div>
                </li>
              );
            })}
            {!top.length && <li className="text-xs text-slate-400">Aucune donnée.</li>}
          </ol>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Panel title="Visiteurs par pays" subtitle={PERIOD_LABELS[days]} className="xl:col-span-4">
          <WorldMap countries={analytics?.countries ?? []} />
        </Panel>

        <Panel title="Activité récente" subtitle="Actions admin et tâches planifiées, 24 h" className="xl:col-span-3" action={<Link href="/admin/reports" className="text-[11px] font-semibold text-blue-600 hover:underline">Rapports</Link>}>
          <ul className="divide-y divide-slate-100 text-[11px]">
            {(data?.activity ?? []).map((item, index) => (
              <li key={`${item.at}-${index}`} className="flex items-center justify-between gap-2 py-1.5">
                <span className="min-w-0"><span className="block truncate text-slate-700">{item.intent}</span><span className="text-[10px] text-slate-400">{item.user || (item.kind === 'admin' ? 'Admin' : '')}</span></span>
                <span className="shrink-0 text-[10px] text-slate-400">{new Date(item.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </li>
            ))}
            {data && !data.activity.length && <li className="py-2 text-slate-400">Rien ces dernières 24 h.</li>}
          </ul>
        </Panel>

        <Panel title="Rédacteurs" subtitle="Articles par auteur" className="xl:col-span-2">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-3 text-[11px]">
            <span className="pb-1 text-[10px] font-semibold text-slate-400">Auteur</span><span className="pb-1 text-right text-[10px] font-semibold text-slate-400">Publiés</span><span className="pb-1 text-right text-[10px] font-semibold text-slate-400">Prévus</span>
            {(data?.content.byAuthor ?? []).map((author) => (
              <div key={author.author} className="contents">
                <span className="truncate border-t border-slate-100 py-1.5 text-slate-700" title={author.author}>{author.author}</span>
                <span className="border-t border-slate-100 py-1.5 text-right font-bold text-slate-900">{author.published}</span>
                <span className="border-t border-slate-100 py-1.5 text-right text-slate-500">{author.scheduled}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Erreurs principales" subtitle="Les plus fréquentes sur la période" className="xl:col-span-3" action={<Link href="/admin/reports" className="text-[11px] font-semibold text-blue-600 hover:underline">Détails</Link>}>
          <ul className="space-y-1.5 text-[11px]">
            {(data?.errors ?? []).map((item) => (
              <li key={item.message} className="flex items-start justify-between gap-2 rounded-lg bg-red-50/60 px-2 py-1.5">
                <span className="line-clamp-2 text-slate-700" title={item.message}>{item.message}</span>
                <span className="shrink-0 rounded-full bg-red-100 px-1.5 text-[10px] font-bold text-red-700">×{item.count}</span>
              </li>
            ))}
            {data && !data.errors.length && <li className="text-emerald-700">Aucune erreur sur la période.</li>}
          </ul>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Panel title="Messages à traiter" subtitle={`${formatNumber(data?.kpis.messages.value)} en attente`} className="xl:col-span-6" action={<Link href="/admin/inbox" className="text-[11px] font-semibold text-blue-600 hover:underline">Ouvrir</Link>}>
          <ul className="divide-y divide-slate-100 text-[11px]">
            {(data?.messages ?? []).map((message) => <li key={message.id} className="flex justify-between gap-2 py-1.5"><span className="min-w-0 truncate"><strong className="text-slate-800">{message.name}</strong> <span className="text-slate-500">· {message.subject || 'Sans sujet'}</span></span><span className="shrink-0 text-[10px] text-slate-400">{dateTime(message.createdAt)}</span></li>)}
            {data && !data.messages.length && <li className="py-2 text-emerald-700">Boîte à jour.</li>}
          </ul>
        </Panel>
        <Panel title="Derniers commentaires" subtitle={data ? `${data.comments.period} sur la période` : ''} className="xl:col-span-6" action={<Change value={data ? percentChange(data.comments.period, data.comments.previous) : null} />}>
          <ul className="divide-y divide-slate-100 text-[11px]">
            {(data?.comments.latest ?? []).map((comment, index) => <li key={`${comment.createdAt}-${index}`} className="flex justify-between gap-2 py-1.5"><span className="min-w-0 truncate"><strong className="text-slate-800">{comment.name}</strong> <span className="text-slate-500">· {comment.article}</span></span><span className="shrink-0 text-[10px] text-slate-400">{dateTime(comment.createdAt)}</span></li>)}
            {data && !data.comments.latest.length && <li className="py-2 text-slate-400">Aucun commentaire.</li>}
          </ul>
        </Panel>
      </section>

      {data && <p className="text-right text-[10px] text-slate-400">Mis à jour {dateTime(data.generatedAt)} · données en cache 2 minutes, « Actualiser » les recharge.</p>}
    </main>
  );
}
