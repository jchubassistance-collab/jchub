'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, FileDown, FileSpreadsheet, Mail, Table2 } from 'lucide-react';
import { Change, formatNumber, Panel } from '@/components/admin/dashboard/Widgets';
import { PERIOD_LABELS, usePeriod } from '@/components/admin/insights/InsightsUI';
import { cachedJson, fetchJson } from '@/lib/admin-cache';

type Report = {
  configured?: boolean;
  label: string;
  range: { from: string; to: string };
  kpis: { label: string; value: number | null; previous: number | null; change: number | null; inverse?: boolean }[];
  pages: { path: string; views: number; visitors: number }[];
  tools: { name: string; opens: number; downloads: number }[];
  articles: { title: string; views: number }[];
  seo: { configured: true; totals: { clicks: number; impressions: number; ctr: number; position: number } } | { configured: false; reason: string };
  alerts: unknown[];
};

const DATASETS = [
  ['resume', 'Résumé'], ['pages', 'Pages'], ['sources', 'Sources'], ['pays', 'Pays'],
  ['outils', 'Outils'], ['articles', 'Articles'], ['requetes', 'Requêtes Google'], ['alertes', 'Alertes'],
] as const;

/** The last 8 weeks (Monday to Sunday), the one just ended first (Brazzaville time). */
function lastWeeks(): { value: string; label: string }[] {
  const local = new Date(Date.now() + 3600_000);
  const day = local.getUTCDay() || 7;
  const thisMonday = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - (day - 1));
  const short = (time: number) => new Date(time).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return Array.from({ length: 9 }, (_, index) => {
    const monday = thisMonday - index * 7 * 86400_000;
    return { value: `week:${new Date(monday).toISOString().slice(0, 10)}`, label: `Semaine du ${short(monday)} au ${short(monday + 6 * 86400_000)}${index === 0 ? ' (en cours)' : ''}` };
  });
}

/** The last 12 months, the one just ended first (Brazzaville time). */
function lastMonths(): { value: string; label: string }[] {
  const local = new Date(Date.now() + 3600_000);
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() - index, 1));
    const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    return { value: `month:${date.toISOString().slice(0, 7)}`, label: `${label.charAt(0).toUpperCase()}${label.slice(1)}${index === 0 ? ' (en cours)' : ''}` };
  });
}

