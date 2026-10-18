'use client';

import { useCallback, useEffect, useState } from 'react';
import { Send, Settings2, ShieldAlert } from 'lucide-react';
import type { PlatformReadiness } from '@/lib/social-readiness';
import type { SocialSettings } from '@/lib/social-types';

type Payload = {
  isAdmin: boolean;
  settings: SocialSettings;
  readiness: { facebook: PlatformReadiness; instagram: PlatformReadiness };
  facebookOAuthAvailable?: boolean;
  facebookOAuthMissing?: string[];
};

const networkState = (state: PlatformReadiness) => state.ready ? 'prêt' : !state.enabled ? 'désactivé' : 'à configurer';

// État de la publication sur Facebook et Instagram, et réglages réservés aux administrateurs.
export function PublishingSettings() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    const response = await fetch('/api/cm/publishing', { cache: 'no-store' });
    const data = await response.json() as Payload & { error?: string };
    if (!response.ok) throw new Error(data.error || 'Réglages de publication indisponibles.');
    setPayload(data);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const facebook = params.get('facebook');
    const instagram = params.get('instagram');
    if (facebook === 'connected') setMessage(instagram === 'connected'
      ? 'La Page Facebook et son compte Instagram professionnel sont connectés dans cet environnement local.'
      : 'La Page Facebook est connectée. Aucun compte Instagram professionnel lié à cette Page n’a été trouvé : relie-le dans les paramètres de la Page, puis relance la connexion.');
    if (facebook === 'page-required') setMessage('Plusieurs Pages sont disponibles. Renseigne FACEBOOK_PAGE_ID dans .env.local, puis relance la connexion.');
    if (facebook === 'error') setMessage('Connexion Facebook échouée. Vérifie les paramètres OAuth, les permissions et la Page.');
    if (facebook || params.get('linkedin')) window.history.replaceState({}, '', `${window.location.pathname}#kits`);
    refresh().catch((error) => setMessage(error.message));
  }, [refresh]);

  const save = async (settings: SocialSettings) => {
    setPayload((current) => current && { ...current, settings });
    const response = await fetch('/api/cm/publishing', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    const data = await response.json() as { error?: string };
    setMessage(response.ok ? 'Réglages enregistrés.' : data.error || 'Réglages non enregistrés.');
    await refresh().catch(() => undefined);
  };

  if (!payload) return message ? <p role="status" className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{message}</p> : null;
  const { settings, readiness, isAdmin } = payload;
  const toggle = (label: string, key: keyof SocialSettings, description: string) => (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3.5">
      <span><strong className="block text-xs text-slate-900">{label}</strong><span className="mt-1 block text-[11px] leading-5 text-slate-500">{description}</span></span>
      <input aria-label={label} type="checkbox" checked={Boolean(settings[key])} onChange={(event) => save({ ...settings, [key]: event.target.checked })} className="mt-1 h-4 w-4 accent-indigo-600" />
    </label>
  );

  return <section className="space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      {(['facebook', 'instagram'] as const).map((platform) => <span key={platform} className={`rounded-full px-3 py-1 text-[11px] font-bold ${readiness[platform].ready ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{platform === 'facebook' ? 'Facebook' : 'Instagram'} · {networkState(readiness[platform])}</span>)}
    </div>
    {message && <p role="status" className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{message}</p>}
    {settings.dryRun && <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900"><ShieldAlert className="h-4 w-4 shrink-0" />Mode test actif : le bouton Publier n’envoie rien aux réseaux.</p>}
    {settings.autoPublish && !settings.dryRun && <p className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900"><Send className="h-4 w-4 shrink-0" />Publication automatique active : quand un article est publié, l’IA prépare son kit et le publie sans attendre de relecture.</p>}
    {isAdmin && <details className="rounded-2xl bg-slate-50 p-4">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-extrabold text-slate-900"><Settings2 className="h-4 w-4" />Réglages de publication (administrateur)</summary>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {toggle(`Facebook · ${settings.facebookEnabled ? 'activé' : 'désactivé'}`, 'facebookEnabled', readiness.facebook.configured ? 'Connexion à la Page détectée.' : `À configurer : ${readiness.facebook.missing.join(', ')}.`)}
        {toggle(`Instagram · ${settings.instagramEnabled ? 'activé' : 'désactivé'}`, 'instagramEnabled', readiness.instagram.configured ? 'Compte Instagram professionnel détecté.' : `À configurer : ${readiness.instagram.missing.join(', ')}.`)}
        {toggle('Publication automatique', 'autoPublish', 'Activée : chaque article publié part sur les réseaux actifs sans relecture du CM.')}
        {toggle('Mode test (dry-run)', 'dryRun', 'Empêche tout envoi réel vers Facebook et Instagram.')}
      </div>
      <div className="mt-3">
        {payload.facebookOAuthAvailable
          ? <a href="/api/auth/facebook/login" className="inline-flex items-center rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-800 hover:bg-indigo-50">Connecter Facebook et Instagram</a>
          : <p className="text-[11px] text-slate-500">{payload.facebookOAuthMissing?.includes('Connexion OAuth Meta disponible uniquement en local.')
            ? 'En production, configure FACEBOOK_ACCESS_TOKEN, FACEBOOK_PAGE_ID et INSTAGRAM_USER_ID dans les variables secrètes Vercel.'
            : `Connexion OAuth locale indisponible : configure ${payload.facebookOAuthMissing?.join(', ') || 'les identifiants Meta'} dans .env.local, puis redémarre le serveur de développement.`}</p>}
      </div>
    </details>}
  </section>;
}
