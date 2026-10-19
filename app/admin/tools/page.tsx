'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Archive, Check, ChevronDown, Eye, Folder, Hammer, Loader2, MoreVertical, Pencil, Plus, Search, Sparkles, X } from 'lucide-react';
import { AdminPagination, useAdminPageSize, usePageParam } from '@/components/ui/Pagination';
import { ToolGenerationPanel, type ToolGeneration } from '@/components/admin/ToolGenerationPanel';

type ToolRecord = { id: string; slug: string; name: string; description: string; category: string; icon: string; status: string; component: string; tags: string[]; views?: number; path?: string; publishAt?: string; generation?: ToolGeneration; seo: { title: string; description: string; keywords: string[] } };
type ToolEditor = { slug: string; name: string; description: string; category: string; icon: string; status: string; component: string; tags: string; seoTitle: string; seoDescription: string; seoKeywords: string; publishAt: string };
const statusLabels: Record<string, string> = { published: 'Publié', draft: 'Brouillon', archived: 'Archivé' };

/** ISO date → value for a datetime-local input, in the admin's own time zone. */
function toLocalInput(iso?: string) {
  if (!iso) return '';
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export default function AdminToolsPage() {
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [components, setComponents] = useState<string[]>([]);
  const [viewsConfigured, setViewsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = usePageParam();
  const [pageSize, setPageSize] = useAdminPageSize();
  const [editor, setEditor] = useState<ToolEditor | null>(null);
  const [editingId, setEditingId] = useState('');
  const [menuId, setMenuId] = useState('');
  const [generationToolId, setGenerationToolId] = useState('');
  const generationTool = tools.find((tool) => tool.id === generationToolId);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/tools', { cache: 'no-store' });
      const data = await response.json() as { tools?: ToolRecord[]; components?: string[]; viewsConfigured?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error || 'Chargement des outils impossible.');
      setTools(data.tools || []); setComponents(data.components || []); setViewsConfigured(Boolean(data.viewsConfigured));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chargement des outils impossible.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => tools.filter((tool) => `${tool.name} ${tool.slug} ${tool.description}`.toLowerCase().includes(query.toLowerCase()) && (category === 'all' || tool.category === category) && (status === 'all' || tool.status === status)), [tools, query, category, status]);
  const categories = tools.map((tool) => tool.category).filter((value, index, values) => values.indexOf(value) === index).sort();
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const counts = { total: tools.length, published: tools.filter((tool) => tool.status === 'published').length, draft: tools.filter((tool) => tool.status === 'draft').length, archived: tools.filter((tool) => tool.status === 'archived').length };

  const openEditor = (tool: ToolRecord) => {
    setEditingId(tool.id);
    setMenuId('');
    setEditor({ slug: tool.slug, name: tool.name, description: tool.description, category: tool.category, icon: tool.icon, status: tool.status, component: tool.component, tags: (tool.tags || []).join(', '), seoTitle: tool.seo?.title || tool.name, seoDescription: tool.seo?.description || tool.description, seoKeywords: (tool.seo?.keywords || []).join(', '), publishAt: toLocalInput(tool.publishAt) });
  };

  const createTool = async () => {
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/admin/tools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const result = await response.json() as { slug?: string; error?: string };
      if (!response.ok || !result.slug) throw new Error(result.error || 'Création impossible.');
      await load();
      setEditingId(result.slug);
      setEditor({ slug: result.slug, name: 'Nouvel outil', description: '', category: 'Développement', icon: '🛠️', status: 'draft', component: '', tags: '', seoTitle: 'Nouvel outil | JcHub', seoDescription: '', seoKeywords: '', publishAt: '' });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Création impossible.'); }
    finally { setSaving(false); }
  };

  const save = async (nextStatus = editor?.status) => {
    if (!editor || !editingId) return;
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/admin/tools/${encodeURIComponent(editingId)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editor, tags: editor.tags.split(',').map((tag) => tag.trim()).filter(Boolean), status: nextStatus, publishAt: editor.publishAt ? new Date(editor.publishAt).toISOString() : null }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Enregistrement impossible.');
      setEditor(null); setNotice(nextStatus === 'published' ? 'Outil publié.' : 'Outil enregistré.'); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Enregistrement impossible.'); }
    finally { setSaving(false); }
  };

  const changeStatus = async (tool: ToolRecord, nextStatus: string) => {
    setMenuId(''); setError('');
    try {
      const response = await fetch(`/api/admin/tools/${encodeURIComponent(tool.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Action impossible.');
      setNotice(nextStatus === 'archived' ? 'Outil archivé.' : nextStatus === 'published' ? 'Outil publié.' : 'Outil déplacé en brouillon.'); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Action impossible.'); }
  };


  return <main className="mx-auto max-w-[1500px] space-y-5 pb-10">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Outils</h1><p className="mt-1 text-sm text-slate-500">Gérez les outils de JcHub. Modifiez leur fiche, composant fonctionnel, statut et référencement.</p></div><button onClick={() => void createTool()} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"><Plus className="h-4 w-4" />Nouvel outil</button></header>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}{!viewsConfigured && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">Les visites sont indisponibles : configure GA4_PROPERTY_ID et l’accès Analytics du compte de service pour afficher les données réelles.</p>}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Total des outils" value={counts.total} note="Dans le catalogue JcHub" icon={<Hammer className="h-4 w-4" />} tone="blue" /><Stat label="Publiés" value={counts.published} note={counts.total ? `${Math.round(counts.published / counts.total * 100)} % du catalogue` : '0 %'} icon={<Check className="h-4 w-4" />} tone="green" /><Stat label="Brouillons" value={counts.draft} note="À finaliser avant publication" icon={<Pencil className="h-4 w-4" />} tone="orange" /><Stat label="Archivés" value={counts.archived} note={counts.total ? `${Math.round(counts.archived / counts.total * 100)} % du catalogue` : '0 %'} icon={<Archive className="h-4 w-4" />} tone="slate" /></section>

    <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_repeat(2,minmax(160px,auto))]"><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Rechercher un outil..." className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label><Filter value={category} onChange={(value) => { setCategory(value); setPage(1); }}><option value="all">Toutes les catégories</option>{categories.map((item) => <option key={item}>{item}</option>)}</Filter><Filter value={status} onChange={(value) => { setStatus(value); setPage(1); }}><option value="all">Tous les statuts</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</Filter></section>

    <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">{loading ? <div className="grid min-h-64 place-items-center text-sm text-slate-500"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Chargement des outils…</span></div> : <><div className="overflow-x-auto rounded-t-2xl"><table className="w-full min-w-[850px] border-collapse text-left"><thead><tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold text-slate-500"><th className="px-4 py-3">Outil</th><th className="px-3 py-3">Catégorie</th><th className="px-3 py-3">Composant</th><th className="px-3 py-3">Statut</th><th className="px-3 py-3">Visites 28 j</th><th className="px-3 py-3">Actions</th></tr></thead><tbody>{visible.map((tool) => <tr key={tool.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"><td className="max-w-[420px] px-4 py-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-xl">{tool.icon}</span><span className="min-w-0"><strong className="block truncate text-[11px] font-bold text-slate-800">{tool.name}</strong><small className="block truncate text-[9px] text-slate-400">/{tool.path?.replace(/^\//, '') || `outils/${tool.slug}`}</small></span></div></td><td className="px-3 py-3"><span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-semibold text-blue-700">{tool.category}</span></td><td className="px-3 py-3"><span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-mono text-slate-600">{tool.component || 'à générer'}</span>{tool.generation?.status === 'pr_open' && <small className="mt-1 block text-[9px] text-violet-700">PR #{tool.generation.prNumber} à vérifier</small>}</td><td className="px-3 py-3"><Badge status={tool.status} />{tool.status === 'published' && tool.publishAt && Date.parse(tool.publishAt) > Date.now() && <small className="mt-1 block text-[9px] text-slate-500">En ligne le {new Date(tool.publishAt).toLocaleDateString('fr-FR')}</small>}</td><td className="px-3 py-3"><span className="inline-flex items-center gap-1.5 text-[10px] text-slate-600"><Eye className="h-3 w-3 text-slate-400" />{viewsConfigured ? Number(tool.views || 0).toLocaleString('fr-FR') : '—'}</span></td><td className="px-3 py-3"><div className="flex items-center gap-1.5">{!tool.path && (!tool.component || tool.generation) && <button title="Créer avec l’IA" onClick={() => { setMenuId(''); setGenerationToolId(tool.id); }} className="grid h-8 w-8 place-items-center rounded-lg border border-violet-200 text-violet-600 hover:border-violet-400 hover:bg-violet-50"><Sparkles className="h-3.5 w-3.5" /></button>}<button title="Modifier" onClick={() => openEditor(tool)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700"><Pencil className="h-3.5 w-3.5" /></button><a title="Voir" href={tool.path ? `/fr${tool.path}` : `/fr/outils/${encodeURIComponent(tool.slug)}`} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700"><Eye className="h-3.5 w-3.5" /></a><div className="relative"><button title="Plus d’actions" onClick={() => setMenuId(menuId === tool.id ? '' : tool.id)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600"><MoreVertical className="h-3.5 w-3.5" /></button>{menuId === tool.id && <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">{tool.status !== 'published' && <button onClick={() => void changeStatus(tool, 'published')} className="w-full rounded-lg px-3 py-2 text-left text-xs text-emerald-700 hover:bg-emerald-50">Publier</button>}{tool.status !== 'draft' && <button onClick={() => void changeStatus(tool, 'draft')} className="w-full rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50">Déplacer en brouillon</button>}{tool.status !== 'archived' && <button onClick={() => void changeStatus(tool, 'archived')} className="w-full rounded-lg px-3 py-2 text-left text-xs text-amber-700 hover:bg-amber-50">Archiver</button>}</div>}</div></div></td></tr>)}</tbody></table></div><AdminPagination page={currentPage} pageSize={pageSize} total={filtered.length} noun="outils" empty="Aucun outil correspondant" onPage={setPage} onPageSize={setPageSize} /></>}</section>

    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-600"><Hammer className="h-5 w-5" /></span><span><strong className="block text-sm text-slate-800">Catalogue public JcHub</strong><small className="text-xs text-slate-500">Les outils publiés sont affichés sur le site.</small></span></div><Link href="/fr/outils" target="_blank" className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700">Voir les outils</Link></section>

    {editor && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="tool-editor-title"><form onSubmit={(event) => { event.preventDefault(); void save(); }} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between"><div><h2 id="tool-editor-title" className="text-xl font-black text-slate-900">Modifier l’outil</h2><p className="mt-1 text-xs text-slate-500">La fiche reste reliée à un composant opérationnel.</p></div><button type="button" onClick={() => setEditor(null)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Nom"><input required value={editor.name} onChange={(event) => setEditor({ ...editor, name: event.target.value })} /></Field><Field label="Slug"><input required value={editor.slug} onChange={(event) => setEditor({ ...editor, slug: event.target.value })} /></Field><Field label="Catégorie"><input value={editor.category} onChange={(event) => setEditor({ ...editor, category: event.target.value })} /></Field><Field label="Icône"><input value={editor.icon} onChange={(event) => setEditor({ ...editor, icon: event.target.value })} /></Field><Field label="Composant fonctionnel"><select value={editor.component} onChange={(event) => setEditor({ ...editor, component: event.target.value })}><option value="">Aucun : à générer avec l’IA</option>{[...components, editor.component].filter((component, index, all) => component && all.indexOf(component) === index).map((component) => <option key={component} value={component}>{component}</option>)}</select></Field><Field label="Statut"><select value={editor.status} onChange={(event) => setEditor({ ...editor, status: event.target.value })}><option value="draft">Brouillon</option><option value="published">Publié</option><option value="archived">Archivé</option></select></Field><Field label="Visible à partir du (vide = tout de suite)"><input type="datetime-local" value={editor.publishAt} onChange={(event) => setEditor({ ...editor, publishAt: event.target.value })} /></Field><Field label="Description" wide><textarea rows={3} value={editor.description} onChange={(event) => setEditor({ ...editor, description: event.target.value })} /></Field><Field label="Mots-clés (séparés par des virgules)" wide><input value={editor.tags} onChange={(event) => setEditor({ ...editor, tags: event.target.value })} /></Field><Field label="Titre SEO"><input value={editor.seoTitle} onChange={(event) => setEditor({ ...editor, seoTitle: event.target.value })} /></Field><Field label="Description SEO"><input value={editor.seoDescription} onChange={(event) => setEditor({ ...editor, seoDescription: event.target.value })} /></Field><Field label="Mots-clés SEO" wide><input value={editor.seoKeywords} onChange={(event) => setEditor({ ...editor, seoKeywords: event.target.value })} /></Field></div><div className="mt-6 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setEditor(null)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">Annuler</button><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Enregistrer</button><button disabled={saving} type="button" onClick={() => void save('published')} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">Enregistrer et publier</button></div></form></div>}

    {generationTool && <ToolGenerationPanel tool={generationTool} onClose={() => setGenerationToolId('')} onChanged={() => void load()} />}
  </main>;
}

function Stat({ label, value, note, icon, tone }: { label: string; value: number; note: string; icon: React.ReactNode; tone: 'blue' | 'green' | 'orange' | 'slate' }) {
  const colors = { blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', orange: 'bg-orange-50 text-orange-600', slate: 'bg-slate-100 text-slate-500' };
  return <article className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-[10px] font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-black tracking-tight text-slate-900">{value}</p></div><span className={`grid h-8 w-8 place-items-center rounded-xl ${colors[tone]}`}>{icon}</span></div><p className="mt-2 text-[10px] text-slate-500">{note}</p></article>;
}

function Filter({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="relative flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3 text-slate-500"><Folder className="mr-2 h-3.5 w-3.5 shrink-0" /><select aria-label="Filtrer les outils" value={value} onChange={(event) => onChange(event.target.value)} className="h-full w-full appearance-none bg-transparent pr-4 text-[10px] text-slate-600 outline-none">{children}</select><ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5" /></label>;
}

function Badge({ status }: { status: string }) {
  const colors = status === 'published' ? 'bg-emerald-100 text-emerald-700' : status === 'draft' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600';
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold ${colors}`}><i className="h-1.5 w-1.5 rounded-full bg-current" />{statusLabels[status] || status}</span>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`block text-xs font-semibold text-slate-600 ${wide ? 'sm:col-span-2' : ''}`}>{label}<span className="mt-1.5 block [&>input]:h-10 [&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:border-slate-200 [&>input]:px-3 [&>input]:text-sm [&>input]:text-slate-900 [&>input]:outline-none [&>input]:focus:border-blue-400 [&>textarea]:w-full [&>textarea]:rounded-lg [&>textarea]:border [&>textarea]:border-slate-200 [&>textarea]:px-3 [&>textarea]:py-2 [&>textarea]:text-sm [&>select]:h-10 [&>select]:w-full [&>select]:rounded-lg [&>select]:border [&>select]:border-slate-200 [&>select]:px-3 [&>select]:text-sm">{children}</span></label>;
}
