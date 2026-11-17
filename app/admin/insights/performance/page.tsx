'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Gauge, nf, Panel } from '@/components/admin/dashboard/Widgets';
import { DataBanner, OhlcChart, tooltipStyle, useInsights, type CollectionInfo } from '@/components/admin/insights/InsightsUI';

type Metric = { p75: number | null; samples: number } | null;
type Performance = {
  configured: boolean;
  info?: CollectionInfo;
  vitals: { overall: Record<string, Metric>; pages: { path: string; samples: number; LCP: Metric; INP: Metric; CLS: Metric }[] };
  candles: { time: number; min: number; p50: number; p95: number; max: number; calls: number }[];
  daily: { day: string; client: number; server: number; errors: number }[];
  routes: { route: string; calls: number; errors: number; p50: number | null; p95: number | null }[];
  availability: number | null;
  calls: number;
};

/** Google's thresholds (75th percentile): good below the first value, poor above the second. */
const THRESHOLDS: Record<string, { good: number; poor: number; unit: 'ms' | '' ; label: string; max: number }> = {
  LCP: { good: 2500, poor: 4000, unit: 'ms', label: 'Affichage du contenu principal', max: 6000 },
  INP: { good: 200, poor: 500, unit: 'ms', label: 'Réactivité aux clics', max: 800 },
  CLS: { good: 0.1, poor: 0.25, unit: '', label: 'Stabilité de la mise en page', max: 0.5 },
  FCP: { good: 1800, poor: 3000, unit: 'ms', label: 'Premier affichage', max: 5000 },
  TTFB: { good: 800, poor: 1800, unit: 'ms', label: 'Réponse du serveur', max: 3000 },
};
const color = (name: string, value: number | null | undefined) => {
  if (value === null || value === undefined) return '#cbd5e1';
  const limit = THRESHOLDS[name];
  return value <= limit.good ? '#16a34a' : value <= limit.poor ? '#f59e0b' : '#ef4444';
};
const show = (name: string, value: number | null | undefined) => {
  if (value === null || value === undefined) return '—';
  if (name === 'CLS') return value.toLocaleString('fr-FR', { maximumFractionDigits: 3 });
  return value >= 1000 ? `${(value / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} s` : `${Math.round(value)} ms`;
};
const ms = (value: number | null) => value === null ? '—' : value >= 1000 ? `${(value / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s` : `${value} ms`;

function VitalPill({ name, metric }: { name: string; metric: Metric }) {
  return <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: color(name, metric?.p75) }} />{show(name, metric?.p75)}</span>;
}

