'use client';

import Link from 'next/link';
import { ArrowRight, Check, CreditCard, Sparkles } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { formatXAF, plans } from '@/lib/pricing';

export default function SubscriptionPage() {
  return (
    <DashboardShell>
      {(user) => {
        const subscription = user.subscription;
        const activePlan = plans.find((plan) => plan.id === subscription?.tier) ?? plans[0];
        const isPremium = subscription?.status === 'active' && subscription.tier !== 'free';
        return (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-[#17324d] to-orange-600 p-6 text-white shadow-[0_25px_70px_rgba(23,50,77,0.2)] sm:p-8">
              <div className="relative z-10"><p className="text-xs font-black uppercase tracking-[0.18em] text-orange-200">Gestion du compte</p><h1 className="mt-2 text-3xl font-black">Mon abonnement</h1><p className="mt-2 max-w-xl text-sm text-slate-200">Gère ton accès aux ressources premium JcHub.</p></div>
            </div>
            <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">Plan actuel</p><h2 className="mt-2 text-2xl font-black text-slate-900">{activePlan.name}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-black ${isPremium ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{isPremium ? 'Actif' : 'Plan gratuit'}</span></div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4"><CreditCard className="h-5 w-5 text-orange-600" /><p className="mt-3 text-xs text-slate-500">Tarif</p><p className="mt-1 font-black text-slate-900">{formatXAF(activePlan.priceXAF)}</p></div><div className="rounded-2xl bg-slate-50 p-4"><Sparkles className="h-5 w-5 text-teal-600" /><p className="mt-3 text-xs text-slate-500">Période</p><p className="mt-1 font-black text-slate-900">{activePlan.period}</p></div><div className="rounded-2xl bg-slate-50 p-4"><Check className="h-5 w-5 text-emerald-600" /><p className="mt-3 text-xs text-slate-500">Accès</p><p className="mt-1 font-black text-slate-900">{isPremium ? 'Premium' : 'Essentiel'}</p></div></div>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">{activePlan.features.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm text-slate-600"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{feature}</li>)}</ul>
            </section>
            <section className="rounded-[24px] border border-orange-100 bg-orange-50/70 p-6 sm:p-8"><h2 className="text-xl font-black text-slate-900">Changer de formule</h2><p className="mt-2 text-sm text-slate-600">Choisis l’accès qui correspond à ton rythme.</p><div className="mt-5 flex flex-wrap gap-3">{plans.filter((plan) => plan.id !== 'free' && plan.id !== subscription?.tier).slice(0, 3).map((plan) => <Link key={plan.id} href={plan.ctaLink} className="inline-flex items-center gap-2 rounded-xl bg-[#17324d] px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-orange-600">{plan.name}<ArrowRight className="h-4 w-4" /></Link>)}</div></section>
          </div>
        );
      }}
    </DashboardShell>
  );
}
