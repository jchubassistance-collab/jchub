'use client';

import { useState } from 'react';
import { AlertTriangle, Clock, Eye, History, Inbox, Loader2, Mail, MousePointerClick, Users, Wrench } from 'lucide-react';
import { Change, nf } from '@/components/admin/dashboard/Widgets';
import { DataBanner, Sparkline, useInsights, type CollectionInfo } from '@/components/admin/insights/InsightsUI';

type Card = { key: string; label: string; value: number; change: number | null; unit?: string; inverse?: boolean; changeLabel?: string; series: { day: string; value: number }[] };
type Overview = { configured: boolean; info?: CollectionInfo; cards?: Card[] };

const LOOK: Record<string, { icon: typeof Users; color: string; tone: string; note: string }> = {
  visitors: { icon: Users, color: '#2563eb', tone: 'bg-blue-50 text-blue-600', note: 'Visiteurs différents par jour, additionnés' },
  pageviews: { icon: Eye, color: '#4f46e5', tone: 'bg-indigo-50 text-indigo-600', note: 'Pages ouvertes par des humains' },
  duration: { icon: Clock, color: '#0891b2', tone: 'bg-cyan-50 text-cyan-600', note: 'Entre la 1re et la dernière page d’une visite' },
  bounce: { icon: MousePointerClick, color: '#f59e0b', tone: 'bg-amber-50 text-amber-600', note: 'Visites d’une seule page' },
  tools: { icon: Wrench, color: '#16a34a', tone: 'bg-emerald-50 text-emerald-600', note: 'Résultats téléchargés dans les outils' },
  newsletter: { icon: Mail, color: '#9333ea', tone: 'bg-violet-50 text-violet-600', note: 'Inscriptions confirmées' },
  messages: { icon: Inbox, color: '#db2777', tone: 'bg-pink-50 text-pink-600', note: 'Formulaire de contact' },
  errors: { icon: AlertTriangle, color: '#ef4444', tone: 'bg-red-50 text-red-600', note: 'Erreurs du site en production' },
};

function display(card: Card) {
  if (card.unit === 's') return card.value >= 60 ? `${Math.floor(card.value / 60)} min ${String(card.value % 60).padStart(2, '0')} s` : `${card.value} s`;
  if (card.unit === '%') return `${card.value.toLocaleString('fr-FR')} %`;
  return nf.format(card.value);
}

export default function InsightsOverviewPage() {
  const { data, error, reload } = useInsights<Overview>('overview');
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState('');

  const importHistory = async () => {
    setImporting(true);
    setNotice('');
    try {
      const response = await fetch('/api/admin/insights', { method: 'POST' });
      const result = await response.json() as { error?: string; days?: number; pageviews?: number; toolCalls?: number; failures?: string[] };
      if (!response.ok) throw new Error(result.error || 'Import impossible.');
      const failed = result.failures?.length ? ` ${result.failures.length} jour(s) illisible(s) : ${result.failures.slice(0, 2).join(' ; ')}` : '';
      setNotice(`${result.days} jour(s) importé(s) : ${nf.format(result.pageviews ?? 0)} pages vues et ${nf.format(result.toolCalls ?? 0)} appels d’outils.${failed}`);
      await reload();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Import impossible.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <DataBanner info={data?.info} configured={data?.configured !== false} />
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(data?.cards ?? Object.keys(LOOK).map((key) => ({ key, label: '—', value: 0, change: null, series: [] }) as Card)).map((card) => {
          const look = LOOK[card.key];
          const Icon = look.icon;
          return (
            <article key={card.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">{card.label}</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">{data ? display(card) : '—'}</p>
                  <div className="mt-0.5"><Change value={data ? card.change : undefined} inverse={card.inverse} label={card.changeLabel ?? 'vs période préc.'} /></div>
                </div>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${look.tone}`}><Icon className="h-5 w-5" /></span>
              </div>
              <div className="mt-2"><Sparkline data={card.series} color={look.color} /></div>
              <p className="mt-1 text-[10px] text-slate-400">{look.note}</p>
            </article>
          );
        })}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><History className="h-5 w-5" /></span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Historique des rapports</h2>
            <p className="mt-0.5 max-w-2xl text-xs text-slate-500">Reprend les 30 derniers jours des rapports du serveur (pages vues par des humains, appels des outils) pour la période d’avant la mesure propre au site. Relancer l’import remplace l’historique déjà importé, sans toucher aux nouvelles données.</p>
            {notice && <p role="status" className="mt-1 text-xs font-semibold text-emerald-700">{notice}</p>}
          </div>
        </div>
        <button type="button" onClick={() => void importHistory()} disabled={importing || data?.configured === false} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:border-blue-300 disabled:opacity-50">
          {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <History className="h-3.5 w-3.5" />}{importing ? 'Import en cours… (≈ 1 min)' : 'Importer l’historique'}
        </button>
      </section>
    </div>
  );
}
