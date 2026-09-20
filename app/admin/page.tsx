'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { reportUserError } from '@/lib/user-error';

import {
  Users,
  FileText,
  Wrench,
  TrendingUp,
  Activity,
  AlertCircle,
  Bot,
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Eye,
  MousePointerClick,
  UserPlus,
} from 'lucide-react';

import Link from 'next/link';

type AdminStats = {
  totalUsers: number;
  totalArticles: number;
  totalDrafts: number;
  approvedDrafts: number;
  totalTools: number;
  totalArticleViews: number;
  articleViews: { slug: string; title: string; views: number }[];
  recentArticles: { id: string; title: string; status: string; publishedAt: string | null }[];
  recentRun: { date: string; status: string; createdAt: string | null } | null;
  recentUsers: {
    uid: string;
    email: string;
    createdAt: string | null;
  }[];
};

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const response = await fetch('/api/admin/stats', { credentials: 'include', cache: 'no-store' });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          router.replace('/admin/login');
          return;
        }
        if (cancelled) return;
        setIsAdmin(true);
        setStats(data as AdminStats);
      } catch (error) {
        reportUserError();
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // ================================================================
  // CHARGEMENT
  // ================================================================

  // ================================================================
  // ACCÈS REFUSÉ
  // ================================================================

  if (!loading && !isAdmin) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />

          <h1 className="text-2xl font-black mb-2">
            Accès refusé
          </h1>

          <p className="text-gray-600 mb-4">
            Tu n&apos;as pas les droits pour accéder à cette page.
          </p>

          <Link
            href="/"
            className="text-brand-600 hover:underline"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  // ================================================================
  // DASHBOARD
  // ================================================================

  return (
    <div className="mx-auto max-w-[1500px] space-y-4">

        {/* En-tête */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Vue d&apos;ensemble · JcHub</p><h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">Analytics Dashboard</h1><p className="mt-1 text-sm text-slate-500">Suivi de l&apos;activité et de la croissance de la plateforme</p></div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm"><CalendarDays className="h-4 w-4 text-[#315de2]" />Jan 2026 - Déc 2026<ChevronDown className="h-3.5 w-3.5" /></button>
            <Link href="/admin/agent" className="inline-flex items-center gap-2 rounded-lg bg-[#315de2] px-4 py-2 text-sm font-bold text-white shadow-sm"><Bot className="h-4 w-4" />Agent éditorial</Link>
          </div>
        </div>

        {/* Erreur de chargement des statistiques */}
        {!stats && !loading && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500" />

              <div>
                <div className="font-bold text-red-700">
                  Impossible de charger les statistiques
                </div>

                <p className="text-sm text-red-600">
                  Vérifie la session administrateur et recharge la page.
                </p>
              </div>
            </div>
          </div>
        )}

        {stats && (
          <>
            {/* Statistiques principales */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
              {[
                {
                  label: 'Total utilisateurs',
                  value: stats.totalUsers,
                  icon: Users,
                  color: 'bg-[#4b35e8]',
                },
                { label: 'Articles publiés', value: stats.totalArticles, icon: FileText, color: 'bg-[#11a873]' },
                { label: 'Brouillons IA', value: stats.totalDrafts, icon: Bot, color: 'bg-[#f58b17]' },
                { label: 'À valider', value: stats.approvedDrafts, icon: Activity, color: 'bg-[#ed3b8f]' },
                { label: 'Outils actifs', value: stats.totalTools, icon: Wrench, color: 'bg-[#08a8a7]' },
                { label: 'Vues des articles', value: stats.totalArticleViews, icon: Eye, color: 'bg-[#e83d5b]' },
              ].map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-[0_5px_18px_rgba(15,23,42,0.05)]"
                  >
                    <div
                      className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${stat.color} shadow-md`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    <div className="text-2xl font-black text-slate-900">
                      {stat.value}
                    </div>

                    <div className="text-xs text-slate-500">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.35fr_.9fr_1fr]">
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_5px_18px_rgba(15,23,42,0.05)]">
                <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Activité de la plateforme</p><h2 className="mt-1 text-lg font-black text-slate-900">Utilisateurs au fil du temps</h2></div><button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Options du graphique"><Activity className="h-4 w-4" /></button></div>
                <div className="relative mt-5 h-52 overflow-hidden rounded-lg bg-slate-50/70 px-2 pt-4">
                  <div className="absolute inset-x-2 top-8 border-t border-dashed border-slate-200" /><div className="absolute inset-x-2 top-1/2 border-t border-dashed border-slate-200" /><div className="absolute inset-x-2 bottom-8 border-t border-dashed border-slate-200" />
                  <svg viewBox="0 0 600 180" preserveAspectRatio="none" className="relative h-full w-full" role="img" aria-label="Évolution des utilisateurs"><defs><linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#5877e8" stopOpacity=".24" /><stop offset="1" stopColor="#5877e8" stopOpacity="0" /></linearGradient></defs><polygon points="0,164 0,145 55,139 110,143 165,119 220,126 275,98 330,108 385,82 440,89 495,70 550,74 600,38 600,164" fill="url(#area-fill)" /><polyline points="0,145 55,139 110,143 165,119 220,126 275,98 330,108 385,82 440,89 495,70 550,74 600,38" fill="none" stroke="#4b62c7" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg>
                  <div className="absolute inset-x-2 bottom-1 flex justify-between text-[10px] text-slate-400"><span>Jan</span><span>Mar</span><span>Mai</span><span>Juil</span><span>Sept</span><span>Déc</span></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-5 text-xs text-slate-500"><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#4b62c7]" />Utilisateurs {stats.totalUsers.toLocaleString('fr-FR')}</span><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#f59e0b]" />+12,4% ce mois</span></div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_5px_18px_rgba(15,23,42,0.05)]"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Répartition</p><h2 className="mt-1 text-lg font-black text-slate-900">Contenus JcHub</h2><div className="mt-5 flex items-center gap-5"><div className="grid h-32 w-32 shrink-0 place-items-center rounded-full" style={{ background: 'conic-gradient(#4b62c7 0 42%, #18a874 42% 72%, #f59e0b 72% 100%)' }}><div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center"><strong className="text-xl text-slate-900">{stats.totalArticles + stats.totalTools}</strong><span className="text-[10px] text-slate-400">total</span></div></div><div className="space-y-3 text-xs text-slate-500"><p><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#4b62c7]" />Articles <strong className="text-slate-800">{stats.totalArticles}</strong></p><p><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#18a874]" />Outils <strong className="text-slate-800">{stats.totalTools}</strong></p><p><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />Brouillons <strong className="text-slate-800">{stats.totalDrafts}</strong></p></div></div></section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_5px_18px_rgba(15,23,42,0.05)]"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Performance</p><h2 className="mt-1 text-lg font-black text-slate-900">Articles les plus vus</h2></div><MousePointerClick className="h-5 w-5 text-[#315de2]" /></div><div className="mt-5 space-y-4">{stats.articleViews.slice(0, 4).map((article, index) => { const maxViews = Math.max(stats.articleViews[0]?.views || 1, 1); return <div key={article.slug}><div className="mb-1 flex justify-between gap-2 text-xs"><span className="max-w-[75%] truncate font-medium text-slate-600">{article.title}</span><strong className="text-slate-900">{article.views.toLocaleString('fr-FR')}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${Math.max(6, (article.views / maxViews) * 100)}%`, backgroundColor: ['#4b62c7', '#18a874', '#f59e0b', '#e83d8f'][index] }} /></div></div>; })}</div></section>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_5px_18px_rgba(15,23,42,0.05)]">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Audience du blog</p><h2 className="mt-1 text-lg font-black text-slate-900">Vues par article</h2></div><Link href="/admin/analytics" className="text-xs font-bold text-[#2d67f6]">Voir les analytics</Link></div>
              <div className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2">{stats.articleViews.length ? stats.articleViews.map((article, index) => <div key={article.slug} className="flex items-center gap-3 border-b border-slate-100 pb-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-100 text-xs font-black text-slate-500">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{article.title}</span><strong className="shrink-0 text-sm text-slate-950">{article.views.toLocaleString('fr-FR')}</strong></div>) : <p className="text-sm text-slate-500">Aucune vue enregistrée pour le moment.</p>}</div>
            </section>

            <div className="mb-6 grid gap-4 xl:grid-cols-[1.35fr_.8fr_1fr]">
              <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Activité</p><h2 className="mt-1 text-lg font-black text-slate-900">Production de contenu</h2></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Ce mois</span></div>
                <div className="mt-5 flex h-36 items-end gap-2 border-b border-slate-100 px-2">
                  {[34, 52, 43, 68, 58, 76, 63, 91, 70, 84, 78, 100].map((height, index) => <div key={index} className="group flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-md bg-gradient-to-t from-[#2d67f6] to-[#72a2ff] transition group-hover:from-[#11a873] group-hover:to-[#5ee0af]" style={{ height: `${height}%` }} /><span className="text-[10px] text-slate-400">{index + 1}</span></div>)}
                </div>
                <div className="mt-4 flex items-center gap-5 text-xs text-slate-500"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#2d67f6]" />Articles {stats.totalArticles}</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#11a873]" />Outils {stats.totalTools}</span></div>
              </section>
              <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Répartition</p><h2 className="mt-1 text-lg font-black text-slate-900">Catalogue JcHub</h2><div className="mt-5 flex items-center gap-5"><div className="grid h-32 w-32 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#f59e0b 0 42%, #2d67f6 42% 75%, #11a873 75% 100%)` }}><div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center"><strong className="text-xl text-slate-900">{stats.totalArticles + stats.totalTools}</strong><span className="text-[10px] text-slate-400">éléments</span></div></div><div className="space-y-3 text-xs text-slate-500"><p><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />Articles</p><p><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />Outils</p><p><i className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />Brouillons</p></div></div></section>
              <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Collecte</p><h2 className="mt-1 text-lg font-black text-slate-900">État de l&apos;agent</h2></div><Bot className="h-5 w-5 text-[#2d67f6]" /></div><div className="mt-5 space-y-4"><div className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><span className="text-sm text-slate-500">Dernière exécution</span><strong className="text-sm text-slate-900">{stats.recentRun?.date || 'En attente'}</strong></div><div><div className="mb-2 flex justify-between text-xs font-semibold text-slate-500"><span>Brouillons à valider</span><span>{stats.approvedDrafts}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#f58b17]" style={{ width: `${Math.min(100, stats.approvedDrafts * 15)}%` }} /></div></div><Link href="/admin/agent" className="inline-flex w-full items-center justify-center rounded-lg bg-[#07142b] px-4 py-2.5 text-sm font-bold text-white">Gérer les publications</Link></div></section>
            </div>

            {/* Actions administrateur */}
            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-6">

              <Link
                href="/admin/users"
                className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <Users className="w-6 h-6 text-brand-600 mb-2 group-hover:scale-110 transition" />

                <div className="font-bold">
                  Utilisateurs
                </div>

                <div className="text-xs text-gray-500">
                  Voir, modifier, supprimer
                </div>
              </Link>

              <Link
                href="/admin/tools"
                className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <Wrench className="w-6 h-6 text-brand-600 mb-2 group-hover:scale-110 transition" />

                <div className="font-bold">
                  Outils
                </div>

                <div className="text-xs text-gray-500">
                  Activer, désactiver
                </div>
              </Link>

              <Link
                href="/admin/guides"
                className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <BookOpen className="mb-2 h-6 w-6 text-brand-600 transition group-hover:scale-110" />
                <div className="font-bold">Guides</div>
                <div className="text-xs text-gray-500">Tester les téléchargements</div>
              </Link>

              <Link href="/admin/content" className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <FileText className="w-6 h-6 text-brand-600 mb-2 group-hover:scale-110 transition" />
                <div className="font-bold">Contenu</div><div className="text-xs text-gray-500">Articles et diffusion</div>
              </Link>
              <Link href="/admin/analytics" className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <BarChart3 className="w-6 h-6 text-brand-600 mb-2 group-hover:scale-110 transition" />
                <div className="font-bold">Analytics</div><div className="text-xs text-gray-500">Vues et trafic</div>
              </Link>
              <Link href="/admin/agent" className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <Bot className="w-6 h-6 text-brand-600 mb-2 group-hover:scale-110 transition" />
                <div className="font-bold">Agent éditorial</div><div className="text-xs text-gray-500">Générer et valider</div>
              </Link>

            </div>

            <div className="mb-8 grid gap-6 lg:grid-cols-2">
              <section className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black flex items-center gap-2"><FileText className="w-5 h-5 text-brand-600" />Articles récents</h2><Link href="/admin/content" className="text-xs font-bold text-brand-600">Tout voir</Link></div>
                <div className="mt-4 space-y-3">{stats.recentArticles.length ? stats.recentArticles.map((article) => <div key={article.id} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3 text-sm"><span className="truncate font-medium">{article.title}</span><span className="shrink-0 text-xs text-gray-500">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('fr-FR') : '-'}</span></div>) : <p className="py-5 text-sm text-gray-500">Aucun article publié.</p>}</div>
              </section>
              <section className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="text-xl font-black flex items-center gap-2"><Bot className="w-5 h-5 text-brand-600" />État de l’agent</h2>
                <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-sm text-gray-600">Dernière exécution</p><p className="mt-1 text-lg font-bold">{stats.recentRun?.date || 'Aucune exécution'}</p><p className="mt-2 text-xs uppercase tracking-wider text-gray-500">{stats.recentRun?.status || 'En attente'} · {stats.approvedDrafts} brouillon(s) à publier</p></div>
                <Link href="/admin/agent" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Ouvrir l’agent</Link>
              </section>
            </div>

            {/* Derniers utilisateurs */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6">

              <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-600" />
                Derniers inscrits
              </h2>

              {stats.recentUsers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Aucun utilisateur pour l&apos;instant
                </p>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full text-sm">

                    <thead className="text-left text-xs text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="pb-2 font-semibold">
                          Email
                        </th>

                        <th className="pb-2 font-semibold">
                          Date
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {stats.recentUsers.map((user) => (
                        <tr
                          key={user.uid}
                          className="border-b border-gray-100"
                        >
                          <td className="py-2.5 font-medium">
                            {user.email}
                          </td>

                          <td className="py-2.5 text-gray-500">
                            {user.createdAt
                              ? new Date(
                                  user.createdAt
                                ).toLocaleDateString('fr-FR')
                              : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                  </table>

                </div>
              )}

            </section>
          </>
        )}

      </div>
  );
}