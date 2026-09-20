'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type ContentData = {
  articles: { id: string; slug: string; title: string; description: string; category: string; publishedAt: string | null }[];
  drafts: { id: string; title: string; status: string; createdAt: string | null }[];
};

export default function AdminContentPage() {
  const [data, setData] = useState<ContentData | null>(null);
  const [error, setError] = useState('');
  const publicSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').replace(/\/$/, '');

  useEffect(() => {
    fetch('/api/admin/content', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json() as ContentData & { error?: string };
        if (!response.ok) throw new Error(result.error || 'Chargement impossible.');
        setData(result);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Chargement impossible.'));
  }, []);

  return <div className="mx-auto max-w-6xl space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Édition</p><h1 className="mt-2 text-3xl font-black text-slate-950">Contenu</h1><p className="mt-2 text-sm text-slate-600">Articles publiés et brouillons générés par l’agent.</p></header>
    <div className="grid gap-4 md:grid-cols-3"><a href={`${publicSiteUrl}/blog`} className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg"><strong className="text-lg">Blog public</strong><span className="mt-2 block text-sm text-slate-600">Voir les articles publiés.</span></a><Link href="/admin/agent" className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 transition hover:-translate-y-1 hover:shadow-lg"><strong className="text-lg text-indigo-950">Brouillons IA</strong><span className="mt-2 block text-sm text-indigo-800">Valider les contenus proposés.</span></Link><a href={`${publicSiteUrl}/rss.xml`} className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg"><strong className="text-lg">Flux RSS</strong><span className="mt-2 block text-sm text-slate-600">Contrôler la diffusion.</span></a></div>
    {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {!data && !error && <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">Chargement du contenu...</p>}
    {data && <div className="grid gap-6 lg:grid-cols-[1.4fr_.8fr]"><section className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Publication</p><h2 className="mt-1 text-xl font-black text-slate-950">Articles publiés <span className="text-sm font-semibold text-slate-400">({data.articles.length})</span></h2></div><a href={`${publicSiteUrl}/blog`} className="text-xs font-bold text-indigo-600">Voir le blog</a></div><div className="mt-5 space-y-3">{data.articles.length ? data.articles.map((article) => <article key={article.id} className="rounded-lg border border-slate-100 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">{article.category}</p><h3 className="mt-1 truncate font-bold text-slate-900">{article.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-500">{article.description}</p></div><a href={`${publicSiteUrl}/blog/${article.slug}`} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-bold text-indigo-600">Ouvrir</a></div><p className="mt-3 text-xs text-slate-400">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('fr-FR') : 'Date inconnue'}</p></article>) : <p className="py-8 text-center text-sm text-slate-500">Aucun article publié.</p>}</div></section><section className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Production IA</p><h2 className="mt-1 text-xl font-black text-slate-950">Brouillons récents</h2></div><Link href="/admin/agent" className="text-xs font-bold text-indigo-600">Gérer</Link></div><div className="mt-5 space-y-3">{data.drafts.length ? data.drafts.map((draft) => <div key={draft.id} className="rounded-lg bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><strong className="text-sm text-slate-800">{draft.title}</strong><span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase text-slate-500">{draft.status}</span></div><p className="mt-2 text-xs text-slate-400">{draft.createdAt ? new Date(draft.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}</p></div>) : <p className="py-8 text-center text-sm text-slate-500">Aucun brouillon.</p>}</div></section></div>}
  </div>;
}