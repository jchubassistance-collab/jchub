'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Activity, AlertCircle, ArrowUpRight, BarChart3, Bell, BookOpen, Bot, CalendarDays, CheckCircle2, Eye, FileText, Inbox, Loader2, Mail, MessageSquare, RefreshCw, TrendingUp, Users, Wrench } from 'lucide-react';

type AdminStats = {
  totalUsers: number;
  totalArticles: number;
  totalDrafts: number;
  approvedDrafts: number;
  pendingMessages: number;
  totalTools: number;
  totalArticleViews: number;
  articleViews: { slug: string; title: string; views: number }[];
  recentArticles: { id: string; title: string; status: string; publishedAt: string | null }[];
  recentRun: { date: string; status: string; createdAt: string | null } | null;
  recentUsers: { uid: string; email: string; createdAt: string | null }[];
  recentDrafts: { id: string; title: string; status: string; createdAt: string | null }[];
  contentTrends: { configured: boolean; dailyViews: Record<string, string | number>[]; monthlyViews: Record<string, string | number>[]; yearlyViews: Record<string, string | number>[]; publishedByDay: Record<string, number>; publishedByMonth: Record<string, number>; publishedByYear: Record<string, number>; currentPeriodViews: number | null; previousPeriodViews: number | null; currentPeriodPublications: number; previousPeriodPublications: number };
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');

  const loadStats = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/stats', { credentials: 'include', cache: 'no-store' });
      const data = await response.json().catch(() => null) as (AdminStats & { error?: string }) | null;
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) router.replace('/admin/login');
        throw new Error(data?.error || 'Impossible de charger les statistiques.');
      }
      setIsAdmin(true); setStats(data as AdminStats);
    } catch (cause) {
      if (cause instanceof Error && cause.message) setError(cause.message);
      setIsAdmin(false);
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => { void loadStats(); }, [loadStats]);

  if (loading && !stats) return <div className="grid min-h-[55vh] place-items-center"><div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-slate-500 shadow-sm"><Loader2 className="h-5 w-5 animate-spin text-blue-600" />Chargement du tableau de bord…</div></div>;
  if (!isAdmin && !loading) return <div className="mx-auto grid min-h-[55vh] max-w-lg place-items-center text-center"><div><AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" /><h1 className="text-2xl font-black text-slate-900">Accès refusé</h1><p className="mt-2 text-sm text-slate-500">{error || 'Reconnecte-toi avec un compte administrateur.'}</p><Link href="/admin/login" className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">Se reconnecter</Link></div></div>;
  if (!stats) return null;

  const cards = [
    { label: 'Utilisateurs', value: stats.totalUsers, note: 'Comptes inscrits', icon: Users, iconTone: 'bg-amber-50 text-amber-600', valueTone: 'text-slate-950' },
    { label: 'Articles publiés', value: stats.totalArticles, note: `${stats.totalDrafts} brouillon(s)`, icon: FileText, iconTone: 'bg-blue-50 text-blue-600', valueTone: 'text-slate-950' },
    { label: 'Vues des articles', value: stats.totalArticleViews, note: 'Consultations cumulées', icon: Eye, iconTone: 'bg-indigo-50 text-indigo-600', valueTone: 'text-slate-950' },
    { label: 'À valider', value: stats.approvedDrafts, note: 'Publications en attente', icon: Bot, iconTone: 'bg-violet-50 text-violet-600', valueTone: 'text-slate-950' },
  ];
  const topArticles = stats.articleViews.slice(0, 5);
  const contentTotal = stats.totalArticles + stats.totalTools + stats.totalDrafts;
  const articlePercent = contentTotal ? (stats.totalArticles / contentTotal) * 100 : 0;
  const toolPercent = contentTotal ? (stats.totalTools / contentTotal) * 100 : 0;
  const failedRun = stats.recentRun && /fail|error|échec/i.test(stats.recentRun.status);
  const notifications = [
    ...(stats.pendingMessages ? [{ title: 'Messages de contact à traiter', detail: `${stats.pendingMessages} message(s) sans réponse`, href: '/admin/inbox', icon: MessageSquare, tone: 'bg-blue-50 text-blue-600' }] : []),
    ...(stats.approvedDrafts ? [{ title: 'Brouillons approuvés à vérifier', detail: `${stats.approvedDrafts} publication(s) en attente`, href: '/admin/agent', icon: FileText, tone: 'bg-violet-50 text-violet-600' }] : []),
    ...(failedRun ? [{ title: 'Échec de l’agent éditorial', detail: `Dernière exécution : ${stats.recentRun?.date || 'date inconnue'}`, href: '/admin/agent', icon: AlertCircle, tone: 'bg-rose-50 text-rose-600' }] : []),
  ];

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-blue-600">Vue d’ensemble · JcHub</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Bonjour, Admin</h1><p className="mt-1 text-sm text-slate-500">Voici un aperçu de l’activité de ta plateforme.</p></div>
        <div className="flex flex-wrap items-center gap-2"><span className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600"><CalendarDays className="h-4 w-4 text-blue-600" />Indicateurs globaux</span><button onClick={() => void loadStats()} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:text-blue-700" aria-label="Actualiser les statistiques"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button><Link href="/admin/content" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2457c5] px-4 text-xs font-bold text-white shadow-sm shadow-blue-900/15 transition hover:bg-blue-700"><FileText className="h-4 w-4" />Gérer les articles</Link></div>
      </header>

      {error && <div role="alert" className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs principaux">
        {cards.map(({ label, value, note, icon: Icon, iconTone }) => <article key={label} className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_25px_rgba(24,39,75,.035)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_35px_rgba(24,39,75,.08)]"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-[27px] font-black tracking-tight text-slate-950">{Number(value).toLocaleString('fr-FR')}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${iconTone}`}><Icon className="h-5 w-5" /></span></div><p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400"><TrendingUp className="h-3.5 w-3.5 text-emerald-500" />{note}</p></article>)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_.85fr]">
        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_25px_rgba(24,39,75,.035)] sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Audience du blog</p><h2 className="mt-1 text-base font-extrabold text-slate-900">Articles les plus consultés</h2></div><Link href="/admin/analytics" className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900">Analytics<ArrowUpRight className="h-3.5 w-3.5" /></Link></div>
          {topArticles.length ? <ArticlesViewsChart rows={topArticles} /> : <div className="mt-6 grid min-h-36 place-items-center rounded-xl bg-slate-50 text-center text-xs text-slate-400">Les consultations des articles appara?tront ici.</div>}
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-[11px] text-slate-500"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-blue-600" />{stats.totalArticleViews.toLocaleString('fr-FR')} vues cumulées</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" />{stats.totalArticles} articles publiés</span></div>
        </article>

        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_25px_rgba(24,39,75,.035)] sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Catalogue</p><h2 className="mt-1 text-base font-extrabold text-slate-900">Répartition des contenus</h2><div className="mt-5 flex flex-col items-center gap-6 sm:flex-row xl:flex-col 2xl:flex-row"><div className="relative grid h-36 w-36 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#2457c5 0 ${articlePercent}%, #15a878 ${articlePercent}% ${articlePercent + toolPercent}%, #f4a62a ${articlePercent + toolPercent}% 100%)` }}><div className="grid h-[104px] w-[104px] place-content-center rounded-full bg-white text-center shadow-inner"><strong className="text-2xl font-black text-slate-900">{contentTotal}</strong><span className="mt-0.5 text-[10px] font-medium text-slate-400">éléments</span></div></div><div className="w-full space-y-3 text-xs">{[{ name: 'Articles', value: stats.totalArticles, tone: 'bg-[#2457c5]' }, { name: 'Outils', value: stats.totalTools, tone: 'bg-[#15a878]' }, { name: 'Brouillons IA', value: stats.totalDrafts, tone: 'bg-[#f4a62a]' }].map((item) => <div key={item.name} className="flex items-center justify-between gap-4"><span className="flex items-center gap-2 text-slate-500"><i className={`h-2.5 w-2.5 rounded-full ${item.tone}`} />{item.name}</span><strong className="text-slate-800">{item.value}</strong></div>)}</div></div><Link href="/admin/content" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#f4f7ff] py-2.5 text-xs font-bold text-[#2457c5] transition hover:bg-blue-50">Gérer le contenu<ArrowUpRight className="h-3.5 w-3.5" /></Link></article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_.8fr]">
        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Performance du contenu</p><h2 className="mt-1 text-base font-extrabold text-slate-900">Vues et articles publiés</h2><p className="mt-1 text-xs text-slate-500">{stats.contentTrends.configured ? 'Vues mesurées par Google Analytics 4' : 'Connecte GA4 pour afficher les vues par période.'}</p></div><div className="flex rounded-lg bg-slate-100 p-1">{(['daily', 'monthly', 'yearly'] as const).map((period) => <button key={period} onClick={() => setTrendPeriod(period)} className={`rounded-md px-3 py-1.5 text-xs font-bold ${trendPeriod === period ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>{period === 'daily' ? 'Jour' : period === 'monthly' ? 'Mois' : 'Année'}</button>)}</div></div>
          <ContentTrendChart period={trendPeriod} trends={stats.contentTrends} />
          <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">28 derniers jours : <b className="text-slate-800">{(stats.contentTrends.currentPeriodViews ?? 0).toLocaleString('fr-FR')} vues</b>{stats.contentTrends.previousPeriodViews !== null && <> · vues vs période précédente : <b className="text-slate-800">{stats.contentTrends.previousPeriodViews.toLocaleString('fr-FR')}</b> ({trendDelta(stats.contentTrends.currentPeriodViews || 0, stats.contentTrends.previousPeriodViews)}%)</>} · Publications : <b className="text-slate-800">{stats.contentTrends.currentPeriodPublications}</b> vs {stats.contentTrends.previousPeriodPublications} précédemment ({trendDelta(stats.contentTrends.currentPeriodPublications, stats.contentTrends.previousPeriodPublications)}%)</p>
        </article>
        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-violet-500">Production IA</p><h2 className="mt-1 text-base font-extrabold text-slate-900">Brouillons de l’IA <span className="text-violet-600">({stats.totalDrafts})</span></h2></div><Link href="/admin/agent" className="text-xs font-bold text-blue-700">Tout gérer →</Link></div><p className="mt-1 text-xs text-slate-500">{stats.approvedDrafts} article(s) généré(s) en attente de publication</p><div className="mt-4 divide-y divide-slate-100">{stats.recentDrafts.length ? stats.recentDrafts.map((draft) => <div key={draft.id} className="flex items-center gap-3 py-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600"><Bot className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-slate-800">{draft.title}</strong><small className="text-[10px] text-slate-400">{draft.status}</small></span><Link href="/admin/agent" className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:border-blue-300 hover:text-blue-700">Réviser / modifier</Link></div>) : <p className="py-6 text-center text-xs text-slate-400">Aucun brouillon IA.</p>}</div></article>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Raccourcis d’administration">
        <QuickCard href="/admin/inbox" title="Messages & newsletter" meta="Consulter les demandes" icon={Inbox} color="from-[#2d7fe0] to-[#2760c6]" />
        <QuickCard href="/admin/agent" title="Agent éditorial" meta={`${stats.approvedDrafts} publication(s) à valider`} icon={Bot} color="from-[#6550c7] to-[#44329f]" />
        <QuickCard href="/admin/tools" title="Outils pratiques" meta={`${stats.totalTools} outils actifs`} icon={Wrench} color="from-[#24a878] to-[#14895f]" />
        <QuickCard href="/admin/guides" title="Guides & ressources" meta="Gérer les téléchargements" icon={BookOpen} color="from-[#ed8848] to-[#db6544]" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_25px_rgba(24,39,75,.035)] sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Publication</p><h2 className="mt-1 text-base font-extrabold text-slate-900">Articles récents</h2></div><Link href="/admin/content" className="text-[11px] font-bold text-blue-700 hover:text-blue-900">Tout voir</Link></div><div className="mt-4 divide-y divide-slate-100">{stats.recentArticles.length ? stats.recentArticles.slice(0, 5).map((article) => <div key={article.id} className="flex items-center gap-3 py-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><FileText className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-slate-800">{article.title}</strong><small className="mt-1 block text-[10px] text-slate-400">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('fr-FR') : 'Date non renseignée'}</small></span><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${article.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{article.status === 'published' ? 'Publié' : article.status}</span></div>) : <p className="py-8 text-center text-xs text-slate-400">Aucun article récent.</p>}</div></article>
        <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_25px_rgba(24,39,75,.035)] sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Centre de suivi</p><h2 className="mt-1 text-base font-extrabold text-slate-900">Notifications</h2></div><span className="relative grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Bell className="h-5 w-5" />{notifications.length > 0 && <i className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}</span></div>{notifications.length ? <div className="mt-4 divide-y divide-slate-100">{notifications.map((notification) => { const Icon = notification.icon; return <Link href={notification.href} key={notification.title} className="flex items-center gap-3 py-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${notification.tone}`}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-slate-800">{notification.title}</strong><small className="mt-1 block truncate text-[10px] text-slate-400">{notification.detail}</small></span><ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300" /></Link>; })}</div> : <div className="mt-4 flex min-h-36 flex-col items-center justify-center rounded-xl bg-emerald-50/60 px-4 text-center"><CheckCircle2 className="mb-2 h-7 w-7 text-emerald-500" /><strong className="text-sm text-slate-700">Tout est à jour</strong><span className="mt-1 text-xs text-slate-400">Aucune notification en attente.</span></div>}<Link href="/admin/inbox" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#f7f8fc] py-2.5 text-xs font-bold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"><Inbox className="h-4 w-4" />Ouvrir la boîte de réception</Link></article>
      </section>

      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_8px_25px_rgba(24,39,75,.035)] sm:flex-row sm:items-center sm:p-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Activity className="h-5 w-5" /></span><span><strong className="block text-sm text-slate-800">Agent éditorial</strong><small className="mt-1 block text-xs text-slate-400">Dernière exécution : {stats.recentRun?.date || 'aucune'} · {stats.recentRun?.status || 'en attente'}</small></span></div><div className="flex flex-wrap gap-2"><Link href="/admin/analytics" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-blue-200 hover:text-blue-700"><BarChart3 className="h-4 w-4" />Voir analytics</Link><Link href="/admin/social" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-blue-200 hover:text-blue-700"><Mail className="h-4 w-4" />Canaux sociaux</Link></div></section>
    </div>
  );
}

