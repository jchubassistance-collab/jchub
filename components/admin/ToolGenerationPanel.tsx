'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Check, ExternalLink, GitPullRequest, Loader2, Sparkles, X } from 'lucide-react';

export type ToolGeneration = {
  status: 'generating' | 'pr_open' | 'merged' | 'rejected' | 'failed';
  component?: string;
  prNumber?: number;
  prUrl?: string;
  author?: string;
  error?: string;
};

type GenerationTool = { id: string; name: string; description: string; status: string; publishAt?: string };

type StatusResponse = {
  missing: string[];
  generation: ToolGeneration | null;
  pr?: { url: string; filesUrl: string; mergeableState: string };
  preview?: { state: 'pending' | 'ready' | 'failed'; toolUrl?: string; logUrl?: string };
  error?: string;
};

type Busy = '' | 'generate' | 'merge' | 'reject' | 'schedule';

/** Admin flow for an AI-generated tool: Gemini code → GitHub PR → Vercel preview → merge → scheduled release. */
export function ToolGenerationPanel({ tool, onClose, onChanged }: { tool: GenerationTool; onClose: () => void; onChanged: () => void }) {
  const [info, setInfo] = useState<StatusResponse | null>(null);
  const [busy, setBusy] = useState<Busy>('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [releaseAt, setReleaseAt] = useState('');

  const endpoint = `/api/admin/tools/${encodeURIComponent(tool.id)}/generation`;

  const load = useCallback(async () => {
    try {
      const response = await fetch(endpoint, { cache: 'no-store' });
      const data = await response.json() as StatusResponse;
      if (!response.ok) throw new Error(data.error || 'État de la génération indisponible.');
      setInfo(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'État de la génération indisponible.');
    }
  }, [endpoint]);

  useEffect(() => { void load(); }, [load]);

  const status = info?.generation?.status;
  const previewState = info?.preview?.state;
  const waiting = status === 'generating' || (status === 'pr_open' && (previewState === 'pending' || info?.pr?.mergeableState === 'unknown'));
  useEffect(() => {
    if (!waiting || busy) return;
    const interval = window.setInterval(() => { void load(); }, 15_000);
    return () => window.clearInterval(interval);
  }, [waiting, busy, load]);

  const run = async (action: 'generate' | 'merge' | 'reject', success: string) => {
    setBusy(action); setError(''); setNotice('');
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Action impossible.');
      setNotice(success);
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action impossible.');
    } finally {
      setBusy('');
      await load();
    }
  };

  const schedule = async () => {
    setBusy('schedule'); setError(''); setNotice('');
    const date = releaseAt ? new Date(releaseAt) : new Date();
    try {
      const response = await fetch(`/api/admin/tools/${encodeURIComponent(tool.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'published', publishAt: date.toISOString() }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Programmation impossible.');
      setNotice(`Programmé : l’outil sera visible à partir du ${date.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}, une fois le nouveau code déployé par Vercel.`);
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Programmation impossible.');
    } finally {
      setBusy('');
    }
  };

  const generation = info?.generation;
  const canGenerate = !generation || generation.status === 'failed' || generation.status === 'rejected';
  const step = !generation || canGenerate || status === 'generating' ? 1 : status === 'pr_open' ? (previewState === 'ready' ? 3 : 2) : 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="tool-generation-title">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-violet-700"><Sparkles className="h-3.5 w-3.5" />Création par IA</p>
            <h2 id="tool-generation-title" className="mt-1 text-xl font-black text-slate-900">{tool.name}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">{tool.description || 'Ajoute une description dans la fiche : c’est elle que l’IA suit.'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>

        {info?.missing.length ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
            Configuration manquante sur Vercel : <strong>{info.missing.join(', ')}</strong>. Ajoute ces variables puis redéploie pour activer la création d’outils.
          </p>
        ) : null}
        {error && <p role="alert" className="mt-4 whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">{error}</p>}
        {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-800">{notice}</p>}

        {!info ? (
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Chargement…</p>
        ) : (
          <ol className="mt-6 space-y-3">
            <Step number={1} current={step} title="Génération du code">
              {status === 'generating' || busy === 'generate' ? (
                <p className="inline-flex items-center gap-2 text-xs text-slate-600"><Loader2 className="h-4 w-4 animate-spin text-violet-600" />L’IA écrit l’outil (Gemini, ou OpenRouter en secours) puis le dépose sur GitHub. Ça prend 1 à 4 minutes.</p>
              ) : canGenerate ? (
                <>
                  {generation?.status === 'failed' && generation.error && <p className="mb-3 whitespace-pre-line rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">Dernier essai : {generation.error}</p>}
                  {generation?.status === 'rejected' && <p className="mb-3 text-xs text-slate-500">La proposition précédente a été rejetée. Tu peux ajuster la description puis relancer.</p>}
                  <button type="button" disabled={Boolean(busy) || Boolean(info.missing.length) || !tool.description.trim()} onClick={() => void run('generate', 'Pull Request créée. Vercel construit maintenant l’aperçu.')} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50">
                    <Sparkles className="h-3.5 w-3.5" />Générer l’outil avec l’IA
                  </button>
                </>
              ) : (
                <p className="text-xs text-slate-600">Composant <code className="rounded bg-slate-100 px-1.5 py-0.5">{generation?.component}</code> proposé dans la{' '}
                  <a href={generation?.prUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">Pull Request #{generation?.prNumber}</a>
                  {generation?.author && <>, écrit par {generation.author}</>}.
                  {generation?.author?.startsWith('OpenRouter') && <span className="mt-2 block rounded-lg bg-amber-50 px-3 py-2 text-amber-800">Gemini était indisponible : ce code vient d’un modèle de secours. Teste-le avec une attention particulière.</span>}
                </p>
              )}
            </Step>

            <Step number={2} current={step} title="Test sur l’aperçu Vercel">
              {status === 'merged' && <p className="text-xs text-slate-600">Aperçu testé.</p>}
              {status === 'pr_open' && (
                previewState === 'ready' ? (
                  <div className="flex flex-wrap gap-2">
                    <a href={info.preview?.toolUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700">Tester l’outil sur l’aperçu<ExternalLink className="h-3.5 w-3.5" /></a>
                    <a href={info.pr?.filesUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-blue-300"><GitPullRequest className="h-3.5 w-3.5" />Voir le code</a>
                  </div>
                ) : previewState === 'failed' ? (
                  <p className="text-xs leading-5 text-red-700">La construction de l’aperçu a échoué : le code ne compile pas.{' '}
                    {info.preview?.logUrl && <a href={info.preview.logUrl} target="_blank" rel="noreferrer" className="font-semibold underline">Voir le journal</a>}. Rejette la proposition puis relance une génération.
                  </p>
                ) : (
                  <p className="inline-flex items-center gap-2 text-xs text-slate-600"><Loader2 className="h-4 w-4 animate-spin text-blue-600" />Vercel construit l’aperçu (2 à 4 minutes). Cette fenêtre se met à jour toute seule.</p>
                )
              )}
            </Step>

            <Step number={3} current={step} title="Approbation">
              {status === 'merged' && <p className="text-xs text-slate-600">Code fusionné dans le site.</p>}
              {status === 'pr_open' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" disabled={Boolean(busy) || previewState !== 'ready'} onClick={() => void run('merge', 'Code fusionné : Vercel déploie le site. Choisis maintenant la date de mise en ligne.')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                    {busy === 'merge' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}J’ai testé : approuver
                  </button>
                  <button type="button" disabled={Boolean(busy)} onClick={() => { if (window.confirm('Rejeter cette proposition ? La Pull Request sera fermée.')) void run('reject', 'Proposition rejetée.'); }} className="rounded-lg border border-red-200 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">
                    {busy === 'reject' ? 'Rejet…' : 'Rejeter'}
                  </button>
                  {previewState !== 'ready' && <span className="text-[11px] text-slate-500">Disponible une fois l’aperçu prêt.</span>}
                </div>
              )}
            </Step>

            <Step number={4} current={step} title="Mise en ligne">
              {status === 'merged' && (
                <div className="space-y-3">
                  {tool.status === 'published' && tool.publishAt && (
                    <p className="text-xs text-slate-600">Programmé pour le {new Date(tool.publishAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}.</p>
                  )}
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="text-xs font-semibold text-slate-600">Visible à partir du
                      <input type="datetime-local" value={releaseAt} onChange={(event) => setReleaseAt(event.target.value)} className="mt-1 block h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-900" />
                    </label>
                    <button type="button" disabled={Boolean(busy)} onClick={() => void schedule()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                      {busy === 'schedule' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarClock className="h-3.5 w-3.5" />}{releaseAt ? 'Programmer' : 'Publier dès le déploiement'}
                    </button>
                  </div>
                  <p className="text-[11px] leading-4 text-slate-500">L’outil apparaît sur le site quand les deux conditions sont réunies : la date est passée et Vercel a fini de déployer le nouveau code (2 à 4 minutes après l’approbation).</p>
                </div>
              )}
            </Step>
          </ol>
        )}
      </section>
    </div>
  );
}

function Step({ number, current, title, children }: { number: number; current: number; title: string; children: React.ReactNode }) {
  const done = number < current;
  const active = number === current;
  return (
    <li className={`rounded-xl border p-4 ${active ? 'border-blue-200 bg-blue-50/40' : 'border-slate-100'}`}>
      <div className="flex items-center gap-2.5">
        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black ${done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{done ? <Check className="h-3.5 w-3.5" /> : number}</span>
        <h3 className={`text-sm font-bold ${active || done ? 'text-slate-900' : 'text-slate-400'}`}>{title}</h3>
      </div>
      {(active || done) && <div className="mt-3 pl-8">{children}</div>}
    </li>
  );
}
