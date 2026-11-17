'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownUp } from 'lucide-react';
import { formatNumber, nf, Panel } from '@/components/admin/dashboard/Widgets';
import { DataBanner, PALETTE, tooltipStyle, useInsights, type CollectionInfo } from '@/components/admin/insights/InsightsUI';

type Article = { id: string; title: string; category: string; views: number; readers: number; englishViews: number; readSeconds: number | null; depth: Record<25 | 50 | 75 | 100, number>; toTools: number };
type Blog = { configured: boolean; info?: CollectionInfo; articles: Article[]; categories: { category: string; views: number; readers: number; articles: number; toTools: number }[] };
type SortKey = 'views' | 'readSeconds' | 'completion' | 'toTools';

const reading = (seconds: number | null) => seconds === null ? '—' : seconds >= 60 ? `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, '0')} s` : `${seconds} s`;
const share = (part: number, whole: number) => whole ? Math.round((part / whole) * 100) : 0;

export default function InsightsBlogPage() {
  const { data, error } = useInsights<Blog>('blog');
  const [sort, setSort] = useState<SortKey>('views');
  const rows = useMemo(() => (data?.articles ?? []).map((article) => ({ ...article, completion: share(article.depth[100], article.readers) }))
    .sort((a, b) => Number(b[sort] ?? -1) - Number(a[sort] ?? -1) || b.views - a.views), [data, sort]);
  const totals = useMemo(() => {
    const list = data?.articles ?? [];
    const readers = list.reduce((sum, article) => sum + article.readers, 0);
    const timed = list.filter((article) => article.readSeconds !== null);
    return {
      views: list.reduce((sum, article) => sum + article.views, 0),
      readers,
      readSeconds: timed.length ? Math.round(timed.reduce((sum, article) => sum + (article.readSeconds ?? 0), 0) / timed.length) : null,
      depth: ([25, 50, 75, 100] as const).map((step) => ({ step: `${step} %`, lecteurs: list.reduce((sum, article) => sum + article.depth[step], 0) })),
      toTools: list.reduce((sum, article) => sum + article.toTools, 0),
    };
  }, [data]);
  const header = (key: SortKey, label: string) => <th className="px-2 py-2 text-right font-semibold"><button type="button" onClick={() => setSort(key)} className={`inline-flex items-center gap-1 ${sort === key ? 'text-blue-700' : ''}`}>{label}<ArrowDownUp className="h-3 w-3" /></button></th>;

  return (
    <div className="space-y-4">
      <DataBanner info={data?.info} configured={data?.configured !== false} />
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Vues d’articles', formatNumber(data ? totals.views : undefined), 'pages d’articles ouvertes'],
          ['Lecteurs', formatNumber(data ? totals.readers : undefined), 'visiteurs différents par jour'],
          ['Temps de lecture réel', data ? reading(totals.readSeconds) : '—', 'actif sur la page, en moyenne'],
          ['Vers les outils', formatNumber(data ? totals.toTools : undefined), 'lecteurs qui ont ouvert un outil ensuite'],
        ].map(([label, value, note]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[11px] font-semibold text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-slate-950">{value}</p><p className="text-[10px] text-slate-400">{note}</p></div>)}
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Panel title="Profondeur de lecture" subtitle="Lecteurs arrivés à 25, 50, 75 et 100 % du texte" className="xl:col-span-5">
          <div className="h-60">
            <ResponsiveContainer><BarChart data={totals.depth} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}><CartesianGrid stroke="#f1f5f9" vertical={false} /><XAxis dataKey="step" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} allowDecimals={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="lecteurs" fill="#2563eb" radius={[6, 6, 0, 0]} isAnimationActive={false} maxBarSize={70} /></BarChart></ResponsiveContainer>
          </div>
          {data && !totals.depth[0].lecteurs && <p className="text-center text-xs text-slate-400">Se remplit avec la mesure propre au site (le défilement n’existe pas dans l’historique importé).</p>}
        </Panel>
        <Panel title="Rubriques qui marchent le mieux" subtitle="Vues, lecteurs et passage vers les outils" className="xl:col-span-7">
          <ul className="space-y-2.5">
            {(data?.categories ?? []).map((category, index) => {
              const max = Math.max(1, ...(data?.categories ?? []).map((item) => item.views));
              return (
                <li key={category.category}>
                  <div className="mb-1 flex justify-between gap-2 text-[11px]"><span className="text-slate-700"><strong>{category.category}</strong> <span className="text-slate-400">· {category.articles} article(s)</span></span><span className="text-slate-900"><strong>{nf.format(category.views)}</strong> vues · {nf.format(category.toTools)} vers les outils</span></div>
                  <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full" style={{ width: `${(category.views / max) * 100}%`, background: PALETTE[index % PALETTE.length] }} /></div>
                </li>
              );
            })}
            {data && !data.categories.length && <li className="text-xs text-slate-400">Aucune lecture sur la période.</li>}
          </ul>
        </Panel>
      </section>

      <Panel title="Vues par article" subtitle="Lecture complète = lecteurs arrivés au bout du texte. Vers les outils = lecteurs qui ont ouvert un outil dans les 24 h.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-[11px] text-slate-700">
            <thead><tr className="border-b border-slate-200 text-left text-[10px] text-slate-500"><th className="px-2 py-2 font-semibold">Article</th><th className="px-2 py-2 font-semibold">Rubrique</th>{header('views', 'Vues')}<th className="px-2 py-2 text-right font-semibold">dont EN</th>{header('readSeconds', 'Lecture réelle')}{header('completion', 'Lecture complète')}{header('toTools', 'Vers les outils')}</tr></thead>
            <tbody>
              {rows.map((article) => (
                <tr key={article.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                  <td className="max-w-[420px] truncate px-2 py-2 font-semibold text-slate-800" title={article.title}>{article.title}</td>
                  <td className="px-2 py-2 text-slate-500">{article.category}</td>
                  <td className="px-2 py-2 text-right font-bold text-slate-900">{nf.format(article.views)}</td>
                  <td className="px-2 py-2 text-right text-slate-500">{nf.format(article.englishViews)}</td>
                  <td className="px-2 py-2 text-right">{reading(article.readSeconds)}</td>
                  <td className="px-2 py-2 text-right">{article.depth[25] ? `${article.completion} %` : '—'}</td>
                  <td className="px-2 py-2 text-right font-semibold text-blue-700">{nf.format(article.toTools)}</td>
                </tr>
              ))}
              {data && !rows.length && <tr><td colSpan={7} className="py-6 text-center text-slate-400">Aucun article lu sur la période.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
