'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BellRing, CheckCircle2, Mail, Save, Send, XCircle } from 'lucide-react';
import { Panel } from '@/components/admin/dashboard/Widgets';
import { useInsights } from '@/components/admin/insights/InsightsUI';
import type { AlertRuleDefinition, RuleSettings } from '@/lib/alerts/rules';

type ChannelState = { ready: true; to: string } | { ready: false; missing: string[] };
type Alerts = {
  configured: boolean;
  channels: { email: ChannelState };
  rules: (AlertRuleDefinition & { settings: RuleSettings })[];
  alerts: { id: number; ts: number; rule: string; level: string; title: string; message: string; link: string | null; sent: Record<string, string> }[];
  errors: { id: string; at: number; message: string; path: string; status: number | null; occurrence: number | null; country: string }[];
  serverErrors: { ts: number; path: string; status: number; durationMs: number }[];
};

const when = (time: number) => new Date(time).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Brazzaville' });
const LEVEL_STYLES: Record<string, string> = { critique: 'bg-red-50 text-red-700', attention: 'bg-amber-50 text-amber-800', info: 'bg-blue-50 text-blue-700' };

function ChannelCard({ name, icon, state }: { name: string; icon: React.ReactNode; state?: ChannelState }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">{icon}{name}</p>
        {state?.ready ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Prêt</span> : <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400"><XCircle className="h-3.5 w-3.5" />Non configuré</span>}
      </div>
      {state?.ready
        ? <p className="mt-2 text-xs text-slate-600">Les alertes partent vers {state.to}.</p>
        : state && <p className="mt-2 text-xs text-slate-500">À ajouter sur Vercel : {state.missing.map((name) => <code key={name} className="mr-1 rounded bg-slate-100 px-1 py-0.5 text-[11px]">{name}</code>)}</p>}
    </div>
  );
}

