'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, CalendarClock, Check, Eye, LoaderCircle, RefreshCw, Send, Settings2, ShieldAlert } from 'lucide-react';
import type { PublicationRecord, SocialPlatform, SocialSettings } from '@/lib/social-types';
import type { PlatformReadiness } from '@/lib/social-readiness';
import type { FacebookInsightsReport } from '@/lib/facebook-insights';
import type { GitHubInsightsReport } from '@/lib/github-insights';

type ArticleOption = { id: string; title: string; url: string };
type Payload = { settings: SocialSettings; credentialReadiness: Record<SocialPlatform, PlatformReadiness>; linkedinOAuthAvailable?: boolean; facebookOAuthAvailable?: boolean; facebookOAuthMissing?: string[]; publications: PublicationRecord[]; articles: ArticleOption[]; error?: string };
type InsightResult<T> = { report?: T; error?: string };
type SocialInsightsPayload = { facebook: InsightResult<FacebookInsightsReport>; github: InsightResult<GitHubInsightsReport>; error?: string };

const initialSettings: SocialSettings = { linkedinEnabled: false, facebookEnabled: false, githubEnabled: false, autoPublish: false, dryRun: true, timezone: 'Africa/Lagos' };
const platformLabels = { linkedin: 'LinkedIn membre', facebook: 'Facebook Page', github: 'GitHub Markdown' };
const statusLabels: Record<string, string> = { DRAFT: 'Brouillon', APPROVED: 'Approuvée', SCHEDULED: 'Programmée', PUBLISHING: 'En cours', PUBLISHED: 'Publiée', FAILED: 'Échec', CANCELLED: 'Annulée', UNKNOWN: 'À vérifier' };

