'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatNumber, nf, Panel } from '@/components/admin/dashboard/Widgets';
import { DataBanner, Donut, tooltipStyle, useInsights, type CollectionInfo } from '@/components/admin/insights/InsightsUI';

type Conversions = {
  configured: boolean;
  info?: CollectionInfo;
  funnel: { visitors: number; toolUsers: number; converted: number };
  conversions: { name: string; subject: string | null; count: number }[];
  outbound: { host: string; clicks: number; visitors: number }[];
  consent: { choice: string; count: number }[];
  daily: { day: string; count: number }[];
};

/** Partner sites shown apart from the other outbound clicks. */
const PARTNERS: Record<string, string> = { 'njdwebs.com': 'NJD Web', '2md-designer.com': '2MD Designer' };
const CONVERSION_LABELS: Record<string, string> = { newsletter_signup: 'Inscriptions newsletter', resource_request: 'Demandes de modèles', resource_download: 'Téléchargements de ressources', contact_submit: 'Messages de contact' };
const rate = (part: number, whole: number) => whole ? Math.round((part / whole) * 1000) / 10 : 0;

export default function InsightsConversionsPage() {
  const { data, error } = useInsights<Conversions>('conversions');
  const funnel = data?.funnel ?? { visitors: 0, toolUsers: 0, converted: 0 };
  const whatsapp = (data?.outbound ?? []).filter((row) => row.host === 'wa.me' || row.host === 'api.whatsapp.com').reduce((sum, row) => sum + row.clicks, 0);
  const contact = (data?.conversions ?? []).filter((row) => row.name === 'contact_submit');
  const serviceRequests = contact.filter((row) => row.subject === 'project').reduce((sum, row) => sum + row.count, 0) + whatsapp;
  const partners = (data?.outbound ?? []).filter((row) => PARTNERS[row.host]);
  const others = (data?.outbound ?? []).filter((row) => !PARTNERS[row.host]);
  const granted = data?.consent.find((row) => row.choice === 'granted')?.count ?? 0;
  const denied = data?.consent.find((row) => row.choice === 'denied')?.count ?? 0;
  const steps = [
    { label: 'Visiteurs', value: funnel.visitors, color: '#2563eb' },
    { label: 'Ont utilisé un outil', value: funnel.toolUsers, color: '#7c3aed' },
    { label: 'Ont converti', value: funnel.converted, color: '#16a34a' },
  ];
  const totals = new Map<string, number>();
  for (const row of data?.conversions ?? []) totals.set(row.name, (totals.get(row.name) ?? 0) + row.count);

  return (
    <div className="space-y-4">
      <DataBanner info={data?.info} configured={data?.configured !== false} />
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="grid gap-4 xl:grid-cols-12">
        <Panel title="Entonnoir de conversion" subtitle="Visiteurs (par jour) → utilisation d’un outil → newsletter, contact, demande de modèle ou WhatsApp" className="xl:col-span-6">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.label}>
                <div className="mb-1 flex justify-between text-xs"><span className="font-semibold text-slate-700">{index + 1}. {step.label}</span><span className="font-black text-slate-900">{nf.format(step.value)}{index > 0 && <span className="ml-1.5 text-[11px] font-semibold text-slate-500">({rate(step.value, funnel.visitors).toLocaleString('fr-FR')} % des visiteurs)</span>}</span></div>
                <div className="h-7 rounded-lg bg-slate-100"><div className="h-7 rounded-lg" style={{ width: `${funnel.visitors ? Math.max(3, (step.value / funnel.visitors) * 100) : 0}%`, background: step.color }} /></div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-500">Taux de conversion global : <strong className="text-slate-900">{rate(funnel.converted, funnel.visitors).toLocaleString('fr-FR')} %</strong>. Mesure propre au site uniquement : l’historique importé ne connaît pas les conversions.</p>
        </Panel>
        <section className="grid grid-cols-2 gap-3 xl:col-span-6">
          {[
            ['Demandes de service', serviceRequests, 'formulaire « projet » + WhatsApp'],
            ['Inscriptions newsletter', totals.get('newsletter_signup') ?? 0, 'formulaire envoyé'],
            ['Messages de contact', contact.reduce((sum, row) => sum + row.count, 0), 'tous sujets'],
            ['Demandes de modèles', totals.get('resource_request') ?? 0, 'page Ressources'],
          ].map(([label, value, note]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[11px] font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-950">{formatNumber(data ? Number(value) : undefined)}</p><p className="text-[10px] text-slate-400">{note}</p></div>)}
        </section>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Panel title="Conversions par jour" className="xl:col-span-6">
          <div className="h-56">
            <ResponsiveContainer><AreaChart data={(data?.daily ?? []).map((row) => ({ jour: new Date(`${row.day}T12:00:00Z`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), conversions: row.count }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}><CartesianGrid stroke="#f1f5f9" vertical={false} /><XAxis dataKey="jour" tick={{ fontSize: 10 }} minTickGap={20} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} /><Tooltip contentStyle={tooltipStyle} /><Area type="monotone" dataKey="conversions" stroke="#16a34a" fill="#16a34a" fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Sites partenaires" subtitle="Clics vers NJD Web et 2MD Designer" className="xl:col-span-3">
          <ul className="space-y-2">
            {Object.entries(PARTNERS).map(([host, label]) => {
              const row = partners.find((item) => item.host === host);
              return <li key={host} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><span><strong className="block text-xs text-slate-800">{label}</strong><small className="text-[10px] text-slate-500">{host}</small></span><span className="text-right"><strong className="block text-lg font-black text-slate-900">{nf.format(row?.clicks ?? 0)}</strong><small className="text-[10px] text-slate-500">{nf.format(row?.visitors ?? 0)} visiteur(s)</small></span></li>;
            })}
          </ul>
        </Panel>
        <Panel title="Bandeau des cookies" subtitle="Choix des visiteurs" className="xl:col-span-3">
          <Donut data={[{ name: 'Acceptés', value: granted, color: '#16a34a' }, { name: 'Refusés', value: denied, color: '#ef4444' }]} center={granted + denied ? `${rate(granted, granted + denied)} %` : '—'} height={140} />
          <p className="mt-2 text-[10px] text-slate-500">Seuls les visiteurs qui acceptent sont comptés par Google Analytics.</p>
        </Panel>
      </section>

      <Panel title="Autres clics sortants" subtitle="Réseaux sociaux, sources citées, WhatsApp…">
        <ul className="grid gap-x-6 gap-y-1.5 text-[11px] sm:grid-cols-2 xl:grid-cols-3">
          {others.map((row) => <li key={row.host} className="flex justify-between gap-2 border-b border-slate-100 py-1"><span className="truncate text-slate-700">{row.host === 'wa.me' ? 'WhatsApp (wa.me)' : row.host}</span><strong className="text-slate-900">{nf.format(row.clicks)}</strong></li>)}
          {data && !others.length && <li className="text-slate-400">Aucun clic sortant sur la période.</li>}
        </ul>
      </Panel>
    </div>
  );
}
