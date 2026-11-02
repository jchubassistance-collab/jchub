'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ExternalLink, FileText, Loader2, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { cachedJson, fetchJson, rememberJson } from '@/lib/admin-cache';
import { categoryKey, normalizeCategory, WRITER_CATEGORIES, WRITER_LIMITS, type WriterArticleSummary } from '@/lib/writer-rules';
import type { PerformanceRange, WriterPerformance } from '@/lib/writer-performance';
import { publicSiteUrl } from '@/components/redaction/WriterShell';

export type { WriterArticleSummary };

const ARTICLES_URL = '/api/redaction/articles';

/** The writer's articles, newest change first: those of the last visit at once, then fresh ones. */
export function useWriterArticles() {
  const [articles, setArticles] = useState<WriterArticleSummary[]>(() => cachedJson<{ articles?: WriterArticleSummary[] }>(ARTICLES_URL)?.articles || []);
  const [loaded, setLoaded] = useState(() => cachedJson(ARTICLES_URL) !== undefined);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      setArticles((await fetchJson<{ articles?: WriterArticleSummary[] }>(ARTICLES_URL, 'Impossible de charger vos articles.')).articles || []);
      setLoaded(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Impossible de charger vos articles.'); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return { articles, loaded, error, reload: load };
}

const CATEGORIES_URL = '/api/redaction/categories';

/** Categories writers choose from, built-in and added ones; `add` stores a new one for every writer. */
export function useWriterCategories() {
  const [categories, setCategories] = useState<string[]>(() => cachedJson<{ categories?: string[] }>(CATEGORIES_URL)?.categories || [...WRITER_CATEGORIES]);
  useEffect(() => {
    fetchJson<{ categories?: string[] }>(CATEGORIES_URL).then((data) => { if (data.categories) setCategories(data.categories); }).catch(() => undefined);
  }, []);
  const add = useCallback(async (name: string) => {
    const response = await fetch(CATEGORIES_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const data = await response.json().catch(() => ({})) as { error?: string; name?: string; categories?: string[] };
    if (!response.ok || !data.name || !data.categories) throw new Error(data.error || 'Ajout de la catégorie impossible.');
    rememberJson(CATEGORIES_URL, { categories: data.categories });
    setCategories(data.categories);
    return data.name;
  }, []);
  return { categories, add };
}

/** Category picker: the list opens on click and narrows as the writer types; a new name can be added to everyone's list. */
export function CategoryField({ id, value, onChange, disabled, className }: { id: string; value: string; onChange: (value: string) => void; disabled?: boolean; className: string }) {
  const { categories, add } = useWriterCategories();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  // What the writer typed since the list opened: an opened list shows every category.
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const typed = normalizeCategory(value);
  const isNew = typed.length >= 2 && !categories.some((category) => categoryKey(category) === categoryKey(typed));
  const shown = query ? categories.filter((category) => categoryKey(category).includes(categoryKey(query))) : categories;
  const show = (text: string) => { setQuery(text); setOpen(true); setActive(0); };
  const pick = (category: string) => { setError(''); onChange(category); setOpen(false); };
  const save = async () => {
    setAdding(true); setError('');
    try { onChange(await add(typed)); setOpen(false); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Ajout de la catégorie impossible.'); }
    finally { setAdding(false); }
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) { show(''); return; }
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => (current + step + shown.length) % Math.max(shown.length, 1));
    } else if (event.key === 'Enter' && open && shown[active]) {
      event.preventDefault(); pick(shown[active]);
    } else if (event.key === 'Escape') setOpen(false);
  };
  return <>
    <span className="relative block">
      <input
        ref={inputRef} id={id} value={value} disabled={disabled} autoComplete="off"
        role="combobox" aria-expanded={open} aria-controls={`${id}-list`} aria-autocomplete="list"
        onFocus={() => show('')} onClick={() => !open && show('')} onBlur={() => setOpen(false)}
        onChange={(event) => { setError(''); onChange(event.target.value); show(event.target.value); }}
        onKeyDown={onKeyDown} maxLength={WRITER_LIMITS.category} placeholder="Choisir ou saisir une catégorie" className={`${className} pr-9`}
      />
      <button type="button" tabIndex={-1} aria-label="Afficher les catégories" disabled={disabled} onMouseDown={(event) => { event.preventDefault(); if (open) setOpen(false); else { inputRef.current?.focus(); show(''); } }} className="absolute right-1 top-1/2 mt-[3px] grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:text-slate-600">
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && shown.length > 0 && <ul id={`${id}-list`} role="listbox" className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm font-normal shadow-lg">
        {shown.map((category, index) => <li key={category} role="option" aria-selected={categoryKey(category) === categoryKey(value)} onMouseDown={(event) => { event.preventDefault(); pick(category); }} onMouseEnter={() => setActive(index)} className={`flex cursor-pointer items-center justify-between px-3 py-2 text-slate-700 ${index === active ? 'bg-blue-50 text-blue-800' : ''}`}>
          {category}{categoryKey(category) === categoryKey(value) && <Check className="h-4 w-4 text-blue-600" />}
        </li>)}
      </ul>}
    </span>
    {isNew && <button type="button" onClick={() => void save()} disabled={disabled || adding} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60">{adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}Ajouter « {typed} » aux catégories</button>}
    {error && <span role="alert" className="mt-1 block text-xs font-normal text-red-600">{error}</span>}
  </>;
}

