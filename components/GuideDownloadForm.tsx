'use client';

import { FormEvent, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Download, Loader2, Mail, X } from 'lucide-react';
import { trackEvent } from '@/lib/analytics-client';
import { TurnstileWidget } from '@/components/TurnstileWidget';

type Props = {
  guideSlug: string;
};

export function GuideDownloadForm({ guideSlug }: Props) {
  const [email, setEmail] = useState('');
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('loading');
    setMessage('');

    try {
      const response = await fetch('/api/guides/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guideSlug, email, newsletterOptIn, turnstileToken }),
      });
      const data = await response.json().catch(() => ({ error: '' })) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Envoi indisponible.');

      setState('success');
      trackEvent('guide_download', { guide: guideSlug, method: 'email' });
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Une erreur est survenue.');
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> Vérifie ta boîte mail : le lien de téléchargement vient d’être envoyé.
        </div>
      </div>
    );
  }

  return (
    <>
      <button type="button" onClick={() => { setState('idle'); setMessage(''); setIsOpen(true); }} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 shadow-[0_10px_25px_rgba(103,232,249,.14)] transition hover:-translate-y-0.5 hover:bg-cyan-200 hover:shadow-[0_14px_30px_rgba(103,232,249,.2)]">
        <Download className="h-4 w-4" /> Télécharger gratuitement
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/75 px-4 backdrop-blur-sm" role="presentation" onMouseDown={() => setIsOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby={`guide-download-title-${guideSlug}`} className="w-full max-w-sm overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#0b1a2d] shadow-[0_25px_80px_rgba(0,0,0,.55)]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.2),transparent_45%),linear-gradient(135deg,#102b43,#0b1a2d)] px-5 pb-4 pt-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-300/15 text-cyan-200"><Download className="h-4 w-4" /></div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-300">Accès gratuit</p>
                    <h2 id={`guide-download-title-${guideSlug}`} className="mt-1 text-xl font-black text-white">Recevoir le guide</h2>
                  </div>
                </div>
                <button type="button" onClick={() => setIsOpen(false)} aria-label="Fermer" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <p className="mt-3 text-sm leading-5 text-slate-300">Saisis ton adresse e-mail pour débloquer le téléchargement.</p>
            </div>

            <form noValidate onSubmit={submit} className="space-y-3 px-5 py-5">
              <label className="relative block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[.14em] text-slate-400">Adresse e-mail</span>
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  autoFocus
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ton@email.com"
                  className="w-full rounded-xl border border-white/15 bg-white/[.07] py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-500 transition focus:border-cyan-300 focus:bg-white/10 focus:ring-4 focus:ring-cyan-300/10"
                />
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[.03] p-3 text-xs leading-5 text-slate-400 transition hover:border-cyan-300/30 hover:bg-white/[.05]">
                <input type="checkbox" checked={newsletterOptIn} onChange={(event) => setNewsletterOptIn(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-cyan-400" />
                <span>Je souhaite recevoir les nouveaux guides et ressources par e-mail. Désinscription possible à tout moment.</span>
              </label>
              <TurnstileWidget onToken={setTurnstileToken} />
              <button type="submit" disabled={state === 'loading'} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 shadow-[0_10px_25px_rgba(103,232,249,.14)] transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60">
                {state === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-4 w-4" />}
                Confirmer le téléchargement
              </button>
              {state === 'error' && <p className="text-sm text-red-200" role="alert">{message}</p>}
            </form>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
