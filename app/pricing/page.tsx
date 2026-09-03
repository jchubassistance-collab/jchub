'use client';

import Link from 'next/link';
import { Check, ShieldCheck, Sparkles, ArrowRight, Wallet, Clock3, Star } from 'lucide-react';
import { plans } from '@/lib/pricing';

export default function PricingPage() {
  const featuredPlan = plans.find((plan) => plan.popular) ?? plans[1];

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-orange-100/80 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-orange-700">
              <Sparkles className="h-3.5 w-3.5" />
              Paiement sécurisé
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
              Un plan pour <span className="text-orange-600">chaque rythme</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
              Commence gratuitement, teste à petit prix, puis choisis l’accès qui correspond vraiment à ton apprentissage.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Choisis ton accès</p><h2 className="mt-2 text-2xl font-black text-[#17324d] sm:text-3xl">Simple au départ. Puissant ensuite.</h2></div>
          <p className="max-w-sm text-sm leading-relaxed text-slate-500">Tous les plans incluent les outils gratuits. Change de formule quand tu veux.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const isFeatured = plan.id === featuredPlan.id;

            return (
              <article
                key={plan.id}
                className={`group relative rounded-2xl border p-6 shadow-sm transition-all duration-300 ${
                  isFeatured
                    ? 'border-orange-300 bg-[#17324d] text-white shadow-xl shadow-orange-900/10 ring-2 ring-orange-100'
                    : 'border-slate-200 bg-white hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl'
                }`}
              >
                {plan.saveBadge && <span className={`absolute -top-3 left-5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] shadow-sm ${isFeatured ? 'bg-orange-400 text-[#17324d]' : 'bg-orange-50 text-orange-700'}`}>{plan.saveBadge}</span>}
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className={`text-xl font-black ${isFeatured ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h2>
                </div>

                <div className="mb-4">
                  <div className={`text-4xl font-black tracking-tight ${isFeatured ? 'text-white' : 'text-slate-900'}`}>{plan.priceDisplay}</div>
                  <div className={`mt-1 text-sm ${isFeatured ? 'text-slate-300' : 'text-slate-500'}`}>{plan.period}</div>
                </div>

                <p className={`mb-5 min-h-[52px] text-sm leading-6 ${isFeatured ? 'text-slate-300' : 'text-slate-600'}`}>{plan.description}</p>

                <ul className={`space-y-2.5 text-sm ${isFeatured ? 'text-slate-200' : 'text-slate-700'}`}>
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${isFeatured ? 'bg-emerald-400/20' : 'bg-emerald-100'}`}>
                        <Check className={`h-3.5 w-3.5 shrink-0 ${isFeatured ? 'text-emerald-300' : 'text-emerald-600'}`} />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.ctaLink}
                  className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    plan.id === 'free'
                      ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                      : isFeatured
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/20 hover:bg-orange-400'
                        : 'bg-[#17324d] text-white hover:bg-orange-600'
                  }`}
                >
                  {plan.cta}
                  {plan.id !== 'free' && <ArrowRight className="h-4 w-4" />}
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 border-y border-slate-200 py-8 md:grid-cols-3">
          <div className="p-2">
            <Wallet className="mb-3 h-8 w-8 text-orange-600" />
            <h3 className="text-lg font-bold">Paiement mobile</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">MTN MoMo et Airtel Money, sans étape inutile.</p>
          </div>
          <div className="p-2">
            <ShieldCheck className="mb-3 h-8 w-8 text-orange-600" />
            <h3 className="text-lg font-bold">Transparence</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Tu sais exactement ce que tu paies, pour combien de temps et ce que tu reçois.</p>
          </div>
          <div className="p-2">
            <Clock3 className="mb-3 h-8 w-8 text-orange-600" />
            <h3 className="text-lg font-bold">Activation rapide</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Le paiement est validé rapidement et l’accès est activé immédiatement.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-[#f7f8fa] px-6 py-4">
            <h2 className="text-xl font-black">Comparatif rapide</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f7f8fa] text-slate-700">
                <tr>
                  <th className="px-6 py-3 font-semibold">Fonctionnalités</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="px-4 py-3 font-semibold text-center">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Outils gratuits', true, true, true, true, true],
                  ['Ressources premium', false, true, true, true, true],
                  ['Assistant IA', false, true, true, true, true],
                  ['Support prioritaire', false, false, true, true, true],
                  ['Accès anticipé', false, false, false, true, true],
                ].map((row, index) => (
                  <tr key={index} className="border-t border-slate-200">
                    <td className="px-6 py-3 font-medium text-slate-700">{row[0]}</td>
                    {row.slice(1).map((value, valueIndex) => (
                      <td key={valueIndex} className="px-4 py-3 text-center">
                        {value === true ? (
                          <Check className="mx-auto h-4 w-4 text-emerald-500" />
                        ) : value === false ? (
                          <span className="text-slate-300">—</span>
                        ) : (
                          <span>{value}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800">
            <Star className="h-4 w-4 text-orange-600" />
            7 jours satisfait ou remboursé
          </div>
          <p className="mt-4 text-slate-600">
            Une question avant de payer ? <a href="mailto:hello@jchub.dev" className="font-semibold text-orange-600 underline">hello@jchub.dev</a>
          </p>
        </div>
      </section>
    </div>
  );
}
