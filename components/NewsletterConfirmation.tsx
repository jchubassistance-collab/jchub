'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import { LOCALE_HEADER } from '@/i18n/request-locale';

const copy = bilingual({
  confirm: 'Confirmer mon inscription',
  done: 'C’est fait : ton inscription est confirmée. Un e-mail de bienvenue arrive dans ta boîte.',
  failed: 'Impossible de confirmer ton inscription pour le moment.',
  missing: 'Ce lien est incomplet. Ouvre le lien reçu par e-mail, ou inscris-toi à nouveau depuis le site.',
}, {
  confirm: 'Confirm my subscription',
  done: 'Done: your subscription is confirmed. A welcome email is on its way to your inbox.',
  failed: 'We can’t confirm your subscription right now.',
  missing: 'This link is incomplete. Open the link from the email, or subscribe again from the site.',
});

/** The button posts the token: mail scanners that open the link do not confirm anything. */
export function NewsletterConfirmation({ token }: { token: string }) {
  const locale = useLocale();
  const t = copy[locale];
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  if (!token) return <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{t.missing}</p>;
  if (state === 'done') return <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800" role="status"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />{t.done}</p>;

  const confirm = async () => {
    setState('loading');
    setError('');
    try {
      const response = await fetch('/api/newsletter/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json', [LOCALE_HEADER]: locale }, body: JSON.stringify({ token }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || t.failed);
      setState('done');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.failed);
      setState('error');
    }
  };

  return (
    <div className="space-y-3">
      <button type="button" onClick={confirm} disabled={state === 'loading'} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60">
        {state === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : <MailCheck className="h-5 w-5" />}
        {t.confirm}
      </button>
      {state === 'error' && <p className="text-sm text-red-700" role="alert">{error}</p>}
    </div>
  );
}