export default function InsightsReportsPage() {
  const days = usePeriod();
  const months = useMemo(() => lastMonths(), []);
  const weeks = useMemo(() => lastWeeks(), []);
  const [period, setPeriod] = useState<string>(() => weeks[1].value);
  const [kind, value] = period.split(':');
  const query = kind === 'days' ? `days=${days}` : `${kind}=${value}`;
  const url = `/api/admin/insights/report?${query}`;
  const [report, setReport] = useState<Report | null>(() => cachedJson<Report>(url) ?? null);
  const [error, setError] = useState('');
  const [mail, setMail] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    setReport(cachedJson<Report>(url) ?? null);
    setError('');
    fetchJson<Report>(url, 'Impossible de préparer le rapport.')
      .then((data) => { if (active) setReport(data); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Impossible de préparer le rapport.'); });
    return () => { active = false; };
  }, [url]);

  const send = async () => {
    setSending(true);
    setMail(null);
    try {
      const response = await fetch('/api/admin/insights/report', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ [kind]: value }) });
      const body = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error || 'E-mail non envoyé.');
      setMail({ tone: 'ok', text: 'Rapport envoyé par e-mail, avec le tableau de bord Excel et le PDF en pièces jointes.' });
    } catch (cause) {
      setMail({ tone: 'error', text: cause instanceof Error ? cause.message : 'E-mail non envoyé.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="text-xs font-semibold text-slate-600">
          Période du rapport
          <select value={period} onChange={(event) => setPeriod(event.target.value)} className="mt-1.5 block h-10 w-72 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-400">
            <optgroup label="Semaines">{weeks.map((week) => <option key={week.value} value={week.value}>{week.label}</option>)}</optgroup>
            <optgroup label="Mois">{months.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}</optgroup>
            <optgroup label="Glissant"><option value="days:">{PERIOD_LABELS[days]} glissants</option></optgroup>
          </select>
        </label>
        <a href={`/api/admin/insights/report?${query}&format=xlsx`} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700"><FileSpreadsheet className="h-4 w-4" />Excel (tableau de bord)</a>
        <a href={`/api/admin/insights/report?${query}&format=pdf`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:border-blue-300"><FileDown className="h-4 w-4" />PDF</a>
        {kind !== 'days' && <button type="button" onClick={() => void send()} disabled={sending} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:border-blue-300 disabled:opacity-60"><Mail className="h-4 w-4" />{sending ? 'Envoi…' : 'Envoyer par e-mail'}</button>}
        <p className="flex items-center gap-1.5 text-[11px] text-slate-500 sm:ml-auto"><CalendarDays className="h-3.5 w-3.5" />Le rapport de la semaine écoulée part tout seul chaque lundi à 7 h (Excel + PDF).</p>
      </section>
      {mail && <p role="status" className={`rounded-xl px-4 py-2.5 text-xs font-medium ${mail.tone === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>{mail.text}</p>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <Panel title={report ? `Aperçu — ${report.label}` : 'Aperçu'} subtitle={report ? `Du ${new Date(`${report.range.from}T12:00:00Z`).toLocaleDateString('fr-FR')} au ${new Date(`${report.range.to}T12:00:00Z`).toLocaleDateString('fr-FR')}, comparé à la période d’avant de même durée.` : 'Préparation du rapport…'}>
        {report ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {report.kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold text-slate-500">{kpi.label}</p>
                <p className="mt-0.5 text-xl font-black text-slate-950 tabular-nums">{formatNumber(kpi.value)}</p>
                {kpi.change !== null && <Change value={kpi.change} inverse={kpi.inverse} />}
                {kpi.previous !== null && <p className="mt-0.5 text-[10px] text-slate-400">Période préc. : {formatNumber(kpi.previous)}</p>}
              </div>
            ))}
            {report.seo.configured && (
              <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2 xl:col-span-4">
                <p className="text-[11px] font-semibold text-slate-500">Google</p>
                <p className="mt-0.5 text-sm text-slate-800"><strong>{formatNumber(report.seo.totals.clicks)}</strong> clics · <strong>{formatNumber(report.seo.totals.impressions)}</strong> impressions · CTR {report.seo.totals.ctr.toLocaleString('fr-FR')} % · position {report.seo.totals.position.toLocaleString('fr-FR')}</p>
              </div>
            )}
          </div>
        ) : <div className="h-28 animate-pulse rounded-xl bg-slate-50" />}
      </Panel>

      {report && (
        <section className="grid gap-4 lg:grid-cols-3">
          <Panel title="Pages les plus vues">
            <ol className="space-y-1.5 text-xs">{report.pages.slice(0, 8).map((page) => <li key={page.path} className="flex justify-between gap-2"><span className="min-w-0 truncate text-slate-700" title={page.path}>{page.path}</span><strong className="tabular-nums">{formatNumber(page.views)}</strong></li>)}</ol>
          </Panel>
          <Panel title="Outils les plus utilisés">
            <ol className="space-y-1.5 text-xs">{report.tools.slice(0, 8).map((tool) => <li key={tool.name} className="flex justify-between gap-2"><span className="min-w-0 truncate text-slate-700">{tool.name}</span><strong className="tabular-nums">{formatNumber(tool.downloads)} <span className="font-normal text-slate-400">téléch.</span></strong></li>)}</ol>
          </Panel>
          <Panel title="Articles les plus lus">
            <ol className="space-y-1.5 text-xs">{report.articles.slice(0, 8).map((article) => <li key={article.title} className="flex justify-between gap-2"><span className="min-w-0 truncate text-slate-700" title={article.title}>{article.title}</span><strong className="tabular-nums">{formatNumber(article.views)}</strong></li>)}</ol>
          </Panel>
        </section>
      )}

      <Panel title="Exports CSV" subtitle="Pour Excel ou Google Sheets : séparateur point-virgule, accents conservés.">
        <div className="flex flex-wrap gap-2">
          {DATASETS.map(([dataset, label]) => (
            <a key={dataset} href={`/api/admin/insights/report?${query}&format=csv&dataset=${dataset}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300">
              {dataset === 'resume' ? <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> : <Table2 className="h-3.5 w-3.5 text-slate-400" />}{label}
            </a>
          ))}
        </div>
      </Panel>
    </div>
  );
}
