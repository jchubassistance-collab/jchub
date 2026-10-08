'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, CalendarDays, Users } from 'lucide-react';

type Row = Record<string, string | number>;
type Analytics = {
  configured: boolean; period?: string; visitors?: number; newUsers?: number; sessions?: number; conversions?: number;
  conversionRate?: number; bounceRate?: number; averageSessionDuration?: number; newsletter?: number; socialClicks?: number;
  timeline?: Row[]; channels?: Row[]; sources?: Row[]; devices?: Row[]; countries?: Row[]; pages?: Row[];
};
const fmt = (n: unknown) => Number(n || 0).toLocaleString('fr-FR');
const duration = (seconds: unknown) => { const n = Math.max(0, Math.round(Number(seconds || 0))); return `${String(Math.floor(n / 3600)).padStart(2, '0')}:${String(Math.floor((n % 3600) / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`; };
const palette = ['#18b4b2', '#4269d0', '#e69b2e', '#8a57bd', '#ed6f58', '#61a66b', '#de5d94', '#808b9a'];

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { fetch('/api/admin/analytics', { cache: 'no-store' }).then(async (response) => { const result = await response.json() as Analytics & { error?: string }; if (!response.ok) throw new Error(result.error || 'Impossible de charger les données Analytics.'); setData(result); }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Analytics indisponibles.')); }, []);

  const channels = data?.channels || [];
  const sources = data?.sources || [];
  const channelTotal = channels.reduce((sum, row) => sum + Number(row.sessions || 0), 0);
  const donut = useMemo(() => {
    let start = 0;
    const stops = channels.map((row, index) => {
      const end = start + (channelTotal ? Number(row.sessions || 0) / channelTotal * 100 : 0);
      const segment = `${palette[index % palette.length]} ${start}% ${end}%`;
      start = end;
      return segment;
    });
    return stops.length ? `conic-gradient(${stops.join(', ')})` : '#e8edf4';
  }, [channels, channelTotal]);

  return <main className="mx-auto max-w-[1500px] space-y-5 pb-10">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">Mesure du site</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Acquisition</h1><p className="mt-1 text-sm text-slate-500">Vue d’ensemble du trafic et des conversions JcHub.</p></div>
      <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm"><CalendarDays className="h-4 w-4 text-blue-600" />{data?.period || '28 derniers jours'}</div>
    </header>
    {error && <Notice text={error} />}
    {data && !data.configured && <Notice text="GA4 n’est pas connecté. Vérifie GA4_PROPERTY_ID et l’accès du compte de service à la propriété." />}
    {data?.configured && <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Utilisateurs" value={fmt(data.visitors)} icon={<Users />} tone="blue" />
        <Kpi label="Sessions" value={fmt(data.sessions)} icon={<Activity />} tone="teal" />
        <Kpi label="Taux de rebond" value={`${Number(data.bounceRate || 0).toLocaleString('fr-FR')} %`} icon={<ArrowDownRight />} tone="orange" />
        <Kpi label="Conversions" value={fmt(data.conversions)} icon={<ArrowUpRight />} tone="violet" />
        <Kpi label="Durée moyenne" value={duration(data.averageSessionDuration)} icon={<CalendarDays />} tone="slate" />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <PanelTitle title="Canaux d’acquisition" subtitle="Répartition des sessions" />
          {channels.length ? <div className="mt-5 flex flex-wrap items-center justify-center gap-6 sm:justify-between"><div className="relative h-44 w-44 shrink-0 rounded-full" style={{ background: donut }}><div className="absolute inset-8 grid place-content-center rounded-full bg-white text-center"><strong className="text-2xl text-slate-900">{fmt(channelTotal)}</strong><span className="text-xs text-slate-400">sessions</span></div></div><div className="min-w-[145px] flex-1 space-y-2">{channels.slice(0, 7).map((row, i) => <div key={String(row.sessionDefaultChannelGroup)} className="flex items-center justify-between gap-3 text-xs"><span className="flex min-w-0 items-center gap-2 text-slate-600"><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: palette[i % palette.length] }} /><span className="truncate">{String(row.sessionDefaultChannelGroup || 'Non défini')}</span></span><b className="text-slate-800">{channelTotal ? `${Math.round(Number(row.sessions || 0) / channelTotal * 100)} %` : '0 %'}</b></div>)}</div></div> : <Empty />}
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><PanelTitle title="Utilisateurs et nouveaux visiteurs" subtitle="Évolution quotidienne" /><TrendChart rows={data.timeline || []} primary="activeUsers" secondary="newUsers" /></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><PanelTitle title="Conversions" subtitle="Conversions par jour" /><TrendChart rows={data.timeline || []} primary="conversions" color="#e69b2e" /></article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h2 className="text-lg font-extrabold text-slate-900">Détail de l’acquisition</h2><p className="mt-1 text-xs text-slate-500">Performances par source et support</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">{sources.length} sources</span></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[980px] border-collapse text-left text-xs"><thead><tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Source / support</th><th className="px-3 py-3 text-right">Sessions</th><th className="px-3 py-3 text-right">Utilisateurs</th><th className="px-3 py-3 text-right">Nouveaux</th><th className="px-3 py-3 text-right">Rebond</th><th className="px-3 py-3 text-right">Pages / session</th><th className="px-3 py-3 text-right">Durée moy.</th><th className="px-4 py-3 text-right">Conversions</th></tr></thead><tbody>{sources.length ? sources.map((row, i) => <tr key={`${String(row.sessionSourceMedium)}-${i}`} className="border-t border-slate-100 hover:bg-blue-50/40"><td className="max-w-[270px] px-4 py-3 font-semibold text-slate-700"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: palette[i % palette.length] }} />{String(row.sessionSourceMedium || '(direct) / (none)')}</td><MetricCell value={row.sessions} max={sources[0]?.sessions} /><MetricCell value={row.activeUsers} max={sources[0]?.activeUsers} /><MetricCell value={row.newUsers} max={sources[0]?.newUsers} /><MetricCell value={`${(Number(row.bounceRate || 0) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`} heat={Number(row.bounceRate || 0) * 100} /><MetricCell value={Number(row.screenPageViewsPerSession || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} /><MetricCell value={duration(row.averageSessionDuration)} /><td className="px-4 py-3 text-right font-bold text-slate-800">{fmt(row.conversions)}</td></tr>) : <tr><td colSpan={8} className="px-4 py-8"><Empty /></td></tr>}</tbody></table></div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2"><PagesBarChart rows={data.pages || []} /><MiniList title="Appareils" rows={data.devices || []} label="deviceCategory" metric="activeUsers" /></section>
      <CountryPanel rows={data.countries || []} totalUsers={data.visitors || 0} />
    </>}
  </main>;
}

