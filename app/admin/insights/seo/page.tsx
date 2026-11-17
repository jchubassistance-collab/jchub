'use client';

import { useMemo, useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, CheckCircle2, ExternalLink, Info, Loader2, RefreshCw, Search } from 'lucide-react';
import { Change, formatNumber, Gauge, nf, Panel } from '@/components/admin/dashboard/Widgets';
import { tooltipStyle, useInsights } from '@/components/admin/insights/InsightsUI';
import { fetchJson } from '@/lib/admin-cache';
import { COUNTRIES } from '@/lib/country-codes';

type Row = { key: string; clicks: number; impressions: number; ctr: number; position: number };
type Totals = { clicks: number; impressions: number; ctr: number; position: number };
type Google =
  | { configured: true; site: string; range: { from: string; to: string }; totals: Totals; previous: Totals; daily: ({ day: string } & Totals)[]; queries: Row[]; pages: Row[]; countries: Row[]; devices: Row[]; opportunities: Row[]; sitemaps: { path: string; lastDownloaded: string | null; errors: number; warnings: number; submitted: number; pending: boolean }[]; fetchedAt: number }
  | { configured: false; reason: string; account?: string };
type Issue = { level: 'error' | 'warning'; text: string };
type Seo = {
  configured: boolean;
  google: Google;
  audit: { checked: number; healthy: number; score: number; errors: number; warnings: number; pages: { kind: 'article' | 'outil'; locale: 'fr' | 'en'; title: string; path: string; issues: Issue[] }[] };
};

const DEVICE_LABELS: Record<string, string> = { DESKTOP: 'Ordinateur', MOBILE: 'Mobile', TABLET: 'Tablette' };
const day = (value: string) => new Date(`${value}T12:00:00Z`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
// Search Console gives ISO alpha-3 codes (FRA, COG): named when the code is known, shown as is otherwise.
const countryName = (code: string) => COUNTRIES[ALPHA3[code] ?? '']?.[1] ?? code;
const ALPHA3: Record<string, string> = { FRA: 'FR', COG: 'CG', COD: 'CD', CMR: 'CM', GAB: 'GA', CIV: 'CI', SEN: 'SN', BEL: 'BE', CAN: 'CA', USA: 'US', CHE: 'CH', MAR: 'MA', DZA: 'DZ', TUN: 'TN', BEN: 'BJ', TGO: 'TG', MLI: 'ML', BFA: 'BF', NER: 'NE', TCD: 'TD', CAF: 'CF', GIN: 'GN', MDG: 'MG', HTI: 'HT', GBR: 'GB', DEU: 'DE', IND: 'IN', NGA: 'NG', GHA: 'GH', KEN: 'KE', ZAF: 'ZA', AGO: 'AO', RWA: 'RW', BDI: 'BI', ESP: 'ES', ITA: 'IT', PRT: 'PT', NLD: 'NL', BRA: 'BR', CHN: 'CN', JPN: 'JP', LUX: 'LU', MUS: 'MU', REU: 'RE', GNQ: 'GQ' };

function GoogleSetup({ reason, account }: { reason: string; account?: string }) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
      <p className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" />Search Console n’est pas encore relié</p>
      <p className="mt-2 text-amber-900">{reason}</p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-amber-900">
        <li>Ouvre <a className="font-semibold underline" href="https://search.google.com/search-console/users" target="_blank" rel="noreferrer">Search Console › Paramètres › Utilisateurs et autorisations</a> sur la propriété jchub.dev.</li>
        <li>« Ajouter un utilisateur » : {account ? <code className="rounded bg-white/70 px-1.5 py-0.5 text-xs">{account}</code> : 'l’adresse du compte de service (GOOGLE_SERVICE_ACCOUNT_EMAIL)'}, autorisation « Restreint ».</li>
        <li>Reviens ici et clique sur « Actualiser ». Si tu as plusieurs propriétés, indique la bonne dans GSC_SITE_URL (ex. <code className="text-xs">sc-domain:jchub.dev</code>).</li>
      </ol>
    </section>
  );
}

