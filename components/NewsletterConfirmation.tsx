'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import { LOCALE_HEADER } from '@/i18n/request-locale';

const copy = bilingual({
  home: 'Accueil JcHub',
  idleTitle: 'Plus qu’un clic',
  idleText: 'Confirme ton adresse pour recevoir les nouveaux outils et articles de JcHub par e-mail. Tu pourras te désinscrire à tout moment.',
  doneTitle: 'Bienvenue à bord',
  doneText: 'Ton inscription est confirmée. Un e-mail de bienvenue arrive dans ta boîte.',
  missingTitle: 'Lien incomplet',
  missingText: 'Ouvre le lien reçu par e-mail, ou inscris-toi à nouveau depuis le site.',
  later: 'Plus tard',
  confirm: 'Confirmer mon inscription',
  tools: 'Découvrir les outils',
  blog: 'Lire le blog',
  backHome: 'Retour à l’accueil',
  failed: 'Impossible de confirmer ton inscription pour le moment.',
}, {
  home: 'JcHub home',
  idleTitle: 'One click to go',
  idleText: 'Confirm your address to get JcHub’s new tools and articles by email. You can unsubscribe at any time.',
  doneTitle: 'Welcome aboard',
  doneText: 'Your subscription is confirmed. A welcome email is on its way to your inbox.',
  missingTitle: 'Incomplete link',
  missingText: 'Open the link from the email, or subscribe again from the site.',
  later: 'Not now',
  confirm: 'Confirm my subscription',
  tools: 'Discover the tools',
  blog: 'Read the blog',
  backHome: 'Back to home',
  failed: 'We can’t confirm your subscription right now.',
});

/** Confetti around the envelope: [left %, top %, shape, color, delay s]. */
const CONFETTI: [number, number, 'ring' | 'star' | 'wave' | 'plus' | 'dots', string, number][] = [
  [8, 62, 'star', '#fbbf24', 0], [14, 30, 'ring', '#f9a8d4', 0.6], [22, 10, 'wave', '#5eead4', 1.2],
  [28, 70, 'dots', '#c4b5fd', 0.3], [40, 4, 'ring', '#93c5fd', 0.9], [62, 2, 'wave', '#5eead4', 0.4],
  [74, 14, 'plus', '#86efac', 1.1], [86, 6, 'dots', '#c4b5fd', 0.2], [90, 40, 'wave', '#5eead4', 0.8],
  [80, 66, 'ring', '#f9a8d4', 1.4], [92, 76, 'star', '#fbbf24', 0.5], [6, 86, 'plus', '#86efac', 1],
  [34, 92, 'plus', '#93c5fd', 0.7], [68, 90, 'ring', '#fbbf24', 0.1],
];

/** Server and browser can differ in the last digits of Math.cos: rounded, both render the same markup. */
const round = (value: number) => Math.round(value * 100) / 100;

function Confetto({ shape, color }: { shape: (typeof CONFETTI)[number][2]; color: string }) {
  switch (shape) {
    case 'ring': return <svg viewBox="0 0 20 20" className="h-5 w-5"><circle cx="10" cy="10" r="6.5" fill="none" stroke={color} strokeWidth="3.5" /></svg>;
    case 'star': return <svg viewBox="0 0 24 24" className="h-6 w-6"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z" fill={color} strokeLinejoin="round" stroke={color} strokeWidth="1.5" /></svg>;
    case 'wave': return <svg viewBox="0 0 28 14" className="h-3.5 w-7"><path d="M2 10c3-6 5-6 8 0s5 6 8 0 5-6 8 0" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" /></svg>;
    case 'plus': return <svg viewBox="0 0 20 20" className="h-5 w-5"><path d="M10 3v14M3 10h14" stroke={color} strokeWidth="3.5" strokeLinecap="round" /></svg>;
    case 'dots': return <svg viewBox="0 0 24 24" className="h-6 w-6">{Array.from({ length: 10 }, (_, index) => { const angle = (index / 10) * Math.PI * 2; return <circle key={index} cx={round(12 + Math.cos(angle) * 8)} cy={round(12 + Math.sin(angle) * 8)} r="1.8" fill={color} />; })}</svg>;
  }
}

