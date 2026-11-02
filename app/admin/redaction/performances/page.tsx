'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BookOpenCheck, Clock3, ExternalLink, Eye, FileCheck2, Info, Loader2, MessageCircle, Users } from 'lucide-react';
import { ArticleThumb, articleUrl, Card, formatDay, Notice, useWriterPerformance } from '@/components/redaction/shared';
import { BarList, ColumnChart, Delta, formatNumber, Legend, LineChart, SegmentedBar, SERIES, Sparkline } from '@/components/redaction/charts';
import { change, formatDuration, PERFORMANCE_RANGES, type ArticlePerformance, type PerformanceRange } from '@/lib/writer-performance';

type SortKey = 'views' | 'allTimeViews' | 'readSeconds' | 'comments' | 'publishedAt';
const sorts: { key: SortKey; label: string }[] = [
  { key: 'views', label: 'Vues sur la période' },
  { key: 'allTimeViews', label: 'Vues depuis la publication' },
  { key: 'readSeconds', label: 'Temps de lecture' },
  { key: 'comments', label: 'Commentaires' },
  { key: 'publishedAt', label: 'Date de publication' },
];

const monthLabel = (month: string, style: 'short' | 'long') => new Date(`${month}-15T12:00:00`).toLocaleDateString('fr-FR', style === 'short' ? { month: 'short' } : { month: 'long', year: 'numeric' }).replace('.', '');
const editUrl = (article: ArticlePerformance) => `/admin/redaction/articles/${encodeURIComponent(article.id)}`;

