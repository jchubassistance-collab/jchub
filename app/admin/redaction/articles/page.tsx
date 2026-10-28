'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { PlusCircle, Search } from 'lucide-react';
import { AdminPagination, useAdminPageSize, usePageParam } from '@/components/ui/Pagination';
import { ArticleTable, Card, Notice, statusLabels, useWriterArticles } from '@/components/redaction/shared';

const filters = ['all', 'draft', 'published', 'archived'] as const;
type Filter = (typeof filters)[number];

export default function WriterArticlesPage() {
  const searchParams = useSearchParams();
  const initial = searchParams?.get('statut');
  const [filter, setFilterState] = useState<Filter>((filters as readonly string[]).includes(initial || '') ? initial as Filter : 'all');
  const [query, setQuery] = useState('');
  const [page, setPage] = usePageParam();
  const [pageSize, setPageSize] = useAdminPageSize();
  const [actionError, setActionError] = useState('');
  const { articles, loaded, error, reload } = useWriterArticles();

  const setFilter = (next: Filter) => {
    setFilterState(next); setPage(1);
    const url = new URL(window.location.href);
    if (next === 'all') url.searchParams.delete('statut'); else url.searchParams.set('statut', next);
    window.history.replaceState(null, '', url);
  };
  const count = (status: Filter) => status === 'all' ? articles.length : articles.filter((article) => article.status === status).length;
  const matching = articles.filter((article) => (filter === 'all' || article.status === filter) && `${article.title} ${article.description} ${article.category}`.toLowerCase().includes(query.trim().toLowerCase()));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(matching.length / pageSize)));
  const visible = matching.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return <div className="mx-auto max-w-[1180px] space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-[28px] font-extrabold tracking-tight text-[#0f1c3f]">Mes articles</h1><p className="mt-1.5 text-[15px] text-slate-600">Tous vos articles, brouillons et publiés.</p></div>
      <Link href="/admin/redaction/nouveau" className="inline-flex items-center gap-2 rounded-lg bg-[#1f6feb] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><PlusCircle className="h-4 w-4" />Créer un article</Link>
    </header>

    {(error || actionError) && <Notice>{error || actionError}</Notice>}

    <Card>
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
        <div role="tablist" aria-label="Filtrer par statut" className="flex flex-wrap gap-1.5">
          {filters.filter((status) => status !== 'archived' || count('archived')).map((status) => <button key={status} role="tab" aria-selected={filter === status} onClick={() => setFilter(status)} className={`rounded-lg px-3.5 py-2 text-sm font-medium ${filter === status ? 'bg-[#0f1c3f] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{status === 'all' ? 'Tous' : `${statusLabels[status]}s`} <span className={filter === status ? 'text-slate-300' : 'text-slate-400'}>{count(status)}</span></button>)}
        </div>
        <label className="relative ml-auto w-full sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Rechercher un article…" aria-label="Rechercher un article" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
      </div>
      <div className="px-4 sm:px-6">
        {visible.length ? <ArticleTable articles={visible} onChanged={() => void reload()} onError={setActionError} />
          : loaded && <p className="py-12 text-center text-sm text-slate-500">{articles.length ? 'Aucun article ne correspond.' : 'Vous n’avez pas encore d’article.'}</p>}
      </div>
      {matching.length > 0 && <AdminPagination page={currentPage} pageSize={pageSize} total={matching.length} noun="articles" empty="Aucun article" onPage={setPage} onPageSize={setPageSize} />}
    </Card>
  </div>;
}
