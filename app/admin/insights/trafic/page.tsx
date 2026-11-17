'use client';

import { useMemo, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { nf, Panel } from '@/components/admin/dashboard/Widgets';
import { WorldMap } from '@/components/admin/dashboard/WorldMap';
import { CandleChart, DataBanner, Donut, HourHeatmap, PALETTE, SOURCE_COLORS, SOURCE_LABELS, tooltipStyle, useInsights, type Candle, type CollectionInfo } from '@/components/admin/insights/InsightsUI';
import { COUNTRIES } from '@/lib/country-codes';

type Traffic = {
  configured: boolean;
  info?: CollectionInfo;
  daily: { day: string; visitors: number; pageviews: number }[];
  sources: { source: string; visits: number }[];
  countries: { key: string; visitors: number }[];
  devices: { key: string; visitors: number }[];
  langs: { key: string; visitors: number }[];
  cities: { city: string; country: string; visitors: number }[];
  heatmap: { day: number; hour: number; views: number }[];
  candles: Candle[];
};
type Grain = 'day' | 'week' | 'month';

const countryName = (code: string) => COUNTRIES[code]?.[1] ?? (code || 'Inconnu');
const DEVICE_LABELS: Record<string, string> = { mobile: 'Mobile', ordinateur: 'Ordinateur', tablette: 'Tablette' };
const LANG_LABELS: Record<string, string> = { fr: 'Français', en: 'Anglais', '': 'Sans langue (accueil)' };

/** Days grouped by week (from Monday) or month; the visitors of each day are added up. */
function regroup(daily: Traffic['daily'], grain: Grain) {
  if (grain === 'day') return daily.map((row) => ({ label: new Date(`${row.day}T12:00:00Z`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), visiteurs: row.visitors, 'pages vues': row.pageviews }));
  const groups = new Map<string, { label: string; visiteurs: number; 'pages vues': number }>();
  for (const row of daily) {
    const date = new Date(`${row.day}T12:00:00Z`);
    let key: string;
    let label: string;
    if (grain === 'week') {
      const monday = new Date(date);
      monday.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
      key = monday.toISOString().slice(0, 10);
      label = `sem. du ${monday.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`;
    } else {
      key = row.day.slice(0, 7);
      label = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    }
    const group = groups.get(key) ?? { label, visiteurs: 0, 'pages vues': 0 };
    group.visiteurs += row.visitors;
    group['pages vues'] += row.pageviews;
    groups.set(key, group);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, group]) => group);
}

