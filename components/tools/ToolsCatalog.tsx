'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ChevronRight, Search, Wrench, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Tool } from '@/lib/tools';
import { trackEvent } from '@/lib/analytics-client';
import { bilingual } from '@/i18n/copy';
import { LoadMore, usePageParam } from '@/components/ui/Pagination';

/** A tool already localized by the page, with its address in the visitor's language. */
export type CatalogTool = Tool & { href: string };
/** `showCategories` is false on a category page, where every tool shares the category. */
type ToolsCatalogProps = { tools: CatalogTool[]; initialQuery?: string; showCategories?: boolean };
/** Tools added by each "See more": three rows of four on a large screen. */
const STEP = 12;
const ALL = '__all__';

const copy = bilingual({
  all: 'Toutes',
  searchPlaceholder: 'Rechercher un outil...',
  searchLabel: 'Rechercher un outil',
  clearSearch: 'Effacer la recherche',
  filterLabel: 'Filtrer par catégorie',
  count: (total: number) => `${total} outil${total > 1 ? 's' : ''}`,
  shown: (shown: number, total: number) => `${shown} outil${shown > 1 ? 's' : ''} sur ${total}`,
  more: (count: number) => `Voir ${count} outil${count > 1 ? 's' : ''} de plus`,
  open: 'Ouvrir',
  noResultTitle: 'Aucun outil trouvé',
  noResultText: 'Essaie un autre mot-clé ou une autre catégorie.',
}, {
  all: 'All',
  searchPlaceholder: 'Search for a tool...',
  searchLabel: 'Search for a tool',
  clearSearch: 'Clear search',
  filterLabel: 'Filter by category',
  count: (total: number) => `${total} tool${total === 1 ? '' : 's'}`,
  shown: (shown: number, total: number) => `${shown} of ${total} tools`,
  more: (count: number) => `See ${count} more tool${count === 1 ? '' : 's'}`,
  open: 'Open',
  noResultTitle: 'No tool found',
  noResultText: 'Try another keyword or category.',
});

export function ToolsCatalog({ tools, initialQuery = '', showCategories = true }: ToolsCatalogProps) {
  const locale = useLocale();
  const t = copy[locale];
  // Pages of tools shown: ?page=3 shows the first 36, so Back and shared links find the same list.
  const [pages, setPages] = usePageParam();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(ALL);
  const [focusFrom, setFocusFrom] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const lastInitialQuery = useRef(initialQuery);
  const categories = [ALL, ...Array.from(new Set(tools.map((tool) => tool.category)))];

  // A new search from the header replaces the current one; the first render keeps ?page.
  useEffect(() => {
    if (lastInitialQuery.current === initialQuery) return;
    lastInitialQuery.current = initialQuery;
    setQuery(initialQuery);
    setPages(1);
  }, [initialQuery, setPages]);

  // Keyboard and screen reader users land on the first tool just added.
  useEffect(() => {
    if (focusFrom === null) return;
    (gridRef.current?.children[focusFrom] as HTMLElement | undefined)?.focus({ preventScroll: true });
    setFocusFrom(null);
  }, [focusFrom]);

  const filteredTools = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return tools.filter((tool) => {
      const matchesCategory = category === ALL || tool.category === category;
      const searchableText = `${tool.name} ${tool.description} ${tool.category} ${tool.tags.join(' ')}`.toLocaleLowerCase();
      return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [category, query, tools]);

  const visibleTools = filteredTools.slice(0, pages * STEP);
  const shown = visibleTools.length;

  const updateQuery = (value: string) => { setQuery(value); setPages(1); };
  const chooseCategory = (value: string) => { setCategory(value); setPages(1); };
  const showMore = () => {
    setFocusFrom(shown);
    setPages(Math.ceil(shown / STEP) + 1);
  };

  return (
    <>
      <div className={`template-tools__filters mb-6 grid gap-3 rounded-[1.25rem] border border-blue-100 bg-white p-3 shadow-[0_8px_28px_rgba(37,99,235,.06)] sm:p-4 ${showCategories ? 'sm:grid-cols-[1fr_auto]' : ''}`}>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder={t.searchPlaceholder} className="w-full rounded-full border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-10 text-sm text-[#0f172a] outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100" aria-label={t.searchLabel} />
          {query && <button type="button" onClick={() => updateQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-700" aria-label={t.clearSearch}><X className="h-4 w-4" /></button>}
        </label>
        {showCategories && <div className="flex min-w-0 items-center gap-2 pb-1 sm:max-w-xl sm:justify-end sm:pb-0" role="group" aria-label={t.filterLabel}>
          <button type="button" onClick={() => chooseCategory(ALL)} className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-bold transition ${category === ALL ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'border-blue-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800'}`}>{t.all}</button>
          <div className="tools-category-scroll flex min-w-0 gap-2 overflow-x-auto">
            {categories.filter((item) => item !== ALL).map((item) => <button key={item} type="button" onClick={() => chooseCategory(item)} className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-bold transition ${category === item ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'border-blue-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800'}`}>{item}</button>)}
          </div>
        </div>}
      </div>

      <div className="mb-5 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-blue-600" /><span>{t.count(filteredTools.length)}</span></div>
      </div>

      {visibleTools.length > 0 ? (
        <div ref={gridRef} className="template-tools__catalog grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleTools.map((tool, index) => (
            <Link key={tool.slug} href={tool.href} onClick={() => trackEvent('tool_click', { tool: tool.slug, category: tool.category })} style={{ animationDelay: `${(index % STEP) * 55}ms` }} className="template-tools__card tool-card group flex min-h-[230px] flex-col rounded-[22px] border border-blue-100/80 bg-white p-6 shadow-[0_2px_6px_rgba(15,23,42,.04)] transition duration-300 hover:border-blue-200 hover:shadow-[0_25px_50px_rgba(37,99,235,.14)]">
              <div className="mb-5 flex items-start justify-between gap-3">
                <span className="template-tools__icon grid h-14 w-14 place-items-center rounded-2xl bg-[#eff6ff] text-3xl text-blue-700 transition duration-300 group-hover:rotate-[-5deg] group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white" aria-hidden="true">{tool.icon}</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-800">{tool.category}</span>
              </div>
              <h2 className="mb-2 text-base font-bold leading-snug text-[#0f172a] transition-colors group-hover:text-blue-700">{tool.name}</h2>
              <p className="flex-1 text-sm leading-5 text-slate-600">{tool.description}</p>
              <span className="mt-4 inline-flex items-center text-sm font-semibold text-blue-700">{t.open}<ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-blue-200 bg-white px-6 py-16 text-center"><Search className="mx-auto h-8 w-8 text-blue-500" /><h2 className="mt-3 font-black text-[#0f172a]">{t.noResultTitle}</h2><p className="mt-1 text-sm text-slate-500">{t.noResultText}</p></div>
      )}

      <LoadMore shown={shown} total={filteredTools.length} nextPage={Math.ceil(shown / STEP) + 1} counter={t.shown(shown, filteredTools.length)} label={t.more(Math.min(STEP, filteredTools.length - shown))} onMore={showMore} />
    </>
  );
}
