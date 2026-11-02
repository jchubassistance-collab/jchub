'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CalendarDays, CalendarPlus, Eye, FileText, FolderOpen, Lightbulb, MessageCircle, PencilLine, PlusCircle, Trophy, Zap } from 'lucide-react';
import { ArticleTable, Card, formatDay, Notice, useWriterArticles, useWriterPerformance } from '@/components/redaction/shared';
import { Delta, formatNumber, LineChart, SERIES } from '@/components/redaction/charts';
import { useWriter } from '@/components/redaction/WriterShell';
import { change } from '@/lib/writer-performance';
import { MIN_PUBLISHED_WORDS, type WriterArticleSummary } from '@/lib/writer-rules';

/** Monday 00:00 of the current week, in the writer's time zone. */
function startOfWeek() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date.getTime();
}

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const editUrl = (article: { id: string }) => `/admin/redaction/articles/${encodeURIComponent(article.id)}`;
const plannedDay = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

export default function WriterDashboardPage() {
  const { firstName } = useWriter();
  const { articles, loaded, error, reload } = useWriterArticles();
  const { data: performance } = useWriterPerformance(30);
  const [actionError, setActionError] = useState('');
  const weekStart = startOfWeek();
  const drafts = articles.filter((article) => article.status === 'draft');
  const published = articles.filter((article) => article.status === 'published');
  const publishedThisWeek = published.filter((article) => article.publishedAt && new Date(article.publishedAt).getTime() >= weekStart).length;
  const totals = performance?.totals;
  const upcoming = drafts.filter((article) => article.plannedFor && article.plannedFor >= today()).sort((a, b) => (a.plannedFor || '').localeCompare(b.plannedFor || '')).slice(0, 4);
  const toFinish = [...drafts].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).slice(0, 4);
  const best = performance?.articles.find((article) => article.views > 0);

  const stats = [
    { label: 'Vues sur 30 jours', value: totals ? formatNumber(totals.views) : '—', note: totals ? <Delta value={change(totals.views, totals.previousViews)} suffix="vs 30 j d’avant" /> : 'Sur vos articles publiés', href: '/admin/redaction/performances', icon: Eye, tone: 'bg-teal-50 text-teal-600' },
    { label: 'Commentaires', value: totals ? formatNumber(totals.comments) : '—', note: 'Reçus en 30 jours', href: '/admin/redaction/performances', icon: MessageCircle, tone: 'bg-violet-50 text-violet-600' },
    { label: 'Articles en ligne', value: loaded ? formatNumber(published.length) : '—', note: publishedThisWeek ? `Dont ${publishedThisWeek} cette semaine` : 'Aucun cette semaine', href: '/admin/redaction/articles?statut=published', icon: FileText, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Brouillons', value: loaded ? formatNumber(drafts.length) : '—', note: `${formatNumber(articles.length)} article${articles.length > 1 ? 's' : ''} au total`, href: '/admin/redaction/articles?statut=draft', icon: PencilLine, tone: 'bg-blue-50 text-blue-600' },
  ];

  return <div className="mx-auto max-w-[1180px] space-y-5 sm:space-y-6">
    <header>
      <h1 className="text-[26px] font-extrabold tracking-tight text-[#0f1c3f] sm:text-[32px]">Bonjour {firstName} <span aria-hidden="true">👋</span></h1>
      <p className="mt-1.5 text-[15px] text-slate-600">Voici où en sont vos articles et vos lecteurs.</p>
    </header>

    {(error || actionError) && <Notice>{error || actionError}</Notice>}

    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Votre activité">
      {stats.map(({ label, value, note, href, icon: Icon, tone }) => <Link key={label} href={href} className="group flex flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,28,63,.05)] transition hover:border-blue-200 hover:shadow-md sm:p-5">
        <span className="flex items-center justify-between"><span className={`grid h-9 w-9 place-items-center rounded-full sm:h-11 sm:w-11 ${tone}`}><Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" /></span><ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" /></span>
        <p className="mt-3 text-[13px] font-medium leading-5 text-slate-600 sm:mt-4 sm:text-sm">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-[#0f1c3f] sm:text-3xl">{value}</p>
        <div className="mt-1 text-xs leading-4 text-slate-500">{note}</div>
      </Link>)}
    </section>

    <section className="grid gap-5 lg:grid-cols-[minmax(0,1.75fr)_minmax(290px,1fr)] lg:gap-6">
      <Card className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="text-base font-bold text-[#0f1c3f] sm:text-lg">Vos lectures ces 30 derniers jours</h2><p className="mt-0.5 text-xs text-slate-500">Vues par jour, toutes langues confondues</p></div>
          <Link href="/admin/redaction/performances" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-700 hover:underline">Détails<ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-3">{performance ? <LineChart dates={performance.daily.map((day) => day.date)} series={[{ name: 'Vues', color: SERIES[0] }]} values={[performance.daily.map((day) => day.fr + day.en)]} area height={200} label="Vues par jour sur les 30 derniers jours" /> : <div className="h-[200px]" />}</div>
        {best && <Link href="/admin/redaction/performances" className="mt-4 flex items-center gap-3 rounded-xl bg-amber-50/70 p-3 hover:bg-amber-50">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700"><Trophy className="h-[18px] w-[18px]" /></span>
          <span className="min-w-0 flex-1"><span className="block text-xs text-slate-500">Votre article le plus lu sur 30 jours</span><strong className="line-clamp-1 text-sm font-semibold text-slate-900">{best.title}</strong></span>
          <span className="shrink-0 text-right"><strong className="block text-sm text-slate-900">{formatNumber(best.views)}</strong><span className="text-xs text-slate-500">vues</span></span>
        </Link>}
      </Card>

      <Card className="h-fit p-4 sm:p-6">
        <h2 className="flex items-center gap-2.5 text-base font-bold text-[#0f1c3f] sm:text-lg"><Zap className="h-5 w-5 text-slate-500" />Actions rapides</h2>
        <div className="mt-4 space-y-2.5">
          <Link href="/admin/redaction/nouveau" className="flex items-center justify-center gap-2.5 rounded-lg bg-[#1f6feb] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><PlusCircle className="h-5 w-5" />Créer un nouvel article</Link>
          <QuickLink href="/admin/redaction/calendrier" icon={<CalendarDays className="h-5 w-5" />}>Voir le calendrier éditorial</QuickLink>
          <QuickLink href="/admin/redaction/ressources" icon={<FileText className="h-5 w-5" />}>Guides de rédaction</QuickLink>
          <QuickLink href="/admin/redaction/ressources#ressources" icon={<FolderOpen className="h-5 w-5" />}>Ressources</QuickLink>
        </div>
        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-blue-800"><Lightbulb className="h-4 w-4" />Rappel</p>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">Un article publié est en ligne en quelques minutes, puis traduit en anglais. Relisez l’aperçu avant de cliquer sur <strong className="font-semibold text-slate-800">Publier</strong>.</p>
        </div>
      </Card>
    </section>

    <section className="grid gap-5 md:grid-cols-2 lg:gap-6">
      <Card className="p-4 sm:p-6">
        <h2 className="flex items-center gap-2.5 text-base font-bold text-[#0f1c3f]"><PencilLine className="h-5 w-5 text-slate-500" />Brouillons à terminer</h2>
        {toFinish.length ? <ul className="mt-4 space-y-4">{toFinish.map((article) => <DraftProgress key={article.id} article={article} />)}</ul>
          : loaded && <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Aucun brouillon en cours. <Link href="/admin/redaction/nouveau" className="font-medium text-blue-700 hover:underline">Commencer un article</Link></p>}
      </Card>
      <Card className="p-4 sm:p-6">
        <h2 className="flex items-center gap-2.5 text-base font-bold text-[#0f1c3f]"><CalendarDays className="h-5 w-5 text-slate-500" />Prévu au calendrier</h2>
        {upcoming.length ? <ol className="mt-4 divide-y divide-slate-100">{upcoming.map((article) => <li key={article.id}>
          <Link href={editUrl(article)} className="flex items-center gap-3 py-2.5 hover:text-blue-700">
            <span className="w-24 shrink-0 text-xs font-semibold text-blue-700">{plannedDay(article.plannedFor!)}</span>
            <span className="line-clamp-1 min-w-0 flex-1 text-sm text-slate-800">{article.title}</span>
          </Link>
        </li>)}</ol>
          : loaded && <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Rien de prévu pour l’instant. <Link href="/admin/redaction/calendrier" className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline"><CalendarPlus className="h-4 w-4" />Planifier une idée</Link></p>}
      </Card>
    </section>

    <Card className="p-4 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-base font-bold text-[#0f1c3f] sm:text-lg"><FileText className="h-5 w-5 text-slate-500" />Vos derniers articles</h2>
        <Link href="/admin/redaction/articles" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline">Voir tous<ArrowRight className="h-4 w-4" /></Link>
      </div>
      {articles.length ? <ArticleTable articles={articles.slice(0, 5)} onChanged={() => void reload()} onError={setActionError} />
        : loaded && <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center"><p className="text-sm font-semibold text-slate-800">Aucun article pour l’instant</p><p className="mt-1 text-sm text-slate-500">Commencez par une idée dans le calendrier, ou lancez-vous directement.</p><Link href="/admin/redaction/nouveau" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1f6feb] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><PlusCircle className="h-4 w-4" />Créer mon premier article</Link></div>}
    </Card>
  </div>;
}

/** A draft with how far it is from the words a publication needs. */
function DraftProgress({ article }: { article: WriterArticleSummary }) {
  const ratio = Math.min(1, article.words / MIN_PUBLISHED_WORDS);
  const missing = Math.max(0, MIN_PUBLISHED_WORDS - article.words);
  return <li>
    <Link href={editUrl(article)} className="group block">
      <span className="flex items-baseline justify-between gap-3"><span className="line-clamp-1 text-sm font-medium text-slate-800 group-hover:text-blue-700">{article.title}</span><span className="shrink-0 text-xs text-slate-500">{formatDay(article.updatedAt, { day: 'numeric', month: 'short' })}</span></span>
      <span className="mt-1.5 block h-2 rounded-full bg-blue-100"><span className="block h-full rounded-full bg-[#2a78d6]" style={{ width: `${Math.max(3, ratio * 100)}%` }} /></span>
      <span className="mt-1 block text-xs text-slate-500">{formatNumber(article.words)} mots · {missing ? `encore ${formatNumber(missing)} pour pouvoir publier` : 'assez long pour être publié'}</span>
    </Link>
  </li>;
}

function QuickLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <Link href={href} className="flex items-center gap-3.5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 hover:border-blue-200 hover:bg-blue-50/40"><span className="text-slate-600">{icon}</span>{children}</Link>;
}
