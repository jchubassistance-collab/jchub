'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';

const STORAGE_KEY = 'jchub-analytics-consent';
// The CNIL recommends asking again after six months.
const CONSENT_MAX_AGE_MS = 182 * 86_400_000;
export const OPEN_CONSENT_EVENT = 'jchub:open-consent';

type Choice = 'granted' | 'denied';

function readChoice(): Choice | null {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null') as { value?: unknown; at?: unknown } | null;
    if ((stored?.value === 'granted' || stored?.value === 'denied') && typeof stored.at === 'number' && Date.now() - stored.at < CONSENT_MAX_AGE_MS) {
      return stored.value;
    }
  } catch { /* Blocked storage: ask again. */ }
  return null;
}

function clearAnalyticsCookies() {
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim();
    if (!name.startsWith('_ga')) continue;
    const domain = window.location.hostname.split('.').slice(-2).join('.');
    document.cookie = `${name}=; Max-Age=0; path=/`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=.${domain}`;
  }
}

/** Audience trackers (GA4, Metricool) load only after an explicit opt-in. */
export function AnalyticsConsent({ nonce }: { nonce?: string }) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    const stored = readChoice();
    setChoice(stored);
    setBannerOpen(stored === null);
    const open = () => setBannerOpen(true);
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, []);

  const decide = (value: Choice) => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ value, at: Date.now() })); } catch { /* Choice applies to this visit only. */ }
    setBannerOpen(false);
    if (value === 'denied' && choice === 'granted') {
      // Trackers already running cannot be unloaded: clear their cookies and restart the page without them.
      clearAnalyticsCookies();
      window.location.reload();
      return;
    }
    setChoice(value);
  };

  return (
    <>
      {choice === 'granted' && (
        <>
          <GoogleAnalytics nonce={nonce} />
          <Script
            src="https://tracker.metricool.com/resources/be.js"
            nonce={nonce}
            strategy="lazyOnload"
            onLoad={() => (window as typeof window & { beTracker?: { t: (options: { hash: string }) => void } }).beTracker?.t({ hash: 'cf3c77b7b68bec375b5ba0a7a2f6716' })}
          />
        </>
      )}
      {bannerOpen && (
        <section role="dialog" aria-modal="false" aria-labelledby="consent-title" className="fixed inset-x-4 bottom-4 z-[80] mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-2xl shadow-slate-950/20 sm:inset-x-6">
          <h2 id="consent-title" className="text-sm font-bold text-slate-900">Mesure d’audience</h2>
          <p className="mt-2 text-xs leading-5">
            Avec ton accord, on utilise Google Analytics et Metricool pour savoir quelles pages et quels outils sont utiles. Ces services déposent des cookies. Sans accord, rien n’est chargé et le site fonctionne pareil.{' '}
            <Link href="/confidentialite" className="font-semibold text-blue-700 underline-offset-2 hover:underline">En savoir plus</Link>
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => decide('denied')} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">Refuser</button>
            <button type="button" onClick={() => decide('granted')} className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Accepter</button>
          </div>
        </section>
      )}
    </>
  );
}
