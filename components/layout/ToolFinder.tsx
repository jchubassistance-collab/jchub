'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { LoaderCircle, Search, Sparkles, X } from 'lucide-react';
import type { Tool } from '@/lib/tools';
import { findToolsByKeywords, normalizeSearchText } from '@/lib/tool-search';
import { bilingual } from '@/i18n/copy';
import { LOCALE_HEADER } from '@/i18n/request-locale';
import type { Locale } from '@/i18n/routing';

type CatalogTool = Tool & { href: string };

const copy = bilingual({
  searchFailed: 'La recherche a échoué.',
  confident: 'Outils correspondants',
  close: 'Ce qui s’en rapproche dans le catalogue',
  describe: 'Décris ce que tu veux faire',
  placeholderCompact: 'Que veux-tu faire ?',
  placeholder: 'Que veux-tu faire ? Décris ton besoin…',
  clear: 'Effacer la recherche',
  unavailable: 'Recherche indisponible',
  recommended: 'Outils recommandés',
  closeResults: 'Fermer les résultats',
  noMatch: 'Aucun outil correspondant dans le catalogue actuel.',
  busy: 'Beaucoup de recherches en ce moment, ta réponse arrive dans quelques secondes…',
  thinking: 'L’IA cherche l’outil le plus adapté…',
  aiNote: 'Suggestion assistée par IA à partir des outils disponibles.',
}, {
  searchFailed: 'The search failed.',
  confident: 'Matching tools',
  close: 'The closest matches in the catalog',
  describe: 'Describe what you want to do',
  placeholderCompact: 'What do you want to do?',
  placeholder: 'What do you want to do? Describe your need…',
  clear: 'Clear search',
  unavailable: 'Search unavailable',
  recommended: 'Recommended tools',
  closeResults: 'Close results',
  noMatch: 'No matching tool in the current catalog.',
  busy: 'Lots of searches right now, your answer will arrive in a few seconds…',
  thinking: 'The AI is looking for the best tool…',
  aiNote: 'AI-assisted suggestion based on the available tools.',
});

type Suggestion = { slug: string; name: string; description: string; href: string; reason: string; icon: string };
type Result = { message: string; suggestions: Suggestion[]; source: 'catalog' | 'ai' | 'cache' };

// The AI is asked only after a pause on a real sentence the catalog cannot answer:
// every AI request counts against the visitor's daily quota.
const AI_PAUSE_MS = 1_400;
const MIN_AI_WORDS = 3;

// Shared by the header and mobile menu instances; loaded on first focus, in the page's language.
const catalogRequests: Partial<Record<Locale, Promise<CatalogTool[]>>> = {};
function loadCatalog(locale: Locale): Promise<CatalogTool[]> {
  catalogRequests[locale] ??= fetch(`/api/tool-assistant?lang=${locale}`)
    .then((response) => (response.ok ? response.json() : { tools: [] }))
    .then((data: { tools?: CatalogTool[] }) => data.tools ?? [])
    .catch(() => {
      delete catalogRequests[locale];
      return [];
    });
  return catalogRequests[locale];
}

function toSuggestion(tool: CatalogTool): Suggestion {
  return { slug: tool.slug, name: tool.name, description: tool.description, href: tool.href, reason: tool.description, icon: tool.icon };
}