export default function WriterPerformancePage() {
  const [days, setDays] = useState<PerformanceRange>(30);
  const [sort, setSort] = useState<SortKey>('views');
  const { data, loading, error } = useWriterPerformance(days);

  const sorted = [...(data?.articles || [])].sort((a, b) => sort === 'publishedAt' ? (b.publishedAt || '').localeCompare(a.publishedAt || '') : b[sort] - a[sort]);
  const totals = data?.totals;
  const analytics = Boolean(data?.analytics);
  const viewsChange = totals ? change(totals.views, totals.previousViews) : null;
  const langViews = data ? [{ name: 'Version française', value: data.daily.reduce((sum, day) => sum + day.fr, 0) }, { name: 'Version anglaise', value: data.daily.reduce((sum, day) => sum + day.en, 0) }] : [];
  const top = (data?.articles || []).filter((article) => article.views > 0).slice(0, 8);

  return <div className="mx-auto max-w-[1180px] space-y-5 sm:space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-[#0f1c3f] sm:text-[28px]">Performances</h1>
        <p className="mt-1.5 text-[15px] text-slate-600">Qui lit vos articles, combien de temps, d’où et dans quelle langue.</p>
      </div>
      {/* The period scopes every figure of the page. */}
      <div className="flex items-center gap-3">
        {loading && data && <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-label="Mise à jour" />}
        <div role="radiogroup" aria-label="Période" className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          {PERFORMANCE_RANGES.map((range) => <button key={range} type="button" role="radio" aria-checked={days === range} onClick={() => setDays(range)} className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${days === range ? 'bg-[#1f6feb] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>{range} jours</button>)}
        </div>
      </div>
    </header>

    {error && <Notice>{error}</Notice>}
    {data && <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Du {formatDay(data.start)} au {formatDay(data.end)} inclus. {analytics ? 'Source : Google Analytics, mis à jour une fois par jour.' : 'Source : compteur du site (les lecteurs, le temps de lecture, les appareils et la provenance demandent Google Analytics).'}</p>}

    <div className={`space-y-5 transition-opacity sm:space-y-6 ${loading && data ? 'opacity-60' : ''}`}>
      {/* The figure the page leads with, then its detail. */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
        <Card className="flex flex-col justify-between p-5 sm:p-6">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-slate-600"><Eye className="h-4 w-4 text-slate-400" />Vues sur {days} jours</p>
            <p className="mt-2 text-5xl font-bold tracking-tight text-[#0f1c3f]">{totals ? formatNumber(totals.views) : '—'}</p>
            <p className="mt-2">{totals && <Delta value={viewsChange} suffix={`vs les ${days} jours d’avant (${formatNumber(totals.previousViews)})`} />}</p>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
            <div><dt className="text-slate-500">Depuis la publication</dt><dd className="mt-0.5 text-lg font-semibold text-slate-900">{totals ? formatNumber(totals.allTimeViews) : '—'}</dd></div>
            <div><dt className="text-slate-500">Moyenne par jour</dt><dd className="mt-0.5 text-lg font-semibold text-slate-900">{totals ? formatNumber(totals.views / days) : '—'}</dd></div>
          </dl>
        </Card>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Tile icon={Users} tone="bg-blue-50 text-blue-600" label="Lecteurs uniques" value={analytics && totals ? formatNumber(totals.readers) : '—'} note={analytics ? (totals?.readers ? `${(totals.views / totals.readers).toFixed(1).replace('.', ',')} vues par lecteur` : 'Sur la période') : 'Google Analytics requis'} />
          <Tile icon={Clock3} tone="bg-teal-50 text-teal-600" label="Temps de lecture moyen" value={analytics && totals ? formatDuration(totals.readSeconds) : '—'} note={analytics ? 'Temps actif par vue' : 'Google Analytics requis'} />
          <Tile icon={MessageCircle} tone="bg-violet-50 text-violet-600" label="Commentaires" value={totals ? formatNumber(totals.comments) : '—'} note={totals ? <Delta value={change(totals.comments, totals.previousComments)} suffix="" /> : null} />
          <Tile icon={FileCheck2} tone="bg-emerald-50 text-emerald-600" label="Articles en ligne" value={totals ? formatNumber(totals.published) : '—'} note={totals && totals.published ? `${formatNumber(totals.allTimeViews / totals.published)} vues chacun en moyenne` : 'Publiés et visibles'} />
        </div>
      </section>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-[#0f1c3f] sm:text-lg">Vues par jour</h2>
          <Legend items={[{ name: 'Version française', color: SERIES[0] }, { name: 'Version anglaise', color: SERIES[1] }]} />
        </div>
        <div className="mt-4">
          {data ? <LineChart dates={data.daily.map((day) => day.date)} series={[{ name: 'Français', color: SERIES[0] }, { name: 'Anglais', color: SERIES[1] }]} values={[data.daily.map((day) => day.fr), data.daily.map((day) => day.en)]} label={`Vues par jour sur ${days} jours, en français et en anglais`} height={280}
            extra={(index) => <>
              <li className="flex justify-between gap-2 border-t border-slate-100 pt-1"><span className="text-slate-500">Total</span><strong className="text-sm text-slate-900">{formatNumber(data.daily[index].fr + data.daily[index].en)}</strong></li>
              {data.daily[index].comments > 0 && <li className="flex justify-between gap-2"><span className="text-slate-500">Commentaires</span><strong className="text-sm text-slate-900">{data.daily[index].comments}</strong></li>}
            </>} />
            : <div className="h-[280px]" />}
        </div>
        <p className="mt-2 text-xs text-slate-500">Survolez ou touchez la courbe pour voir le détail d’un jour ; au clavier, utilisez les flèches.</p>
      </Card>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-6">
        <Card className="p-4 sm:p-6">
          <h2 className="text-base font-bold text-[#0f1c3f] sm:text-lg">Articles les plus lus sur {days} jours</h2>
          <div className="mt-4"><BarList items={top.map((article) => ({ label: article.title, value: article.views, href: editUrl(article), note: `${formatNumber(article.fr)} en français · ${formatNumber(article.en)} en anglais` }))} empty="Aucune vue sur la période." /></div>
        </Card>
        <div className="space-y-5 lg:space-y-6">
          <Card className="p-4 sm:p-6">
            <h2 className="text-base font-bold text-[#0f1c3f]">Langue des lectures</h2>
            <div className="mt-4"><SegmentedBar parts={langViews} label="Répartition des vues par langue" /></div>
          </Card>
          <Card className="p-4 sm:p-6">
            <h2 className="text-base font-bold text-[#0f1c3f]">Appareils</h2>
            <div className="mt-4">{analytics ? <SegmentedBar parts={(data?.devices || []).map((share) => ({ name: share.name, value: share.views }))} label="Répartition des vues par appareil" /> : <NeedsAnalytics />}</div>
          </Card>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 lg:gap-6">
        <Card className="p-4 sm:p-6">
          <h2 className="text-base font-bold text-[#0f1c3f]">D’où viennent vos lecteurs</h2>
          <div className="mt-4">{analytics ? <BarList items={(data?.channels || []).map((share) => ({ label: share.name, value: share.views }))} empty="Pas encore de données sur la période." /> : <NeedsAnalytics />}</div>
        </Card>
        <Card className="p-4 sm:p-6">
          <h2 className="text-base font-bold text-[#0f1c3f]">Pays</h2>
          <div className="mt-4">{analytics ? <BarList items={(data?.countries || []).map((share) => ({ label: share.name, value: share.views }))} color={SERIES[2]} empty="Pas encore de données sur la période." /> : <NeedsAnalytics />}</div>
        </Card>
      </section>

      <Card className="p-4 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold text-[#0f1c3f] sm:text-lg"><BookOpenCheck className="h-5 w-5 text-slate-400" />Vos publications sur 12 mois</h2>
        <div className="mt-4">{data && <ColumnChart items={data.monthly.map((item) => ({ label: monthLabel(item.month, 'short'), long: monthLabel(item.month, 'long'), value: item.count }))} label="Nombre d’articles publiés par mois sur les 12 derniers mois" />}</div>
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-bold text-[#0f1c3f] sm:text-lg">Détail par article</h2>
          <label className="flex items-center gap-2 text-sm text-slate-600">Trier par
            <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-800 outline-none focus:border-blue-400">{sorts.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select>
          </label>
        </div>
        {sorted.length ? <>
          {/* Phones: one card per article. */}
          <ul className="mt-4 space-y-3 md:hidden">{sorted.map((article) => <li key={article.id} className="rounded-xl border border-slate-200 p-3.5">
            <div className="flex gap-3"><ArticleThumb src={article.image} className="h-12 w-12" /><div className="min-w-0 flex-1"><Link href={editUrl(article)} className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">{article.title}</Link><p className="mt-0.5 text-xs text-slate-500">Publié le {formatDay(article.publishedAt)}</p></div></div>
            <div className="mt-3 flex items-center justify-between gap-3"><div><p className="text-xl font-bold text-[#0f1c3f]">{formatNumber(article.views)} <span className="text-xs font-normal text-slate-500">vues</span></p><Delta value={change(article.views, article.previousViews)} suffix="" /></div><Sparkline values={article.trend} width={110} label={`Évolution des vues de ${article.title}`} /></div>
            <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-xs">
              <Metric label="FR / EN" value={`${formatNumber(article.fr)} / ${formatNumber(article.en)}`} />
              <Metric label="Lecture" value={analytics ? formatDuration(article.readSeconds) : '—'} />
              <Metric label="Commentaires" value={formatNumber(article.comments)} />
              <Metric label="Depuis la publication" value={formatNumber(article.allTimeViews)} />
              <Metric label="Lecteurs" value={analytics ? formatNumber(article.readers) : '—'} />
              <Metric label="Mots" value={formatNumber(article.words)} />
            </dl>
          </li>)}</ul>
          {/* Wider screens: one row per article. */}
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs font-medium text-slate-500"><tr>
                <th className="py-2.5 pr-3 font-medium">Article</th>
                <th className="px-3 py-2.5 text-right font-medium">Vues ({days} j)</th>
                <th className="px-3 py-2.5 font-medium">Évolution</th>
                <th className="px-3 py-2.5 text-right font-medium">FR / EN</th>
                <th className="px-3 py-2.5 text-right font-medium">Lecteurs</th>
                <th className="px-3 py-2.5 text-right font-medium">Lecture moy.</th>
                <th className="px-3 py-2.5 text-right font-medium">Comm.</th>
                <th className="px-3 py-2.5 text-right font-medium">Total</th>
                <th className="py-2.5 pl-3 text-right font-medium">Mots</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100" style={{ fontVariantNumeric: 'tabular-nums' }}>{sorted.map((article) => <tr key={article.id} className="align-middle">
                <td className="max-w-[300px] py-3 pr-3"><div className="flex items-center gap-3"><ArticleThumb src={article.image} className="h-10 w-10" /><div className="min-w-0"><Link href={editUrl(article)} className="line-clamp-1 font-semibold text-slate-900 hover:text-blue-700">{article.title}</Link><p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">{formatDay(article.publishedAt)}{article.status === 'published' ? <a href={articleUrl(article.slug)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-blue-700 hover:underline"><ExternalLink className="h-3 w-3" />Voir</a> : <span>· retiré du site</span>}</p></div></div></td>
                <td className="px-3 py-3 text-right"><strong className="font-semibold text-slate-900">{formatNumber(article.views)}</strong><br /><Delta value={change(article.views, article.previousViews)} suffix="" /></td>
                <td className="px-3 py-3"><Sparkline values={article.trend} label={`Évolution des vues de ${article.title}`} /></td>
                <td className="px-3 py-3 text-right text-slate-700">{formatNumber(article.fr)} / {formatNumber(article.en)}</td>
                <td className="px-3 py-3 text-right text-slate-700">{analytics ? formatNumber(article.readers) : '—'}</td>
                <td className="px-3 py-3 text-right text-slate-700">{analytics ? formatDuration(article.readSeconds) : '—'}</td>
                <td className="px-3 py-3 text-right text-slate-700">{formatNumber(article.comments)}</td>
                <td className="px-3 py-3 text-right text-slate-700">{formatNumber(article.allTimeViews)}</td>
                <td className="py-3 pl-3 text-right text-slate-700">{formatNumber(article.words)}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </> : data && <p className="py-12 text-center text-sm text-slate-500">Les chiffres apparaîtront ici après votre première publication.</p>}
        <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">« Total » compte toutes les ouvertures depuis la publication, dans les deux langues. Les autres colonnes portent sur les {days} derniers jours ; l’évolution compare aux {days} jours d’avant.</p>
      </Card>
    </div>
  </div>;
}

function Tile({ icon: Icon, tone, label, value, note }: { icon: typeof Eye; tone: string; label: string; value: string; note: React.ReactNode }) {
  return <Card className="p-4 sm:p-5">
    <span className={`grid h-9 w-9 place-items-center rounded-full sm:h-10 sm:w-10 ${tone}`}><Icon className="h-[18px] w-[18px]" /></span>
    <p className="mt-3 text-[13px] font-medium leading-5 text-slate-600 sm:text-sm">{label}</p>
    <p className="mt-0.5 text-xl font-bold text-[#0f1c3f] sm:text-2xl">{value}</p>
    <div className="mt-1 text-xs leading-4 text-slate-500">{note}</div>
  </Card>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-slate-500">{label}</dt><dd className="mt-0.5 font-semibold text-slate-900">{value}</dd></div>;
}

function NeedsAnalytics() {
  return <p className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-500">Disponible quand Google Analytics est relié au site. Les vues par jour et par langue, elles, viennent du compteur du site.</p>;
}
