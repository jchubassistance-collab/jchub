'use client';

import Link from 'next/link';
import { BookOpen, Headphones, TrendingUp, Sparkles, ArrowRight, Heart, Clock, Download } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { formatXAF } from '@/lib/pricing';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/books')
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setRecommendations(data?.books?.slice(0, 4) ?? []))
      .catch(() => setRecommendations([]));
  }, []);

  return (
    <DashboardShell>
      {(user) => (
        <div className="space-y-6">
          <div className="account-dashboard-hero relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#1a2d3d] via-[#17324d] to-[#f97316] p-6 text-white shadow-[0_25px_70px_rgba(23,50,77,0.18)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_35%)]" />
            <div className="relative">
              <h1 className="text-2xl font-black md:text-3xl">Bienvenue, {user.displayName?.split(' ')[0]} 👋</h1>
              <p className="mt-2 max-w-xl text-sm text-slate-200 md:text-base">Prêt à continuer ton apprentissage aujourd'hui ?</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/livres" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#17324d] transition hover:-translate-y-0.5 hover:shadow-lg">
                  <BookOpen className="h-4 w-4" />
                  Explorer les livres
                </Link>
                <Link href="/outils" className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20">
                  <Sparkles className="h-4 w-4" />
                  Découvrir les outils
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Livres achetés', value: '0', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
              { label: 'Outils utilisés', value: '0', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
              { label: 'Heures écoutées', value: '0h', icon: Headphones, color: 'from-emerald-500 to-teal-500' },
              { label: 'Streak', value: '0 j', icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
            ].map((s) => (
              <div key={s.label} className="account-stat-card rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} shadow-md`}>
                  <s.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-2xl font-black text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>

          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
              <Clock className="h-5 w-5 text-orange-600" />
              Continue ton apprentissage
            </h2>
            <div className="py-8 text-center text-slate-500">
              <BookOpen className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p className="mb-4">Tu n&apos;as pas encore commencé d&apos;apprentissage</p>
              <Link href="/livres" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#17324d] to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5">
                Commencer maintenant
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
              <Sparkles className="h-5 w-5 text-orange-600" />
              Recommandés pour toi
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {recommendations.map((book) => (
                <Link key={book.slug} href={`/livres/${book.slug}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${book.pricing === 'free' ? 'from-emerald-400 to-teal-500' : 'from-rose-400 to-pink-500'} text-2xl`}>
                    📚
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-slate-900">{book.title}</h3>
                    <p className="text-xs text-slate-500">{book.author}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{book.estimatedAudioHours}h audio</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { title: 'Mon abonnement', desc: user.subscription?.status === 'active' && user.subscription.tier !== 'free' ? `Actif (${user.subscription.tier})` : 'Plan gratuit', icon: Sparkles, href: '/compte/abonnement', color: 'from-amber-500 to-orange-500' },
              { title: 'Ma bibliothèque', desc: 'Mes livres achetés', icon: BookOpen, href: '/compte/bibliotheque', color: 'from-blue-500 to-cyan-500' },
              { title: 'Mes favoris', desc: 'Outils et livres sauvegardés', icon: Heart, href: '/compte/favoris', color: 'from-pink-500 to-rose-500' },
            ].map((card) => (
              <Link key={card.title} href={card.href} className="group rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-[0_16px_35px_rgba(15,23,42,0.08)]">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} transition group-hover:scale-110`}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
                <div className="mb-1 text-base font-bold text-slate-900">{card.title}</div>
                <div className="text-xs text-slate-500">{card.desc}</div>
                <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-orange-600">
                  Ouvrir
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