export const statusLabels: Record<string, string> = { draft: 'Brouillon', published: 'Publié', archived: 'Archivé', scheduled: 'Programmé' };
const statusTones: Record<string, string> = { draft: 'border-blue-100 bg-blue-50 text-blue-700', published: 'border-emerald-100 bg-emerald-50 text-emerald-700', archived: 'border-slate-200 bg-slate-100 text-slate-600', scheduled: 'border-violet-100 bg-violet-50 text-violet-700' };

export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex rounded-lg border px-3 py-1 text-xs font-semibold ${statusTones[status] || statusTones.archived}`}>{statusLabels[status] || status}</span>;
}

export function ArticleThumb({ src, className = 'h-14 w-14' }: { src: string; className?: string }) {
  if (src) return <img src={src} alt="" loading="lazy" className={`${className} shrink-0 rounded-lg object-cover`} />;
  return <span className={`${className} grid shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#e8efff] to-[#c9d8fb] text-[#2457c5]`}><FileText className="h-5 w-5" /></span>;
}

export function formatDay(iso: string | null, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return iso ? new Date(iso).toLocaleDateString('fr-FR', options) : '—';
}

/** Date that matters for a row: publication for an online article, last change otherwise. */
export const articleDate = (article: WriterArticleSummary) => article.status === 'published' ? article.publishedAt : article.updatedAt || article.createdAt;

export const articleUrl = (slug: string) => `${publicSiteUrl}/fr/blog/${encodeURIComponent(slug)}`;
export const canDelete = (article: Pick<WriterArticleSummary, 'status' | 'publishedAt'>) => article.status === 'draft' && !article.publishedAt;

export async function deleteArticle(id: string) {
  const response = await fetch(`/api/redaction/articles/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const data = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(data.error || 'Suppression impossible.');
}

export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <section className={`rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,28,63,.05)] ${className}`}>{children}</section>;
}

export function Notice({ tone = 'error', children }: { tone?: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const styles = { error: 'border-red-200 bg-red-50 text-red-700', success: 'border-emerald-200 bg-emerald-50 text-emerald-800', info: 'border-blue-100 bg-blue-50 text-blue-900' };
  return <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${styles[tone]}`}>{children}</p>;
}

/**
 * Articles with their actions: a table when its box is wide enough, a stacked list otherwise.
 * The box decides (container query), not the screen: the dashboard card is narrow on a laptop too.
 */