export default function InsightsPerformancePage() {
  const { data, error } = useInsights<Performance>('performance');
  // Candle: low = fastest call, open = median, close = 95th percentile, high = slowest call.
  const candles = useMemo(() => (data?.candles ?? []).map((row) => ({ time: row.time, low: row.min, open: row.p50, close: row.p95, high: row.max })), [data]);
  const errors = (data?.daily ?? []).map((row) => ({ jour: new Date(`${row.day}T12:00:00Z`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), '4xx': row.client, '5xx': row.server, 'erreurs du site': row.errors }));
  const overall = data?.vitals.overall ?? {};

  return (
    <div className="space-y-4">
      <DataBanner info={data?.info} configured={data?.configured !== false} />
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {(['LCP', 'INP', 'CLS'] as const).map((name) => {
          const metric = overall[name];
          const limit = THRESHOLDS[name];
          return (
            <div key={name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-1">
              <Gauge value={metric?.p75 === null || metric?.p75 === undefined ? null : name === 'CLS' ? Number(metric.p75.toFixed(3)) : Math.round(metric.p75)} max={limit.max} label={`${name} · ${limit.label}`} color={color(name, metric?.p75)} suffix={name === 'CLS' ? '' : ' ms'} />
              <p className="mt-1 text-center text-[10px] text-slate-400">Bon ≤ {show(name, limit.good)} · {nf.format(metric?.samples ?? 0)} mesure(s)</p>
            </div>
          );
        })}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Gauge value={data?.availability ?? null} label="Disponibilité mesurée" color={(data?.availability ?? 100) >= 99.5 ? '#16a34a' : (data?.availability ?? 100) >= 98 ? '#f59e0b' : '#ef4444'} suffix=" %" />
          <p className="mt-1 text-center text-[10px] text-slate-400">{(data?.calls ?? 0) >= 20 ? `Appels d’API sans erreur 5xx (${nf.format(data?.calls ?? 0)})` : `Pas assez de mesures (${nf.format(data?.calls ?? 0)} appel(s), il en faut 20)`}</p>
        </div>
        {(['FCP', 'TTFB'] as const).map((name) => (
          <div key={name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500">{name} · {THRESHOLDS[name].label}</p>
            <p className="mt-2 text-2xl font-black" style={{ color: color(name, overall[name]?.p75) }}>{show(name, overall[name]?.p75)}</p>
            <p className="text-[10px] text-slate-400">75e centile · {nf.format(overall[name]?.samples ?? 0)} mesure(s)</p>
          </div>
        ))}
      </section>

      <Panel title="Latence des API par heure" subtitle="Une bougie par heure : mèche basse = appel le plus rapide, ouverture = médiane (p50), clôture = 95e centile (p95), mèche haute = appel le plus lent. Une bougie haute signale une heure où certains appels ont traîné. Échelle logarithmique, crons exclus (ils figurent dans le tableau des routes).">
        {candles.length ? <OhlcChart data={candles} logScale format={(value) => (value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${Math.round(value)} ms`)} /> : <p className="py-10 text-center text-xs text-slate-400">Pas encore d’appels mesurés : la latence de toutes les routes est enregistrée depuis ce déploiement.</p>}
      </Panel>

      <section className="grid gap-4 xl:grid-cols-12">
        <Panel title="Erreurs dans le temps" subtitle="Réponses 4xx et 5xx des API, et erreurs enregistrées par le site" className="xl:col-span-7">
          <div className="h-64">
            <ResponsiveContainer><BarChart data={errors} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}><CartesianGrid stroke="#f1f5f9" vertical={false} /><XAxis dataKey="jour" tick={{ fontSize: 10 }} minTickGap={18} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="4xx" stackId="e" fill="#f59e0b" isAnimationActive={false} maxBarSize={28} /><Bar dataKey="5xx" stackId="e" fill="#ef4444" isAnimationActive={false} maxBarSize={28} /><Bar dataKey="erreurs du site" fill="#7c3aed" isAnimationActive={false} maxBarSize={28} /></BarChart></ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Routes les plus lentes" subtitle="95e centile de la durée de réponse" className="xl:col-span-5">
          <table className="w-full text-[11px] text-slate-700">
            <thead><tr className="text-left text-[10px] text-slate-500"><th className="pb-1 font-semibold">Route</th><th className="pb-1 text-right font-semibold">Appels</th><th className="pb-1 text-right font-semibold">p50</th><th className="pb-1 text-right font-semibold">p95</th><th className="pb-1 text-right font-semibold">5xx</th></tr></thead>
            <tbody>
              {(data?.routes ?? []).map((route) => <tr key={route.route} className="border-t border-slate-100"><td className="max-w-[220px] truncate py-1.5 font-mono text-[10px] text-slate-700" title={route.route}>{route.route}</td><td className="py-1.5 text-right">{nf.format(route.calls)}</td><td className="py-1.5 text-right">{ms(route.p50)}</td><td className="py-1.5 text-right font-bold text-slate-900">{ms(route.p95)}</td><td className={`py-1.5 text-right ${route.errors ? 'font-bold text-red-600' : 'text-slate-400'}`}>{route.errors}</td></tr>)}
              {data && !data.routes.length && <tr><td colSpan={5} className="py-3 text-center text-slate-400">Aucun appel mesuré.</td></tr>}
            </tbody>
          </table>
        </Panel>
      </section>

      <Panel title="Core Web Vitals par page" subtitle="75e centile par page, les plus visitées d’abord. Vert = bon, orange = à améliorer, rouge = mauvais (seuils de Google).">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[11px] text-slate-700">
            <thead><tr className="border-b border-slate-200 text-left text-[10px] text-slate-500"><th className="px-2 py-2 font-semibold">Page</th><th className="px-2 py-2 text-right font-semibold">Mesures</th><th className="px-2 py-2 text-right font-semibold">LCP</th><th className="px-2 py-2 text-right font-semibold">INP</th><th className="px-2 py-2 text-right font-semibold">CLS</th></tr></thead>
            <tbody>
              {(data?.vitals.pages ?? []).map((page) => <tr key={page.path} className="border-b border-slate-100"><td className="max-w-[420px] truncate px-2 py-2 text-slate-800">{page.path}</td><td className="px-2 py-2 text-right">{nf.format(page.samples)}</td><td className="px-2 py-2 text-right"><VitalPill name="LCP" metric={page.LCP} /></td><td className="px-2 py-2 text-right"><VitalPill name="INP" metric={page.INP} /></td><td className="px-2 py-2 text-right"><VitalPill name="CLS" metric={page.CLS} /></td></tr>)}
              {data && !data.vitals.pages.length && <tr><td colSpan={5} className="py-4 text-center text-slate-400">Les Web Vitals arrivent avec les visites, depuis la mise en ligne de la mesure propre au site.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
