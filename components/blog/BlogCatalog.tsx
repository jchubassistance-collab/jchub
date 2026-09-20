'use client';

import Link from 'next/link';
import { ArrowRight, Grid2X2, Grid3X3, List, Search, Tag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { BlogArticle } from '@/lib/blog';

export function BlogCatalog({ articles }: { articles: BlogArticle[] }) {
  const pageSize = 8;
  const categories = ['Tous', ...Array.from(new Set(articles.map((article) => article.category)))];
  const [category, setCategory] = useState('Tous');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'grid' | 'compact' | 'list'>('grid');
  const filteredArticles = (category === 'Tous' ? articles : articles.filter((article) => article.category === category)).filter((article) => `${article.title} ${article.description} ${article.keywords.join(' ')}`.toLowerCase().includes(query.toLowerCase().trim()));
  const pageCount = Math.max(1, Math.ceil(filteredArticles.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleArticles = filteredArticles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => setPage(1), [category, query]);

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un article..."
            aria-label="Rechercher un article"
            className="w-full rounded-2xl border border-white/10 bg-[#071526] py-3 pl-11 pr-10 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Effacer la recherche" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </label>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">Filtrer par expertise</p>
          <div className="flex shrink-0 rounded-xl border border-white/10 bg-[#071526] p-1" aria-label="Choisir la vue">
            <button type="button" onClick={() => setView('grid')} aria-label="Vue standard" aria-pressed={view === 'grid'} className={`grid h-8 w-8 place-items-center rounded-lg transition ${view === 'grid' ? 'bg-cyan-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}><Grid2X2 className="h-4 w-4" /></button>
            <button type="button" onClick={() => setView('compact')} aria-label="Vue compacte" aria-pressed={view === 'compact'} className={`grid h-8 w-8 place-items-center rounded-lg transition ${view === 'compact' ? 'bg-cyan-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}><Grid3X3 className="h-4 w-4" /></button>
            <button type="button" onClick={() => setView('list')} aria-label="Vue en liste" aria-pressed={view === 'list'} className={`grid h-8 w-8 place-items-center rounded-lg transition ${view === 'list' ? 'bg-cyan-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}><List className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2" aria-label="Filtrer les articles">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${category === item ? 'border-cyan-400 bg-cyan-400 text-slate-950 shadow-lg' : 'border-white/10 bg-[#071526] text-slate-300 hover:border-cyan-400/50 hover:text-white'}`}
          >
            {item}
          </button>
        ))}
      </div>

      <p className="mb-5 text-sm text-slate-400">
        <span className="font-black text-white">{filteredArticles.length}</span> article{filteredArticles.length > 1 ? 's' : ''} trouvé{filteredArticles.length > 1 ? 's' : ''}
      </p>

      <div className={view === 'list' ? 'grid grid-cols-1 gap-3' : view === 'compact' ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4' : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}>
        {visibleArticles.map((article, index) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            style={{ animationDelay: `${index * 70}ms` }}
            className={`group relative overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,24,48,0.96),rgba(7,20,34,0.9))] shadow-[0_18px_40px_rgba(3,7,18,0.45)] transition-all duration-300 ease-out will-change-transform hover:-translate-y-1 hover:translate-x-0.5 hover:border-cyan-400/50 hover:shadow-[0_22px_50px_rgba(34,211,238,0.14)] motion-safe:animate-[fadeIn_0.5s_ease-out] ${view === 'list' ? 'flex items-center gap-3 p-2.5 sm:gap-4 sm:p-3' : 'hover:shadow-[0_20px_50px_rgba(50,140,255,0.18)]'}`}
          >
            <div className={view === 'list' ? 'h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-800 sm:h-24 sm:w-36' : view === 'compact' ? 'aspect-[4/3] overflow-hidden rounded-t-[20px] bg-slate-800' : 'aspect-[16/9] overflow-hidden rounded-t-[20px] bg-slate-800'}>
              <img src={article.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <div className={view === 'list' ? 'min-w-0 flex-1 py-0.5 pr-0.5' : view === 'compact' ? 'p-2.5' : 'p-3.5'}>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-300">
                <span className="rounded-full bg-orange-500/15 px-2 py-1 font-semibold text-orange-300">{article.category}</span>
              </div>
              <h2 className={`${view === 'compact' ? 'line-clamp-2 text-sm' : 'text-base'} mb-1.5 font-black leading-snug text-white group-hover:text-cyan-200`}>{article.title}</h2>
              <p className={`mb-3 text-sm leading-5 text-slate-300 ${view === 'compact' ? 'hidden' : view === 'list' ? 'line-clamp-2' : 'line-clamp-2'}`}>{article.description}</p>
              <div className={`${view === 'compact' || view === 'list' ? 'hidden' : 'mb-3'} flex flex-wrap gap-1.5`}>
                {article.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[10px] text-slate-300">
                    <Tag className="h-3 w-3" />{tag}
                  </span>
                ))}
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-300">Lire l'article <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
            </div>
          </Link>
        ))}
      </div>

      {!visibleArticles.length && (
        <div className="border border-dashed border-white/10 bg-[#071526] px-6 py-14 text-center">
          <Search className="mx-auto mb-3 h-7 w-7 text-slate-500" />
          <p className="font-bold text-white">Aucun article ne correspond à ta recherche.</p>
          <button type="button" onClick={() => { setQuery(''); setCategory('Tous'); }} className="mt-3 text-sm font-bold text-cyan-300 hover:text-cyan-200">Réinitialiser les filtres</button>
        </div>
      )}

      {pageCount > 1 && (
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2" aria-label="Pagination des articles">
          <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Page précédente" className="shrink-0 rounded-lg border border-white/10 bg-[#071526] px-2.5 py-2 text-xs font-semibold text-slate-200 disabled:opacity-40 sm:px-3 sm:text-sm"><span className="sm:hidden">Préc.</span><span className="hidden sm:inline">Précédent</span></button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              aria-current={currentPage === pageNumber ? 'page' : undefined}
              className={`h-9 min-w-9 shrink-0 rounded-lg border px-2.5 text-sm font-bold ${currentPage === pageNumber ? 'border-cyan-400 bg-cyan-400 text-slate-950' : 'border-white/10 bg-[#071526] text-slate-300'}`}
            >
              {pageNumber}
            </button>
          ))}
          <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount} aria-label="Page suivante" className="shrink-0 rounded-lg border border-white/10 bg-[#071526] px-2.5 py-2 text-xs font-semibold text-slate-200 disabled:opacity-40 sm:px-3 sm:text-sm"><span className="sm:hidden">Suiv.</span><span className="hidden sm:inline">Suivant</span></button>
        </nav>
      )}
    </>
  );
}
