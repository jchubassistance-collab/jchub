'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownUp } from 'lucide-react';
import { formatNumber, nf, Panel } from '@/components/admin/dashboard/Widgets';
import { DataBanner, PALETTE, tooltipStyle, useInsights, type CollectionInfo } from '@/components/admin/insights/InsightsUI';

type ToolRow = { tool: string; opens: number; visitors: number; uploads: number; files: number; averageSize: number | null; downloads: number; waitMs: number | null; apiCalls: number; processingP50: number | null; processingP95: number | null; errorRate: number | null };
type Tools = {
  configured: boolean;
  info?: CollectionInfo;
  tools: ToolRow[];
  funnel: { opened: number; uploaded: number; downloaded: number };
  daily: { day: string; tool: string; uses: number }[];
  errors: { tool: string; message: string; count: number }[];
  names: Record<string, { name: string; icon: string; category: string }>;
};
type SortKey = 'opens' | 'uploads' | 'downloads' | 'conversion' | 'files' | 'errorRate' | 'processingP50';

const size = (bytes: number | null) => bytes === null ? '—' : bytes >= 1_000_000 ? `${(bytes / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo` : `${Math.round(bytes / 1000)} Ko`;
const ms = (value: number | null) => value === null ? '—' : value >= 1000 ? `${(value / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} s` : `${value} ms`;
const rate = (part: number, whole: number) => whole ? Math.round((part / whole) * 100) : 0;

