'use client';

import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import { ADMIN_PAGE_SIZES, pageFromParam, pageWindow } from '@/lib/pagination';

const PAGE_SIZE_KEY = 'jchub-admin-page-size';

/**
 * The page of a list, kept in the address (?page=3). The history entry is replaced, not added:
 * Back leaves the list instead of going through every page seen, and comes back to the same page.
 */
export function usePageParam(): [number, (page: number) => void] {
  const searchParams = useSearchParams();
  const [page, setPageState] = useState(() => pageFromParam(searchParams?.get('page')));
  const setPage = useCallback((next: number) => {
    const value = Math.max(1, Math.floor(next));
    setPageState(value);
    const url = new URL(window.location.href);
    if (value > 1) url.searchParams.set('page', String(value));
    else url.searchParams.delete('page');
    window.history.replaceState(null, '', url);
  }, []);
  return [page, setPage];
}

/** Rows per page of the admin tables, remembered in this browser. */
export function useAdminPageSize(): [number, (size: number) => void] {
  const [size, setSize] = useState<number>(ADMIN_PAGE_SIZES[0]);
  useEffect(() => {
    try {
      const stored = Number(window.localStorage.getItem(PAGE_SIZE_KEY));
      if ((ADMIN_PAGE_SIZES as readonly number[]).includes(stored)) setSize(stored);
    } catch { /* Blocked storage: the default size. */ }
  }, []);
  const update = useCallback((next: number) => {
    setSize(next);
    try { window.localStorage.setItem(PAGE_SIZE_KEY, String(next)); } catch { /* Kept for this visit only. */ }
  }, []);
  return [size, update];
}

/**
 * "See more" under a public list. It is a real link to the next page, which search engines follow;
 * a plain click adds the next items under the ones already shown, without reloading.
 */
export function LoadMore({ shown, total, nextPage, counter, label, onMore }: {
  shown: number;
  total: number;
  nextPage: number;
  counter: string;
  label: string;
  onMore: () => void;
}) {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams?.toString());
  params.set('page', String(nextPage));
  const click = (event: MouseEvent<HTMLAnchorElement>) => {
    // Ctrl or middle click still opens the next page in a new tab.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onMore();
  };
  if (!total) return null;
  return <div className="mt-10 flex flex-col items-center gap-3">
    <p className="text-sm font-medium text-slate-500" aria-live="polite">{counter}</p>
    <div className="h-1 w-44 overflow-hidden rounded-full bg-blue-100" aria-hidden="true">
      <div className="h-full rounded-full bg-blue-600 transition-[width] duration-500" style={{ width: `${Math.min(100, (shown / total) * 100)}%` }} />
    </div>
    {shown < total && <a href={`?${params.toString()}`} onClick={click} className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-full border border-blue-200 bg-white px-6 text-sm font-bold text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50">
      {label}<ChevronDown className="h-4 w-4" aria-hidden="true" />
    </a>}
  </div>;
}

/**
 * Footer of an admin table: rows shown, rows per page, and the pages (first, last, the current one
 * and its neighbors, "…" between).
 */
export function AdminPagination({ page, pageSize, total, noun, empty, onPage, onPageSize }: {
  page: number;
  pageSize: number;
  total: number;
  /** Plural, after the total: "sur 57 outils". */
  noun: string;
  /** Shown when no row matches. */
  empty: string;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const first = total ? (current - 1) * pageSize + 1 : 0;
  const last = Math.min(current * pageSize, total);
  const button = 'grid h-8 min-w-8 place-items-center rounded-lg px-2 text-xs font-bold';
  return <footer className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-slate-100 px-4 py-3">
    <span className="text-[10px] text-slate-500">{total ? `Affichage de ${first} à ${last} sur ${total} ${noun}` : empty}</span>
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-1.5 text-[10px] text-slate-500">
        Lignes
        {/* The first row shown stays on screen when the size changes. */}
        <select value={pageSize} onChange={(event) => { const size = Number(event.target.value); onPageSize(size); onPage(Math.floor(Math.max(0, first - 1) / size) + 1); }} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400">
          {ADMIN_PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      {totalPages > 1 && <nav aria-label="Pagination" className="flex items-center gap-1">
        <button type="button" aria-label="Page précédente" disabled={current <= 1} onClick={() => onPage(current - 1)} className={`${button} border border-slate-200 text-slate-500 disabled:opacity-40`}><ChevronLeft className="h-4 w-4" /></button>
        {pageWindow(current, totalPages).map((item, index) => item === 'gap'
          ? <span key={`gap-${index}`} className="px-1 text-xs text-slate-400" aria-hidden="true">…</span>
          : <button key={item} type="button" aria-label={`Page ${item}`} aria-current={item === current ? 'page' : undefined} onClick={() => onPage(item)} className={`${button} ${item === current ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:border-blue-300'}`}>{item}</button>)}
        <button type="button" aria-label="Page suivante" disabled={current >= totalPages} onClick={() => onPage(current + 1)} className={`${button} border border-slate-200 text-slate-500 disabled:opacity-40`}><ChevronRight className="h-4 w-4" /></button>
      </nav>}
    </div>
  </footer>;
}