function Kpi({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: string }) { const tones: Record<string, string> = { blue: 'bg-blue-50 text-blue-600', teal: 'bg-teal-50 text-teal-600', orange: 'bg-orange-50 text-orange-600', violet: 'bg-violet-50 text-violet-600', slate: 'bg-slate-100 text-slate-600' }; return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">{label}</p><span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span></div><p className="mt-3 text-2xl font-black tracking-tight text-slate-900">{value}</p></article>; }
function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div><h2 className="font-extrabold text-slate-900">{title}</h2><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div>; }
function TrendChart({ rows, primary, secondary, color = '#4269d0' }: { rows: Row[]; primary: string; secondary?: string; color?: string }) { if (!rows.length) return <div className="mt-6"><Empty /></div>; const series = [primary, ...(secondary ? [secondary] : [])]; const max = Math.max(1, ...rows.flatMap((r) => series.map((key) => Number(r[key] || 0)))); const points = (key: string) => rows.map((r, i) => `${rows.length <= 1 ? 50 : i / (rows.length - 1) * 100},${96 - Number(r[key] || 0) / max * 86}`).join(' '); return <div className="mt-5"><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-44 w-full" role="img" aria-label="Graphique d’évolution">{[15, 38, 61, 84].map(y => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#e8edf4" strokeWidth=".5" />)}<polyline points={points(primary)} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />{secondary && <polyline points={points(secondary)} fill="none" stroke="#e69b2e" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />}</svg><div className="mt-2 flex justify-between text-[10px] text-slate-400"><span>{String(rows[0]?.date || '')}</span><span>{String(rows[Math.floor(rows.length / 2)]?.date || '')}</span><span>{String(rows.at(-1)?.date || '')}</span></div><div className="mt-3 flex gap-4 text-[11px] text-slate-500"><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: color }} />{primary === 'activeUsers' ? 'Utilisateurs' : 'Conversions'}</span>{secondary && <span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-orange-500" />Nouveaux utilisateurs</span>}</div></div>; }
function MetricCell({ value, max, heat }: { value: unknown; max?: unknown; heat?: number }) { const opacity = heat !== undefined ? Math.min(.3, heat / 100 * .3) : Math.min(.25, Number(value || 0) / Math.max(1, Number(max || 0)) * .25); const background = heat !== undefined ? `rgba(230,155,46,${opacity})` : `rgba(66,105,208,${opacity})`; return <td className="px-3 py-3 text-right tabular-nums text-slate-700" style={{ background }}>{typeof value === 'number' ? fmt(value) : String(value ?? '')}</td>; }
function MiniList({ title, rows, label, metric }: { title: string; rows: Row[]; label: string; metric: string }) { return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-extrabold text-slate-900">{title}</h2><div className="mt-4 space-y-3">{rows.slice(0, 5).map((row, i) => <div key={`${String(row[label])}-${i}`} className="flex justify-between gap-3 text-xs"><span className="truncate text-slate-600">{String(row[label] || 'Inconnu')}</span><strong className="text-slate-800">{fmt(row[metric])}</strong></div>)}{!rows.length && <Empty />}</div></article>; }
function PagesBarChart({ rows }: { rows: Row[] }) {
  const visible = rows.slice(0, 7);
  const max = Math.max(1, ...visible.flatMap(row => [Number(row.screenPageViews || 0), Number(row.activeUsers || 0)]));
  const chart = { left: 42, top: 18, width: 520, height: 158 };
  const group = chart.width / Math.max(visible.length, 1);
  const barWidth = Math.min(19, group * .28);
  const y = (value: number) => chart.top + chart.height - value / max * chart.height;
  const label = (path: unknown) => {
    const value = String(path || '/');
    const segment = value.split('/').filter(Boolean).at(-1) || 'Accueil';
    return segment.length > 12 ? `${segment.slice(0, 11)}…` : segment;
  };
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-extrabold text-slate-900">Pages les plus consultées</h2><p className="mt-1 text-xs text-slate-500">Vues et utilisateurs actifs · 28 derniers jours</p></div><span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">Top 7</span></div>
    {visible.length ? <><div className="mt-5 overflow-x-auto"><svg viewBox="0 0 590 235" className="h-[220px] min-w-[500px] w-full" role="img" aria-label="Histogramme des vues et utilisateurs actifs par page">
      {[0, 1, 2, 3].map(step => { const yy = chart.top + step * chart.height / 3; const value = Math.round(max * (1 - step / 3)); return <g key={step}><line x1={chart.left} x2={chart.left + chart.width} y1={yy} y2={yy} stroke="#e8edf4" strokeWidth="1" /><text x={chart.left - 8} y={yy + 3} textAnchor="end" fill="#94a3b8" fontSize="9">{fmt(value)}</text></g>; })}
      {visible.map((row, index) => { const x = chart.left + index * group + group / 2; const views = Number(row.screenPageViews || 0); const users = Number(row.activeUsers || 0); const viewsY = y(views); const usersY = y(users); return <g key={`${String(row.pagePath)}-${index}`}><rect x={x - barWidth - 2} y={viewsY} width={barWidth} height={chart.top + chart.height - viewsY} rx="2" fill="#3478df"><title>{String(row.pagePath)} — {fmt(views)} vues</title></rect><rect x={x + 2} y={usersY} width={barWidth} height={chart.top + chart.height - usersY} rx="2" fill="#9fc5f5"><title>{String(row.pagePath)} — {fmt(users)} utilisateurs actifs</title></rect><text x={x} y={chart.top + chart.height + 18} textAnchor="middle" fill="#64748b" fontSize="9">{label(row.pagePath)}</text></g>; })}
    </svg></div><div className="mt-1 flex justify-center gap-5 text-[11px] text-slate-500"><span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-[#3478df]" />Vues de page</span><span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-[#9fc5f5]" />Utilisateurs actifs</span></div></> : <Empty />}
  </article>;
}
const countryCoordinates: Record<string, [number, number]> = {
  'united states': [-98, 39], 'united states of america': [-98, 39], usa: [-98, 39], 'etats unis': [-98, 39], Canada: [-106, 56], Mexico: [-102, 23], Brazil: [-51, -10], Argentina: [-64, -34], Chile: [-71, -33], Colombia: [-74, 4], Peru: [-75, -9],
  France: [2, 46], 'united kingdom': [-3, 55], uk: [-3, 55], 'royaume uni': [-3, 55], Germany: [10, 51], Allemagne: [10, 51], Spain: [-4, 40], Italy: [12, 42], Netherlands: [5, 52], Switzerland: [8, 47], Belgium: [4, 51], Portugal: [-8, 39], Sweden: [15, 62], Norway: [9, 61], Poland: [19, 52], Ukraine: [31, 49], Russia: [90, 60], Austria: [14, 47], Ireland: [-8, 53], Denmark: [10, 56], Greece: [22, 39], Romania: [25, 46], Czechia: [15, 49], 'czech republic': [15, 49], Finland: [26, 64], Iceland: [-19, 65],
  Nigeria: [8, 9], Ghana: [-2, 8], Cameroon: [12, 5], 'South Africa': [24, -29], Kenya: [38, 0], Egypt: [30, 26], Morocco: [-7, 32], Senegal: [-14, 14], Algeria: [3, 28], Tunisia: [9, 34], Uganda: [32, 1], Tanzania: [35, -6], Ethiopia: [40, 9], Benin: [2, 9], 'cote d ivoire': [-5, 7], 'ivory coast': [-5, 7], 'congo kinshasa': [23, -3], 'democratic republic of the congo': [23, -3], 'congo brazzaville': [15, -1],
  India: [79, 22], China: [104, 35], Japan: [138, 37], 'South Korea': [128, 36], 'korea republic of': [128, 36], Indonesia: [118, -2], Thailand: [101, 15], Vietnam: [108, 16], Singapore: [104, 1], Philippines: [122, 12], Australia: [134, -25], 'New Zealand': [172, -41], Turkey: [35, 39], 'Saudi Arabia': [45, 24], 'United Arab Emirates': [54, 24], Pakistan: [69, 30], Bangladesh: [90, 24], Malaysia: [102, 4], Taiwan: [121, 24], 'Hong Kong': [114, 22], Israel: [35, 31], Iran: [53, 32], Iraq: [44, 33], Qatar: [51, 25], Nepal: [84, 28], 'Sri Lanka': [81, 7], Afghanistan: [66, 34], Cambodia: [105, 13], Myanmar: [96, 21], Oman: [57, 21], Kuwait: [47, 29], Jordan: [36, 31], Bahrain: [50, 26], Kazakhstan: [67, 48], Yemen: [48, 15], Syria: [38, 35],
  Albania: [20, 41], Belarus: [28, 53], Bulgaria: [25, 43], Croatia: [16, 45], Cyprus: [33, 35], Estonia: [25, 59], Georgia: [44, 42], Hungary: [19, 47], Latvia: [24, 57], Lithuania: [24, 56], Luxembourg: [6, 49], Slovakia: [19, 48], Slovenia: [15, 46], Serbia: [21, 44], Bosnia: [18, 44], Moldova: [29, 47], Armenia: [45, 40], Azerbaijan: [47, 40],
  Angola: [18, -12], Botswana: [24, -22], 'Burkina Faso': [-2, 12], Burundi: [30, -3], 'Central African Republic': [21, 7], Chad: [19, 15], 'Democratic Republic of the Congo': [23, -3], Djibouti: [43, 11], Eritrea: [39, 15], Gabon: [11, -1], Gambia: [-16, 13], Guinea: [-10, 10], Madagascar: [47, -19], Malawi: [34, -13], Mali: [-4, 17], Mauritania: [-10, 20], Mauritius: [57, -20], Mozambique: [35, -18], Namibia: [18, -22], Niger: [9, 17], Rwanda: [30, -2], Somalia: [46, 6], Sudan: [30, 13], Togo: [1, 8], Zambia: [28, -14], Zimbabwe: [30, -19],
  Bolivia: [-64, -17], 'Costa Rica': [-84, 10], Cuba: [-79, 22], Ecuador: [-78, -1], Guatemala: [-90, 15], Honduras: [-86, 15], Nicaragua: [-85, 13], Panama: [-80, 9], Paraguay: [-58, -23], Uruguay: [-56, -33], Venezuela: [-66, 7], 'Dominican Republic': [-70, 19], Jamaica: [-77, 18], 'Puerto Rico': [-66, 18],
};
const normalizeCountry = (country: string) => country.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
function CountryPanel({ rows, totalUsers }: { rows: Row[]; totalUsers: number }) {
  const top = rows.slice(0, 7);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const max = Math.max(1, ...top.map(row => Number(row.activeUsers || 0)));
  const total = top.reduce((sum, row) => sum + Number(row.activeUsers || 0), 0);
  const point = (country: string) => {
    const normalized = normalizeCountry(country);
    const coords = countryCoordinates[normalized] || Object.entries(countryCoordinates).find(([name]) => normalizeCountry(name) === normalized)?.[1];
    if (!coords) return null;
    const [lon, lat] = coords;
    return { x: ((lon + 180) / 360) * 720, y: ((90 - lat) / 180) * 340 };
  };
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h2 className="text-lg font-extrabold text-slate-900">{'Pays d\u2019origine des visiteurs'}</h2><p className="mt-1 text-xs text-slate-500">{'R\u00e9partition g\u00e9ographique des utilisateurs sur la p\u00e9riode'}</p></div><span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700">{fmt(total)} utilisateurs | principaux pays</span></div>
    {top.length ? <div className="grid lg:grid-cols-[minmax(250px,.8fr)_minmax(0,1.7fr)]">
      <div className="space-y-3 p-5">{top.map((row, index) => { const users = Number(row.activeUsers || 0); const share = totalUsers ? users / totalUsers * 100 : 0; const active = selectedIndex === index; return <button type="button" onClick={() => setSelectedIndex(index)} key={`${String(row.country)}-${index}`} aria-pressed={active} className={`block w-full rounded-lg p-2 text-left transition ${active ? 'bg-sky-50 ring-1 ring-sky-200' : 'hover:bg-slate-50'}`}><span className="mb-1.5 flex items-center justify-between gap-3 text-xs"><span className="truncate font-semibold text-slate-700">{String(row.country || 'Inconnu')}</span><span className="shrink-0 text-slate-500">{fmt(users)} <b className="ml-1 text-slate-800">{share.toFixed(1)} %</b></span></span><span className="block h-3 overflow-hidden rounded-sm bg-slate-100"><span className="block h-full rounded-sm bg-gradient-to-r from-sky-500 to-blue-700" style={{ width: `${Math.max(2, users / max * 100)}%` }} /></span></button>; })}</div>
      <div className="relative m-3 min-h-[250px] overflow-hidden rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 via-[#e5f4fa] to-blue-100 sm:min-h-[320px]">
        <div className="absolute left-4 top-4 z-10 rounded-lg bg-white/85 px-3 py-2 shadow-sm"><p className="text-xs font-bold text-slate-700">Visiteurs par localisation</p><p className="mt-1 text-[10px] text-slate-500">{String(top[selectedIndex]?.country || 'Pays')} | {fmt(top[selectedIndex]?.activeUsers)} utilisateurs</p></div>
        <svg viewBox="0 0 720 340" className="absolute inset-0 h-full w-full" role="group" aria-label="Carte interactive des pays">
          <defs><pattern id="map-grid" width="36" height="34" patternUnits="userSpaceOnUse"><path d="M36 0H0V34" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1" /></pattern></defs><rect width="720" height="340" fill="url(#map-grid)" />
          <g fill="#b7d8e7" stroke="#91bed3" strokeWidth="1.2" strokeLinejoin="round"><path d="M59 79 83 58 121 49 149 59 169 76 181 94 165 109 156 130 140 143 132 169 116 177 106 159 95 147 83 124 67 111 58 94Z" /><path d="m153 171 21 8 13 24-2 27-12 29-8 31-12 28-9-20-2-31-13-28 4-29 12-22Z" /><path d="m310 78 18-19 38-9 31 8 18 16-8 15-24 4-15 17-24 1-15-14-19 1Z" /><path d="m344 112 26-13 28 8 18 24 6 29-15 22-7 28-18 22-16-15-7-30-16-21-8-28Z" /><path d="m384 66 28-22 62-9 53 13 29 21 47 12 35 30-18 22-31-6-19 18-34-10-20 19-34-4-16-21-27 3-16-22-31-2-18-19Z" /><path d="m533 178 34-9 35 13 23 24-8 22-20 7-18-15-30 1-21-17Z" /><path d="m641 245 15-8 13 12-6 18-17 5-12-12Z" /><path d="m278 57 13-13 15 6-4 15-14 8Z" /></g>
          <g fill="none" stroke="#4b93bb" strokeOpacity=".45" strokeDasharray="3 5" strokeWidth="1.4">{top.filter(row => point(String(row.country || ''))).map((row, i) => { const a = point(String(top[selectedIndex]?.country || '')); const b = point(String(row.country || '')); return a && b && String(row.country) !== String(top[selectedIndex]?.country) ? <path key={`route-${i}`} d={`M${a.x},${a.y} Q${(a.x + b.x) / 2},${Math.min(a.y, b.y) - 24} ${b.x},${b.y}`} /> : null; })}</g>
          {top.map((row, i) => { const loc = point(String(row.country || '')); if (!loc) return null; const active = selectedIndex === i; return <g key={`dot-${String(row.country)}`} role="button" tabIndex={0} aria-label={`${String(row.country)}, ${fmt(row.activeUsers)} utilisateurs`} aria-pressed={active} onClick={() => setSelectedIndex(i)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedIndex(i); } }} className="cursor-pointer"><circle cx={loc.x} cy={loc.y} r={active ? 12 : 9} fill="#1d5e92" fillOpacity={active ? '.28' : '.16'} /><circle cx={loc.x} cy={loc.y} r={active ? 5 : 3.5} fill={palette[i % palette.length]} stroke="white" strokeWidth="2" /><title>{String(row.country)} : {fmt(row.activeUsers)} utilisateurs</title></g>; })}
        </svg>
        <div className="absolute bottom-3 left-4 flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-[10px] text-slate-500"><i className="h-2 w-2 rounded-full bg-teal-500" /> {top.filter(row => point(String(row.country || ''))).length} pays interactifs sur {top.length} - clique un point ou un pays</div>
      </div>
    </div> : <Empty />}
  </article>;
}
function Empty() { return <p className="py-6 text-center text-sm text-slate-400">Aucune donnée disponible.</p>; }
function Notice({ text }: { text: string }) { return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{text}</div>; }