export default function InsightsTrafficPage() {
  const { data, error } = useInsights<Traffic>('traffic');
  const [grain, setGrain] = useState<Grain>('day');
  const series = useMemo(() => regroup(data?.daily ?? [], grain), [data, grain]);
  const totalVisitors = (data?.countries ?? []).reduce((sum, row) => sum + row.visitors, 0);
  const congo = data?.countries.find((row) => row.key === 'CG')?.visitors ?? 0;

  return (
    <div className="space-y-4">
      <DataBanner info={data?.info} configured={data?.configured !== false} />
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="grid gap-4 xl:grid-cols-12">
        <Panel title="Visiteurs dans le temps" subtitle="Visiteurs et pages vues" className="xl:col-span-8" action={
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-[11px] font-semibold">
            {(['day', 'week', 'month'] as const).map((value) => <button key={value} type="button" onClick={() => setGrain(value)} className={`rounded-md px-2.5 py-1 ${grain === value ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>{value === 'day' ? 'Jour' : value === 'week' ? 'Semaine' : 'Mois'}</button>)}
          </div>
        }>
          <div className="h-72">
            <ResponsiveContainer><LineChart data={series} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}><CartesianGrid yAxisId="left" stroke="#f1f5f9" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10 }} minTickGap={24} /><YAxis yAxisId="left" tick={{ fontSize: 10 }} allowDecimals={false} /><YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} allowDecimals={false} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} /><Line isAnimationActive={false} yAxisId="left" type="monotone" dataKey="visiteurs" stroke="#2563eb" strokeWidth={2.5} dot={false} /><Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="pages vues" stroke="#94a3b8" strokeWidth={1.5} dot={false} /></LineChart></ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Sources du trafic" subtitle="D’où arrivent les visites" className="xl:col-span-4">
          <Donut data={(data?.sources ?? []).map((row) => ({ name: SOURCE_LABELS[row.source] ?? row.source, value: row.visits, color: SOURCE_COLORS[row.source] ?? '#64748b' }))} center={nf.format((data?.sources ?? []).reduce((sum, row) => sum + row.visits, 0))} height={170} />
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Panel title="Pays" subtitle="Visiteurs par pays" className="xl:col-span-5">
          <WorldMap countries={(data?.countries ?? []).filter((row) => row.key).map((row) => ({ code: row.key, name: countryName(row.key), visitors: row.visitors }))} />
        </Panel>
        <Panel title="Congo et reste du monde" subtitle="Part des visiteurs" className="xl:col-span-3">
          <Donut data={[{ name: 'Congo', value: congo, color: '#16a34a' }, { name: 'Reste du monde', value: Math.max(0, totalVisitors - congo), color: '#cbd5e1' }]} center={totalVisitors ? `${Math.round((congo / totalVisitors) * 100)} %` : '—'} height={150} />
          <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-[11px]">
            {(data?.countries ?? []).slice(0, 6).map((row) => <li key={row.key} className="flex justify-between gap-2"><span className="truncate text-slate-600">{countryName(row.key)}</span><strong>{nf.format(row.visitors)}</strong></li>)}
          </ul>
        </Panel>
        <Panel title="Villes" subtitle="Les 15 premières" className="xl:col-span-4">
          <ul className="divide-y divide-slate-100 text-[11px]">
            {(data?.cities ?? []).map((row) => <li key={`${row.city}-${row.country}`} className="flex justify-between gap-2 py-1.5"><span className="truncate text-slate-700">{row.city} <span className="text-slate-400">· {countryName(row.country)}</span></span><strong>{nf.format(row.visitors)}</strong></li>)}
            {data && !data.cities.length && <li className="py-2 text-slate-400">Aucune ville connue sur la période.</li>}
          </ul>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Panel title="Appareils" className="xl:col-span-2">
          <Donut data={(data?.devices ?? []).map((row, index) => ({ name: DEVICE_LABELS[row.key] ?? row.key, value: row.visitors, color: PALETTE[index % PALETTE.length] }))} height={140} />
        </Panel>
        <Panel title="Langue" className="xl:col-span-2">
          <Donut data={(data?.langs ?? []).map((row, index) => ({ name: LANG_LABELS[row.key] ?? row.key, value: row.visitors, color: ['#2563eb', '#ef4444', '#cbd5e1'][index % 3] }))} height={140} />
        </Panel>
        <Panel title="Quand viennent tes visiteurs" subtitle="Pages vues par jour et par heure (heure de Brazzaville)" className="xl:col-span-8">
          <HourHeatmap cells={data?.heatmap ?? []} />
        </Panel>
      </section>

      <Panel title="Bougies du trafic" subtitle="Une bougie par jour : ouverture = visiteurs de 0 h, clôture = visiteurs de 23 h, mèche haute = heure la plus chargée, mèche basse = heure la plus calme. Verte quand la journée finit plus fort qu’elle n’a commencé.">
        {data?.candles.length ? <CandleChart candles={data.candles} /> : <p className="py-10 text-center text-xs text-slate-400">Pas encore de données.</p>}
        {data?.candles.length ? (
          <p className="mt-2 text-[11px] text-slate-500">Pic de la période : {(() => { const best = [...data.candles].sort((a, b) => b.high - a.high)[0]; return `${nf.format(best.high)} visiteurs entre ${best.peakHour} h et ${best.peakHour + 1} h le ${new Date(`${best.day}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`; })()}.</p>
        ) : null}
      </Panel>
    </div>
  );
}
