'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronDown, FileText, Folder, Image as ImageIcon, List, Search, Sparkles, Wrench } from 'lucide-react';
import { AdminPagination, useAdminPageSize, usePageParam } from '@/components/ui/Pagination';

export type CmCatalogItem = { slug: string; title: string; description: string; excerpt?: string; category?: string; publishedAt?: string; tags?: string[]; url: string; kind: 'Article'|'Outil'; image?: string; icon?: string };
type KitSummary = { slug: string; kind: 'article'|'tool'; status: 'draft'|'ready'|'published' };


export function CmCatalogDashboard({ items, kits, kind, onKindChange, onPrepare }: { items: CmCatalogItem[]; kits: KitSummary[]; kind: 'Article'|'Outil'; onKindChange: (kind:'Article'|'Outil')=>void; onPrepare: (item: CmCatalogItem) => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [kitStatus, setKitStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [page, setPage] = usePageParam();
  const [pageSize, setPageSize] = useAdminPageSize();
  const [selected, setSelected] = useState<string[]>([]);
  const currentItems = useMemo(() => items.filter(item=>item.kind===kind),[items,kind]);
  const categories = useMemo(()=>Array.from(new Set(currentItems.map(item=>item.category).filter((value):value is string=>Boolean(value)))).sort((a,b)=>a.localeCompare(b,'fr')),[currentItems]);
  const getKitStatus = (item:CmCatalogItem) => {
    const mappedKind = item.kind === 'Article' ? 'article' : 'tool';
    return kits.find(kit=>kit.slug===item.slug&&kit.kind===mappedKind)?.status || 'none';
  };
  const filtered = useMemo(()=>currentItems.filter(item=>{
    const matchesText = `${item.title} ${item.slug} ${item.description} ${item.category||''}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr'));
    const date = item.publishedAt ? new Date(item.publishedAt).getTime() : 0;
    const age = date ? Date.now()-date : Number.POSITIVE_INFINITY;
    const matchesDate = dateRange==='all'||(dateRange==='week'&&age<=7*86400000)||(dateRange==='month'&&age<=30*86400000);
    return matchesText&&(category==='all'||item.category===category)&& (kitStatus==='all'||getKitStatus(item)===kitStatus)&&matchesDate;
  }),[currentItems,query,category,kitStatus,dateRange,kits]);
  const safePage = Math.min(page,Math.max(1,Math.ceil(filtered.length/pageSize)));
  const pageItems=filtered.slice((safePage-1)*pageSize,safePage*pageSize);
  const countArticles=items.filter(item=>item.kind==='Article').length;
  const countTools=items.filter(item=>item.kind==='Outil').length;
  const readyCount=kits.filter(kit=>kit.status==='ready').length;
  const publishedCount=kits.filter(kit=>kit.status==='published').length;
  const statusLabel=(status:string)=>status==='ready'?'Prêt à publier':status==='published'?'Publié':status==='draft'?'Brouillon':'Aucun kit';
  const statusColor=(status:string)=>status==='ready'?'bg-amber-50 text-amber-700':status==='published'?'bg-emerald-50 text-emerald-700':status==='draft'?'bg-slate-100 text-slate-600':'bg-blue-50 text-blue-700';
  const change=(setter:(value:string)=>void,value:string)=>{setter(value);setPage(1);};

  return <section className="mx-auto max-w-[1500px] space-y-5 pb-10">
    <header className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-start gap-4"><span className="mt-1 grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm">{kind==='Article'?<FileText className="h-7 w-7"/>:<Wrench className="h-6 w-6"/>}</span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-blue-600">Espace Community Manager</p><h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{kind==='Article'?'Articles':'Outils'}</h1><p className="mt-1 text-sm text-slate-500">Préparez des publications à partir des contenus JcHub et suivez les kits prêts à partager.</p></div></div><button onClick={()=>{const first=pageItems[0];if(first)onPrepare(first);}} disabled={!pageItems.length} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"><Sparkles className="h-4 w-4"/>Préparer un kit</button></header>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Statistiques CM">
      <Stat label="Total des contenus" value={items.length} note="Articles et outils publiés" icon={<FileText className="h-4 w-4"/>} tone="blue"/>
      <Stat label="Articles" value={countArticles} note="Disponibles pour une publication" icon={<FileText className="h-4 w-4"/>} tone="green"/>
      <Stat label="Outils" value={countTools} note="Fiches disponibles" icon={<Wrench className="h-4 w-4"/>} tone="orange"/>
      <Stat label="Kits prêts" value={readyCount} note={`${publishedCount} ${publishedCount>1?'déjà publiés':'déjà publié'}`} icon={<Check className="h-4 w-4"/>} tone="slate"/>
    </section>

    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"><button onClick={()=>{onKindChange('Article');setPage(1);setSelected([]);}} aria-pressed={kind==='Article'} className={`rounded-lg px-4 py-2 text-xs font-bold ${kind==='Article'?'bg-blue-600 text-white':'text-slate-600 hover:bg-slate-50'}`}>Articles <span className="ml-1 opacity-75">{countArticles}</span></button><button onClick={()=>{onKindChange('Outil');setPage(1);setSelected([]);}} aria-pressed={kind==='Outil'} className={`rounded-lg px-4 py-2 text-xs font-bold ${kind==='Outil'?'bg-blue-600 text-white':'text-slate-600 hover:bg-slate-50'}`}>Outils <span className="ml-1 opacity-75">{countTools}</span></button></div>

    <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(145px,auto))]">
      <label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e=>change(setQuery,e.target.value)} placeholder={`Rechercher un ${kind.toLowerCase()}...`} className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/></label>
      <Filter icon={<Folder/>} value={category} onChange={value=>change(setCategory,value)}><option value="all">Toutes les catégories</option>{categories.map(item=><option key={item}>{item}</option>)}</Filter>
      <Filter icon={<List/>} value={kitStatus} onChange={value=>change(setKitStatus,value)}><option value="all">Tous les kits</option><option value="none">Sans kit</option><option value="draft">Brouillons</option><option value="ready">Prêts à publier</option><option value="published">Publiés</option></Filter>
      <Filter icon={<CalendarDays/>} value={dateRange} onChange={value=>change(setDateRange,value)}><option value="all">Toutes les dates</option><option value="week">7 derniers jours</option><option value="month">30 derniers jours</option></Filter>
    </section>

    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left"><thead><tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold text-slate-500"><th className="w-10 px-3 py-3"><input aria-label="Sélectionner tous les contenus affichés" type="checkbox" checked={pageItems.length>0&&pageItems.every(item=>selected.includes(item.slug))} onChange={()=>setSelected(old=>pageItems.every(item=>old.includes(item.slug))?old.filter(slug=>!pageItems.some(item=>item.slug===slug)):Array.from(new Set([...old,...pageItems.map(item=>item.slug)])))} className="rounded border-slate-300"/></th><th className="px-3 py-3">{kind}</th><th className="px-3 py-3">Catégorie</th><th className="px-3 py-3">Statut du kit</th><th className="px-3 py-3">Date</th><th className="px-3 py-3 text-right">Actions</th></tr></thead><tbody>{pageItems.map(item=>{const status=getKitStatus(item);return <tr key={`${item.kind}-${item.slug}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"><td className="px-3 py-3"><input aria-label={`Sélectionner ${item.title}`} type="checkbox" checked={selected.includes(item.slug)} onChange={()=>setSelected(old=>old.includes(item.slug)?old.filter(slug=>slug!==item.slug):[...old,item.slug])} className="rounded border-slate-300"/></td><td className="px-3 py-3"><div className="flex items-center gap-3"><span className="grid h-12 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-xl">{item.image?<img src={item.image} alt="" className="h-full w-full object-cover"/>:item.icon||<ImageIcon className="h-5 w-5 text-slate-400"/>}</span><span className="min-w-0"><strong className="block max-w-[390px] truncate text-[11px] text-slate-800">{item.title}</strong><small className="mt-1 block max-w-[390px] truncate text-[10px] text-slate-400">/{item.slug}</small></span></div></td><td className="px-3 py-3"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">{item.category||'Général'}</span></td><td className="px-3 py-3"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusColor(status)}`}><i className={`h-1.5 w-1.5 rounded-full ${status==='ready'?'bg-amber-500':status==='published'?'bg-emerald-500':status==='draft'?'bg-slate-400':'bg-blue-500'}`}/>{statusLabel(status)}</span></td><td className="px-3 py-3"><span className="block text-[10px] font-semibold text-slate-600">{item.publishedAt?new Date(item.publishedAt).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}):'—'}</span><small className="text-[9px] text-slate-400">{item.publishedAt?new Date(item.publishedAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'—'}</small></td><td className="px-3 py-3"><div className="flex justify-end"><button onClick={()=>onPrepare(item)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-blue-200 px-2.5 text-[10px] font-bold text-blue-700 hover:bg-blue-50"><Sparkles className="h-3.5 w-3.5"/>Créer un kit</button></div></td></tr>})}{!pageItems.length&&<tr><td colSpan={6} className="px-4 py-16 text-center text-sm text-slate-500">Aucun {kind.toLowerCase()} ne correspond à ces filtres.</td></tr>}</tbody></table></div>
      <AdminPagination page={safePage} pageSize={pageSize} total={filtered.length} noun={`${kind.toLowerCase()}s`} empty={`Aucun ${kind.toLowerCase()} correspondant`} onPage={setPage} onPageSize={setPageSize}/>
    </section>
    {selected.length>0&&<p className="text-right text-xs text-slate-500">{selected.length} contenu(s) sélectionné(s) · choisis « Créer un kit » sur une ligne pour générer un kit.</p>}
  </section>;
}

function Stat({label,value,note,icon,tone}:{label:string;value:number;note:string;icon:React.ReactNode;tone:'blue'|'green'|'orange'|'slate'}) {
  const colors={blue:'bg-blue-50 text-blue-600',green:'bg-emerald-50 text-emerald-600',orange:'bg-orange-50 text-orange-500',slate:'bg-slate-100 text-slate-500'};
  return <article className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-[0_3px_12px_rgba(24,39,75,.035)]"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${colors[tone]}`}>{icon}</span><div className="min-w-0"><p className="text-[11px] font-medium text-slate-500">{label}</p><p className="mt-0.5 text-xl font-black leading-6 text-slate-950">{value}</p><p className="mt-1 truncate text-[10px] text-slate-400">{note}</p></div></article>;
}

function Filter({icon,value,onChange,children}:{icon:React.ReactNode;value:string;onChange:(value:string)=>void;children:React.ReactNode}) {
  return <label className="relative flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-500 focus-within:border-blue-400"><span className="pointer-events-none [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span><select aria-label="Filtrer les contenus" value={value} onChange={event=>onChange(event.target.value)} className="h-full min-w-0 flex-1 appearance-none bg-transparent pr-4 text-[10px] text-slate-700 outline-none">{children}</select><ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5"/></label>;
}