export function ArticleTable({ articles, onChanged, onError }: { articles: WriterArticleSummary[]; onChanged: () => void; onError: (message: string) => void }) {
  const edit = (article: WriterArticleSummary) => `/admin/redaction/articles/${encodeURIComponent(article.id)}`;
  return <div className="@container">
    <ul className="divide-y divide-slate-100 @xl:hidden">{articles.map((article) => <li key={article.id} className="flex gap-3 py-3.5">
      <Link href={edit(article)} className="shrink-0"><ArticleThumb src={article.image} className="h-12 w-12" /></Link>
      <div className="min-w-0 flex-1">
        <Link href={edit(article)} className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">{article.title}</Link>
        <p className="mt-0.5 truncate text-xs text-slate-500">{article.category || 'Sans catégorie'} · {formatDay(articleDate(article))}</p>
        <div className="mt-2 flex items-center justify-between gap-2"><StatusBadge status={article.status} /><ArticleActions article={article} onChanged={onChanged} onError={onError} /></div>
      </div>
    </li>)}</ul>
    <table className="hidden w-full text-left @xl:table">
      <thead className="text-sm text-slate-600"><tr className="border-b border-slate-200"><th className="py-3 pr-3 font-medium">Titre</th><th className="px-3 py-3 font-medium">Statut</th><th className="px-3 py-3 font-medium">Date</th><th className="py-3 pl-3 text-center font-medium">Actions</th></tr></thead>
      <tbody>{articles.map((article) => <tr key={article.id} className="border-b border-slate-100 last:border-0">
        <td className="py-3 pr-3"><Link href={edit(article)} className="flex min-w-0 items-center gap-3.5"><ArticleThumb src={article.image} /><span className="min-w-0"><strong className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">{article.title}</strong><small className="mt-1 block text-xs text-slate-500">{article.category || 'Sans catégorie'}</small></span></Link></td>
        <td className="px-3 py-3"><StatusBadge status={article.status} /></td>
        <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-500">{formatDay(articleDate(article))}</td>
        <td className="py-3 pl-3"><ArticleActions article={article} onChanged={onChanged} onError={onError} /></td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function ArticleActions({ article, onChanged, onError }: { article: WriterArticleSummary; onChanged: () => void; onError: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    window.addEventListener('pointerdown', onPointer);
    return () => window.removeEventListener('pointerdown', onPointer);
  }, [open]);
  const remove = async () => {
    setOpen(false);
    if (!window.confirm(`Supprimer le brouillon « ${article.title} » ? Cette action est définitive.`)) return;
    setBusy(true);
    try { await deleteArticle(article.id); onChanged(); }
    catch (cause) { onError(cause instanceof Error ? cause.message : 'Suppression impossible.'); }
    finally { setBusy(false); }
  };
  const hasMenu = article.status === 'published' || canDelete(article);
  return <div ref={ref} className="relative flex items-center justify-center gap-1.5">
    <Link href={`/admin/redaction/articles/${encodeURIComponent(article.id)}`} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700">Éditer</Link>
    {hasMenu ? <button onClick={() => setOpen(!open)} disabled={busy} aria-label={`Plus d’actions pour ${article.title}`} aria-expanded={open} className="grid h-9 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}</button> : <span className="w-8" />}
    {open && <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">
      {article.status === 'published' && <a href={articleUrl(article.slug)} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"><ExternalLink className="h-3.5 w-3.5" />Voir sur le site</a>}
      {canDelete(article) && <button onClick={() => void remove()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" />Supprimer le brouillon</button>}
    </div>}
  </div>;
}

/** Performance of the writer's articles over 7, 30 or 90 days: the last answer at once, then a fresh one. */
export function useWriterPerformance(days: PerformanceRange) {
  const url = `/api/redaction/performance?jours=${days}`;
  const [data, setData] = useState<WriterPerformance | undefined>(() => cachedJson<WriterPerformance>(url));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    const kept = cachedJson<WriterPerformance>(url);
    if (kept) setData(kept);
    fetchJson<WriterPerformance>(url, 'Impossible de charger vos statistiques.')
      .then((fresh) => { if (!cancelled) setData(fresh); })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Impossible de charger vos statistiques.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url]);
  return { data, loading, error };
}