function RowsTable({ rows, first, empty, link }: { rows: Row[]; first: string; empty: string; link?: (key: string) => string }) {
  if (!rows.length) return <p className="py-6 text-center text-xs text-slate-500">{empty}</p>;
  return (
    <div className="max-h-[420px] overflow-auto">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-white text-[10px] uppercase tracking-wide text-slate-400"><tr><th className="py-2 pr-2 font-semibold">{first}</th><th className="px-2 text-right font-semibold">Clics</th><th className="px-2 text-right font-semibold">Impr.</th><th className="px-2 text-right font-semibold">CTR</th><th className="pl-2 text-right font-semibold">Pos.</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.key} className="text-slate-700">
              <td className="max-w-0 truncate py-2 pr-2 font-medium text-slate-900" title={row.key}>{link ? <a href={link(row.key)} target="_blank" rel="noreferrer" className="hover:text-blue-600">{row.key}</a> : row.key}</td>
              <td className="px-2 text-right tabular-nums">{nf.format(row.clicks)}</td>
              <td className="px-2 text-right tabular-nums">{nf.format(row.impressions)}</td>
              <td className="px-2 text-right tabular-nums">{row.ctr.toLocaleString('fr-FR')} %</td>
              <td className={`pl-2 text-right tabular-nums ${row.position <= 10 ? 'text-emerald-600' : row.position <= 20 ? 'text-amber-600' : 'text-slate-500'}`}>{row.position.toLocaleString('fr-FR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function InsightsSeoPage() {
  const { data, error, days, reload } = useInsights<Seo>('seo');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'article' | 'outil'>('all');
  const google = data?.google;
  const chart = useMemo(() => (google?.configured ? google.daily : []).map((row) => ({ jour: day(row.day), Clics: row.clicks, Impressions: row.impressions })), [google]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await fetchJson(`/api/admin/insights?section=seo&days=${days}&fresh=1`);
      await reload();
    } finally {
      setRefreshing(false);
    }
  };

  const audit = data?.audit;
  const auditPages = (audit?.pages ?? []).filter((page) => filter === 'all' || page.kind === filter);

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <p className="flex items-center gap-1.5"><Info className="h-3.5 w-3.5" />{google?.configured ? <>Propriété <strong className="text-slate-700">{google.site}</strong>, du {day(google.range.from)} au {day(google.range.to)} (Google publie les chiffres avec 2 jours de retard).</> : 'Données de Google Search Console et contrôle des pages du site.'}</p>
        <button type="button" onClick={() => void refresh()} disabled={refreshing} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:border-blue-300 disabled:opacity-60">{refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}Actualiser</button>
      </div>

      {google && !google.configured && <GoogleSetup reason={google.reason} account={google.account} />}

      {google?.configured && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {([
              ['Clics depuis Google', google.totals.clicks, google.previous.clicks, false, ''],
              ['Impressions', google.totals.impressions, google.previous.impressions, false, ''],
              ['Taux de clic (CTR)', google.totals.ctr, google.previous.ctr, false, ' %'],
              ['Position moyenne', google.totals.position, google.previous.position, true, ''],
            ] as const).map(([label, value, previous, inverse, unit]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-black text-slate-950 tabular-nums">{value.toLocaleString('fr-FR')}{unit}</p>
                <div className="mt-1"><Change value={previous ? Math.round(((value - previous) / previous) * 1000) / 10 : null} inverse={inverse} /></div>
              </div>
            ))}
          </section>

          <Panel title="Clics et impressions par jour" subtitle="Impressions : nombre de fois où le site apparaît dans les résultats de Google.">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chart} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid yAxisId="left" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="jour" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} minTickGap={16} />
                  <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area yAxisId="right" type="monotone" dataKey="Impressions" stroke="#93c5fd" fill="#dbeafe" strokeWidth={1.5} isAnimationActive={false} />
                  <Line yAxisId="left" type="monotone" dataKey="Clics" stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <section className="grid gap-4 xl:grid-cols-2">
            <Panel title="Requêtes Google" subtitle="Ce que les gens ont tapé avant d’arriver sur le site."><RowsTable rows={google.queries} first="Requête" empty="Aucune requête sur la période." /></Panel>
            <Panel title="Pages" subtitle="Pages de jchub.dev affichées dans Google."><RowsTable rows={google.pages} first="Page" empty="Aucune page sur la période." link={(key) => `https://jchub.dev${key}`} /></Panel>
          </section>

          <Panel title="Opportunités" subtitle="Recherches où le site est vu souvent (position 4 à 20) mais peu cliqué : améliore le titre et la description de la page, ou la page elle-même.">
            <RowsTable rows={google.opportunities} first="Requête" empty="Pas d’opportunité claire sur la période : il faut plus d’impressions." />
          </Panel>

          <section className="grid gap-4 lg:grid-cols-3">
            <Panel title="Pays" className="lg:col-span-2"><RowsTable rows={google.countries.map((row) => ({ ...row, key: countryName(row.key) }))} first="Pays" empty="Aucun pays." /></Panel>
            <Panel title="Appareils">
              <ul className="space-y-2 text-xs">
                {google.devices.map((row) => {
                  const share = google.totals.clicks ? Math.round((row.clicks / google.totals.clicks) * 100) : 0;
                  return <li key={row.key}><div className="flex justify-between font-medium text-slate-700"><span>{DEVICE_LABELS[row.key] ?? row.key}</span><span className="tabular-nums">{nf.format(row.clicks)} clics · {share} %</span></div><div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${share}%` }} /></div></li>;
                })}
                {!google.devices.length && <li className="text-slate-500">Aucune donnée.</li>}
              </ul>
            </Panel>
          </section>

          <Panel title="Sitemaps" subtitle="Plans du site envoyés à Google.">
            {google.sitemaps.length ? (
              <ul className="divide-y divide-slate-100 text-xs">
                {google.sitemaps.map((sitemap) => (
                  <li key={sitemap.path} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <a href={sitemap.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-slate-900 hover:text-blue-600">{sitemap.path}<ExternalLink className="h-3 w-3" /></a>
                    <span className="text-slate-500">{formatNumber(sitemap.submitted)} adresses · lu le {sitemap.lastDownloaded ? new Date(sitemap.lastDownloaded).toLocaleDateString('fr-FR') : '—'} · {sitemap.errors ? <span className="font-semibold text-red-600">{sitemap.errors} erreur(s)</span> : sitemap.warnings ? <span className="font-semibold text-amber-600">{sitemap.warnings} avertissement(s)</span> : <span className="text-emerald-600">aucune erreur</span>}{sitemap.pending ? ' · en attente' : ''}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-xs text-slate-500">Aucun sitemap envoyé. Ajoute https://jchub.dev/sitemap.xml dans Search Console › Sitemaps.</p>}
          </Panel>
        </>
      )}

      <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Panel title="Santé SEO des pages" subtitle={audit ? `${audit.checked} pages contrôlées (FR et EN)` : undefined}>
          {audit ? (
            <div className="space-y-3">
              <Gauge value={audit.score} label="pages sans problème" color={audit.score >= 80 ? '#16a34a' : audit.score >= 50 ? '#f59e0b' : '#ef4444'} suffix=" %" />
              <ul className="space-y-1 text-xs text-slate-600">
                <li className="flex justify-between"><span>Sans problème</span><strong className="text-emerald-600">{audit.healthy}</strong></li>
                <li className="flex justify-between"><span>Avec une erreur</span><strong className="text-red-600">{audit.errors}</strong></li>
                <li className="flex justify-between"><span>À améliorer</span><strong className="text-amber-600">{audit.warnings}</strong></li>
              </ul>
            </div>
          ) : <p className="text-xs text-slate-500">Chargement…</p>}
        </Panel>
        <Panel title="Pages à corriger" subtitle="Titre : 30 à 65 caractères. Description : 70 à 160. Articles : couverture, 300 mots au moins, mots-clés, version anglaise." action={
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-[11px] font-semibold">
            {(['all', 'article', 'outil'] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`rounded-md px-2 py-1 ${filter === value ? 'bg-slate-900 text-white' : 'text-slate-600'}`}>{value === 'all' ? 'Tout' : value === 'article' ? 'Articles' : 'Outils'}</button>)}
          </div>
        }>
          {auditPages.length ? (
            <ul className="max-h-[480px] divide-y divide-slate-100 overflow-auto text-xs">
              {auditPages.map((page) => (
                <li key={`${page.locale}:${page.path}`} className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-500">{page.locale}</span>
                    <a href={`https://jchub.dev${page.path}`} target="_blank" rel="noreferrer" className="min-w-0 truncate font-semibold text-slate-900 hover:text-blue-600">{page.title}</a>
                  </div>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {page.issues.map((issue) => <li key={issue.text} className={`rounded-md px-1.5 py-0.5 ${issue.level === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>{issue.text}</li>)}
                  </ul>
                </li>
              ))}
            </ul>
          ) : <p className="flex items-center gap-2 py-6 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" />{audit ? 'Aucune page à corriger.' : 'Chargement…'}</p>}
        </Panel>
      </section>
      {!data && !error && <p className="flex items-center gap-2 text-xs text-slate-500"><Search className="h-3.5 w-3.5" />Lecture de Search Console…</p>}
    </div>
  );
}
