'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LoaderCircle, Search, Sparkles, X } from 'lucide-react';

type Suggestion = { slug: string; name: string; description: string; href: string; reason: string; icon: string };
type Result = { message: string; suggestions: Suggestion[]; source: 'catalog' | 'ai' | 'cache' };

export function ToolFinder({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || query.trim().length < 2) return;
    setLoading(true); setError(''); setResult(null);
    // The server queues AI calls when several visitors search at once.
    const slowTimer = window.setTimeout(() => setSlow(true), 2500);
    try {
      const response = await fetch('/api/tool-assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: query.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'La recherche a échoué.');
      setResult(data as Result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'La recherche a échoué.');
    } finally { window.clearTimeout(slowTimer); setSlow(false); setLoading(false); }
  };

  const shell = dark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-300' : 'border-blue-100 bg-white/80 text-slate-800 placeholder:text-slate-500';

  return <div className="relative">
    <form onSubmit={submit} className={`flex items-center gap-2 rounded-full border px-3 py-2 ${shell}`}>
      {loading ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-indigo-500"/> : <Search className={`h-4 w-4 shrink-0 ${dark ? 'text-slate-300' : 'text-blue-600'}`}/>}
      <input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={500} aria-label="Décris ce que tu veux faire" placeholder={compact ? 'Que veux-tu faire ?' : 'Que veux-tu faire ? Décris ton besoin…'} className={`min-w-0 flex-1 bg-transparent outline-none ${compact ? 'text-xs' : 'text-sm'} placeholder:opacity-80`} />
      {query && <button type="button" onClick={() => { setQuery(''); setResult(null); setError(''); }} aria-label="Effacer la recherche" className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-3.5 w-3.5"/></button>}
    </form>
    {loading && slow && <p className="absolute right-0 top-full z-[70] mt-2 w-[min(92vw,25rem)] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-600 shadow-xl shadow-slate-950/15" aria-live="polite">Beaucoup de recherches en ce moment, ta réponse arrive dans quelques secondes…</p>}
    {(result || error) &&<section className="absolute right-0 top-full z-[70] mt-2 max-h-[70vh] w-[min(92vw,25rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl shadow-slate-950/15" aria-live="polite">
      <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><Sparkles className="h-4 w-4"/></span><p className="text-sm font-bold">{error ? 'Recherche indisponible' : 'Outils recommandés'}</p></div><button type="button" onClick={() => { setResult(null); setError(''); }} aria-label="Fermer les résultats" className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4"/></button></div>
      {error ? <p className="mt-3 text-xs leading-5 text-slate-600">{error}</p> : <><p className="mt-2 text-xs leading-5 text-slate-600">{result?.message}</p>{result?.suggestions.length ? <div className="mt-3 space-y-2">{result.suggestions.map((suggestion) => <Link key={suggestion.slug} href={suggestion.href} className="block rounded-xl border border-slate-100 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/50"><div className="flex gap-2"><span className="text-base" aria-hidden="true">{suggestion.icon}</span><div className="min-w-0"><p className="text-xs font-bold text-slate-900">{suggestion.name}<span className="ml-1 text-indigo-600">→</span></p><p className="mt-1 text-[11px] leading-4 text-slate-600">{suggestion.reason}</p></div></div></Link>)}</div> : <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">Aucun outil correspondant dans le catalogue actuel.</p>}{result?.source === 'ai' && <p className="mt-3 text-[10px] text-slate-400">Suggestion assistée par IA à partir des outils disponibles.</p>}</>}
    </section>}
  </div>;
}
