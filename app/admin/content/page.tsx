'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Archive, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Eye, FileText, Folder, List, Loader2, MoreVertical, Pencil, Plus, Search, Sparkles, X } from 'lucide-react';

type Article = { id: string; slug: string; title: string; description: string; category: string; status: string; author: string; image: string; views: number; publishedAt: string | null; updatedAt: string | null; content?: string };
type Draft = { id: string; title: string; status: string; createdAt: string | null };
type EditorArticle = Pick<Article, 'id' | 'slug' | 'title' | 'description' | 'category' | 'status'> & { content: string };
const PAGE_SIZE = 8;
const statusLabels: Record<string, string> = { published: 'Publié', draft: 'Brouillon', archived: 'Archivé', scheduled: 'Programmé' };

export default function AdminContentPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [author, setAuthor] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorArticle | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkWorking, setBulkWorking] = useState(false);
  const publicSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').replace(/\/$/, '');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/content', { cache: 'no-store' });
      const result = await response.json() as { articles?: Article[]; drafts?: Draft[]; error?: string };
      if (!response.ok) throw new Error(result.error || 'Chargement impossible.');
      setArticles(result.articles || []); setDrafts(result.drafts || []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chargement impossible.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => articles.filter((article) => {
    const matchQuery = `${article.title} ${article.slug} ${article.description}`.toLowerCase().includes(query.toLowerCase());
    const date = article.publishedAt || article.updatedAt;
    const matchDate = !date || dateRange === 'all' || (dateRange === 'month' ? Date.now() - new Date(date).getTime() <= 30 * 86400000 : Date.now() - new Date(date).getTime() <= 7 * 86400000);
    return matchQuery && (category === 'all' || article.category === category) && (status === 'all' || article.status === status) && (author === 'all' || article.author === author) && matchDate;
  }), [articles, query, category, status, author, dateRange]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const categories = articles.map((article) => article.category).filter((value, index, values) => values.indexOf(value) === index).sort();
  const authors = articles.map((article) => article.author).filter((value, index, values) => values.indexOf(value) === index).sort();
  const counts = { all: articles.length, published: articles.filter((article) => article.status === 'published').length, draft: articles.filter((article) => article.status === 'draft').length, archived: articles.filter((article) => article.status === 'archived').length };
  const pendingAi = drafts.filter((draft) => ['draft', 'approved'].includes(draft.status)).length;
  const currentPageIds = visible.map((article) => article.id);

  const openEditor = async (article: Article) => {
    setMenuId(null);
    try {
      const response = await fetch(`/api/admin/content/${encodeURIComponent(article.id)}`, { cache: 'no-store' });
      const record = await response.json() as { content?: string; error?: string };
      if (!response.ok) throw new Error(record.error || 'Impossible de charger cet article.');
      setEditor({ id: article.id, slug: article.slug, title: article.title, description: article.description, category: article.category, status: article.status, content: record.content || '' });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Impossible de charger cet article.'); }
  };

  const createArticle = async () => {
    setSaving(true); setNotice('');
    try {
      const response = await fetch('/api/admin/content', { method: 'POST' });
      const result = await response.json() as { id?: string; error?: string };
      if (!response.ok || !result.id) throw new Error(result.error || 'Création impossible.');
      await load();
      setEditor({ id: result.id, slug: result.id, title: 'Nouvel article', description: '', category: 'Développement', status: 'draft', content: '' });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Création impossible.'); }
    finally { setSaving(false); }
  };

  const saveArticle = async (nextStatus = editor?.status) => {
    if (!editor) return;
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/admin/content/${encodeURIComponent(editor.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editor, status: nextStatus }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Enregistrement impossible.');
      setEditor(null); setNotice(nextStatus === 'published' ? 'Article publié.' : 'Article enregistré.'); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Enregistrement impossible.'); }
    finally { setSaving(false); }
  };

  const changeStatus = async (article: Article, nextStatus: string) => {
    setMenuId(null); setError('');
    try {
      const response = await fetch(`/api/admin/content/${encodeURIComponent(article.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Action impossible.');
      setNotice(nextStatus === 'archived' ? 'Article archivé.' : nextStatus === 'published' ? 'Article publié.' : 'Article déplacé en brouillon.'); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Action impossible.'); }
  };

  const bulkAction = async (action: 'publish' | 'draft' | 'archive') => {
    setBulkWorking(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/admin/content/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selected, action }) });
      const result = await response.json() as { error?: string; updated?: number };
      if (!response.ok) throw new Error(result.error || 'Action groupée impossible.');
      setSelected([]);
      setNotice(`${result.updated || 0} article(s) mis à jour.`);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Action groupée impossible.'); }
    finally { setBulkWorking(false); }
  };

  const toggleSelected = (id: string) => setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  const selectPage = () => setSelected((items) => currentPageIds.every((id) => items.includes(id)) ? items.filter((id) => !currentPageIds.includes(id)) : items.concat(currentPageIds).filter((id, index, all) => all.indexOf(id) === index));
  const dateLabel = (date: string | null) => date ? new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const compact = (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value);

  return <main className="mx-auto max-w-[1500px] space-y-5 pb-10">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Articles</h1><p className="mt-1 text-sm text-slate-500">Gérez les articles de votre blog JcHub. Publiez, modifiez, organisez et suivez vos contenus.</p></div><button onClick={() => void createArticle()} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"><Plus className="h-4 w-4" />Nouvel article</button></header>

    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Statistiques des articles">
      <StatCard label="Total des articles" value={counts.all} note="Dans votre catalogue" icon={<FileText className="h-4 w-4" />} tone="blue" />
      <StatCard label="Publiés" value={counts.published} note={counts.all ? `${Math.round(counts.published / counts.all * 100)} %` : '0 %'} icon={<Check className="h-4 w-4" />} tone="green" />
      <StatCard label="Brouillons" value={counts.draft + pendingAi} note={`${pendingAi} brouillon(s) IA à relire`} icon={<Sparkles className="h-4 w-4" />} tone="orange" />
      <StatCard label="Archivés" value={counts.archived} note={counts.all ? `${Math.round(counts.archived / counts.all * 100)} %` : '0 %'} icon={<Archive className="h-4 w-4" />} tone="slate" />
    </section>

    <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(125px,auto))]">
      <label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Rechercher un article..." className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
      <FilterSelect icon={<Folder />} value={category} onChange={(value) => { setCategory(value); setPage(1); }} label="Toutes les catégories"><option value="all">Toutes les catégories</option>{categories.map((item) => <option key={item}>{item}</option>)}</FilterSelect>
      <FilterSelect icon={<List />} value={status} onChange={(value) => { setStatus(value); setPage(1); }} label="Tous les statuts"><option value="all">Tous les statuts</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</FilterSelect>
      <FilterSelect icon={<span className="text-[11px]">●</span>} value={author} onChange={(value) => { setAuthor(value); setPage(1); }} label="Tous les auteurs"><option value="all">Tous les auteurs</option>{authors.map((item) => <option key={item}>{item}</option>)}</FilterSelect>
      <FilterSelect icon={<CalendarDays />} value={dateRange} onChange={(value) => { setDateRange(value); setPage(1); }} label="Toutes les dates"><option value="all">Toutes les dates</option><option value="week">7 derniers jours</option><option value="month">30 derniers jours</option></FilterSelect>
    </section>

    <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
      {selected.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-blue-100 bg-blue-50 px-4 py-3"><span className="text-xs font-bold text-blue-900">{selected.length} article(s) sélectionné(s)</span><div className="flex flex-wrap gap-2"><button disabled={bulkWorking} onClick={() => void bulkAction('publish')} className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white disabled:opacity-50">Publier</button><button disabled={bulkWorking} onClick={() => void bulkAction('draft')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 disabled:opacity-50">Déplacer en brouillon</button><button disabled={bulkWorking} onClick={() => void bulkAction('archive')} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-[10px] font-bold text-amber-700 disabled:opacity-50">Archiver</button><button disabled={bulkWorking} onClick={() => setSelected([])} className="rounded-lg px-3 py-2 text-[10px] font-bold text-slate-500">Annuler sélection</button></div></div>}
      {loading ? <div className="grid min-h-64 place-items-center text-sm text-slate-500"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Chargement des articles…</span></div> : <>
        <div className="overflow-x-auto rounded-t-2xl"><table className="w-full min-w-[900px] border-collapse text-left"><thead><tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold text-slate-500"><th className="w-10 px-3 py-3"><input aria-label="Sélectionner cette page" type="checkbox" checked={currentPageIds.length > 0 && currentPageIds.every((id) => selected.includes(id))} onChange={selectPage} className="rounded border-slate-300" /></th><th className="px-3 py-3">Article</th><th className="px-3 py-3">Catégorie</th><th className="px-3 py-3">Statut</th><th className="px-3 py-3">Auteur</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Vues</th><th className="px-3 py-3">Actions</th></tr></thead>
          <tbody>{visible.map((article) => <tr key={article.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"><td className="px-3 py-2.5"><input aria-label={`Sélectionner ${article.title}`} type="checkbox" checked={selected.includes(article.id)} onChange={() => toggleSelected(article.id)} className="rounded border-slate-300" /></td><td className="max-w-[380px] px-3 py-2.5"><div className="flex min-w-0 items-center gap-3">{article.image ? <img src={article.image} alt="" className="h-10 w-12 shrink-0 rounded-lg border border-slate-100 object-cover" /> : <span className="grid h-10 w-12 shrink-0 place-items-center rounded-lg bg-slate-900 text-xs font-black text-white">Jc</span>}<span className="min-w-0"><strong className="block truncate text-[11px] font-bold text-slate-800">{article.title}</strong><small className="block truncate text-[9px] text-slate-400">/{article.slug}</small></span></div></td><td className="px-3 py-2.5"><span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-semibold text-blue-700">{article.category}</span></td><td className="px-3 py-2.5"><StatusBadge status={article.status} /></td><td className="px-3 py-2.5"><span className="text-[10px] font-medium text-slate-600">{article.author}</span></td><td className="px-3 py-2.5"><span className="block text-[10px] font-semibold text-slate-600">{dateLabel(article.publishedAt || article.updatedAt)}</span><small className="text-[9px] text-slate-400">{article.publishedAt ? new Date(article.publishedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}</small></td><td className="px-3 py-2.5"><span className="inline-flex items-center gap-1.5 text-[10px] text-slate-600"><Eye className="h-3 w-3 text-slate-400" />{compact(article.views)}</span></td><td className="px-3 py-2.5"><div className="flex items-center gap-1.5"><button title="Modifier" onClick={() => void openEditor(article)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700"><Pencil className="h-3.5 w-3.5" /></button><a title="Voir" href={`${publicSiteUrl}/blog/${encodeURIComponent(article.slug)}`} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700"><Eye className="h-3.5 w-3.5" /></a><div className="relative"><button title="Plus d’actions" onClick={() => setMenuId(menuId === article.id ? null : article.id)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300"><MoreVertical className="h-3.5 w-3.5" /></button>{menuId === article.id && <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">{article.status !== 'published' && <button onClick={() => void changeStatus(article, 'published')} className="w-full rounded-lg px-3 py-2 text-left text-xs text-emerald-700 hover:bg-emerald-50">Publier</button>}{article.status !== 'draft' && <button onClick={() => void changeStatus(article, 'draft')} className="w-full rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">Déplacer en brouillon</button>}{article.status !== 'archived' && <button onClick={() => void changeStatus(article, 'archived')} className="w-full rounded-lg px-3 py-2 text-left text-xs text-amber-700 hover:bg-amber-50">Archiver</button>}</div>}</div></div></td></tr>)}</tbody></table></div>
        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-slate-100 px-4 py-3"><span className="text-[10px] text-slate-500">{filtered.length ? `Affichage de ${Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)} à ${Math.min(page * PAGE_SIZE, filtered.length)} sur ${filtered.length} articles` : 'Aucun article correspondant'}</span><div className="flex items-center gap-1"><button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).slice(Math.max(0, page - 2), Math.max(0, page - 2) + 3).map((number) => <button key={number} onClick={() => setPage(number)} className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold ${page === number ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600'}`}>{number}</button>)}<button disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div></footer>
      </>}
    </section>

    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-violet-100 bg-violet-50/70 p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-violet-600"><Sparkles className="h-5 w-5" /></span><span><strong className="block text-sm text-slate-800">Brouillons générés par l’IA <span className="text-violet-600">{pendingAi}</span></strong><small className="text-xs text-slate-500">Révisez, modifiez et publiez les propositions de l’agent éditorial.</small></span></div><Link href="/admin/agent" className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-700">Ouvrir les brouillons</Link></section>

    {editor && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="editor-title"><form onSubmit={(event) => { event.preventDefault(); void saveArticle(); }} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between"><div><h2 id="editor-title" className="text-xl font-black text-slate-900">Modifier l’article</h2><p className="mt-1 text-xs text-slate-500">Modifiez le contenu et son statut de publication.</p></div><button type="button" onClick={() => setEditor(null)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600 sm:col-span-2">Titre<input required value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-400" /></label><label className="text-xs font-semibold text-slate-600">Slug<input required value={editor.slug} onChange={(event) => setEditor({ ...editor, slug: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-400" /></label><label className="text-xs font-semibold text-slate-600">Catégorie<input value={editor.category} onChange={(event) => setEditor({ ...editor, category: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-400" /></label><label className="text-xs font-semibold text-slate-600 sm:col-span-2">Résumé<textarea rows={2} value={editor.description} onChange={(event) => setEditor({ ...editor, description: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400" /></label><label className="text-xs font-semibold text-slate-600 sm:col-span-2">Contenu<textarea rows={12} value={editor.content} onChange={(event) => setEditor({ ...editor, content: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 text-slate-900 outline-none focus:border-blue-400" /></label><label className="text-xs font-semibold text-slate-600">Statut<select value={editor.status} onChange={(event) => setEditor({ ...editor, status: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"><option value="draft">Brouillon</option><option value="published">Publié</option><option value="archived">Archivé</option></select></label></div><div className="mt-6 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setEditor(null)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">Annuler</button><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Enregistrer</button><button disabled={saving} type="button" onClick={() => void saveArticle('published')} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">Enregistrer et publier</button></div></form></div>}
  </main>;
}

function StatCard({ label, value, note, icon, tone }: { label: string; value: number; note: string; icon: React.ReactNode; tone: 'blue' | 'green' | 'orange' | 'slate' }) {
  const styles = { blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', orange: 'bg-orange-50 text-orange-600', slate: 'bg-slate-100 text-slate-500' };
  return <article className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-[10px] font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-black tracking-tight text-slate-900">{value}</p></div><span className={`grid h-8 w-8 place-items-center rounded-xl ${styles[tone]}`}>{icon}</span></div><p className="mt-2 text-[10px] text-slate-500">{note}</p></article>;
}

function FilterSelect({ icon, value, onChange, label, children }: { icon: React.ReactNode; value: string; onChange: (value: string) => void; label: string; children: React.ReactNode }) {
  return <label className="relative flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-500"><span className="shrink-0 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-full w-full appearance-none bg-transparent pr-4 text-[10px] text-slate-600 outline-none">{children}</select><ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5" /></label>;
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === 'published' ? 'bg-emerald-100 text-emerald-700' : status === 'draft' ? 'bg-orange-100 text-orange-700' : status === 'archived' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700';
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold ${tone}`}><i className="h-1.5 w-1.5 rounded-full bg-current" />{statusLabels[status] || status}</span>;
}
