'use client';

import { useEffect, useState } from 'react';
import { Bot, ExternalLink, Lightbulb, Radar, RefreshCw, Send, Sparkles } from 'lucide-react';

type Draft = {
  id: string;
  title: string;
  description: string;
  article: string;
  posts?: { x?: string; linkedin?: string; devto?: string };
  promotion?: { type: 'tool' | 'article'; slug: string; name: string; url: string };
  recommendations?: Array<{ type: 'tool' | 'article'; title: string; reason: string; suggestedSlug: string }>;
  status: 'draft' | 'approved' | 'rejected' | 'published';
  publishedSlug?: string;
  provider?: string;
  createdAt?: string | null;
  socialResults?: { network: 'x' | 'linkedin' | 'devto'; status: 'published' | 'skipped' | 'failed'; message?: string; id?: string }[];
};

export default function AgentPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');

  const loadDrafts = async () => {
    const response = await fetch('/api/admin/agent/drafts', { cache: 'no-store' });
    const data = await response.json() as { drafts?: Draft[]; error?: string };
    if (!response.ok) throw new Error(data.error || 'Chargement impossible.');
    setDrafts(data.drafts || []);
  };

  useEffect(() => {
    loadDrafts().catch((error) => setMessage(error.message)).finally(() => setLoading(false));
  }, []);

  const runAgent = async () => {
    setRunning(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/agent/run', { method: 'POST' });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Démarrage impossible.');
      setMessage('Recherche lancée. Recharge la liste dans quelques instants.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Démarrage impossible.');
    } finally {
      setRunning(false);
    }
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

  const publishDraft = async (id: string) => {
    const response = await fetch(`/api/admin/agent/drafts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'publish' }) });
    const data = await response.json() as { error?: string; status?: Draft['status']; slug?: string; socialResults?: Draft['socialResults'] };
    if (!response.ok) { setMessage(data.error || 'Publication impossible.'); return; }
    setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, status: 'published', publishedSlug: data.slug, socialResults: data.socialResults } : draft));
    setMessage('Article publié sur JcHub et réseaux traités.');
  };

  const publishNetwork = async (id: string, network: 'x' | 'linkedin' | 'devto') => {
    const response = await fetch(`/api/admin/agent/drafts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'publish-network', network }) });
    const data = await response.json() as { error?: string; socialResult?: Draft['socialResults'] extends Array<infer Result> ? Result : never };
    if (!response.ok) { setMessage(data.error || `Publication ${network} impossible.`); return; }
    setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, socialResults: [...(draft.socialResults || []).filter((result) => result.network !== network), ...(data.socialResult ? [data.socialResult] : [])] } : draft));
    setMessage(`${network.toUpperCase()} : résultat enregistré.`);
  };

  const publicSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').replace(/\/$/, '');
  const shareUrl = (draft: Draft) => `${publicSiteUrl}/blog/${draft.publishedSlug || draft.id}`;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section className="overflow-hidden rounded-2xl bg-[#07142b] text-white shadow-xl shadow-blue-950/10">
        <div className="flex flex-col justify-between gap-6 p-6 md:flex-row md:items-end md:p-8">
          <div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-blue-300"><Radar className="h-4 w-4" /> Veille éditoriale</div><h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Tendances et brouillons</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">L’agent observe le web, compare ton catalogue et prépare une publication avec le bon lien JcHub.</p></div>
          <button onClick={runAgent} disabled={running} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2d67f6] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />{running ? 'Analyse en cours...' : 'Lancer une analyse'}</button>
        </div>
        <div className="grid border-t border-white/10 bg-white/[.04] sm:grid-cols-3"><div className="flex items-center gap-3 px-6 py-4 text-sm text-slate-300"><Sparkles className="h-4 w-4 text-amber-300" />Tendances web</div><div className="flex items-center gap-3 border-white/10 px-6 py-4 text-sm text-slate-300 sm:border-l"><Bot className="h-4 w-4 text-blue-300" />Contenu généré</div><div className="flex items-center gap-3 border-white/10 px-6 py-4 text-sm text-slate-300 sm:border-l"><Send className="h-4 w-4 text-emerald-300" />Validation humaine</div></div>
      </section>

      {message && <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">{message}</p>}

      {loading ? <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Chargement des brouillons...</p> : drafts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm"><Lightbulb className="mx-auto h-8 w-8 text-amber-400" /><p className="mt-3 font-bold text-slate-700">Aucun brouillon pour le moment.</p><p className="mt-1 text-sm text-slate-500">Lance une analyse pour générer la prochaine idée.</p></div>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <article key={draft.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md md:p-6">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">{draft.provider || 'ia'}</span><span>•</span><span>{draft.status}</span>
                  </div>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">{draft.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{draft.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">{draft.status === 'draft' && <><button onClick={() => updateStatus(draft.id, 'approved')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500">Approuver</button><button onClick={() => updateStatus(draft.id, 'rejected')} className="rounded-lg bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300">Rejeter</button></>}{draft.status === 'approved' && <button onClick={() => publishDraft(draft.id)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500">Publier sur le blog</button>}{draft.status === 'published' && <a href={`/blog/${draft.publishedSlug || draft.id}`} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700">Voir l’article</a>}</div>
              </div>
              <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold text-indigo-700">Voir le contenu</summary><div className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{draft.article}</div></details>
              {draft.promotion && <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4"><p className="text-[11px] font-black uppercase tracking-wider text-blue-700">Élément JcHub promu</p><div className="mt-2 flex flex-wrap items-center gap-2"><strong className="text-slate-900">{draft.promotion.name}</strong><span className="rounded-full bg-white px-2 py-1 text-[11px] text-slate-500">{draft.promotion.type === 'tool' ? 'outil' : 'article'}</span><a href={draft.promotion.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">Ouvrir le lien <ExternalLink className="h-3 w-3" /></a></div></div>}
              {draft.recommendations && draft.recommendations.length > 0 && <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-4"><p className="text-[11px] font-black uppercase tracking-wider text-amber-700">Idées détectées par la veille</p><ul className="mt-2 space-y-2 text-sm text-slate-700">{draft.recommendations.map((recommendation, index) => <li key={`${recommendation.suggestedSlug}-${index}`} className="border-b border-amber-100 pb-2 last:border-0 last:pb-0"><strong>{recommendation.title}</strong> <span className="text-xs text-slate-500">({recommendation.type})</span><span className="block text-xs text-slate-600">{recommendation.reason}</span></li>)}</ul></div>}
              {draft.socialResults && <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Diffusion réseaux</p><div className="mt-2 flex flex-wrap gap-2">{draft.socialResults.map((result) => <span key={result.network} title={result.message} className={`rounded-full px-3 py-1 text-xs font-bold ${result.status === 'published' ? 'bg-emerald-100 text-emerald-700' : result.status === 'skipped' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{result.network.toUpperCase()} · {result.status === 'published' ? 'publié' : result.status === 'skipped' ? 'ignoré' : 'échec'}</span>)}</div></div>}
              {draft.posts && <div className="mt-4 grid gap-3 text-sm md:grid-cols-3"><div><strong className="text-slate-900">X</strong><p className="mt-1 text-slate-600">{draft.posts.x}</p>{draft.status === 'published' && <button type="button" onClick={() => publishNetwork(draft.id, 'x')} className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700">Publier sur X</button>}</div><div><strong className="text-slate-900">LinkedIn</strong><p className="mt-1 text-slate-600">{draft.posts.linkedin}</p>{draft.status === 'published' && <button type="button" onClick={() => publishNetwork(draft.id, 'linkedin')} className="mt-2 rounded-lg bg-[#0a66c2] px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">Publier sur LinkedIn</button>}</div><div><strong className="text-slate-900">Dev.to</strong><p className="mt-1 text-slate-600">{draft.posts.devto}</p>{draft.status === 'published' && <button type="button" onClick={() => publishNetwork(draft.id, 'devto')} className="mt-2 rounded-lg bg-[#171717] px-3 py-2 text-xs font-bold text-white hover:bg-black">Publier sur Dev.to</button>}</div></div>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}