function trendDelta(current: number, previous: number) { return previous ? Math.round((current - previous) / previous * 100) : current ? 100 : 0; }

function ContentTrendChart({ period, trends }: { period: 'daily' | 'monthly' | 'yearly'; trends: AdminStats['contentTrends'] }) {
  const viewRows = period === 'daily' ? trends.dailyViews.slice(-14) : period === 'monthly' ? trends.monthlyViews.slice(-12) : trends.yearlyViews.slice(-8);
  const published = period === 'daily' ? trends.publishedByDay : period === 'monthly' ? trends.publishedByMonth : trends.publishedByYear;
  const keys = viewRows.length ? viewRows.map((row) => String(row.date || row.yearMonth || row.year || '')) : Object.keys(published).sort().slice(-(period === 'daily' ? 14 : period === 'monthly' ? 12 : 8));
  const viewsByKey = new Map(viewRows.map((row) => [String(row.date || row.yearMonth || row.year || ''), Number(row.screenPageViews || 0)]));
  const rows = keys.map((raw) => {
    const key = period === 'daily' && raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6)}` : period === 'monthly' && raw.length === 6 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;
    const gaKey = viewRows.length ? raw : period === 'daily' ? key.replace(/-/g, '') : period === 'monthly' ? key.replace('-', '') : key;
    return { key, label: period === 'daily' ? key.slice(5) : period === 'monthly' ? key.slice(2) : key, views: Number(viewsByKey.get(gaKey) || 0), articles: Number(published[key] || 0) };
  });
  const maxViews = Math.max(1, ...rows.map((row) => row.views));
  const maxArticles = Math.max(1, ...rows.map((row) => row.articles));
  return <div className="mt-5 space-y-3">{rows.length ? rows.map((row) => <div key={row.key} className="grid grid-cols-[42px_1fr_82px] items-center gap-3 text-[10px]"><span className="text-slate-400">{row.label}</span><div className="space-y-1"><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${row.views / maxViews * 100}%` }} /></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${row.articles / maxArticles * 100}%` }} /></div></div><span className="text-right text-slate-500">{row.views.toLocaleString('fr-FR')} vues · {row.articles} art.</span></div>) : <p className="grid min-h-32 place-items-center text-xs text-slate-400">{trends.configured ? 'Aucune donnée pour cette période.' : 'Les statistiques des vues apparaîtront après connexion GA4.'}</p>}
    <div className="flex gap-4 border-t border-slate-100 pt-3 text-[10px] text-slate-500"><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-blue-500" />Vues</span><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500" />Articles publiés</span></div>
  </div>;
}

function ArticlesViewsChart({ rows }: { rows: { slug: string; title: string; views: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.views));
  const chart = { left: 44, top: 20, width: 520, height: 150 };
  const group = chart.width / rows.length;
  const barWidth = Math.min(46, group * .52);
  const tick = (value: number) => chart.top + chart.height - value / max * chart.height;
  const shortTitle = (title: string) => title.length > 13 ? `${title.slice(0, 12)}?` : title;
  return <div className="mt-5">
    <div className="mb-2 flex items-center justify-between"><span className="text-[11px] text-slate-500">Consultations par article</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">Top {rows.length}</span></div>
    <div className="overflow-x-auto"><svg viewBox="0 0 590 220" className="h-[210px] min-w-[500px] w-full" role="img" aria-label="Histogramme des articles les plus consult?s">
      {[0, 1, 2, 3].map((step) => { const y = chart.top + step * chart.height / 3; const value = Math.round(max * (1 - step / 3)); return <g key={step}><line x1={chart.left} x2={chart.left + chart.width} y1={y} y2={y} stroke="#e8edf4" /><text x={chart.left - 8} y={y + 3} textAnchor="end" fill="#94a3b8" fontSize="9">{value.toLocaleString('fr-FR')}</text></g>; })}
      {rows.map((article, index) => { const x = chart.left + index * group + (group - barWidth) / 2; const y = tick(article.views); return <a key={article.slug} href={`/blog/${encodeURIComponent(article.slug)}`} target="_blank" rel="noreferrer" className="cursor-pointer"><rect x={x} y={y} width={barWidth} height={chart.top + chart.height - y} rx="4" fill="#3478df"><title>{article.title} ? {article.views.toLocaleString('fr-FR')} vues</title></rect><text x={x + barWidth / 2} y={chart.top + chart.height + 18} textAnchor="middle" fill="#64748b" fontSize="9">{shortTitle(article.title)}</text></a>; })}
    </svg></div>
    <div className="mt-1 flex justify-center text-[11px] text-slate-500"><span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-blue-600" />Vues des articles</span></div>
  </div>;
}

function QuickCard({ href, title, meta, icon: Icon, color }: { href: string; title: string; meta: string; icon: typeof Inbox; color: string }) {
  return <Link href={href} className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-4 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg`}><span className="absolute -right-5 -top-7 h-24 w-24 rounded-full bg-white/10 transition group-hover:scale-125" /><span className="relative flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15"><Icon className="h-[18px] w-[18px]" /></span><ArrowUpRight className="h-4 w-4 text-white/75 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span><strong className="relative mt-5 block text-sm font-extrabold">{title}</strong><span className="relative mt-1 block text-[10px] text-white/75">{meta}</span></Link>;
}
