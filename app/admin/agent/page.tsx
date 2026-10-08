'use client';

import { useEffect, useState } from 'react';
import { Bot, CheckCircle2, CircleAlert, Clock3, ExternalLink, Lightbulb, Radar, RefreshCw, Send, Sparkles, ClipboardCheck } from 'lucide-react';

type Draft = {
  id: string;
  title: string;
  description: string;
  article: string;
  posts?: { devto?: string };
  promotion?: { type: 'tool' | 'article'; slug: string; name: string; url: string };
  recommendations?: Array<{ type: 'tool' | 'article'; title: string; reason: string; problem?: string; targetUser?: string; solution?: string; features?: string[]; suggestedSlug: string }>;
  importance?: { sourceCount: number; reason: string };
  notificationStatus?: 'sent' | 'failed' | 'pending';
  status: 'draft' | 'approved' | 'rejected' | 'scheduled' | 'published';
  publishedSlug?: string;
  provider?: string;
  createdAt?: string | null;
  scheduledFor?: string | null;
  sources?: Array<{ title: string; url: string; source: string; score: number; summary: string }>;
  socialResults?: { network: 'devto'; status: 'published' | 'skipped' | 'failed'; message?: string; id?: string; url?: string }[];
};

export default function AgentPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [scheduleValues, setScheduleValues] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ title: '', description: '', article: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [auditFindings, setAuditFindings] = useState<Array<{ type: 'stale' | 'duplicate' | 'broken-link'; title: string; detail: string }> | null>(null);
  const [auditing, setAuditing] = useState(false);

  const loadDrafts = async () => {
    const response = await fetch('/api/admin/agent/drafts', { cache: 'no-store' });
    const data = await response.json() as { drafts?: Draft[]; error?: string };
    if (!response.ok) throw new Error(data.error || 'Chargement impossible.');
    const nextDrafts = data.drafts || [];
    setDrafts(nextDrafts);
    return nextDrafts;
  };

  useEffect(() => {
    loadDrafts().catch((error) => setMessage(error.message)).finally(() => setLoading(false));
  }, []);

  const runAgent = async () => {
    setRunning(true);
    setMessage('');
    try {
      const previousIds = new Set(drafts.map((draft) => draft.id));
      const response = await fetch('/api/admin/agent/run', { method: 'POST' });
      const data = await response.json() as { error?: string; runId?: string };
      if (!response.ok) throw new Error(data.error || 'Démarrage impossible.');
      setMessage('Analyse lancée. Recherche des tendances et création du brouillon...');
      for (let attempt = 0; attempt < 30; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
        const nextDrafts = await loadDrafts();
        const newDraft = nextDrafts.find((draft) => !previousIds.has(draft.id));
        if (newDraft) {
          setMessage(`Analyse terminée : « ${newDraft.title} » est prêt à examiner.${newDraft.notificationStatus === 'sent' ? ' Notification envoyée par e-mail.' : ' La notification e-mail a échoué; consulte le brouillon ici.'}`);
          return;
        }
      }
      setMessage(`L’analyse a démarré (${data.runId || 'workflow'}), mais aucun brouillon n’est arrivé après 60 secondes. Vérifie les journaux du workflow et les clés Gemini/Firebase.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Démarrage impossible.');
    } finally {
      setRunning(false);
    }
  };

  const approveAndSchedule = async (draft: Draft) => {
    const response = await fetch(`/api/admin/agent/drafts/${draft.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve-and-schedule' }) });
    const data = await response.json() as { error?: string; scheduledFor?: string };
    if (!response.ok) { setMessage(data.error || 'Programmation impossible.'); return; }
    await loadDrafts();
    setMessage(`Article approuvé et programmé pour le ${data.scheduledFor ? new Date(data.scheduledFor).toLocaleString('fr-FR') : 'la semaine prochaine'}.`);
  };

  const createToolDraft = async (draft: Draft, recommendation: NonNullable<Draft['recommendations']>[number]) => {
    const response = await fetch('/api/admin/tools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal: { ...recommendation, sourceDraftId: draft.id } }),
    });
    const data = await response.json() as { error?: string };
    if (!response.ok) { setMessage(data.error || 'Création du brouillon d’outil impossible.'); return; }
    setMessage(`Brouillon d’outil créé : ${recommendation.title}. Tu peux le compléter dans l’administration des outils.`);
  };

  const runContentAudit = async () => {
    setAuditing(true); setMessage('');
    try {
      const response = await fetch('/api/admin/agent/audit', { method: 'POST' });
      const data = await response.json() as { error?: string; checkedArticles?: number; checkedTools?: number; findings?: Array<{ type: 'stale' | 'duplicate' | 'broken-link'; title: string; detail: string }> };
      if (!response.ok) throw new Error(data.error || 'Audit impossible.');
      setAuditFindings(data.findings || []);
      setMessage(`Audit terminé : ${data.checkedArticles || 0} article(s) et ${data.checkedTools || 0} outil(s) vérifiés.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Audit impossible.'); }
    finally { setAuditing(false); }
  };

  const scheduleDraft = async (draft: Draft) => {
    const localDate = scheduleValues[draft.id];
    if (!localDate) {
      setMessage('Choisis une date et une heure avant de programmer l’article.');
      return;
    }
    const response = await fetch(`/api/admin/agent/drafts/${draft.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'schedule', scheduledFor: new Date(localDate).toISOString() }),
    });
    const data = await response.json() as { error?: string };
    if (!response.ok) {
      setMessage(data.error || 'Programmation impossible.');
      return;
    }
    await loadDrafts();
    setMessage('Article programmé. Le cron le publiera après la date choisie.');
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const response = await fetch(`/api/admin/agent/drafts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const data = await response.json() as { error?: string };
      setMessage(data.error || 'Mise à jour impossible.');
      return;
    }
    setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, status } : draft));
  };

  const saveDraft = async (draft: Draft) => {
    const response = await fetch(`/api/admin/agent/drafts/${draft.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'edit', ...editFields }) });
    const data = await response.json() as { error?: string; title?: string; description?: string; article?: string };
    if (!response.ok) { setMessage(data.error || 'Enregistrement impossible.'); return; }
    setDrafts((current) => current.map((item) => item.id === draft.id ? { ...item, title: data.title || editFields.title, description: data.description || editFields.description, article: data.article || editFields.article } : item));
    setEditingId(null);
    setMessage('Modifications du brouillon enregistrées.');
  };

  const publishDraft = async (id: string) => {
    const response = await fetch(`/api/admin/agent/drafts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'publish' }) });
    const data = await response.json() as { error?: string; status?: Draft['status']; slug?: string; socialResults?: Draft['socialResults'] };
    if (!response.ok) { setMessage(data.error || 'Publication impossible.'); return; }
    setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, status: 'published', publishedSlug: data.slug, socialResults: data.socialResults } : draft));
    setMessage('Article publié sur JcHub et réseaux traités.');
  };

  const publishNetwork = async (id: string, network: 'devto') => {
    const response = await fetch(`/api/admin/agent/drafts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'publish-network', network }) });
    const data = await response.json() as { error?: string; socialResult?: { network: 'devto'; status: 'published' | 'skipped' | 'failed'; message?: string; id?: string; url?: string } };
    if (!response.ok) { setMessage(data.error || `Publication ${network} impossible.`); return; }
    setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, socialResults: [...(draft.socialResults || []).filter((result) => result.network !== network), ...(data.socialResult ? [data.socialResult] : [])] } : draft));
    setMessage(`${network.toUpperCase()} : résultat enregistré.`);
  };

  const minimumScheduleDate = new Date(Date.now() + 60_000);
  const minimumScheduleValue = new Date(minimumScheduleDate.getTime() - minimumScheduleDate.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  const pendingCount = drafts.filter((draft) => draft.status === 'draft').length;
  const approvedCount = drafts.filter((draft) => draft.status === 'approved').length;
  const publishedCount = drafts.filter((draft) => draft.status === 'published').length;
  const visibleDrafts = statusFilter === 'all' ? drafts : drafts.filter((draft) => draft.status === statusFilter);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-10">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-blue-600">Veille &amp; création</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Agent éditorial</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Repérez les sujets, préparez des articles et gérez leur validation depuis un seul espace.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => loadDrafts().catch((error) => setMessage(error.message))} disabled={running} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:border-blue-200 hover:text-blue-700 disabled:opacity-60"><RefreshCw className="h-4 w-4" />Actualiser</button><button type="button" onClick={() => void runContentAudit()} disabled={auditing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:border-violet-200 hover:text-violet-700 disabled:opacity-60"><ClipboardCheck className={`h-4 w-4 ${auditing ? 'animate-pulse' : ''}`} />{auditing ? 'Audit…' : 'Auditer le contenu'}</button><button onClick={runAgent} disabled={running} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />{running ? 'Analyse en cours…' : 'Lancer une analyse'}</button></div></header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><AgentStat label="Tous les brouillons" value={drafts.length} note="Contenus produits par l’agent" icon={<Bot className="h-4 w-4" />} tone="blue" /><AgentStat label="À réviser" value={pendingCount} note="En attente de validation" icon={<CircleAlert className="h-4 w-4" />} tone="orange" /><AgentStat label="Prêts à publier" value={approvedCount} note="Approuvés ou programmables" icon={<Clock3 className="h-4 w-4" />} tone="violet" /><AgentStat label="Publiés" value={publishedCount} note="Articles diffusés sur JcHub" icon={<CheckCircle2 className="h-4 w-4" />} tone="green" /></section>

      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-violet-50 p-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-blue-600 shadow-sm"><Radar className="h-5 w-5" /></span><span><strong className="block text-sm text-slate-800">Veille éditoriale hebdomadaire</strong><small className="mt-1 block text-xs text-slate-500">Chaque semaine, l’agent analyse les tendances et propose des contenus pour différents publics. Aucun article n’est publié sans ton approbation.</small></span></div><div className="flex flex-wrap gap-3 text-[10px] font-semibold text-slate-500"><span className="inline-flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-amber-500" />Repérage des sujets</span><span className="inline-flex items-center gap-1.5"><Bot className="h-3.5 w-3.5 text-blue-500" />Rédaction assistée</span><span className="inline-flex items-center gap-1.5"><Send className="h-3.5 w-3.5 text-emerald-600" />Validation humaine</span></div></section>

      {message && <p role="status" className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">{message}</p>}
      {auditFindings && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-extrabold text-slate-900">Résultats de l’audit éditorial</h2>{auditFindings.length ? <ul className="mt-3 space-y-2">{auditFindings.map((finding, index) => <li key={`${finding.type}-${index}`} className="rounded-xl bg-amber-50 p-3 text-sm"><strong>{finding.title}</strong><p className="mt-1 text-xs leading-5 text-slate-600">{finding.detail}</p></li>)}</ul> : <p className="mt-2 text-sm text-emerald-700">Aucun lien interne brisé, titre identique ou article de plus d’un an détecté.</p>}<p className="mt-3 text-[11px] text-slate-400">Ces contrôles automatiques sont des pistes à vérifier, pas des décisions de publication.</p></section>}

      <section className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"><div><h2 className="text-sm font-extrabold text-slate-900">Brouillons de l’IA</h2><p className="mt-1 text-xs text-slate-500">Révisez le texte, approuvez-le, puis publiez-le ou programmez sa sortie.</p></div><div className="flex items-center gap-2"><label htmlFor="draft-status" className="text-xs font-semibold text-slate-500">Statut</label><select id="draft-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"><option value="all">Tous ({drafts.length})</option><option value="draft">À réviser ({pendingCount})</option><option value="approved">Prêts ({approvedCount})</option><option value="published">Publiés ({publishedCount})</option><option value="scheduled">Programmés ({drafts.filter((draft) => draft.status === 'scheduled').length})</option><option value="rejected">Refusés ({drafts.filter((draft) => draft.status === 'rejected').length})</option></select></div></section>

      {loading ? <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Chargement des brouillons…</p> : visibleDrafts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm"><Lightbulb className="mx-auto h-8 w-8 text-amber-400" /><p className="mt-3 font-bold text-slate-700">{drafts.length ? 'Aucun brouillon pour ce statut.' : 'Aucun brouillon pour le moment.'}</p><p className="mt-1 text-sm text-slate-500">{drafts.length ? 'Choisis un autre statut pour afficher les propositions.' : 'Lance une analyse pour générer la prochaine idée.'}</p></div>
      ) : (
        <div className="space-y-4">
          {visibleDrafts.map((draft) => (
            <article id={`draft-${draft.id}`} key={draft.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md">
              <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-emerald-400" />
              <div className="p-5 md:p-6">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-400">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 uppercase tracking-wider text-blue-700">{draft.provider || 'IA'}</span><DraftStatus status={draft.status} />{draft.createdAt && <span className="text-[10px] font-medium">Créé le {new Date(draft.createdAt).toLocaleDateString('fr-FR')}</span>}{draft.status === 'scheduled' && draft.scheduledFor && <span className="text-[10px] font-medium">Sortie prévue le {new Date(draft.scheduledFor).toLocaleString('fr-FR')}</span>}
                  </div>
                  <h2 className="mt-3 text-lg font-extrabold text-slate-900">{draft.title}</h2>
                  <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">{draft.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">{['draft', 'approved'].includes(draft.status) && <button onClick={() => { setEditingId(editingId === draft.id ? null : draft.id); setEditFields({ title: draft.title, description: draft.description, article: draft.article }); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-blue-300">Réviser / modifier</button>}{draft.status === 'draft' && <><button onClick={() => updateStatus(draft.id, 'approved')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500">Approuver</button><button onClick={() => void approveAndSchedule(draft)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500">Approuver et programmer la semaine prochaine</button><button onClick={() => updateStatus(draft.id, 'rejected')} className="rounded-lg bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300">Rejeter</button></>}{draft.status === 'approved' && <button onClick={() => publishDraft(draft.id)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500">Publier sur le blog</button>}{draft.status === 'published' && <a href={`/blog/${draft.publishedSlug || draft.id}`} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700">Voir l’article</a>}</div>
              </div>
              {editingId === draft.id && <div className="mt-4 space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4"><label className="block text-xs font-bold text-slate-600">Titre<input value={editFields.title} onChange={(event) => setEditFields((fields) => ({ ...fields, title: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label><label className="block text-xs font-bold text-slate-600">Résumé<textarea value={editFields.description} onChange={(event) => setEditFields((fields) => ({ ...fields, description: event.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label><label className="block text-xs font-bold text-slate-600">Article<textarea value={editFields.article} onChange={(event) => setEditFields((fields) => ({ ...fields, article: event.target.value }))} rows={12} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal leading-6" /></label><div className="flex justify-end gap-2"><button onClick={() => setEditingId(null)} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-600">Annuler</button><button onClick={() => void saveDraft(draft)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">Enregistrer</button></div></div>}
              {draft.status === 'approved' && <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-indigo-100 bg-indigo-50 p-4"><label className="text-xs font-semibold text-slate-600">Programmer la publication<input type="datetime-local" min={minimumScheduleValue} value={scheduleValues[draft.id] || ''} onChange={(event) => setScheduleValues((current) => ({ ...current, [draft.id]: event.target.value }))} className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900" /></label><button type="button" onClick={() => scheduleDraft(draft)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500">Programmer</button></div>}
              <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold text-indigo-700">Voir le contenu</summary><div className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{draft.article}</div></details>
              {draft.promotion && <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-[11px] font-black uppercase tracking-wider text-blue-700">Élément JcHub promu</p><div className="mt-2 flex flex-wrap items-center gap-2"><strong className="text-slate-900">{draft.promotion.name}</strong><span className="rounded-full bg-white px-2 py-1 text-[11px] text-slate-500">{draft.promotion.type === 'tool' ? 'outil' : 'article'}</span><a href={draft.promotion.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">Ouvrir le lien <ExternalLink className="h-3 w-3" /></a></div></div>}
              {draft.recommendations && draft.recommendations.length > 0 && <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4"><p className="text-[11px] font-black uppercase tracking-wider text-amber-700">Idées détectées par la veille</p><ul className="mt-2 space-y-3 text-sm text-slate-700">{draft.recommendations.map((recommendation, index) => <li key={`${recommendation.suggestedSlug}-${index}`} className="rounded-lg border border-amber-100 bg-white p-3"><strong>{recommendation.title}</strong> <span className="text-xs text-slate-500">({recommendation.type === 'tool' ? 'outil' : 'article'})</span>{recommendation.problem && <p className="mt-2 text-xs"><strong>Besoin :</strong> {recommendation.problem}</p>}{recommendation.targetUser && <p className="mt-1 text-xs"><strong>Public :</strong> {recommendation.targetUser}</p>}{recommendation.solution && <p className="mt-1 text-xs"><strong>Solution :</strong> {recommendation.solution}</p>}{recommendation.features && <ul className="mt-1 list-inside list-disc text-xs">{recommendation.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>}<p className="mt-1 text-xs text-slate-600">{recommendation.reason}</p>{recommendation.type === 'tool' && <button type="button" onClick={() => void createToolDraft(draft, recommendation)} className="mt-3 rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100">Créer un brouillon d’outil à partir de cette idée</button>}</li>)}</ul></div>}
              {draft.sources && draft.sources.length > 0 && <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50 p-4"><p className="text-[11px] font-black uppercase tracking-wider text-cyan-800">Tendances et sources repérées ({draft.sources.length})</p><ul className="mt-2 grid gap-2 sm:grid-cols-2">{draft.sources.map((source, index) => <li key={`${source.url}-${index}`} className="rounded-lg bg-white p-3"><a href={source.url.startsWith('https://') ? source.url : undefined} target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-900 hover:text-cyan-700">{source.title}</a><span className="ml-2 rounded-full bg-cyan-50 px-2 py-1 text-[10px] font-bold uppercase text-cyan-800">{source.source} · {source.score}</span><p className="mt-1 text-xs leading-5 text-slate-600">{source.summary}</p></li>)}</ul></div>}
              {draft.socialResults && <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Diffusion réseaux</p><div className="mt-2 flex flex-wrap gap-2">{draft.socialResults.map((result) => <span key={result.network} title={result.message} className={`rounded-full px-3 py-1 text-xs font-bold ${result.status === 'published' ? 'bg-emerald-100 text-emerald-700' : result.status === 'skipped' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{result.network.toUpperCase()} · {result.status === 'published' ? 'publié' : result.status === 'skipped' ? 'ignoré' : 'échec'}</span>)}</div></div>}
              {draft.posts?.devto && <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"><strong className="text-slate-900">Dev.to</strong><p className="mt-1 text-slate-600">{draft.posts.devto}</p>{draft.status === 'published' && <button type="button" onClick={() => publishNetwork(draft.id, 'devto')} className="mt-2 rounded-lg bg-[#171717] px-3 py-2 text-xs font-bold text-white hover:bg-black">Publier sur Dev.to</button>}</div>}
              {draft.importance && <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{draft.importance.reason} L’article ne sera publié qu’après approbation humaine.</p>}
              {draft.notificationStatus === 'failed' && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">La notification par e-mail n’a pas pu être envoyée. Le brouillon reste disponible ici.</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function AgentStat({ label, value, note, icon, tone }: { label: string; value: number; note: string; icon: React.ReactNode; tone: 'blue' | 'orange' | 'violet' | 'green' }) {
  const colors = { blue: 'bg-blue-50 text-blue-600', orange: 'bg-orange-50 text-orange-600', violet: 'bg-violet-50 text-violet-600', green: 'bg-emerald-50 text-emerald-600' };
  return <article className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><span><span className="block text-[10px] font-medium text-slate-500">{label}</span><strong className="mt-1 block text-2xl font-black tracking-tight text-slate-900">{value}</strong></span><span className={`grid h-9 w-9 place-items-center rounded-xl ${colors[tone]}`}>{icon}</span></div><p className="mt-2 text-[10px] text-slate-500">{note}</p></article>;
}

function DraftStatus({ status }: { status: Draft['status'] }) {
  const labels: Record<Draft['status'], string> = { draft: 'À réviser', approved: 'Prêt à publier', rejected: 'Refusé', scheduled: 'Programmé', published: 'Publié' };
  const tones: Record<Draft['status'], string> = { draft: 'bg-orange-100 text-orange-700', approved: 'bg-violet-100 text-violet-700', rejected: 'bg-slate-100 text-slate-600', scheduled: 'bg-blue-100 text-blue-700', published: 'bg-emerald-100 text-emerald-700' };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${tones[status]}`}><i className="h-1.5 w-1.5 rounded-full bg-current" />{labels[status]}</span>;
}
