'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Info, Loader2, RefreshCw } from 'lucide-react';
import { formatNumber, nf, Panel } from '@/components/admin/dashboard/Widgets';
import { tooltipStyle } from '@/components/admin/insights/InsightsUI';
import { cachedJson, fetchJson } from '@/lib/admin-cache';
import type { History } from '@/lib/insights/history';

type Payload = (History & { configured: true }) | { configured: false };

const URL_HISTORY = '/api/admin/insights/history';
const short = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', timeZone: 'UTC' });
const DEVICE: Record<string, string> = { desktop: 'Ordinateur', mobile: 'Mobile', tablet: 'Tablette' };

function Table({ head, rows, empty = 'Aucune donnée.' }: { head: string[]; rows: (string | number | null)[][]; empty?: string }) {
  if (!rows.length) return <p className="py-6 text-center text-xs text-slate-500">{empty}</p>;
  return (
    <div className="max-h-[420px] overflow-auto">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-white text-[10px] uppercase tracking-wide text-slate-400"><tr>{head.map((label, index) => <th key={label} className={`py-2 font-semibold ${index ? 'px-2 text-right' : 'pr-2'}`}>{label}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="text-slate-700">
              {row.map((cell, index) => <td key={index} className={index ? 'px-2 text-right tabular-nums' : 'max-w-0 truncate py-2 pr-2 font-medium text-slate-900'} title={index ? undefined : String(cell ?? '')}>{typeof cell === 'number' ? nf.format(cell) : cell ?? '—'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function InsightsHistoryPage() {
  const [data, setData] = useState<Payload | null>(() => cachedJson<Payload>(URL_HISTORY) ?? null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    setError('');
    if (refresh) setRefreshing(true);
    try {
      setData(await fetchJson<Payload>(refresh ? `${URL_HISTORY}?refresh=1` : URL_HISTORY, 'Impossible de charger l’historique.'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de charger l’historique.');
    } finally {
      setRefreshing(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const history = data?.configured ? data : null;
  const daily = useMemo(() => (history?.daily ?? []).map((row) => ({ jour: short(row.day), 'Visiteurs (Analytics)': row.gaUsers, 'Visiteurs (site)': row.siteVisitors, 'Clics Google': row.googleClicks })), [history]);
  const weekly = useMemo(() => (history?.weeks ?? []).map((row) => ({ semaine: `Sem. ${short(row.week)}`, 'Visiteurs (Analytics)': row.gaUsers, 'Clics Google': row.googleClicks, 'Visiteurs (site)': row.siteVisitors })), [history]);

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="flex min-w-0 flex-1 items-center gap-2 text-xs text-slate-600"><Info className="h-4 w-4 shrink-0 text-blue-600" />{history ? <>Du <strong>{short(history.range.from)}</strong> au <strong>{short(history.range.to)}</strong>, toutes sources réunies. Mis à jour le {new Date(history.builtAt).toLocaleString('fr-FR', { timeZone: 'Africa/Brazzaville' })}.</> : 'L’historique du site depuis le 3 septembre, toutes sources réunies.'}</p>
        <button type="button" onClick={() => void load(true)} disabled={refreshing} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-blue-300 disabled:opacity-60">{refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}{refreshing ? 'Lecture des sources…' : 'Mettre à jour'}</button>
        <a href={`${URL_HISTORY}?format=xlsx`} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700"><FileSpreadsheet className="h-3.5 w-3.5" />Télécharger l’Excel</a>
      </section>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {!data && !error && <p className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin" />Première lecture de Google Analytics, Search Console et Firestore (jusqu’à une minute)…</p>}
      {data && !data.configured && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">La base du Control Center n’est pas configurée.</p>}

      {history && (
        <>
          <Panel title="Sources et périodes couvertes">
            <ul className="divide-y divide-slate-100 text-xs">
              {history.coverage.map((item) => (
                <li key={item.source} className="grid gap-1 py-2.5 sm:grid-cols-[180px_160px_1fr] sm:items-center">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">{item.status === 'ok' ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}{item.source}</span>
                  <span className="tabular-nums text-slate-600">{item.from && item.to ? `${short(item.from)} → ${short(item.to)}` : '—'}</span>
                  <span className={item.status === 'ok' ? 'text-slate-500' : 'text-amber-800'}>{item.note}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {([
              ['Visiteurs (Analytics)', history.totals.gaUsers, 'somme des visiteurs quotidiens'],
              ['Pages vues (Analytics)', history.totals.gaPageviews, `${formatNumber(history.totals.gaSessions)} sessions`],
              ['Clics depuis Google', history.totals.googleClicks, `${formatNumber(history.totals.googleImpressions)} impressions`],
              ['Visiteurs (mesure du site)', history.totals.siteVisitors, `${formatNumber(history.totals.sitePageviews)} pages vues, depuis le 28 oct.`],
              ['Inscrits newsletter', history.totals.newsletter, ''],
              ['Messages de contact', history.totals.contacts, ''],
              ['Commentaires', history.totals.comments, ''],
              ['Demandes de modèles', history.totals.resources, ''],
            ] as const).map(([label, value, note]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-black text-slate-950 tabular-nums">{formatNumber(value)}</p>
                {note && <p className="mt-0.5 text-[11px] text-slate-400">{note}</p>}
              </div>
            ))}
          </section>

          <Panel title="Jour par jour depuis le 3 septembre" subtitle="Après le 12 octobre, Google Analytics ne compte plus que les visiteurs qui acceptent les cookies : la mesure du site prend le relais à partir du 28 octobre.">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="jour" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Visiteurs (Analytics)" stroke="#2563eb" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="Visiteurs (site)" stroke="#16a34a" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="Clics Google" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" dot={false} connectNulls={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Semaine par semaine" subtitle="Du lundi au dimanche ; la première et la dernière semaine peuvent être incomplètes.">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="semaine" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Visiteurs (Analytics)" fill="#2563eb" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="Clics Google" fill="#f59e0b" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="Visiteurs (site)" fill="#16a34a" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Table
              head={['Semaine', 'Visiteurs GA', 'Pages vues GA', 'Clics Google', 'Impressions', 'Visiteurs site', 'Newsletter', 'Messages']}
              rows={history.weeks.map((row) => [`Semaine du ${short(row.week)}`, row.gaUsers, row.gaPageviews, row.googleClicks, row.googleImpressions, row.siteVisitors, row.newsletter, row.contacts])}
            />
          </Panel>

          {history.ga.configured ? (
            <>
              <section className="grid gap-4 xl:grid-cols-2">
                <Panel title="Pages les plus vues (Analytics)"><Table head={['Page', 'Vues', 'Visiteurs', 'Durée (s)']} rows={history.ga.pages.slice(0, 100).map((row) => [row.path, row.pageviews, row.users, row.duration])} /></Panel>
                <Panel title="Sources des visites (Analytics)"><Table head={['Source / support', 'Sessions', 'Visiteurs']} rows={history.ga.sources.map((row) => [row.source, row.sessions, row.users])} /></Panel>
              </section>
              <section className="grid gap-4 xl:grid-cols-3">
                <Panel title="Pays (Analytics)"><Table head={['Pays', 'Visiteurs', 'Sessions']} rows={history.ga.countries.map((row) => [row.country, row.users, row.sessions])} /></Panel>
                <Panel title="Villes (Analytics)"><Table head={['Ville', 'Visiteurs']} rows={history.ga.cities.map((row) => [`${row.city} (${row.country})`, row.users])} /></Panel>
                <Panel title="Appareils et événements (Analytics)">
                  <Table head={['Appareil', 'Visiteurs', 'Sessions']} rows={history.ga.devices.map((row) => [DEVICE[row.device] ?? row.device, row.users, row.sessions])} />
                  <Table head={['Événement', 'Nombre', 'Visiteurs']} rows={history.ga.events.map((row) => [row.name, row.count, row.users])} />
                </Panel>
              </section>
            </>
          ) : (
            <p className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>Google Analytics :</strong> {history.ga.reason}{history.ga.account && <> Compte à ajouter : <code className="rounded bg-white/70 px-1 text-xs">{history.ga.account}</code>, puis « Mettre à jour ».</>}</span></p>
          )}

          {history.seo.configured ? (
            <section className="grid gap-4 xl:grid-cols-2">
              <Panel title="Requêtes Google (Search Console)"><Table head={['Requête', 'Clics', 'Impr.', 'Position']} rows={history.seo.queries.slice(0, 200).map((row) => [row.key, row.clicks, row.impressions, row.position])} /></Panel>
              <Panel title="Pages dans Google (Search Console)"><Table head={['Page', 'Clics', 'Impr.', 'Position']} rows={history.seo.pages.slice(0, 200).map((row) => [row.key, row.clicks, row.impressions, row.position])} /></Panel>
            </section>
          ) : (
            <p className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>Search Console :</strong> {history.seo.reason}</span></p>
          )}

          <Panel title="Jour par jour (détail)" subtitle="Case « — » : la source ne mesurait pas ce jour-là. Tout est aussi dans l’Excel.">
            <Table
              head={['Jour', 'Visiteurs GA', 'Pages vues GA', 'Clics Google', 'Impressions', 'Visiteurs site', 'Pages vues site', 'Newsletter', 'Messages', 'Commentaires']}
              rows={[...history.daily].reverse().map((row) => [new Date(`${row.day}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' }), row.gaUsers, row.gaPageviews, row.googleClicks, row.googleImpressions, row.siteVisitors, row.sitePageviews, row.newsletter, row.contacts, row.comments])}
            />
          </Panel>
        </>
      )}
    </div>
  );
}