export default function InsightsToolsPage() {
  const { data, error } = useInsights<Tools>('tools');
  const [sort, setSort] = useState<SortKey>('opens');
  const name = (slug: string) => data?.names[slug]?.name ?? slug;

  const rows = useMemo(() => [...(data?.tools ?? [])].map((row) => ({ ...row, conversion: rate(row.downloads, row.visitors) })).sort((a, b) => (Number(b[sort] ?? -1) - Number(a[sort] ?? -1)) || b.opens - a.opens), [data, sort]);
  const totals = useMemo(() => {
    const list = data?.tools ?? [];
    const files = list.reduce((sum, row) => sum + row.files, 0);
    const bytes = list.reduce((sum, row) => sum + (row.averageSize ?? 0) * row.files, 0);
    const p50s = list.filter((row) => row.processingP50 !== null);
    const attempts = list.reduce((sum, row) => sum + Math.max(row.uploads, row.apiCalls), 0);
    const failures = list.reduce((sum, row) => sum + (row.errorRate !== null ? (row.errorRate / 100) * Math.max(row.uploads, row.apiCalls) : 0), 0);
    return {
      used: list.filter((row) => row.uploads || row.downloads || row.apiCalls).length,
      opened: list.filter((row) => row.opens).length,
      files,
      averageSize: files ? Math.round(bytes / files) : null,
      processing: p50s.length ? Math.round(p50s.reduce((sum, row) => sum + (row.processingP50 ?? 0), 0) / p50s.length) : null,
      errorRate: attempts ? Number(((failures / attempts) * 100).toFixed(1)) : null,
    };
  }, [data]);
  const topTools = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of data?.daily ?? []) counts.set(row.tool, (counts.get(row.tool) ?? 0) + row.uses);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tool]) => tool);
  }, [data]);
  const dailyUses = useMemo(() => {
    const days = new Map<string, Record<string, number | string>>();
    for (const row of data?.daily ?? []) {
      if (!topTools.includes(row.tool)) continue;
      const entry = days.get(row.day) ?? { label: new Date(`${row.day}T12:00:00Z`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) };
      entry[name(row.tool)] = row.uses;
      days.set(row.day, entry);
    }
    return Array.from(days.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, entry]) => entry);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, topTools]);

  const funnel = data?.funnel ?? { opened: 0, uploaded: 0, downloaded: 0 };
  const steps = [
    { label: 'Outil ouvert', value: funnel.opened, color: '#2563eb' },
    { label: 'Fichier envoyé', value: funnel.uploaded, color: '#7c3aed' },
    { label: 'Résultat téléchargé', value: funnel.downloaded, color: '#16a34a' },
  ];
  const header = (key: SortKey, label: string) => (
    <th className="px-2 py-2 text-right font-semibold"><button type="button" onClick={() => setSort(key)} className={`inline-flex items-center gap-1 ${sort === key ? 'text-blue-700' : ''}`}>{label}<ArrowDownUp className="h-3 w-3" /></button></th>
  );

  return (
    <div className="space-y-4">
      <DataBanner info={data?.info} configured={data?.configured !== false} />
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          ['Outils ouverts', formatNumber(data ? totals.opened : undefined), 'au moins une visite'],
          ['Outils utilisés', formatNumber(data ? totals.used : undefined), 'fichier envoyé ou résultat'],
          ['Fichiers traités', formatNumber(data ? totals.files : undefined), 'envoyés dans les outils'],
          ['Taille moyenne', data ? size(totals.averageSize) : '—', 'par fichier'],
          ['Traitement serveur', data ? ms(totals.processing) : '—', 'médiane des outils serveur'],
          ['Taux d’erreur', data && totals.errorRate !== null ? `${totals.errorRate.toLocaleString('fr-FR')} %` : '—', 'erreurs / tentatives'],
        ].map(([label, value, note]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[11px] font-semibold text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-slate-950">{value}</p><p className="text-[10px] text-slate-400">{note}</p></div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Panel title="Entonnoir des outils" subtitle="Visiteurs (par jour et par outil) à chaque étape, mesure propre au site" className="xl:col-span-5">
          <div className="space-y-3">
            {steps.map((step, index) => {
              const width = funnel.opened ? Math.max(4, (step.value / funnel.opened) * 100) : 0;
              return (
                <div key={step.label}>
                  <div className="mb-1 flex justify-between text-xs"><span className="font-semibold text-slate-700">{index + 1}. {step.label}</span><span className="font-black text-slate-900">{nf.format(step.value)}{index > 0 && <span className="ml-1.5 text-[11px] font-semibold text-slate-500">({rate(step.value, steps[index - 1].value)} % de l’étape précédente)</span>}</span></div>
                  <div className="h-7 rounded-lg bg-slate-100"><div className="flex h-7 items-center rounded-lg px-2 text-[11px] font-bold text-white" style={{ width: `${width}%`, background: step.color }}>{funnel.opened ? `${rate(step.value, funnel.opened)} %` : ''}</div></div>
                </div>
              );
            })}
            {data && !funnel.opened && <p className="text-xs text-slate-400">L’entonnoir se remplit avec la mesure propre au site : l’historique des rapports ne connaît pas les fichiers envoyés dans le navigateur.</p>}
          </div>
        </Panel>
        <Panel title="Utilisations par jour" subtitle="Les 5 outils les plus utilisés" className="xl:col-span-7">
          <div className="h-64">
            <ResponsiveContainer><BarChart data={dailyUses} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}><CartesianGrid stroke="#f1f5f9" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 10 }} minTickGap={16} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 11 }} />{topTools.map((tool, index) => <Bar key={tool} dataKey={name(tool)} stackId="uses" fill={PALETTE[index]} isAnimationActive={false} maxBarSize={36} />)}</BarChart></ResponsiveContainer>
          </div>
          {data && !topTools.length && <p className="text-center text-xs text-slate-400">Aucune utilisation mesurée sur la période.</p>}
        </Panel>
      </section>

      <Panel title="Classement des outils" subtitle="Clique sur une colonne pour trier. Conversion = visiteurs qui ont obtenu un résultat. Traitement = durée réelle côté serveur (médiane / 95e centile).">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-[11px] text-slate-700">
            <thead><tr className="border-b border-slate-200 text-left text-[10px] text-slate-500"><th className="px-2 py-2 font-semibold">Outil</th>{header('opens', 'Ouvertures')}{header('uploads', 'Envois')}{header('downloads', 'Résultats')}{header('conversion', 'Conversion')}{header('files', 'Fichiers')}<th className="px-2 py-2 text-right font-semibold">Taille moy.</th><th className="px-2 py-2 text-right font-semibold">Attente visiteur</th>{header('processingP50', 'Traitement')}{header('errorRate', 'Erreurs')}</tr></thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.tool} className="border-b border-slate-100 hover:bg-slate-50/60">
                  <td className="px-2 py-2"><span className="inline-flex items-center gap-2"><span className="w-5 text-right text-slate-400">{index + 1}</span><span className="text-base">{data?.names[row.tool]?.icon}</span><span className="font-semibold text-slate-800">{name(row.tool)}</span></span></td>
                  <td className="px-2 py-2 text-right font-bold text-slate-900">{nf.format(row.opens)}</td>
                  <td className="px-2 py-2 text-right">{nf.format(row.uploads)}</td>
                  <td className="px-2 py-2 text-right">{nf.format(row.downloads)}</td>
                  <td className="px-2 py-2 text-right"><span className={`rounded-full px-1.5 py-0.5 font-bold ${row.conversion >= 30 ? 'bg-emerald-50 text-emerald-700' : row.conversion > 0 ? 'bg-amber-50 text-amber-700' : 'text-slate-400'}`}>{row.conversion} %</span></td>
                  <td className="px-2 py-2 text-right">{nf.format(row.files)}</td>
                  <td className="px-2 py-2 text-right text-slate-600">{size(row.averageSize)}</td>
                  <td className="px-2 py-2 text-right text-slate-600">{ms(row.waitMs)}</td>
                  <td className="px-2 py-2 text-right text-slate-600">{row.processingP50 === null ? '—' : `${ms(row.processingP50)} / ${ms(row.processingP95)}`}</td>
                  <td className="px-2 py-2 text-right">{row.errorRate === null ? <span className="text-slate-400">—</span> : <span className={`font-bold ${row.errorRate > 5 ? 'text-red-600' : 'text-slate-700'}`}>{row.errorRate.toLocaleString('fr-FR')} %</span>}</td>
                </tr>
              ))}
              {data && !rows.length && <tr><td colSpan={10} className="py-6 text-center text-slate-400">Aucun outil ouvert sur la période.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Erreurs vues par les visiteurs" subtitle="Messages d’erreur affichés dans les outils">
        <ul className="divide-y divide-slate-100 text-[11px]">
          {(data?.errors ?? []).map((row) => <li key={`${row.tool}-${row.message}`} className="flex justify-between gap-3 py-1.5"><span className="min-w-0 truncate"><strong className="text-slate-800">{name(row.tool)}</strong> <span className="text-slate-500">· {row.message}</span></span><span className="shrink-0 rounded-full bg-red-50 px-1.5 font-bold text-red-700">×{row.count}</span></li>)}
          {data && !data.errors.length && <li className="py-2 text-emerald-700">Aucune erreur affichée sur la période.</li>}
        </ul>
      </Panel>
    </div>
  );
}