/** The letter leaves the envelope once the subscription is confirmed. */
function Envelope({ opened }: { opened: boolean }) {
  return (
    <svg viewBox="0 0 220 190" className="h-auto w-52 drop-shadow-[0_18px_30px_rgba(3,105,251,.25)] sm:w-60" aria-hidden="true">
      {/* Open top flap, behind the letter */}
      <path d="M20 80 L110 18 L200 80 Z" fill="#1e4fd6" />
      <path d="M20 80 h180 v86 a14 14 0 0 1 -14 14 h-152 a14 14 0 0 1 -14 -14 z" fill="#1d4ed8" />
      {/* Letter */}
      <g className="transition-transform duration-700 ease-out" style={{ transform: opened ? 'translateY(-26px)' : 'translateY(0)' }}>
        <rect x="44" y="34" width="132" height="110" rx="6" fill="#ffffff" />
        <rect x="98" y="46" width="24" height="24" rx="6" fill="#0369fb" />
        <path d="M104 58l4 4 8-8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-opacity duration-500" style={{ opacity: opened ? 1 : 0 }} />
        <rect x="62" y="80" width="96" height="5" rx="2.5" fill="#e2e8f0" />
        <rect x="62" y="92" width="96" height="5" rx="2.5" fill="#e2e8f0" />
        <rect x="62" y="104" width="70" height="5" rx="2.5" fill="#e2e8f0" />
      </g>
      {/* Front flaps */}
      <path d="M20 80 L110 140 L20 180 Z" fill="#2563eb" />
      <path d="M200 80 L110 140 L200 180 Z" fill="#3b82f6" />
      <path d="M20 180 L110 122 L200 180 Z" fill="#2f6df5" />
    </svg>
  );
}

export function NewsletterConfirmation({ token }: { token: string }) {
  const locale = useLocale();
  const t = copy[locale];
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const done = state === 'done';

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

  const title = !token ? t.missingTitle : done ? t.doneTitle : t.idleTitle;
  const text = !token ? t.missingText : done ? t.doneText : t.idleText;
  const action = 'rounded-lg px-4 py-2.5 text-sm font-bold uppercase tracking-[.12em] transition';

  return (
    <div className="flex min-h-screen flex-col items-center overflow-x-hidden bg-[#f8fafc] px-4 py-8 text-center">
      <Link href="/" aria-label={t.home} className="inline-flex items-center gap-2 text-xl font-extrabold tracking-tight text-[#0369fb]">
        <Image src="/jchub-icon-192.png" alt="" width={32} height={32} className="h-8 w-8 rounded-lg" />
        JcHub
      </Link>

      <div className="mt-4 flex w-full flex-col items-center sm:mt-8">
        <div className="newsletter-scene relative flex h-56 w-full max-w-md items-center justify-center sm:h-64">
          {CONFETTI.map(([left, top, shape, color, delay], index) => (
            <span key={index} className="newsletter-confetto absolute" style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${delay}s` }} aria-hidden="true">
              <Confetto shape={shape} color={color} />
            </span>
          ))}
          <div className="newsletter-envelope relative"><Envelope opened={done} /></div>
        </div>

        <h1 className="mt-4 flex max-w-full items-center justify-center gap-2 text-2xl font-extrabold uppercase tracking-[.06em] text-[#0369fb] sm:gap-3 sm:text-4xl sm:tracking-[.08em]">
          <span className="text-amber-400" aria-hidden="true">•</span><span className="min-w-0">{title}</span><span className="text-amber-400" aria-hidden="true">•</span>
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-slate-500" aria-live="polite">{text}</p>

        <div className="mt-8 flex flex-wrap-reverse items-center justify-center gap-3">
          {!token ? (
            <Link href="/" className={`${action} text-emerald-600 hover:bg-emerald-50`}>{t.backHome}</Link>
          ) : done ? (
            <>
              <Link href="/blog" className={`${action} text-slate-500 hover:bg-slate-100`}>{t.blog}</Link>
              <Link href="/outils" className={`${action} text-emerald-600 hover:bg-emerald-50`}>{t.tools}</Link>
            </>
          ) : (
            <>
              <Link href="/" className={`${action} text-slate-400 hover:bg-slate-100 hover:text-slate-600`}>{t.later}</Link>
              <button type="button" onClick={confirm} disabled={state === 'loading'} className={`${action} inline-flex items-center gap-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-60`}>
                {state === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                {t.confirm}
              </button>
            </>
          )}
        </div>
        {state === 'error' && <p className="mt-4 max-w-md text-sm text-red-600" role="alert">{error}</p>}
      </div>
    </div>
  );
}
