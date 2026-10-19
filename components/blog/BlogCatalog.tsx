'use client';

import { useLocale } from 'next-intl';
import { ArrowRight, Grid2X2, Grid3X3, List, Search, Tag, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { BlogArticle } from '@/lib/blog';
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import { LoadMore, usePageParam } from '@/components/ui/Pagination';

const ALL = '__all__';
/** Articles added by each "See more": two rows of four on a large screen. */
const STEP = 8;

const copy = bilingual({
  all: 'Tous',
  searchPlaceholder: 'Rechercher un article...',
  searchLabel: 'Rechercher un article',
  clearSearch: 'Effacer la recherche',
  filterByExpertise: 'Filtrer par expertise',
  chooseView: 'Choisir la vue',
  gridView: 'Vue standard',
  compactView: 'Vue compacte',
  listView: 'Vue en liste',
  filterArticles: 'Filtrer les articles',
  found: (count: number) => ` article${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`,
  readArticle: 'Lire l’article',
  noResult: 'Aucun article ne correspond à ta recherche.',
  resetFilters: 'Réinitialiser les filtres',
  shown: (shown: number, total: number) => `${shown} article${shown > 1 ? 's' : ''} sur ${total}`,
  more: (count: number) => `Voir ${count} article${count > 1 ? 's' : ''} de plus`,
}, {
  all: 'All',
  searchPlaceholder: 'Search for an article...',
  searchLabel: 'Search for an article',
  clearSearch: 'Clear search',
  filterByExpertise: 'Filter by expertise',
  chooseView: 'Choose the view',
  gridView: 'Standard view',
  compactView: 'Compact view',
  listView: 'List view',
  filterArticles: 'Filter articles',
  found: (count: number) => ` article${count === 1 ? '' : 's'} found`,
  readArticle: 'Read the article',
  noResult: 'No article matches your search.',
  resetFilters: 'Reset filters',
  shown: (shown: number, total: number) => `${shown} of ${total} articles`,
  more: (count: number) => `See ${count} more article${count === 1 ? '' : 's'}`,
});

/** `showCategories` is false on a category page, where every article shares the category. */
export function BlogCatalog({ articles, showCategories = true }: { articles: BlogArticle[]; showCategories?: boolean }) {
  const t = copy[useLocale()];
  const categories = [ALL, ...Array.from(new Set(articles.map((article) => article.category)))];
  const [category, setCategoryState] = useState(ALL);
  const [query, setQueryState] = useState('');
  // Pages of articles shown: ?page=3 shows the first 24, so Back and shared links find the same list.
  const [pages, setPages] = usePageParam();
  const [view, setView] = useState<'grid' | 'compact' | 'list'>('grid');
  const [focusFrom, setFocusFrom] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const filteredArticles = (category === ALL ? articles : articles.filter((article) => article.category === category)).filter((article) => `${article.title} ${article.description} ${article.keywords.join(' ')}`.toLowerCase().includes(query.toLowerCase().trim()));
  const visibleArticles = filteredArticles.slice(0, pages * STEP);
  const shown = visibleArticles.length;

  const setQuery = (value: string) => { setQueryState(value); setPages(1); };
  const setCategory = (value: string) => { setCategoryState(value); setPages(1); };
  const showMore = () => {
    setFocusFrom(shown);
    setPages(Math.ceil(shown / STEP) + 1);
  };

  // Keyboard and screen reader users land on the first article just added.
  useEffect(() => {
    if (focusFrom === null) return;
    (gridRef.current?.children[focusFrom] as HTMLElement | undefined)?.focus({ preventScroll: true });
    setFocusFrom(null);
  }, [focusFrom]);

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchLabel}
            className="w-full rounded-2xl border border-blue-100 bg-white py-3 pl-11 pr-10 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label={t.clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-700">
              <X className="h-4 w-4" />
            </button>
          )}
        </label>

        <div className="flex items-center justify-between gap-3">
          {showCategories && <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">{t.filterByExpertise}</p>}
          <div className="flex shrink-0 rounded-xl border border-blue-100 bg-white p-1" aria-label={t.chooseView}>
            <button type="button" onClick={() => setView('grid')} aria-label={t.gridView} aria-pressed={view === 'grid'} className={`grid h-8 w-8 place-items-center rounded-lg transition ${view === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-blue-700'}`}><Grid2X2 className="h-4 w-4" /></button>
            <button type="button" onClick={() => setView('compact')} aria-label={t.compactView} aria-pressed={view === 'compact'} className={`grid h-8 w-8 place-items-center rounded-lg transition ${view === 'compact' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-blue-700'}`}><Grid3X3 className="h-4 w-4" /></button>
            <button type="button" onClick={() => setView('list')} aria-label={t.listView} aria-pressed={view === 'list'} className={`grid h-8 w-8 place-items-center rounded-lg transition ${view === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-blue-700'}`}><List className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {showCategories && <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2" aria-label={t.filterArticles}>
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${category === item ? 'border-blue-600 bg-blue-600 text-white shadow-lg' : 'border-blue-100 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'}`}
          >
            {item === ALL ? t.all : item}
          </button>
        ))}
      </div>}

      <p className="mb-5 text-sm text-slate-500">
        <span className="font-black text-slate-900">{filteredArticles.length}</span>{t.found(filteredArticles.length)}
      </p>

      <div ref={gridRef} className={view === 'list' ? 'grid grid-cols-1 gap-3' : view === 'compact' ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4' : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}>
        {visibleArticles.map((article, index) => (
          <Link
            key={article.slug}
            href={{ pathname: '/blog/[slug]', params: { slug: article.slug } }}
            style={{ animationDelay: `${(index % STEP) * 70}ms` }}
            className={`group relative overflow-hidden rounded-[20px] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,.06)] transition-all duration-300 ease-out will-change-transform hover:-translate-y-1 hover:translate-x-0.5 hover:border-blue-300 hover:shadow-[0_18px_40px_rgba(37,99,235,.12)] motion-safe:animate-[fadeIn_0.5s_ease-out] ${view === 'list' ? 'flex items-center gap-3 p-2.5 sm:gap-4 sm:p-3' : 'hover:shadow-[0_20px_50px_rgba(50,140,255,0.18)]'}`}
          >
            <div className={view === 'list' ? 'h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-800 sm:h-24 sm:w-36' : view === 'compact' ? 'aspect-[4/3] overflow-hidden rounded-t-[20px] bg-slate-800' : 'aspect-[16/9] overflow-hidden rounded-t-[20px] bg-slate-800'}>
              <img src={article.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <div className={view === 'list' ? 'min-w-0 flex-1 py-0.5 pr-0.5' : view === 'compact' ? 'p-2.5' : 'p-3.5'}>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                <span className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-700">{article.category}</span>
              </div>
              <h2 className={`${view === 'compact' ? 'line-clamp-2 text-sm' : 'text-base'} mb-1.5 font-black leading-snug text-slate-900 group-hover:text-blue-700`}>{article.title}</h2>
              <p className={`mb-3 text-sm leading-5 text-slate-600 ${view === 'compact' ? 'hidden' : view === 'list' ? 'line-clamp-2' : 'line-clamp-2'}`}>{article.description}</p>
              <div className={`${view === 'compact' || view === 'list' ? 'hidden' : 'mb-3'} flex flex-wrap gap-1.5`}>
                {article.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[10px] text-slate-500">
                    <Tag className="h-3 w-3" />{tag}
                  </span>
                ))}
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700">{t.readArticle} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
            </div>
          </Link>
        ))}
      </div>

      {!visibleArticles.length && (
        <div className="border border-dashed border-white/10 bg-[#071526] px-6 py-14 text-center">
          <Search className="mx-auto mb-3 h-7 w-7 text-slate-500" />
          <p className="font-bold text-white">{t.noResult}</p>
          <button type="button" onClick={() => { setQuery(''); setCategory(ALL); }} className="mt-3 text-sm font-bold text-cyan-300 hover:text-cyan-200">{t.resetFilters}</button>
        </div>
      )}

      {shown > 0 && <LoadMore shown={shown} total={filteredArticles.length} nextPage={Math.ceil(shown / STEP) + 1} counter={t.shown(shown, filteredArticles.length)} label={t.more(Math.min(STEP, filteredArticles.length - shown))} onMore={showMore} />}
    </>
  );
}
