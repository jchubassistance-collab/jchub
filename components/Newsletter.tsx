'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';
import { trackEvent } from '@/lib/analytics-client';
import { TurnstileWidget } from '@/components/TurnstileWidget';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState('loading');
    setError('');
    setWarning('');
    try {
      const response = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, turnstileToken }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setWarning(data.warning || '');
      setState('success');
      trackEvent('newsletter_signup', { method: 'website' });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Une erreur est survenue.');
      setState('error');
    }
  };

  if (state === 'success') return <div className="space-y-2"><div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white"><CheckCircle2 className="h-5 w-5" /> Merci, ton inscription est confirmée.</div>{warning && <p className="text-center text-xs text-amber-200" role="status">{warning}</p>}</div>;

  return <form onSubmit={submit} className="mx-auto mt-7 flex max-w-lg flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ton@email.com" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-slate-900 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" /></label><TurnstileWidget onToken={setTurnstileToken} /><button disabled={state === 'loading'} className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-400 disabled:opacity-60">{state === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'S’inscrire'}</button>{state === 'error' && <p className="text-sm text-red-200 sm:absolute">{error}</p>}</form>;
}
