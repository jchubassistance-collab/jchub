'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CalendarCheck, CalendarDays, Eye, FileText, FolderOpen, Lightbulb, PlusCircle, Target, Zap } from 'lucide-react';
import { ArticleTable, Card, Notice, useWriterArticles } from '@/components/redaction/shared';
import { useWriter } from '@/components/redaction/WriterShell';

/** Monday 00:00 of the current week, in the writer's time zone. */
function startOfWeek() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date.getTime();
}

const steps = [
  { title: 'Choisir un sujet', text: 'Notez vos idées d’articles dans le calendrier éditorial.' },
  { title: 'Rédiger l’article', text: 'Respectez la structure et les règles de rédaction.' },
  { title: 'Relire l’aperçu', text: 'Vérifiez le titre, le résumé et le rendu avant de publier.' },
  { title: 'Publication', text: 'L’article est en ligne en quelques minutes, puis traduit en anglais.' },
];

export default function WriterDashboardPage() {
  const { firstName } = useWriter();
  const { articles, loaded, error, reload } = useWriterArticles();
  const [actionError, setActionError] = useState('');
  const weekStart = startOfWeek();
  const drafts = articles.filter((article) => article.status === 'draft').length;
  const views = articles.reduce((total, article) => total + article.views, 0);
  const publishedThisWeek = articles.filter((article) => article.status === 'published' && article.publishedAt && new Date(article.publishedAt).getTime() >= weekStart).length;
  const stats = [
    { label: 'Mes brouillons', value: drafts, note: 'Articles en cours de rédaction', href: '/admin/redaction/articles?statut=draft', icon: FileText, tone: 'bg-blue-50 text-blue-600' },
    { label: 'Vues totales', value: views, note: 'Sur vos articles publiés', href: '/admin/redaction/performances', icon: Eye, tone: 'bg-teal-50 text-teal-600' },
    { label: 'Publié cette semaine', value: publishedThisWeek, note: publishedThisWeek > 1 ? 'Articles mis en ligne' : 'Article mis en ligne', href: '/admin/redaction/articles?statut=published', icon: CalendarCheck, tone: 'bg-violet-50 text-violet-600' },
    { label: 'Articles totaux', value: articles.length, note: 'Depuis votre arrivée', href: '/admin/redaction/articles', icon: CalendarDays, tone: 'bg-orange-50 text-orange-500' },
  ];

  return <div className="mx-auto max-w-[1180px] space-y-7">
    <header>
      <h1 className="text-[28px] font-extrabold tracking-tight text-[#0f1c3f] sm:text-[32px]">Bonjour {firstName} <span aria-hidden="true">👋</span></h1>
      <p className="mt-2 text-[15px] text-slate-600">Bienvenue sur votre espace de rédaction. Voici un aperçu de votre activité.</p>
    </header>

    {(error || actionError) && <Notice>{error || actionError}</Notice>}

    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Votre activité">
      {stats.map(({ label, value, note, href, icon: Icon, tone }) => <Link key={label} href={href} className="group rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,28,63,.05)] transition hover:border-blue-200 hover:shadow-md sm:p-5">
        <span className={`grid h-10 w-10 place-items-center rounded-full sm:h-12 sm:w-12 ${tone}`}><Icon className="h-5 w-5 sm:h-6 sm:w-6" /></span>
        <p className="mt-4 text-sm font-medium leading-5 text-slate-700 sm:mt-5 sm:text-[15px]">{label}</p>
        <p className="mt-1 text-2xl font-bold text-[#0f1c3f] sm:text-3xl">{loaded ? value.toLocaleString('fr-FR') : '—'}</p>
        <p className="mt-2 flex items-end justify-between gap-2 text-xs leading-4 text-slate-500 sm:mt-3">{note}<ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" /></p>
      </Link>)}
    </section>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(290px,1fr)]">
      <Card className="p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-3 text-lg font-bold text-[#0f1c3f]"><span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600"><FileText className="h-[18px] w-[18px]" /></span>Vos derniers articles</h2>
          <Link href="/admin/redaction/articles" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline">Voir tous<ArrowRight className="h-4 w-4" /></Link>
        </div>
        {articles.length ? <ArticleTable articles={articles.slice(0, 5)} onChanged={() => void reload()} onError={setActionError} />
          : loaded && <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center"><p className="text-sm font-semibold text-slate-800">Aucun article pour l’instant</p><p className="mt-1 text-sm text-slate-500">Commencez par une idée dans le calendrier, ou lancez-vous directement.</p><Link href="/admin/redaction/nouveau" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1f6feb] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><PlusCircle className="h-4 w-4" />Créer mon premier article</Link></div>}
      </Card>

      <Card className="h-fit p-5 sm:p-6">
        <h2 className="flex items-center gap-3 text-lg font-bold text-[#0f1c3f]"><span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-700"><Zap className="h-[18px] w-[18px]" /></span>Actions rapides</h2>
        <div className="mt-5 space-y-3">
          <Link href="/admin/redaction/nouveau" className="flex items-center justify-center gap-2.5 rounded-lg bg-[#1f6feb] px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><PlusCircle className="h-5 w-5" />Créer un nouvel article</Link>
          <QuickLink href="/admin/redaction/calendrier" icon={<CalendarDays className="h-5 w-5" />}>Voir le calendrier éditorial</QuickLink>
          <QuickLink href="/admin/redaction/ressources" icon={<FileText className="h-5 w-5" />}>Consulter les guides de rédaction</QuickLink>
          <QuickLink href="/admin/redaction/ressources#ressources" icon={<FolderOpen className="h-5 w-5" />}>Accéder aux ressources</QuickLink>
        </div>
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 p-5">
          <p className="flex items-center gap-2.5 font-semibold text-blue-800"><Lightbulb className="h-5 w-5" />Rappel important</p>
          <p className="mt-2.5 text-sm leading-6 text-slate-600">Un article publié est visible de tous en quelques minutes, puis traduit automatiquement en anglais. Relisez l’aperçu avant de cliquer sur <strong className="font-semibold text-slate-800">Publier</strong>.</p>
        </div>
      </Card>
    </div>

    <Card className="p-5 sm:p-7">
      <h2 className="flex items-center gap-3 text-lg font-bold text-[#0f1c3f]"><Target className="h-5 w-5 text-slate-600" />Prochaines étapes</h2>
      <ol className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => <li key={step.title} className="flex gap-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 text-lg font-bold text-blue-700">{index + 1}</span>
          <span className="min-w-0 flex-1"><strong className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">{step.title}{index < steps.length - 1 && <ArrowRight className="hidden h-4 w-4 text-slate-400 xl:block" />}</strong><span className="mt-1.5 block text-[13px] leading-5 text-slate-500">{step.text}</span></span>
        </li>)}
      </ol>
    </Card>
  </div>;
}

function QuickLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <Link href={href} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-800 hover:border-blue-200 hover:bg-blue-50/40"><span className="text-slate-600">{icon}</span>{children}</Link>;
}
