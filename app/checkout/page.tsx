'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Check, Clock3, Lock, Sparkles } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { plans, formatXAF } from '@/lib/pricing';

const phoneRegex = /^242[0-9]{9}$/;

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const initialPlanId = searchParams?.get('plan') ?? 'monthly';

  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const paymentMethod = 'MTN_MOMO' as const;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedPlanId(initialPlanId);
  }, [initialPlanId]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? plans.find((plan) => plan.id === 'monthly')!,
    [selectedPlanId]
  );

  const handleSubmit = async () => {
    setError('');

    if (!name.trim() || !email.trim()) {
      setError('Remplis ton nom et ton adresse e-mail.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('L’adresse e-mail est invalide.');
      return;
    }

    const normalizedPhone = phone.replace(/\s+/g, '');
    if (!phoneRegex.test(normalizedPhone)) {
      setError('Numéro Congo invalide. Format attendu : 242XXXXXXXX');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('Tu dois être connecté avant de payer. Crée un compte ou connecte-toi.');
      return;
    }

    setLoading(true);

    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          plan: selectedPlan.id,
          paymentMethod,
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: normalizedPhone || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Une erreur est survenue lors du paiement.');
        return;
      }

      window.location.href = payload.paymentUrl;
    } catch (exception: any) {
      setError(exception?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-page min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/pricing" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-orange-600">
          <ArrowLeft className="h-4 w-4" />
          Retour aux plans
        </Link>

        <div className="account-shell grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-slate-200/80 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-600">Checkout</p>
                <h1 className="text-3xl font-black text-slate-900">Finalise ton abonnement</h1>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">Plan sélectionné</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {plans.filter((plan) => plan.id !== 'free').map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`rounded-2xl border p-3 text-left transition-all ${
                        selectedPlanId === plan.id
                          ? 'border-orange-300 bg-orange-50 ring-2 ring-orange-200 shadow-[0_12px_30px_rgba(249,115,22,0.12)]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-base font-bold text-slate-900">{plan.name}</span>
                        {plan.popular && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-orange-700">Pop</span>}
                      </div>
                      <div className="mt-2 text-xl font-black text-slate-900">{plan.priceDisplay}</div>
                      <div className="text-xs text-slate-500">{plan.period}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Nom complet</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    placeholder="Jessy Ngnambongo"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Adresse e-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    placeholder="jean@email.com"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Numéro MTN MoMo</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    placeholder="242XXXXXXXX"
                  />
                  <p className="mt-2 text-xs text-slate-500">Format : 242XXXXXXXX</p>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">Méthode de paiement</label>
                <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-3">
                  <div className="text-sm font-bold text-yellow-700">MTN MoMo</div>
                  <div className="text-xs text-slate-500">Paiement mobile</div>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-orange-600 px-4 py-3.5 text-base font-bold text-white shadow-[0_16px_30px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_35px_rgba(249,115,22,0.18)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Traitement en cours...' : `Payer ${formatXAF(selectedPlan.priceXAF)}`}
              </button>
            </div>
          </section>

          <aside className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900 p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.35)] sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.32),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(20,184,166,0.22),_transparent_35%)]" />
            <div className="relative">
              <div className="mb-5 flex items-center justify-between gap-2">
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200">
                  Résumé
                </span>
                <div className="flex items-center gap-1 text-amber-300">
                  <Clock3 className="h-4 w-4" />
                  <span className="text-xs font-semibold">Validation rapide</span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-300">Plan sélectionné</p>
                    <h2 className="mt-1 text-2xl font-black text-white">{selectedPlan.name}</h2>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300">
                    {selectedPlan.period}
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <span>Prix</span>
                    <span className="font-semibold text-white">{formatXAF(selectedPlan.priceXAF)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Mode</span>
                    <span className="font-semibold text-white">MTN MoMo</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Accès</span>
                    <span className="font-semibold text-white">Illimité</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200 backdrop-blur-sm">
                <div className="flex items-center gap-2 font-semibold">
                  <Lock className="h-4 w-4" />
                  Paiement sécurisé
                </div>
                <p className="mt-2 text-emerald-100/90">
                  Tu recevras une confirmation sur ton téléphone puis le paiement sera vérifié automatiquement.
                </p>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                {selectedPlan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
