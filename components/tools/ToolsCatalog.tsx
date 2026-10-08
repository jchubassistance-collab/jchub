'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, ChevronRight, Search, Wrench, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Tool } from '@/lib/tools';
import { trackEvent } from '@/lib/analytics-client';

type ToolsCatalogProps = { tools: Tool[]; initialQuery?: string };
const DESKTOP_PAGE_SIZE = 12;
const MOBILE_PAGE_SIZE = 4;

export function ToolsCatalog({ tools, initialQuery = '' }: ToolsCatalogProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DESKTOP_PAGE_SIZE);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState('Toutes');
  const categories = ['Toutes', ...Array.from(new Set(tools.map((tool) => tool.category)))];

  useEffect(() => {
    setQuery(initialQuery);
    setPage(1);
  }, [initialQuery]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const updatePageSize = () => {
      setPageSize(mediaQuery.matches ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE);
      setPage(1);
    };
    updatePageSize();
    mediaQuery.addEventListener('change', updatePageSize);
    return () => mediaQuery.removeEventListener('change', updatePageSize);
  }, []);

  const filteredTools = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return tools.filter((tool) => {
      const matchesCategory = category === 'Toutes' || tool.category === category;
      const searchableText = `${tool.name} ${tool.description} ${tool.category} ${tool.tags.join(' ')}`.toLocaleLowerCase();
      return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [category, query, tools]);

  const pageCount = Math.max(1, Math.ceil(filteredTools.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleTools = filteredTools.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstResult = filteredTools.length ? (currentPage - 1) * pageSize + 1 : 0;
  const lastResult = Math.min(currentPage * pageSize, filteredTools.length);

  const updateQuery = (value: string) => { setQuery(value); setPage(1); };
  const goToPage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), pageCount));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="template-tools__filters mb-6 grid gap-3 rounded-[1.25rem] border border-blue-100 bg-white p-3 shadow-[0_8px_28px_rgba(37,99,235,.06)] sm:grid-cols-[1fr_auto] sm:p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Rechercher un outil..." className="w-full rounded-full border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-10 text-sm text-[#0f172a] outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100" aria-label="Rechercher un outil" />
          {query && <button type="button" onClick={() => updateQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-700" aria-label="Effacer la recherche"><X className="h-4 w-4" /></button>}
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:max-w-xl sm:justify-end sm:pb-0" aria-label="Filtrer par catégorie">
          {categories.map((item) => <button key={item} type="button" onClick={() => { setCategory(item); setPage(1); }} className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-bold transition ${category === item ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'border-blue-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800'}`}>{item}</button>)}
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-blue-600" /><span>{firstResult}-{lastResult} sur {filteredTools.length} outils</span></div>
        {pageCount > 1 && <span className="font-medium">Page {currentPage} sur {pageCount}</span>}
      </div>

      {visibleTools.length > 0 ? (
        <div className="template-tools__catalog grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleTools.map((tool, index) => (
            <Link key={tool.slug} href={tool.path ?? `/outils/${tool.slug}`} onClick={() => trackEvent('tool_click', { tool: tool.slug, category: tool.category })} style={{ animationDelay: `${index * 55}ms` }} className="template-tools__card tool-card group flex min-h-[230px] flex-col rounded-[22px] border border-blue-100/80 bg-white p-6 shadow-[0_2px_6px_rgba(15,23,42,.04)] transition duration-300 hover:border-blue-200 hover:shadow-[0_25px_50px_rgba(37,99,235,.14)]">
              <div className="mb-5 flex items-start justify-between gap-3">
                <span className="template-tools__icon grid h-14 w-14 place-items-center rounded-2xl bg-[#eff6ff] text-3xl text-blue-700 transition duration-300 group-hover:rotate-[-5deg] group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white" aria-label={tool.name}>{tool.icon}</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-800">{tool.category}</span>
              </div>
              <h2 className="mb-2 text-base font-bold leading-snug text-[#0f172a] transition-colors group-hover:text-blue-700">{tool.name}</h2>
              <p className="flex-1 text-sm leading-5 text-slate-600">{tool.description}</p>
              <span className="mt-4 inline-flex items-center text-sm font-semibold text-blue-700">Ouvrir<ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-blue-200 bg-white px-6 py-16 text-center"><Search className="mx-auto h-8 w-8 text-blue-500" /><h2 className="mt-3 font-black text-[#0f172a]">Aucun outil trouvé</h2><p className="mt-1 text-sm text-slate-500">Essaie un autre mot-clé ou une autre catégorie.</p></div>
      )}

      {pageCount > 1 && <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination des outils">
        <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="inline-flex h-10 items-center gap-1 rounded-full border border-blue-100 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Page précédente"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Précédente</span></button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} type="button" onClick={() => goToPage(pageNumber)} aria-current={pageNumber === currentPage ? 'page' : undefined} className={`h-10 min-w-10 rounded-full border px-3 text-sm font-bold transition ${pageNumber === currentPage ? 'border-blue-600 bg-blue-600 text-white' : 'border-blue-100 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'}`}>{pageNumber}</button>)}
        <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageCount} className="inline-flex h-10 items-center gap-1 rounded-full border border-blue-100 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Page suivante"><span className="hidden sm:inline">Suivante</span><ArrowRight className="h-4 w-4" /></button>
      </nav>}
    </>
  );
}