export default function InsightsAlertsPage() {
  const { data, error, reload } = useInsights<Alerts>('alerts');
  const [rules, setRules] = useState<RuleSettings[]>([]);
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState<'save' | 'test' | null>(null);

  useEffect(() => { if (data?.rules) setRules(data.rules.map((rule) => rule.settings)); }, [data]);
  const update = (id: string, change: Partial<RuleSettings>) => setRules((current) => current.map((rule) => (rule.id === id ? { ...rule, ...change } : rule)));
  const dirty = JSON.stringify(rules) !== JSON.stringify(data?.rules.map((rule) => rule.settings) ?? []);

  const save = async () => {
    setBusy('save');
    setStatus(null);
    try {
      const response = await fetch('/api/admin/insights/alerts', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ rules }) });
      const body = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error || 'Réglages non enregistrés.');
      setStatus({ tone: 'ok', text: 'Réglages enregistrés.' });
      await reload();
    } catch (cause) {
      setStatus({ tone: 'error', text: cause instanceof Error ? cause.message : 'Réglages non enregistrés.' });
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy('test');
    setStatus(null);
    try {
      const response = await fetch('/api/admin/insights/alerts', { method: 'POST' });
      const body = await response.json().catch(() => null) as { sent?: Record<string, string>; error?: string } | null;
      if (!response.ok) throw new Error(body?.error || 'Test impossible.');
      const email = body?.sent?.email;
      setStatus(email === 'envoyé' ? { tone: 'ok', text: 'E-mail de test envoyé : regarde ta boîte de réception.' } : { tone: 'error', text: `E-mail de test non envoyé : ${email || 'e-mail non configuré'}.` });
      await reload();
    } catch (cause) {
      setStatus({ tone: 'error', text: cause instanceof Error ? cause.message : 'Test impossible.' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="grid gap-3 md:grid-cols-[1fr_auto]">
        <ChannelCard name="E-mail" icon={<Mail className="h-4 w-4 text-blue-600" />} state={data?.channels.email} />
        <div className="flex flex-col justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <button type="button" onClick={() => void test()} disabled={busy !== null} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-60"><Send className="h-3.5 w-3.5" />{busy === 'test' ? 'Envoi…' : 'Envoyer un test'}</button>
          <p className="text-[11px] text-slate-500">Pour vérifier que l’e-mail arrive.</p>
        </div>
      </section>
      {status && <p role="status" className={`rounded-xl px-4 py-2.5 text-xs font-medium ${status.tone === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>{status.text}</p>}

      <Panel title="Règles" subtitle="Les erreurs du site sont aussi envoyées par e-mail par les rapports, au plus une fois toutes les 30 minutes chacune." action={
        <button type="button" onClick={() => void save()} disabled={!dirty || busy !== null} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40"><Save className="h-3.5 w-3.5" />{busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}</button>
      }>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="text-[10px] uppercase tracking-wide text-slate-400"><tr><th className="py-2 font-semibold">Active</th><th className="font-semibold">Règle</th><th className="font-semibold">Contrôle</th><th className="font-semibold">Seuil</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.rules ?? []).map((rule) => {
                const setting = rules.find((item) => item.id === rule.id) ?? rule.settings;
                return (
                  <tr key={rule.id} className={setting.enabled ? '' : 'opacity-50'}>
                    <td className="py-3 pr-3"><input type="checkbox" checked={setting.enabled} onChange={(event) => update(rule.id, { enabled: event.target.checked })} aria-label={`Activer ${rule.label}`} className="h-4 w-4 accent-blue-600" /></td>
                    <td className="py-3 pr-3"><p className="font-semibold text-slate-900">{rule.label} <span className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${LEVEL_STYLES[rule.level]}`}>{rule.level}</span></p><p className="mt-0.5 text-slate-500">{rule.description}</p></td>
                    <td className="py-3 pr-3 text-slate-600">{rule.timing === 'immédiat' ? 'Dès que ça arrive' : 'Chaque jour à 7 h'}</td>
                    <td className="py-3">{rule.threshold === null ? <span className="text-slate-400">—</span> : <label className="inline-flex items-center gap-1.5"><input type="number" min={0} step="any" value={setting.threshold ?? ''} onChange={(event) => update(rule.id, { threshold: event.target.value === '' ? null : Number(event.target.value) })} className="h-8 w-20 rounded-lg border border-slate-200 px-2 text-xs text-slate-900 outline-none focus:border-blue-400" /><span className="text-slate-500">{rule.unit}</span></label>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Historique des alertes" subtitle="Les 100 dernières, gardées 13 mois.">
        {data?.alerts.length ? (
          <ul className="max-h-[420px] divide-y divide-slate-100 overflow-auto text-xs">
            {data.alerts.map((alert) => (
              <li key={alert.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900"><span className={`mr-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${LEVEL_STYLES[alert.level] ?? LEVEL_STYLES.info}`}>{alert.level}</span>{alert.title}</p>
                  <p className="mt-0.5 text-slate-600">{alert.message}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">E-mail : {alert.sent.email ?? 'non envoyé'}</p>
                </div>
                <div className="text-right text-[11px] text-slate-500">{when(alert.ts)}{alert.link && <><br /><a href={alert.link} className="font-semibold text-blue-600 hover:underline">Voir</a></>}</div>
              </li>
            ))}
          </ul>
        ) : <p className="flex items-center gap-2 py-6 text-xs text-slate-500"><BellRing className="h-4 w-4" />Aucune alerte pour l’instant.</p>}
      </Panel>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="Erreurs du site (7 jours)" subtitle="Production uniquement." action={<Link href="/admin/reports?tab=errors" className="text-xs font-semibold text-blue-600 hover:underline">Tous les rapports</Link>}>
          {data?.errors.length ? (
            <ul className="max-h-[380px] divide-y divide-slate-100 overflow-auto text-xs">
              {data.errors.map((item) => (
                <li key={item.id} className="py-2">
                  <Link href={`/admin/reports/${item.id}`} className="font-semibold text-slate-900 hover:text-blue-600">{item.message || 'Erreur sans message'}</Link>
                  <p className="mt-0.5 text-[11px] text-slate-500">{when(item.at)} · {item.path || '—'}{item.status ? ` · ${item.status}` : ''}{item.occurrence && item.occurrence > 1 ? ` · ${item.occurrence}ᵉ fois` : ''}{item.country ? ` · ${item.country}` : ''}</p>
                </li>
              ))}
            </ul>
          ) : <p className="flex items-center gap-2 py-6 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" />{data ? 'Aucune erreur en production sur 7 jours.' : 'Chargement…'}</p>}
        </Panel>
        <Panel title="Dernières réponses 5xx de l’API" subtitle="Appels qui ont échoué côté serveur.">
          {data?.serverErrors.length ? (
            <ul className="max-h-[380px] divide-y divide-slate-100 overflow-auto text-xs">
              {data.serverErrors.map((item, index) => (
                <li key={`${item.ts}-${index}`} className="flex items-center justify-between gap-2 py-2">
                  <span className="min-w-0 truncate font-mono text-[11px] text-slate-800" title={item.path}>{item.path}</span>
                  <span className="shrink-0 text-[11px] text-slate-500"><strong className="text-red-600">{item.status}</strong> · {item.durationMs} ms · {when(item.ts)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="flex items-center gap-2 py-6 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" />{data ? 'Aucune réponse 5xx récente.' : 'Chargement…'}</p>}
        </Panel>
      </section>
    </div>
  );
}
