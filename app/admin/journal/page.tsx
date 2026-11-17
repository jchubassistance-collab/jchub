'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { History, Loader2, RefreshCw, Search } from 'lucide-react';

type Entry = { id: string; at: string; uid: string; email: string; role: string; method: string; path: string; action: string; ip: string };

const roleLabels: Record<string, string> = { admin: 'Admin', cm: 'CM', writer: 'Rédaction', system: 'Système', unknown: 'Sans rôle' };
const roleTones: Record<string, string> = {
  admin: 'bg-blue-50 text-blue-700', cm: 'bg-violet-50 text-violet-700', writer: 'bg-emerald-50 text-emerald-700',
  system: 'bg-slate-100 text-slate-600', unknown: 'bg-amber-50 text-amber-700',
};
const methodTones: Record<string, string> = { DELETE: 'text-red-700', POST: 'text-blue-700', PATCH: 'text-amber-700', PUT: 'text-amber-700' };

function formatDate(value: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function ActivityLogPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (options: { before?: string; email?: string } = {}) => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (options.before) params.set('before', options.before);
      if (options.email) params.set('email', options.email);
      const response = await fetch(`/api/admin/activity?${params}`, { cache: 'no-store' });
      const data = await response.json() as { entries?: Entry[]; next?: string | null; error?: string };
      if (!response.ok) throw new Error(data.error || 'Journal indisponible.');
      setEntries((current) => options.before ? [...current, ...(data.entries || [])] : data.entries || []);
      setNext(data.next || null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Journal indisponible.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function applyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim().toLowerCase();
    setFilter(value);
    void load({ email: value || undefined });
  }

  const accounts = Array.from(new Set(entries.map((entry) => entry.email).filter(Boolean))).sort();

  return <section className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-indigo-600">Sécurité</p>
        <h1 className="mt-2 flex items-center gap-2 text-3xl font-black text-slate-950"><History className="h-7 w-7 text-slate-400" />Journal d’activité</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Qui a modifié, publié ou supprimé quoi, et quand : chaque action d’un compte admin, CM ou rédaction, ainsi que les connexions. Les entrées sont gardées un an.</p>
      </div>
      <button type="button" onClick={() => void load({ email: filter || undefined })} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300"><RefreshCw className="h-4 w-4" />Actualiser</button>
    </header>

    <form onSubmit={applyFilter} className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="relative min-w-[240px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input list="activity-accounts" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Filtrer par compte (adresse e-mail)" aria-label="Filtrer par compte" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        <datalist id="activity-accounts">{accounts.map((account) => <option key={account} value={account} />)}</datalist>
      </label>
      <button className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Filtrer</button>
      {filter && <button type="button" onClick={() => { setEmail(''); setFilter(''); void load(); }} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Tous les comptes</button>}
    </form>

    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead><tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-500"><th className="px-4 py-3">Date</th><th className="px-3 py-3">Compte</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Adresse appelée</th><th className="px-3 py-3">IP</th></tr></thead>
          <tbody>
            {entries.map((entry) => <tr key={entry.id} className="border-b border-slate-100 align-top last:border-0 hover:bg-slate-50/60">
              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{formatDate(entry.at)}</td>
              <td className="px-3 py-3"><span className="block max-w-[220px] truncate text-xs font-semibold text-slate-800" title={entry.email || entry.uid}>{entry.email || entry.uid || '—'}</span><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleTones[entry.role] || roleTones.unknown}`}>{roleLabels[entry.role] || entry.role}</span></td>
              <td className="px-3 py-3 text-xs text-slate-800">{entry.action}</td>
              <td className="px-3 py-3"><code className="break-all text-[11px] text-slate-500"><span className={`mr-1 font-bold ${methodTones[entry.method] || 'text-slate-600'}`}>{entry.method}</span>{entry.path}</code></td>
              <td className="whitespace-nowrap px-3 py-3 text-[11px] text-slate-500">{entry.ip || '—'}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {!loading && !entries.length && !error && <p className="p-6 text-center text-sm text-slate-500">Aucune activité enregistrée{filter ? ' pour ce compte' : ''}.</p>}
      <div className="flex justify-center border-t border-slate-100 p-3">
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          : next && <button type="button" onClick={() => void load({ before: next, email: filter || undefined })} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300">Charger plus</button>}
      </div>
    </div>
  </section>;
}
