'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert, RefreshCw, ServerCog } from 'lucide-react';
import { cachedJson, fetchJson } from '@/lib/admin-cache';

type Service = { name: string; configured: boolean; detail: string };
type SettingsData = { services: Service[]; checkedAt: string; error?: string };

const SETTINGS_URL = '/api/admin/settings';

export default function AdminSettingsPage() {
  const [data, setData] = useState<SettingsData | null>(() => cachedJson<SettingsData>(SETTINGS_URL) ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      setData(await fetchJson<SettingsData>(SETTINGS_URL, 'Impossible de vérifier les services.'));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Impossible de vérifier les services.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return <div className="mx-auto max-w-5xl space-y-6"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Configuration</p><h1 className="mt-2 text-3xl font-black text-slate-950">État des services</h1><p className="mt-2 text-sm text-slate-600">État calculé depuis la configuration serveur actuelle. Les secrets ne sont jamais affichés.</p></div><button onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:border-blue-200 hover:text-blue-700 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Actualiser</button></header>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {data && <><section className="grid gap-4 sm:grid-cols-2">{data.services.map((item) => <article key={item.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.name}</p><p className="mt-2 text-sm font-bold text-slate-900">{item.configured ? 'Identifiants détectés' : 'Configuration manquante'}</p></div><span className={`grid h-9 w-9 place-items-center rounded-xl ${item.configured ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{item.configured ? <CheckCircle2 className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}</span></div><p className="mt-3 text-xs leading-5 text-slate-500">{item.detail}</p></article>)}</section><p className="flex items-center gap-2 text-xs text-slate-400"><ServerCog className="h-4 w-4" />Vérification effectuée le {new Date(data.checkedAt).toLocaleString('fr-FR')}. La présence des identifiants ne teste pas l’accès distant au service.</p></>}
  </div>;
}
