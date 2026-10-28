import { countryName } from '@/lib/reports/core';

/** Pieces shared by the report list and the report detail. */

export const KIND_LABELS: Record<string, string> = { page: 'Page', api: 'API', admin: 'Admin', cron: 'Tâche', auth: 'Connexion' };

/** "14:32:05" today, "27 oct., 14:32" before, in Lagos time. */
export function shortTime(time: number, now: number): string {
  const day = (value: number) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Lagos', dateStyle: 'short' }).format(new Date(value));
  return new Intl.DateTimeFormat('fr-FR', day(time) === day(now)
    ? { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', second: '2-digit' }
    : { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(time));
}

export function place(report: { city: string; country: string }): string {
  return [report.city, countryName(report.country)].filter(Boolean).join(', ') || 'Lieu inconnu';
}

export function StatusBadge({ status, failed = false }: { status: number | null; failed?: boolean }) {
  const tone = failed || (status && status >= 500) ? 'bg-red-100 text-red-700'
    : !status ? 'bg-slate-100 text-slate-500'
      : status >= 400 ? 'bg-amber-100 text-amber-800'
        : status >= 300 ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700';
  return <span className={`inline-flex h-6 shrink-0 items-center rounded-full px-2 text-[11px] font-bold tabular-nums ${tone}`}>{status || '—'}</span>;
}

