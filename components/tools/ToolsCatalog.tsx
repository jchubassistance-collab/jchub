'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, ChevronRight, Search, Wrench, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Tool } from '@/lib/tools';

type ToolsCatalogProps = {
  tools: Tool[];
};

const PAGE_SIZE = 12;

export function ToolsCatalog({ tools }: ToolsCatalogProps) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Toutes');
  const categories = ['Toutes', ...Array.from(new Set(tools.map((tool) => tool.category)))];
  const filteredTools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tools.filter((tool) => {
      const matchesCategory = category === 'Toutes' || tool.category === category;
      const searchableText = `${tool.name} ${tool.description} ${tool.category} ${tool.tags.join(' ')}`.toLowerCase();
      return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [category, query, tools]);
  const pageCount = Math.max(1, Math.ceil(filteredTools.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleTools = filteredTools.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const firstResult = filteredTools.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastResult = Math.min(currentPage * PAGE_SIZE, filteredTools.length);

  const updateQuery = (value: string) => { setQuery(value); setPage(1); };

  const goToPage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), pageCount));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_auto] sm:p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Rechercher un outil..." className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100" aria-label="Rechercher un outil" />
          {query && <button type="button" onClick={() => updateQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label="Effacer la recherche"><X className="h-4 w-4" /></button>}
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:max-w-xl sm:justify-end sm:pb-0" aria-label="Filtrer par catégorie">
          {categories.map((item) => <button key={item} type="button" onClick={() => { setCategory(item); setPage(1); }} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition ${category === item ? 'bg-[#17324d] text-white' : 'bg-white text-slate-600 hover:bg-orange-50 hover:text-orange-700'}`}>{item}</button>)}
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Wrench className="h-4 w-4 text-brand-600" />
          <span>
            {firstResult}-{lastResult} sur {filteredTools.length} outils
          </span>
        </div>
        {pageCount > 1 && (
          <span className="text-sm font-medium text-gray-500">
            Page {currentPage} sur {pageCount}
          </span>
        )}
      </div>

      {visibleTools.length > 0 ? <div className="tools-catalog grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleTools.map((tool, index) => (
          <Link
            key={tool.slug}
            href={`/outils/${tool.slug}`}
            style={{ animationDelay: `${index * 55}ms` }}
            className="tool-card group flex min-h-[218px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-teal-300 hover:shadow-[0_20px_40px_-24px_rgba(15,118,110,.55)]"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="tool-icon flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-2xl transition duration-300 group-hover:rotate-3 group-hover:scale-110" aria-label={tool.name}>
                {tool.icon}
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                {tool.category}
              </span>
            </div>
            <h2 className="mb-2 text-base font-bold leading-snug text-slate-900 group-hover:text-orange-600">
              {tool.name}
            </h2>
            <p className="flex-1 text-sm leading-5 text-slate-600">{tool.description}</p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-orange-600">
              Utiliser l&apos;outil
              <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div> : <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center"><Search className="mx-auto h-8 w-8 text-slate-300" /><h2 className="mt-3 font-black text-slate-800">Aucun outil trouvé</h2><p className="mt-1 text-sm text-slate-500">Essaie un autre mot-clé ou une autre catégorie.</p></div>}

      {pageCount > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination des outils">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="inline-flex h-10 items-center gap-1 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Page précédente"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Précédente</span>
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => goToPage(pageNumber)}
              aria-current={pageNumber === currentPage ? 'page' : undefined}
              className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-bold transition ${
                pageNumber === currentPage
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === pageCount}
            className="inline-flex h-10 items-center gap-1 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 transition hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Page suivante"
          >
            <span className="hidden sm:inline">Suivante</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </>
  );
}
