'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, Download, Image as ImageIcon, Instagram, LoaderCircle, RefreshCw, Save, Search, Send, Sparkles, WandSparkles } from 'lucide-react';
import { PublishingSettings } from '@/components/cm/PublishingSettings';

type CatalogItem = { kind: string; title: string; slug: string; description: string; category?: string };
type Kit = { id: string; kind: 'article'|'tool'; slug: string; title: string; category: string; imageTitle: string; imageSubtitle: string; instagramCaption: string; instagramHashtags: string[]; facebookCaption: string; facebookHashtags: string[]; status: 'draft'|'ready'|'published'; createdAt?: string|null; channels?: Partial<Record<KitNetwork, KitChannel>> };
type KitNetwork = 'facebook'|'instagram';
type KitChannel = { status: string; externalUrl?: string|null; error?: string|null };
type PublishOutcome = { platform: KitNetwork; outcome: string; message: string };
const networkLabel = (network: KitNetwork) => network === 'facebook' ? 'Facebook' : 'Instagram';
type KitFields = Pick<Kit,'imageTitle'|'imageSubtitle'|'instagramCaption'|'instagramHashtags'|'facebookCaption'|'facebookHashtags'>;
const input = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export function PublicationKits({ initialSelection = '' }: { initialSelection?: string }) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [selection, setSelection] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState<string|null>(null);
  const [message, setMessage] = useState('');
  const [formats, setFormats] = useState<Record<string,KitNetwork>>({});
  const [filter, setFilter] = useState<'all'|'draft'|'ready'|'published'>('all');
  const [search, setSearch] = useState('');

  const refresh = useCallback(async () => {
    const [cRes, kRes] = await Promise.all([fetch('/api/cm/catalog',{cache:'no-store'}),fetch('/api/cm/kits',{cache:'no-store'})]);
    const [c,k] = await Promise.all([cRes.json(),kRes.json()]);
    if (!cRes.ok || !kRes.ok) throw new Error(c.error || k.error || 'Impossible de charger les kits.');
    const items = (c.content || []) as CatalogItem[];
    setCatalog(items);
    setKits((k.kits || []) as Kit[]);
    if (!selection && !initialSelection && items[0]) setSelection(`${items[0].kind === 'Outil' ? 'tool' : 'article'}:${items[0].slug}`);
  },[selection,initialSelection]);
  useEffect(()=>{refresh().catch(e=>setMessage(e.message)).finally(()=>setLoading(false));},[refresh]);
  useEffect(()=>{if(initialSelection)setSelection(initialSelection);},[initialSelection]);

  const generate = async () => {
    if (!selection) return;
    const [kind,slug] = selection.split(':'); setGenerating(true); setMessage('La rédaction IA prépare le kit…');
    try { const response=await fetch('/api/cm/kits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,slug})}); const data=await response.json(); if(!response.ok) throw new Error(data.error||'Génération impossible.'); await refresh(); setMessage('Kit généré et enregistré en brouillon.'); }
    catch(e){setMessage(e instanceof Error?e.message:'Génération impossible.');} finally{setGenerating(false);}
  };
  const updateKit = (id:string, patch:Partial<KitFields>) => setKits(old=>old.map(k=>k.id===id?{...k,...patch}:k));
  const save = async (kit:Kit) => {
    setSaving(kit.id);setMessage('');
    try { const fields:KitFields={imageTitle:kit.imageTitle,imageSubtitle:kit.imageSubtitle,instagramCaption:kit.instagramCaption,instagramHashtags:kit.instagramHashtags,facebookCaption:kit.facebookCaption,facebookHashtags:kit.facebookHashtags}; const response=await fetch(`/api/cm/kits/${kit.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save',...fields})}); const data=await response.json();if(!response.ok)throw new Error(data.error||'Enregistrement impossible.');setMessage('Modifications enregistrées.'); }
    catch(e){setMessage(e instanceof Error?e.message:'Enregistrement impossible.');}finally{setSaving(null);}
  };
  const setStatus = async (kit:Kit,status:'ready'|'published') => {
    setSaving(kit.id);setMessage('');
    try { const response=await fetch(`/api/cm/kits/${kit.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'status',status})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Mise à jour impossible.');setKits(old=>old.map(k=>k.id===kit.id?{...k,status}:k));setMessage(status==='ready'?'Kit marqué prêt à publier.':'Kit marqué publié.'); }
    catch(e){setMessage(e instanceof Error?e.message:'Mise à jour impossible.');}finally{setSaving(null);}
  };
  const fieldsOf = (kit:Kit):KitFields => ({imageTitle:kit.imageTitle,imageSubtitle:kit.imageSubtitle,instagramCaption:kit.instagramCaption,instagramHashtags:kit.instagramHashtags,facebookCaption:kit.facebookCaption,facebookHashtags:kit.facebookHashtags});
  const channelSummary = (kit:Kit|undefined) => (['facebook','instagram'] as const).flatMap(network => { const channel=kit?.channels?.[network]; if(!channel) return []; return [`${networkLabel(network)} : ${channel.status==='PUBLISHED'?'publié':channel.status==='UNKNOWN'?'à vérifier':channel.status==='FAILED'?`échec (${channel.error||'erreur inconnue'})`:channel.error||'en attente'}.`]; }).join(' ');
  // Les envois tournent en arrière-plan : on suit l'état des réseaux jusqu'à la fin.
  const waitForChannels = async (id:string) => {
    for (let attempt=0; attempt<25; attempt+=1) {
      await new Promise(resolve=>setTimeout(resolve,2000));
      const response=await fetch('/api/cm/kits',{cache:'no-store'}); const data=await response.json(); if(!response.ok) return;
      const current=(data.kits||[]) as Kit[]; setKits(current);
      const kit=current.find(item=>item.id===id);
      if(!Object.values(kit?.channels||{}).some(channel=>channel?.status==='PUBLISHING')) { setMessage(channelSummary(kit)||'Publication terminée.'); return; }
    }
    setMessage('La publication est toujours en cours. Actualise dans quelques instants.');
  };
  // Enregistre d'abord les modifications, pour publier exactement le texte et le visuel affichés.
  const publish = async (kit:Kit, options:{platforms?:KitNetwork[];confirmUnknown?:boolean}={}) => {
    setSaving(kit.id);setMessage('');
    try {
      const saved=await fetch(`/api/cm/kits/${kit.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save',...fieldsOf(kit)})});
      const savedData=await saved.json(); if(!saved.ok) throw new Error(savedData.error||'Enregistre le kit avant de le publier.');
      const response=await fetch(`/api/cm/kits/${kit.id}/publish`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(options)});
      const data=await response.json() as {error?:string;outcomes?:PublishOutcome[]};
      if(!response.ok) throw new Error(data.error||'Publication impossible.');
      setMessage((data.outcomes||[]).map(item=>item.message).join(' '));
      if((data.outcomes||[]).some(item=>item.outcome==='queued')) await waitForChannels(kit.id); else await refresh();
    } catch(e){setMessage(e instanceof Error?e.message:'Publication impossible.');} finally{setSaving(null);}
  };
  const channelRow = (kit:Kit) => {
    const entries=(['facebook','instagram'] as const).flatMap(network=>kit.channels?.[network]?[[network,kit.channels[network]!] as const]:[]);
    if(!entries.length) return null;
    return <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">{entries.map(([network,channel])=>{
      const tone=channel.status==='PUBLISHED'?'bg-emerald-50 text-emerald-800':channel.status==='PUBLISHING'?'bg-indigo-50 text-indigo-800':channel.status==='UNKNOWN'?'bg-amber-50 text-amber-900':channel.status==='FAILED'?'bg-red-50 text-red-800':'bg-slate-100 text-slate-600';
      const label=channel.status==='PUBLISHED'?'publié':channel.status==='PUBLISHING'?'publication en cours…':channel.status==='UNKNOWN'?'à vérifier':channel.status==='FAILED'?'échec':'non envoyé';
      return <span key={network} className={`inline-flex flex-wrap items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold ${tone}`}>{networkLabel(network)} · {label}
        {channel.externalUrl&&<a href={channel.externalUrl} target="_blank" rel="noreferrer" className="underline">Voir le post</a>}
        {channel.error&&channel.status!=='PUBLISHED'&&<span className="font-normal">{channel.error}</span>}
        {channel.status==='UNKNOWN'&&<button type="button" disabled={saving===kit.id} onClick={()=>publish(kit,{platforms:[network],confirmUnknown:true})} className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2 py-1 text-[10px] font-bold text-white disabled:opacity-50"><RefreshCw className="h-3 w-3"/>J’ai vérifié : relancer</button>}
      </span>;
    })}</div>;
  };
  const copy = async (text:string) => { try { await navigator.clipboard.writeText(text);setMessage('Texte copié.'); } catch { setMessage('Copie refusée par le navigateur.'); } };
  const hashtagText = (tags:string[])=>tags.join(' ');
  const visibleKits = kits.filter(kit => (filter==='all'||kit.status===filter) && `${kit.title} ${kit.category}`.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr')));

  return <section className="mx-auto max-w-[1500px] space-y-6 pb-8">
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#111c35] via-[#182d54] to-[#273f7a] p-5 text-white shadow-lg shadow-indigo-950/10 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-5"><div className="max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-blue-100"><WandSparkles className="h-3.5 w-3.5"/>Atelier de contenu</span><h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Des kits prêts à publier</h2><p className="mt-2 text-sm leading-6 text-blue-100/80">Générez un visuel JcHub, une légende et des hashtags pour vos articles et outils. Relisez, puis publiez en un clic sur Facebook et Instagram.</p></div><div className="grid min-w-[210px] grid-cols-3 gap-2">{([['Kits',kits.length],['Brouillons',kits.filter(k=>k.status==='draft').length],['Prêts',kits.filter(k=>k.status==='ready').length]] as const).map(([label,count])=><div key={label} className="rounded-xl border border-white/10 bg-white/10 px-3 py-3"><p className="text-xl font-black">{count}</p><p className="mt-0.5 text-[9px] text-blue-100/75">{label}</p></div>)}</div></div>
    </div>
    <PublishingSettings/>
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20"><Sparkles className="h-5 w-5"/></span><div><h3 className="text-base font-extrabold text-slate-900">Créer un nouveau kit</h3><p className="mt-1 text-xs leading-5 text-slate-500">Choisissez un contenu publié pour générer les textes et le visuel.</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"><select aria-label="Article ou outil à préparer" value={selection} onChange={e=>setSelection(e.target.value)} className={`${input} h-11 bg-slate-50 sm:max-w-none`}><option value="">Choisir un article ou un outil</option>{catalog.map((item,i)=><option key={`${item.slug}-${i}`} value={`${item.kind==='Outil'?'tool':'article'}:${item.slug}`}>{item.kind} · {item.title}</option>)}</select><button type="button" onClick={generate} disabled={!selection||generating} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{generating?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Sparkles className="h-4 w-4"/>}{generating?'Génération en cours…':'Générer le kit'}</button></div>{catalog.length===0&&!loading&&<p className="mt-3 text-xs text-amber-700">Aucun article ou outil publié n’est disponible pour le moment.</p>}</div>
    {message&&<p role="status" className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900"><Sparkles className="h-4 w-4 shrink-0"/>{message}</p>}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-lg font-extrabold text-slate-900">Votre bibliothèque</h3><p className="mt-0.5 text-xs text-slate-500">Retrouvez les textes et visuels de vos publications.</p></div><label className="relative block sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un kit…" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-indigo-400"/></label></div>
    <div className="flex gap-2 overflow-x-auto pb-1">{([['all','Tous'],['draft','Brouillons'],['ready','Prêts à publier'],['published','Publiés']] as const).map(([key,label])=><button key={key} onClick={()=>setFilter(key)} className={`shrink-0 rounded-lg px-3.5 py-2 text-xs font-bold transition ${filter===key?'bg-indigo-600 text-white shadow-sm':'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700'}`}>{label}<span className="ml-1.5 opacity-70">{key==='all'?kits.length:kits.filter(k=>k.status===key).length}</span></button>)}</div>
    {loading?<div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500"><LoaderCircle className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-600"/>Chargement des kits…</div>:kits.length===0?<div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-500"><ImageIcon className="h-7 w-7"/></span><p className="mt-4 font-bold text-slate-800">Votre bibliothèque est vide</p><p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Choisissez un article ou un outil ci-dessus pour préparer votre première publication.</p></div>:visibleKits.length===0?<div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Aucun kit ne correspond à cette recherche.</div>:<div className="space-y-5">{visibleKits.map(kit=>{
      const imageUrl=`/api/cm/kits/${kit.id}/image?format=${formats[kit.id]||'instagram'}`;
      return <article key={kit.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4 sm:p-5"><div><div className="flex items-center gap-2"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-indigo-700">{kit.kind==='tool'?'Outil':'Article'}</span><span className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider ${kit.status==='published'?'bg-emerald-100 text-emerald-800':kit.status==='ready'?'bg-indigo-100 text-indigo-800':'bg-amber-100 text-amber-800'}`}>{kit.status==='published'?'Publié':kit.status==='ready'?'Prêt à publier':'Brouillon'}</span></div><h3 className="mt-2 text-lg font-extrabold text-slate-900">{kit.title}</h3><p className="mt-1 text-xs text-slate-500">{kit.category}{kit.createdAt?` · Créé le ${new Date(kit.createdAt).toLocaleDateString('fr-FR')}`:''}</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={saving===kit.id} onClick={()=>save(kit)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 disabled:opacity-50"><Save className="h-4 w-4"/>{saving===kit.id?'Enregistrement…':'Enregistrer'}</button><button type="button" disabled={saving===kit.id||kit.status==='published'} onClick={()=>setStatus(kit,'ready')} className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-[10px] font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">Marquer prêt</button><button type="button" disabled={saving===kit.id||kit.status==='published'} onClick={()=>publish(kit)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">{saving===kit.id?<LoaderCircle className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>}Publier sur Facebook et Instagram</button></div></div>
      {channelRow(kit)}
      <div className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_300px]"><div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><label className="block text-[10px] font-bold text-slate-600">Titre du visuel<input className={`${input} mt-1.5 bg-slate-50`} maxLength={64} value={kit.imageTitle} onChange={e=>updateKit(kit.id,{imageTitle:e.target.value})}/></label><label className="block text-[10px] font-bold text-slate-600">Sous-titre du visuel<input className={`${input} mt-1.5 bg-slate-50`} maxLength={150} value={kit.imageSubtitle} onChange={e=>updateKit(kit.id,{imageSubtitle:e.target.value})}/></label></div>
      <section className="rounded-xl border border-pink-100 bg-gradient-to-br from-pink-50/50 to-white p-4"><div className="flex items-center justify-between gap-2"><h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-orange-400 text-white"><Instagram className="h-4 w-4"/></span>Instagram</h4><button type="button" onClick={()=>copy(`${kit.instagramCaption}\n\n${hashtagText(kit.instagramHashtags)}`)} className="inline-flex items-center gap-1.5 rounded-lg border border-pink-100 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-pink-50"><Copy className="h-3.5 w-3.5"/>Copier le texte</button></div><textarea aria-label="Légende Instagram" className={`${input} mt-3 bg-white`} rows={4} maxLength={2200} value={kit.instagramCaption} onChange={e=>updateKit(kit.id,{instagramCaption:e.target.value})}/><label className="mt-3 block text-[10px] font-bold text-slate-600">Hashtags<input className={`${input} mt-1.5 bg-white`} value={hashtagText(kit.instagramHashtags)} onChange={e=>updateKit(kit.id,{instagramHashtags:e.target.value.split(/\s+/).filter(Boolean)})}/></label></section>
      <section className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-4"><div className="flex items-center justify-between gap-2"><h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-sm font-black text-white">f</span>Facebook</h4><button type="button" onClick={()=>copy(`${kit.facebookCaption}\n\n${hashtagText(kit.facebookHashtags)}`)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-white px-3 py-2 text-[10px] font-bold text-slate-700 hover:bg-blue-50"><Copy className="h-3.5 w-3.5"/>Copier le texte</button></div><textarea aria-label="Légende Facebook" className={`${input} mt-3 bg-white`} rows={3} maxLength={1000} value={kit.facebookCaption} onChange={e=>updateKit(kit.id,{facebookCaption:e.target.value})}/><label className="mt-3 block text-[10px] font-bold text-slate-600">Hashtags<input className={`${input} mt-1.5 bg-white`} value={hashtagText(kit.facebookHashtags)} onChange={e=>updateKit(kit.id,{facebookHashtags:e.target.value.split(/\s+/).filter(Boolean)})}/></label></section></div>
      <aside className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"><div className="flex items-center justify-between gap-2"><div><p className="text-[9px] font-bold uppercase tracking-wider text-indigo-600">Aperçu</p><h4 className="text-xs font-extrabold text-slate-900">Visuel JcHub</h4></div><select aria-label="Format du visuel" value={formats[kit.id]||'instagram'} onChange={e=>setFormats(old=>({...old,[kit.id]:e.target.value as KitNetwork}))} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[9px] font-semibold"><option value="instagram">Instagram 4:5</option><option value="facebook">Facebook 1200×630</option></select></div><img src={imageUrl} alt={`Aperçu du visuel pour ${kit.title}`} className="mt-3 w-full rounded-lg border border-slate-200 bg-white shadow-sm"/><a href={`${imageUrl}&download=1`} download className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"><Download className="h-4 w-4"/>Télécharger le visuel</a><p className="mt-2 text-[9px] leading-4 text-slate-500">Relisez le texte et le visuel avant la publication.</p></aside></div></article>;
    })}</div>}
  </section>;
}