export default function SocialPublishingAdminPage() {
  const [payload, setPayload] = useState<Payload>({ settings: initialSettings, credentialReadiness: { linkedin: { enabled: false, configured: false, ready: false, missing: [] }, facebook: { enabled: false, configured: false, ready: false, missing: [] }, github: { enabled: false, configured: false, ready: false, missing: [] } }, publications: [], articles: [] });
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [scheduleValues, setScheduleValues] = useState<Record<string, string>>({});
  const [previewId, setPreviewId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch('/api/admin/social', { cache: 'no-store' });
    const data = await response.json() as Payload;
    if (!response.ok) throw new Error(data.error || 'Chargement impossible.');
    setPayload(data);
    setSourceId((current) => current || data.articles[0]?.id || '');
    return data;
  }, []);

  const pollRefresh = async (isComplete: (current: Payload) => boolean) => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const current = await refresh();
      if (isComplete(current)) return current;
    }
    return null;
  };

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get('linkedin');
    if (status === 'connected') setMessage('LinkedIn est connecté dans cet environnement local.');
    if (status === 'error') setMessage('Connexion LinkedIn échouée. Vérifie les paramètres OAuth et réessaie.');
    const facebookStatus = new URLSearchParams(window.location.search).get('facebook');
    if (facebookStatus === 'connected') setMessage('La Page Facebook est connectée dans cet environnement local.');
    if (facebookStatus === 'page-required') setMessage('Plusieurs Pages sont disponibles. Renseigne FACEBOOK_PAGE_ID dans .env.local, puis relance la connexion.');
    if (facebookStatus === 'error') setMessage('Connexion Facebook échouée. Vérifie les paramètres OAuth, les permissions et la Page.');
    if (status) window.history.replaceState({}, '', window.location.pathname);
    refresh().catch((error) => setMessage(error.message)).finally(() => setLoading(false));
  }, [refresh]);

  const updateSettings = async (settings: SocialSettings) => {
    setPayload((current) => ({ ...current, settings }));
    const response = await fetch('/api/admin/social', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    const data = await response.json() as { settings?: SocialSettings; error?: string };
    if (!response.ok) { setMessage(data.error || 'Paramètres non enregistrés.'); await refresh(); return; }
    setMessage('Paramètres enregistrés.');
  };

  const request = async (key: string, url: string, body: Record<string, unknown>) => {
    setWorking(key); setMessage('');
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json() as { error?: string; dryRun?: boolean; wouldPublish?: string; reason?: string; queued?: boolean };
      if (!response.ok) throw new Error(data.error || data.reason || 'Action impossible.');
      setMessage(data.dryRun ? `DRY RUN : aucune publication envoyée (${data.wouldPublish}).` : data.queued ? 'Publication placée dans la file sécurisée.' : 'Action effectuée.');
      await refresh();
      if (data.queued && key === 'prepare') {
        const completed = await pollRefresh((current) => current.publications.some((item) => item.sourceContentId === sourceId));
        setMessage(completed ? 'Variantes préparées et ajoutées à la file.' : 'La préparation est toujours en cours. Actualise la file dans quelques instants.');
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Action impossible.'); }
    finally { setWorking(null); }
  };

  const action = async (record: PublicationRecord, actionName: 'approve' | 'publish' | 'cancel' | 'retry' | 'schedule') => {
    if (actionName === 'retry' && record.status === 'UNKNOWN' && !window.confirm('Le résultat précédent est ambigu. Vérifie d’abord le compte cible. Confirme seulement si tu as vérifié qu’aucune publication n’existe.')) return;
    setWorking(record.id); setMessage('');
    try {
      const body = actionName === 'schedule'
        ? { action: actionName, localDateTime: scheduleValues[record.id] }
        : actionName === 'retry' && record.status === 'UNKNOWN'
          ? { action: actionName, confirmNoExternalPost: true }
          : { action: actionName };
      const response = await fetch(`/api/admin/social/${record.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json() as { error?: string; dryRun?: boolean; wouldPublish?: string; queued?: boolean };
      if (!response.ok) throw new Error(data.error || 'Action impossible.');
      setMessage(data.dryRun ? `DRY RUN : aucune publication envoyée (${data.wouldPublish}).` : data.queued ? 'Publication placée dans la file sécurisée.' : `${statusLabels[actionName === 'approve' ? 'APPROVED' : actionName === 'cancel' ? 'CANCELLED' : actionName === 'schedule' ? 'SCHEDULED' : 'PUBLISHED'] || 'Action effectuée'}.`);
      await refresh();
      if (data.queued) {
        const completed = await pollRefresh((current) => {
          const updated = current.publications.find((item) => item.id === record.id);
          return Boolean(updated && ['PUBLISHED', 'FAILED', 'UNKNOWN'].includes(updated.status));
        });
        if (!completed) setMessage('La publication est toujours en cours. Actualise la file dans quelques instants.');
        else {
          const updated = completed.publications.find((item) => item.id === record.id);
          setMessage(updated?.status === 'PUBLISHED' ? 'Publication effectuée.' : `Publication terminée : ${statusLabels[updated?.status || ''] || 'vérifie son état dans la file'}.`);
        }
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Action impossible.'); }
    finally { setWorking(null); }
  };

  const settingToggle = (label: string, key: keyof SocialSettings, description: string) => (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <span><strong className="block text-sm text-slate-900">{label}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></span>
      <input aria-label={label} type="checkbox" checked={Boolean(payload.settings[key])} onChange={(event) => updateSettings({ ...payload.settings, [key]: event.target.checked })} className="mt-1 h-4 w-4 accent-blue-600" />
    </label>
  );

  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="rounded-2xl bg-[#07142b] p-6 text-white md:p-8">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-blue-300"><Send className="h-4 w-4" /> Publication sociale</div>
      <h1 className="mt-3 text-3xl font-black">Préparer et publier</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Chaque plateforme possède son propre texte, son statut et son historique. Les tokens restent côté serveur.</p>
    </header>

    {message && <p role="status" className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">{message}</p>}
    {payload.settings.dryRun && <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900"><ShieldAlert className="h-4 w-4 shrink-0" />DRY RUN actif : aucune API sociale ni commit GitHub ne sera appelé.</p>}

    <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-3 rounded-2xl bg-slate-50 p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Settings2 className="h-5 w-5" />Réglages</h2>
        {(['linkedin', 'facebook', 'github'] as const).map((platform) => {
          const key = `${platform}Enabled` as keyof SocialSettings;
          return <div key={platform} className="space-y-2">
            {settingToggle(`${platformLabels[platform]} · ${payload.settings[key] ? 'activée' : 'désactivée'}`, key, payload.credentialReadiness[platform].configured ? 'Configuration serveur détectée.' : `À configurer dans Vercel : ${payload.credentialReadiness[platform].missing.join(', ') || 'variables serveur'}. Aucune valeur secrète n’est affichée.`)}
          </div>;
        })}
        {payload.linkedinOAuthAvailable
          ? <a href="/api/auth/linkedin/login" className="inline-flex items-center rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50">Connecter le compte LinkedIn</a>
          : <p className="text-xs text-slate-500">Connexion OAuth indisponible : configure LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET et LINKEDIN_REDIRECT_URI hors production. En production, utilise un token serveur.</p>}
        <div className="space-y-2">
          {payload.facebookOAuthAvailable
            ? <a href="/api/auth/facebook/login" className="inline-flex items-center rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50">Connecter une Page Facebook</a>
            : <button type="button" disabled title="Configuration OAuth Meta indisponible" className="inline-flex cursor-not-allowed items-center rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500">Connecter une Page Facebook</button>}
          {!payload.facebookOAuthAvailable && <p className="text-xs text-slate-500">{payload.facebookOAuthMissing?.includes('Connexion OAuth Meta disponible uniquement en local.')
            ? 'En production, configure FACEBOOK_ACCESS_TOKEN et FACEBOOK_PAGE_ID dans les variables secrètes Vercel.'
            : `Connexion OAuth locale indisponible : configure ${payload.facebookOAuthMissing?.join(', ') || 'les identifiants Meta'} dans .env.local, puis redémarre le serveur de développement.`}</p>}
        </div>
        {settingToggle('Publication automatique', 'autoPublish', 'Si activée, seules les plateformes activées sont publiées automatiquement.')}
        {settingToggle('Mode dry-run', 'dryRun', 'Empêche tout appel de publication et tout commit tant qu’il est activé.')}
        <label className="block rounded-xl border border-slate-200 bg-white p-4"><span className="block text-sm font-bold">Fuseau horaire des programmations</span><input value={payload.settings.timezone} onChange={(event) => setPayload((current) => ({ ...current, settings: { ...current.settings, timezone: event.target.value } }))} onBlur={() => updateSettings(payload.settings)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Africa/Brazzaville" /><span className="mt-1 block text-xs text-slate-500">Nom IANA, par exemple Africa/Brazzaville.</span></label>
      </div>

      <div className="rounded-2xl border border-slate-200 p-5">
        <h2 className="text-lg font-bold">Créer les variantes</h2>
        <p className="mt-1 text-sm text-slate-500">Choisis un article publié; l’agent prépare un texte adapté à chaque destination.</p>
        <select value={sourceId} onChange={(event) => setSourceId(event.target.value)} className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" disabled={!payload.articles.length}>
          {payload.articles.map((article) => <option key={article.id} value={article.id}>{article.title}</option>)}
        </select>
        <button disabled={!sourceId || Boolean(working)} onClick={() => request('prepare', '/api/admin/social/prepare', { sourceContentId: sourceId })} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {working === 'prepare' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Préparer les trois contenus
        </button>
        <p className="mt-3 text-xs text-slate-500">La préparation n’envoie rien en mode approbation. Le dry-run bloque toujours les appels réels.</p>
      </div>
    </section>

    <SocialInsightsPanel readiness={{ facebook: payload.credentialReadiness.facebook, github: payload.credentialReadiness.github }} />

    <section>
      <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-black">File et historique</h2><button onClick={() => refresh().catch((error) => setMessage(error.message))} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold"><RefreshCw className="h-4 w-4" />Actualiser</button></div>
      {loading ? <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500"><LoaderCircle className="mx-auto mb-2 h-5 w-5 animate-spin" />Chargement...</div> : payload.publications.length === 0 ? <div className="rounded-xl border border-dashed bg-white p-10 text-center text-sm text-slate-500">Aucune publication préparée.</div> :
        <div className="space-y-3">{payload.publications.map((record) => {
          const busy = working === record.id;
          return <article key={record.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><span>{platformLabels[record.platform]}</span><span>·</span><span className={record.status === 'PUBLISHED' ? 'text-emerald-700' : record.status === 'FAILED' || record.status === 'UNKNOWN' ? 'text-red-700' : 'text-amber-700'}>{statusLabels[record.status] || record.status}</span></div><h3 className="mt-1 font-bold text-slate-900">{record.sourceTitle}</h3><a href={record.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-700 hover:underline">{record.sourceUrl}</a><p className="mt-2 max-w-3xl text-sm text-slate-600">{record.sourceDescription}</p><p className="mt-1 text-xs text-slate-400">Destination : {record.destination}</p></div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setPreviewId(previewId === record.id ? null : record.id)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold"><Eye className="h-3.5 w-3.5" />Preview</button>
                {record.status === 'DRAFT' && <button disabled={busy} onClick={() => action(record, 'approve')} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Check className="inline h-3.5 w-3.5" /> Approve</button>}
                {record.status === 'APPROVED' && <button disabled={busy || !payload.credentialReadiness[record.platform].ready || payload.settings.dryRun} title={!payload.credentialReadiness[record.platform].enabled ? 'Active cette plateforme dans les réglages.' : !payload.credentialReadiness[record.platform].configured ? `Variables manquantes : ${payload.credentialReadiness[record.platform].missing.join(', ')}` : payload.settings.dryRun ? 'Désactive le mode dry-run pour publier.' : undefined} onClick={() => action(record, 'publish')} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Send className="inline h-3.5 w-3.5" /> Publish now</button>}
                {((record.status === 'FAILED' && record.errorCode !== 'POST_OUTCOME_UNKNOWN') || record.status === 'UNKNOWN') && <button disabled={busy} onClick={() => action(record, 'retry')} className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><RefreshCw className="inline h-3.5 w-3.5" /> Retry</button>}
                {['DRAFT', 'APPROVED', 'SCHEDULED'].includes(record.status) && <button disabled={busy} onClick={() => action(record, 'cancel')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Cancel</button>}
              </div>
            </div>
            {previewId === record.id && <div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{record.content}</div>}
            <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-4"><span>Programmée : {record.scheduledAt ? new Date(record.scheduledAt).toLocaleString() : '—'}</span><span>Publiée : {record.publishedAt ? new Date(record.publishedAt).toLocaleString() : '—'}</span><span>ID externe : {record.externalId || '—'}</span><span>Tentatives : {record.retryCount}</span></div>
            {record.externalUrl && <a href={record.externalUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-blue-700 hover:underline">Ouvrir le résultat externe</a>}
            {record.status === 'FAILED' && record.error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-800">{record.error}</p>}
            {record.status === 'UNKNOWN' && <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900"><ShieldAlert className="h-4 w-4 shrink-0" />Résultat réseau ambigu. Vérifie la plateforme avant toute nouvelle tentative; le retry automatique est bloqué.</p>}
            {record.status === 'APPROVED' && <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-indigo-100 bg-indigo-50 p-3"><label className="text-xs font-semibold text-slate-600">Programmer ({payload.settings.timezone})<input type="datetime-local" value={scheduleValues[record.id] || ''} onChange={(event) => setScheduleValues((current) => ({ ...current, [record.id]: event.target.value }))} className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" /></label><button type="button" disabled={busy || !scheduleValues[record.id] || !payload.credentialReadiness[record.platform].ready || payload.settings.dryRun} title={payload.settings.dryRun ? 'Désactive le mode dry-run pour programmer.' : !payload.credentialReadiness[record.platform].enabled ? 'Active cette plateforme dans les réglages.' : !payload.credentialReadiness[record.platform].configured ? `Variables manquantes : ${payload.credentialReadiness[record.platform].missing.join(', ')}` : undefined} onClick={() => action(record, 'schedule')} className="inline-flex items-center gap-1 rounded-lg bg-indigo-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><CalendarClock className="h-4 w-4" />Programmer</button></div>}
          </article>;
        })}</div>}
    </section>
  </div>;
}

function SocialInsightsPanel({ readiness }: { readiness: { facebook: PlatformReadiness; github: PlatformReadiness } }) {
  const [insights, setInsights] = useState<SocialInsightsPayload | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!readiness.facebook.configured && !readiness.github.configured) {
      setInsights(null);
      setError('');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    fetch('/api/admin/social/insights', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json() as SocialInsightsPayload;
        if (!response.ok) throw new Error(data.error || 'Chargement des statistiques impossible.');
        if (!cancelled) setInsights(data);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Chargement des statistiques impossible.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [readiness.facebook.configured, readiness.github.configured, refreshKey]);

  const facebook = insights?.facebook.report;
  const github = insights?.github.report;
  const timeline = facebook?.timeline || [];
  const maxImpressions = Math.max(1, ...timeline.map((point) => point.impressions));
  const chartPoints = timeline.map((point, index) => `${timeline.length < 2 ? 50 : index / (timeline.length - 1) * 100},${38 - point.impressions / maxImpressions * 34}`).join(' ');

  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><BarChart3 className="h-5 w-5 text-blue-700" />Statistiques sociales</h2><p className="mt-1 text-xs text-slate-500">Facebook · 28 derniers jours · GitHub · données publiques du dépôt</p></div>
      <button type="button" disabled={(!readiness.facebook.configured && !readiness.github.configured) || loading} onClick={() => setRefreshKey((value) => value + 1)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Actualiser</button>
    </header>
    <div className="grid gap-5 p-5 lg:grid-cols-2">
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900">Facebook Page</h3>
        {!readiness.facebook.configured && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Configure {readiness.facebook.missing.join(' et ')} dans les variables secrètes Vercel. Le Page Access Token n’est jamais affiché.</p>}
        {readiness.facebook.configured && insights?.facebook.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{insights.facebook.error}</p>}
        {loading && readiness.facebook.configured && <p className="py-8 text-center text-sm text-slate-500">Chargement des statistiques Meta...</p>}
        {facebook && !loading && <>
          <div className="grid gap-3 sm:grid-cols-2">
            <InsightKpi label="Abonnés actuels" value={facebook.followers} />
            <InsightKpi label="Impressions (28 j)" value={facebook.impressions} />
            <InsightKpi label="Interactions (28 j)" value={facebook.engagements} />
            <InsightKpi label="Vues de Page (28 j)" value={facebook.pageViews} />
          </div>
          {timeline.length > 1 && <div className="rounded-xl bg-slate-50 p-4"><div className="flex items-center justify-between gap-2"><h4 className="text-sm font-bold text-slate-800">Impressions quotidiennes</h4><span className="text-xs text-slate-500">{timeline[0].date} – {timeline.at(-1)?.date}</span></div><svg viewBox="0 0 100 42" preserveAspectRatio="none" role="img" aria-label="Évolution quotidienne des impressions Facebook" className="mt-3 h-32 w-full overflow-visible"><line x1="0" x2="100" y1="38" y2="38" stroke="#cbd5e1" strokeWidth=".5" /><polyline points={chartPoints} fill="none" stroke="#2563eb" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg></div>}
          {facebook.warnings.length > 0 && <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">Certaines métriques ne sont pas retournées : {facebook.warnings.join(' ')}</p>}
          <p className="text-right text-[11px] text-slate-400">Mis à jour : {new Date(facebook.fetchedAt).toLocaleString('fr-FR')}</p>
        </>}
      </div>
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900">GitHub</h3>
        {!readiness.github.configured && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Configure {readiness.github.missing.join(' et ')} dans les variables secrètes Vercel pour lire les statistiques du dépôt.</p>}
        {readiness.github.configured && insights?.github.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{insights.github.error}</p>}
        {loading && readiness.github.configured && <p className="py-8 text-center text-sm text-slate-500">Chargement des statistiques GitHub...</p>}
        {github && !loading && <>
          <a href={`https://github.com/${github.repository}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-700 hover:underline">{github.repository}</a>
          <div className="grid gap-3 sm:grid-cols-2">
            <InsightKpi label="Étoiles" value={github.stars} />
            <InsightKpi label="Forks" value={github.forks} />
            <InsightKpi label="Watchers" value={github.watchers} />
            <InsightKpi label="Issues + PR ouverts" value={github.openItems} />
          </div>
          <p className="text-right text-[11px] text-slate-400">Mis à jour : {new Date(github.fetchedAt).toLocaleString('fr-FR')}</p>
        </>}
      </div>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    </div>
  </section>;
}

function InsightKpi({ label, value }: { label: string; value: number | null }) {
  return <article className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-black tabular-nums text-slate-900">{value === null ? '—' : value.toLocaleString('fr-FR')}</p></article>;
}
