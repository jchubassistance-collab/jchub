'use client';

import { useEffect } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Radio } from 'lucide-react';
import { nf, Panel } from '@/components/admin/dashboard/Widgets';
import { WorldMap } from '@/components/admin/dashboard/WorldMap';
import { DataBanner, tooltipStyle, useInsights, type CollectionInfo } from '@/components/admin/insights/InsightsUI';
import { COUNTRIES } from '@/lib/country-codes';

type FeedItem = { ts: number; type: string; name: string | null; path: string; tool: string | null; country: string | null; city: string | null; device: string; value: number | null; meta: Record<string, unknown> | null };
type Live = {
  configured: boolean;
  info?: CollectionInfo;
  online: number;
  pages: { path: string; visitors: number }[];
  countries: { code: string; visitors: number }[];
  feed: FeedItem[];
  perMinute: { minute: number; visitors: number }[];
  names: Record<string, string>;
  now: number;
};

const REFRESH_MS = 10_000;
const CUSTOM: Record<string, string> = {
  newsletter_signup: 'Quelqu’un s’est inscrit à la newsletter',
  contact_submit: 'Quelqu’un a envoyé un message de contact',
  resource_request: 'Quelqu’un a demandé un modèle de document',
  resource_download: 'Quelqu’un a téléchargé une ressource',
  social_click: 'Quelqu’un a cliqué vers un réseau social',
  tool_click: 'Quelqu’un a ouvert un outil depuis la recherche',
};

/** One event told as a sentence, e.g. "Quelqu’un a envoyé 3 fichiers dans Images en PDF". */
function sentence(item: FeedItem, names: Record<string, string>): string {
  const tool = item.tool ? names[item.tool] ?? item.tool : 'un outil';
  if (item.type === 'tool_upload') {
    const files = Number(item.meta?.files ?? 1);
    return `Quelqu’un a envoyé ${files} fichier${files > 1 ? 's' : ''} dans ${tool}`;
  }
  if (item.type === 'tool_download') return `Quelqu’un a obtenu son résultat avec ${tool}`;
  if (item.type === 'tool_error') return `Erreur affichée dans ${tool} : ${item.name ?? ''}`;
  if (item.type === 'outbound') return `Clic vers ${item.name === 'wa.me' ? 'WhatsApp' : item.name}`;
  if (item.type === 'custom') return CUSTOM[item.name ?? ''] ?? `Événement : ${item.name}`;
  return `Quelqu’un ouvre ${item.path}`;
}

const place = (item: FeedItem) => [item.city, item.country ? COUNTRIES[item.country]?.[1] ?? item.country : null].filter(Boolean).join(', ');
const ago = (ts: number, now: number) => {
  const seconds = Math.max(0, Math.round((now - ts) / 1000));
  return seconds < 60 ? `il y a ${seconds} s` : `il y a ${Math.round(seconds / 60)} min`;
};

export default function InsightsLivePage() {
  const { data, error, reload } = useInsights<Live>('live');
  useEffect(() => {
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void reload(); }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [reload]);
  const now = data?.now ?? 0;
  const minutes = (data?.perMinute ?? []).map((row) => ({ heure: new Date(row.minute).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), visiteurs: row.visitors }));

  return (
    <div className="space-y-4">
      <DataBanner info={data?.info} configured={data?.configured !== false} />
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-3">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-emerald-700"><span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /></span>En ligne maintenant</p>
          <p className="mt-3 text-6xl font-black text-slate-950">{data ? nf.format(data.online) : '—'}</p>
          <p className="text-xs text-slate-500">visiteur(s) actif(s) ces 5 dernières minutes · actualisé toutes les 10 s</p>
        </div>
        <Panel title="Visiteurs par minute" subtitle="30 dernières minutes" className="xl:col-span-5">
          <div className="h-40">
            <ResponsiveContainer><AreaChart data={minutes} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}><XAxis dataKey="heure" tick={{ fontSize: 10 }} minTickGap={30} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} /><Tooltip contentStyle={tooltipStyle} /><Area type="stepAfter" dataKey="visiteurs" stroke="#16a34a" fill="#16a34a" fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Pages ouvertes" subtitle="Dernière page de chaque visiteur actif" className="xl:col-span-4">
          <ul className="divide-y divide-slate-100 text-[11px]">
            {(data?.pages ?? []).map((page) => <li key={page.path} className="flex justify-between gap-2 py-1.5"><span className="truncate text-slate-700">{page.path}</span><strong className="shrink-0 text-slate-900">{page.visitors}</strong></li>)}
            {data && !data.pages.length && <li className="py-2 text-slate-400">Personne en ce moment.</li>}
          </ul>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Panel title="Derniers événements" subtitle="La dernière heure, en direct" className="xl:col-span-7" action={<Radio className="h-4 w-4 text-emerald-600" />}>
          <ol className="max-h-[460px] space-y-1.5 overflow-y-auto text-[11px]">
            {(data?.feed ?? []).map((item, index) => (
              <li key={`${item.ts}-${index}`} className="flex items-start justify-between gap-3 rounded-lg px-2 py-1.5 odd:bg-slate-50">
                <span className="min-w-0"><span className="block text-slate-800">{sentence(item, data?.names ?? {})}</span><span className="text-[10px] text-slate-400">{[place(item), item.device].filter(Boolean).join(' · ')}</span></span>
                <span className="shrink-0 text-[10px] text-slate-400">{ago(item.ts, now)}</span>
              </li>
            ))}
            {data && !data.feed.length && <li className="py-2 text-slate-400">Aucun événement dans la dernière heure.</li>}
          </ol>
        </Panel>
        <Panel title="D’où viennent-ils" subtitle="Visiteurs des 30 dernières minutes" className="xl:col-span-5">
          <WorldMap countries={(data?.countries ?? []).map((row) => ({ code: row.code, name: COUNTRIES[row.code]?.[1] ?? row.code, visitors: row.visitors }))} />
        </Panel>
      </section>
    </div>
  );
}
