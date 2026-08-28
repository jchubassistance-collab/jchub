'use client';

import Link from 'next/link';
import { ArrowRight, Grid2X2, Grid3X3, List, Search, Tag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { BlogArticle } from '@/lib/blog';

export function BlogCatalog({ articles }: { articles: BlogArticle[] }) {
  const pageSize = 6;
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
        <label className="relative block w-full sm:max-w-md"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un article..." aria-label="Rechercher un article" className="w-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-100" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Effacer la recherche" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800"><X className="h-4 w-4" /></button>}</label>
        <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">Filtrer par expertise</p><div className="flex shrink-0 border border-slate-200 bg-slate-50 p-1" aria-label="Choisir la vue"><button type="button" onClick={() => setView('grid')} aria-label="Vue standard" aria-pressed={view === 'grid'} className={`grid h-8 w-8 place-items-center transition ${view === 'grid' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}><Grid2X2 className="h-4 w-4" /></button><button type="button" onClick={() => setView('compact')} aria-label="Vue compacte" aria-pressed={view === 'compact'} className={`grid h-8 w-8 place-items-center transition ${view === 'compact' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}><Grid3X3 className="h-4 w-4" /></button><button type="button" onClick={() => setView('list')} aria-label="Vue en liste" aria-pressed={view === 'list'} className={`grid h-8 w-8 place-items-center transition ${view === 'list' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-400 hover:text-slate-900'}`}><List className="h-4 w-4" /></button></div></div>
      </div>
      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2" aria-label="Filtrer les articles">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`whitespace-nowrap border px-4 py-2 text-sm font-semibold transition ${category === item ? 'border-slate-950 bg-slate-950 text-white shadow-lg' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-400 hover:text-teal-700'}`}
          >
            {item}
          </button>
        ))}
      </div>
      <p className="mb-5 text-sm text-slate-500"><span className="font-black text-slate-950">{filteredArticles.length}</span> article{filteredArticles.length > 1 ? 's' : ''} trouvé{filteredArticles.length > 1 ? 's' : ''}</p>
      <div className={view === 'list' ? 'grid grid-cols-1 gap-3' : view === 'compact' ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4' : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}>
        {visibleArticles.map((article, index) => (
          <Link key={article.slug} href={`/blog/${article.slug}`} style={{ animationDelay: `${index * 70}ms` }} className={`blog-card group relative overflow-hidden border border-slate-200 bg-white shadow-sm transition hover:border-teal-300 hover:shadow-[0_22px_45px_-25px_rgba(15,118,110,.55)] ${view === 'list' ? 'flex items-center gap-4 p-3 sm:gap-6 sm:p-4' : 'hover:-translate-y-2'}`}>
            <div className={view === 'list' ? 'h-24 w-32 shrink-0 overflow-hidden bg-gray-100 sm:h-28 sm:w-44' : view === 'compact' ? 'aspect-[4/3] overflow-hidden bg-gray-100' : 'aspect-[16/8] overflow-hidden bg-gray-100'}>
              <img src={article.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <div className={view === 'list' ? 'min-w-0 flex-1 py-1 pr-1' : view === 'compact' ? 'p-3' : 'p-4'}>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="bg-orange-100 px-2 py-1 font-semibold text-orange-700">{article.category}</span>
              </div>
              <h2 className={`${view === 'compact' ? 'line-clamp-2 text-sm' : 'text-lg'} mb-2 font-black leading-snug group-hover:text-teal-700`}>{article.title}</h2>
              <p className={`mb-4 text-sm leading-6 text-gray-600 ${view === 'compact' ? 'hidden' : view === 'list' ? 'line-clamp-2' : 'line-clamp-2'}`}>{article.description}</p>
              <div className={`${view === 'compact' || view === 'list' ? 'hidden' : 'mb-4'} flex flex-wrap gap-1.5`}>
                {article.tags.slice(0, 3).map((tag) => <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600"><Tag className="h-3 w-3" />{tag}</span>)}
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-teal-700">Lire l'article <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </div>
          </Link>
        ))}
      </div>
      {!visibleArticles.length && <div className="border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center"><Search className="mx-auto mb-3 h-7 w-7 text-slate-400" /><p className="font-bold text-slate-800">Aucun article ne correspond à ta recherche.</p><button type="button" onClick={() => { setQuery(''); setCategory('Tous'); }} className="mt-3 text-sm font-bold text-teal-700 hover:text-teal-900">Réinitialiser les filtres</button></div>}
      {pageCount > 1 && <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination des articles">
        <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold disabled:opacity-40">Précédent</button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} aria-current={currentPage === pageNumber ? 'page' : undefined} className={`h-9 min-w-9 rounded-lg border px-3 text-sm font-bold ${currentPage === pageNumber ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-200 bg-white text-gray-700'}`}>{pageNumber}</button>)}
        <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount} className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold disabled:opacity-40">Suivant</button>
      </nav>}
    </>
  );
}
