'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';

type PaymentState = 'PENDING' | 'SUCCESS' | 'FAILED';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const reference = searchParams?.get('tx');
  const [state, setState] = useState<PaymentState>('PENDING');

  useEffect(() => {
    if (!reference) {
      setState('FAILED');
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const checkPayment = async () => {
      try {
        const response = await fetch(`/api/payment/mtn/status?reference=${encodeURIComponent(reference)}`);
        const payload = await response.json();
        if (cancelled) return;

        if (payload.status === 'SUCCESS') {
          setState('SUCCESS');
          return;
        }
        if (payload.status === 'FAILED') {
          setState('FAILED');
          return;
        }
        timer = setTimeout(checkPayment, 3000);
      } catch {
        if (!cancelled) timer = setTimeout(checkPayment, 3000);
      }
    };

    checkPayment();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [reference]);

  const content = {
    PENDING: {
      icon: <Clock3 className="h-10 w-10 text-amber-500" />,
      title: 'Paiement en attente',
      text: 'Valide la demande MTN MoMo sur ton téléphone. Nous vérifions automatiquement le paiement.',
    },
    SUCCESS: {
      icon: <CheckCircle2 className="h-10 w-10 text-emerald-500" />,
      title: 'Paiement confirmé',
      text: 'Ton accès est maintenant disponible.',
    },
    FAILED: {
      icon: <XCircle className="h-10 w-10 text-red-500" />,
      title: 'Paiement introuvable',
      text: 'La transaction n’a pas pu être confirmée. Tu peux réessayer depuis le checkout.',
    },
  }[state];

  return (
    <main className="account-page flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
        <div className="mb-5 flex justify-center">{content.icon}</div>
        <h1 className="text-2xl font-black text-slate-900">{content.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">{content.text}</p>
        <Link href="/compte" className="mt-7 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600">
          Aller à mon compte
        </Link>
      </section>
    </main>
  );
}