export function ToolFinder({ compact = false, dark = false, onNavigate }: { compact?: boolean; dark?: boolean; onNavigate?: () => void }) {
  const locale = useLocale();
  const t = copy[locale];
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState<CatalogTool[] | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const aiTimer = useRef<number | undefined>(undefined);
  const aiRequest = useRef<AbortController | null>(null);
  const lastAiQuery = useRef('');
  const panelId = useId();

  const prepare = () => {
    setOpen(true);
    if (!catalog) void loadCatalog(locale).then(setCatalog);
  };

  const askAi = async (text: string) => {
    const normalized = normalizeSearchText(text);
    if (normalized === lastAiQuery.current) return;
    lastAiQuery.current = normalized;
    aiRequest.current?.abort();
    const controller = new AbortController();
    aiRequest.current = controller;
    setLoading(true); setError('');
    // The server queues AI calls when several visitors search at once.
    const slowTimer = window.setTimeout(() => setSlow(true), 2500);
    try {
      const response = await fetch('/api/tool-assistant', { method: 'POST', headers: { 'Content-Type': 'application/json', [LOCALE_HEADER]: locale }, body: JSON.stringify({ query: text }), signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t.searchFailed);
      setResult(data as Result);
    } catch (caught) {
      if (controller.signal.aborted) {
        // Interrupted by new typing: the same text may be asked again later.
        if (lastAiQuery.current === normalized) lastAiQuery.current = '';
        return;
      }
      lastAiQuery.current = '';
      setError(caught instanceof Error ? caught.message : t.searchFailed);
    } finally {
      window.clearTimeout(slowTimer);
      if (aiRequest.current === controller) { setSlow(false); setLoading(false); }
    }
  };

  // Instant catalog suggestions on every keystroke; the AI only after a pause.
  useEffect(() => {
    window.clearTimeout(aiTimer.current);
    // An answer to the previous text must not overwrite suggestions for the new one.
    aiRequest.current?.abort();
    const text = query.trim();
    if (text.length < 2) {
      setResult(null); setError(''); setLoading(false); setSlow(false);
      return;
    }
    if (!catalog) return;
    const match = findToolsByKeywords(text, catalog);
    setError('');
    setResult(match.tools.length
      ? { message: match.confident ? t.confident : t.close, suggestions: (match.tools as CatalogTool[]).map(toSuggestion), source: 'catalog' }
      : null);
    const words = normalizeSearchText(text).split(' ').filter((word) => word.length >= 3).length;
    if (!match.confident && words >= MIN_AI_WORDS) {
      aiTimer.current = window.setTimeout(() => { void askAi(text); }, AI_PAUSE_MS);
    }
    return () => window.clearTimeout(aiTimer.current);
  }, [query, catalog]);

  // Close the panel on Escape or on a click outside the search.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = query.trim();
    if (text.length < 2) return;
    setOpen(true);
    window.clearTimeout(aiTimer.current);
    // Enter asks the AI at once, unless the catalog already answered confidently.
    if (!catalog || !findToolsByKeywords(text, catalog).confident) void askAi(text);
  };

  const reset = () => {
    aiRequest.current?.abort();
    lastAiQuery.current = '';
    setQuery(''); setResult(null); setError(''); setOpen(false);
  };

  const choose = () => {
    reset();
    onNavigate?.();
  };

  const showPanel = open && (Boolean(result) || Boolean(error) || loading);
  const shell = dark ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-300' : 'border-blue-100 bg-white/80 text-slate-800 placeholder:text-slate-500';

  return <div ref={containerRef} className="relative">
    <form onSubmit={submit} role="search" className={`flex items-center gap-2 rounded-full border px-3 py-2 ${shell}`}>
      {loading ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-indigo-500"/> : <Search className={`h-4 w-4 shrink-0 ${dark ? 'text-slate-300' : 'text-blue-600'}`}/>}
      <input value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onFocus={prepare} maxLength={500} role="combobox" aria-autocomplete="list" aria-label={t.describe} aria-expanded={showPanel} aria-controls={panelId} placeholder={compact ? t.placeholderCompact : t.placeholder} className={`min-w-0 flex-1 bg-transparent outline-none ${compact ? 'text-xs' : 'text-sm'} placeholder:opacity-80`} />
      {query && <button type="button" onClick={reset} aria-label={t.clear} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-3.5 w-3.5"/></button>}
    </form>
    {showPanel && <section id={panelId} className="absolute right-0 top-full z-[70] mt-2 max-h-[70vh] w-[min(92vw,25rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl shadow-slate-950/15" aria-live="polite">
      <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><Sparkles className="h-4 w-4"/></span><p className="text-sm font-bold">{error ? t.unavailable : t.recommended}</p></div><button type="button" onClick={() => setOpen(false)} aria-label={t.closeResults} className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4"/></button></div>
      {error ? <p className="mt-3 text-xs leading-5 text-slate-600">{error}</p> : <>
        {result && <p className="mt-2 text-xs leading-5 text-slate-600">{result.message}</p>}
        {result?.suggestions.length ? <div className="mt-3 space-y-2">{result.suggestions.map((suggestion) => <Link key={suggestion.slug} href={suggestion.href} onClick={choose} className="block rounded-xl border border-slate-100 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/50"><div className="flex gap-2"><span className="text-base" aria-hidden="true">{suggestion.icon}</span><div className="min-w-0"><p className="text-xs font-bold text-slate-900">{suggestion.name}<span className="ml-1 text-indigo-600">→</span></p><p className="mt-1 text-[11px] leading-4 text-slate-600">{suggestion.reason}</p></div></div></Link>)}</div> : result && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">{t.noMatch}</p>}
        {loading && <p className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500"><LoaderCircle className="h-3.5 w-3.5 animate-spin text-indigo-500"/>{slow ? t.busy : t.thinking}</p>}
        {result && result.source !== 'catalog' && <p className="mt-3 text-[10px] text-slate-400">{t.aiNote}</p>}
      </>}
    </section>}
  </div>;
}
