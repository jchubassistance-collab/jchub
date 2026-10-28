'use client';

import Link from 'next/link';
import { BarChart3, ExternalLink, Eye, FileCheck2, Trophy } from 'lucide-react';
import { ArticleThumb, articleUrl, Card, formatDay, Notice, useWriterArticles } from '@/components/redaction/shared';

export default function WriterPerformancePage() {
  const { articles, loaded, error } = useWriterArticles();
  const published = articles.filter((article) => article.publishedAt).sort((a, b) => b.views - a.views);
  const total = published.reduce((sum, article) => sum + article.views, 0);
  const best = published[0];
  const max = Math.max(1, best?.views || 0);
  const stats = [
    { label: 'Vues totales', value: total.toLocaleString('fr-FR'), icon: Eye, tone: 'bg-teal-50 text-teal-600' },
    { label: 'Articles publiés', value: published.filter((article) => article.status === 'published').length.toLocaleString('fr-FR'), icon: FileCheck2, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Vues par article', value: published.length ? Math.round(total / published.length).toLocaleString('fr-FR') : '0', icon: BarChart3, tone: 'bg-blue-50 text-blue-600' },
    { label: 'Meilleur article', value: best && best.views ? best.title : '—', icon: Trophy, tone: 'bg-amber-50 text-amber-600', small: true },
  ];

  return <div className="mx-auto max-w-[1180px] space-y-6">
    <header>
      <h1 className="text-[28px] font-extrabold tracking-tight text-[#0f1c3f]">Performances</h1>
      <p className="mt-1.5 text-[15px] text-slate-600">Combien de fois vos articles ont été lus, en français et en anglais.</p>
    </header>
    {error && <Notice>{error}</Notice>}

    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, tone, small }) => <Card key={label} className="p-4 sm:p-5">
        <span className={`grid h-10 w-10 place-items-center rounded-full sm:h-11 sm:w-11 ${tone}`}><Icon className="h-5 w-5" /></span>
        <p className="mt-3 text-sm font-medium text-slate-600 sm:mt-4">{label}</p>
        <p className={`mt-1 font-bold text-[#0f1c3f] ${small ? 'line-clamp-2 text-sm leading-5' : 'text-2xl sm:text-3xl'}`}>{loaded ? value : '—'}</p>
      </Card>)}
    </section>

    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-bold text-[#0f1c3f]">Vues par article</h2>
      {published.length ? <ol className="mt-4 divide-y divide-slate-100">{published.map((article, index) => <li key={article.id} className="flex items-center gap-4 py-3.5">
          <span className="w-5 shrink-0 text-right text-sm font-semibold text-slate-400">{index + 1}</span>
          <ArticleThumb src={article.image} className="h-12 w-12" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/admin/redaction/articles/${encodeURIComponent(article.id)}`} className="line-clamp-1 text-sm font-semibold text-slate-900 hover:text-blue-700">{article.title}</Link>
              <span className="shrink-0 text-sm font-bold text-[#0f1c3f]">{article.views.toLocaleString('fr-FR')}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#1f6feb]" style={{ width: `${Math.max(2, (article.views / max) * 100)}%` }} /></div>
            <p className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">Publié le {formatDay(article.publishedAt)}{article.status === 'published' ? <a href={articleUrl(article.slug)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-700 hover:underline"><ExternalLink className="h-3 w-3" />Voir</a> : <span>· retiré du site</span>}</p>
          </div>
        </li>)}</ol>
          : loaded && <p className="py-12 text-center text-sm text-slate-500">Les chiffres apparaîtront ici après votre première publication.</p>}
      <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">Une vue est comptée à chaque ouverture de l’article sur le site, dans les deux langues. Les chiffres se mettent à jour en continu.</p>
    </Card>
  </div>;
}
