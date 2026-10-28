'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, Copy, ExternalLink } from 'lucide-react';
import { countryName, formatLagosTime, type ErrorReport, type RequestReport } from '@/lib/reports/core';
import { KIND_LABELS, StatusBadge } from '../report-ui';

type Occurrences = Record<string, { count: number; first: number | null; last: number | null; mailed: number | null }>;
type Detail = { request: RequestReport | null; errors: ErrorReport[]; focus: string; occurrences: Occurrences };

function fullPlace(report: { city: string; region: string; country: string }): string {
  return [report.city, report.region, report.country ? `${countryName(report.country)} (${report.country})` : ''].filter(Boolean).join(', ') || 'Inconnu';
}

export default function ReportDetailPage() {
  const id = useParams<{ id: string }>()?.id ?? '';
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/reports/${encodeURIComponent(id)}`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const result = await response.json().catch(() => ({})) as Detail & { error?: string };
        if (!response.ok) throw new Error(result.error || 'Ce rapport est indisponible.');
        setDetail(result);
      })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Ce rapport est indisponible.'); });
    return () => controller.abort();
  }, [id]);

  // An error opened from its email comes into view.
  useEffect(() => {
    if (detail && id.startsWith('e')) document.getElementById(`erreur-${id}`)?.scrollIntoView({ block: 'start' });
  }, [detail, id]);

  const request = detail?.request;
  const first = detail?.errors[0];
  return <main className="mx-auto w-full max-w-[1100px] min-w-0 space-y-4 pb-10">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Link href={detail?.errors.length && !request ? '/admin/reports?tab=errors' : '/admin/reports'} className="inline-flex h-11 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />Rapports</Link>
      {detail && <CopyButton label="Copier le rapport" text={JSON.stringify(detail, null, 2)} />}
    </div>

    {error && <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700" role="alert">{error}</p>}
    {!detail && !error && <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Chargement du rapport…</p>}

    {detail && <>
      <header className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
          <StatusBadge status={request?.status ?? first?.status ?? null} failed={detail.errors.length > 0} />
          {(request?.kind || first?.kind) && <span className="rounded-full bg-slate-100 px-2 py-1">{KIND_LABELS[request?.kind || first?.kind || '']}</span>}
          {request?.bot && <span className="rounded-full bg-slate-100 px-2 py-1">Robot</span>}
          {(request?.env || first?.env) && <span className="rounded-full bg-violet-100 px-2 py-1 text-violet-700">{request?.env || first?.env}</span>}
          <span>{formatLagosTime(request?.at ?? first?.at ?? 0, 'long')} · heure de Lagos</span>
        </p>
        <h1 className="mt-2 text-xl font-black leading-tight text-slate-950 [overflow-wrap:anywhere] sm:text-2xl">{request?.intent || first?.intent || first?.message || 'Rapport'}</h1>
        <p className="mt-1 font-mono text-xs text-slate-500 [overflow-wrap:anywhere]">{request?.method || first?.method} {request?.path || first?.path}{request?.query ? `?${request.query}` : ''}</p>
        {request?.result && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 [overflow-wrap:anywhere]"><b>Résultat :</b> {request.result}{request.durationMs !== null ? ` · ${request.durationMs} ms` : ''}</p>}
      </header>

      {request ? <Section title="Requête">
        <Fields rows={[
          ['Visiteur', `${request.ip || 'IP inconnue'} · ${fullPlace(request)}`],
          ['Appareil', request.device],
          ['Compte admin', request.user],
          ['Hôte', request.host],
          ['Langue', [request.locale && `page ${request.locale}`, request.browserLanguage && `navigateur ${request.browserLanguage}`].filter(Boolean).join(' · ')],
          ['Provenance', request.referer],
          ['Statut', request.status ? String(request.status) : 'Inconnu (page servie sans retour de la route)'],
          ['Durée', request.durationMs !== null ? `${request.durationMs} ms` : ''],
          ['User-agent', request.userAgent],
          ['Identifiant', request.id],
        ]} />
      </Section> : <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Aucune requête journalisée pour cette erreur (tâche de fond, ou requête non enregistrée).</p>}

      {detail.errors.map((item) => <ErrorCard key={item.id} error={item} focused={item.id === detail.focus} occurrences={detail.occurrences[item.fingerprint]} showVisitor={!request} />)}
    </>}
  </main>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><h2 className="font-extrabold text-slate-900">{title}</h2><div className="mt-3">{children}</div></section>;
}

function Fields({ rows }: { rows: [string, string][] }) {
  return <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
    {rows.filter(([, value]) => value).map(([label, value]) => <div key={label} className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800 [overflow-wrap:anywhere]">{value}</dd>
    </div>)}
  </dl>;
}

function ErrorCard({ error, focused, occurrences, showVisitor }: { error: ErrorReport; focused: boolean; occurrences?: Occurrences[string]; showVisitor: boolean }) {
  const context = Object.keys(error.context).map((key) => [key, String(error.context[key])] as [string, string]);
  return <section id={`erreur-${error.id}`} className={`min-w-0 scroll-mt-20 rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${focused ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'}`}>
    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-red-600"><AlertTriangle className="h-4 w-4" />Erreur {error.source || 'gérée'}</p>
    <h2 className="mt-2 text-lg font-black leading-snug text-red-700 [overflow-wrap:anywhere]">{error.message}</h2>
    <div className="mt-3">
      <Fields rows={[
        ['Type', [error.name, error.code].filter(Boolean).join(' · ')],
        ['Statut', error.status ? String(error.status) : ''],
        ['Intention', error.intent],
        ['Route', error.route],
        ['Quand', `${formatLagosTime(error.at)} (Lagos)`],
        ['Occurrences', occurrences ? `${occurrences.count} au total${occurrences.first ? `, depuis le ${formatLagosTime(occurrences.first)}` : ''}${error.occurrence ? ` · celle-ci est la n° ${error.occurrence}` : ''}` : error.occurrence ? `n° ${error.occurrence}` : ''],
        ['Dernier e-mail', occurrences?.mailed ? formatLagosTime(occurrences.mailed) : ''],
        ['Compte admin', error.user],
        ...(showVisitor ? [['Visiteur', `${error.ip || 'IP inconnue'} · ${fullPlace(error)}`], ['Appareil', error.device]] as [string, string][] : []),
        ['Identifiant', error.id],
      ]} />
    </div>
    {context.length > 0 && <div className="mt-4"><h3 className="text-sm font-bold text-slate-900">Contexte</h3><div className="mt-2"><Fields rows={context} /></div></div>}
    {error.stack && <div className="mt-4">
      <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-bold text-slate-900">Pile d’appels</h3><CopyButton label="Copier la pile" text={`${error.name}: ${error.message}\n${error.stack}`} /></div>
      <pre className="mt-2 max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-100 [overflow-wrap:anywhere]">{error.stack}</pre>
    </div>}
    {error.requestId && error.id !== error.requestId && focused && <Link href={`/admin/reports/${error.requestId}`} className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline"><ExternalLink className="h-4 w-4" />Voir la requête seule</Link>}
  </section>;
}

function CopyButton({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* Clipboard refused: nothing to do. */ }
  };
  return <button type="button" onClick={() => void copy()} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-300">
    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}{copied ? 'Copié' : label}
  </button>;
}
