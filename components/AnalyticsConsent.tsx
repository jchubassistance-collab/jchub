'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useLocale } from 'next-intl';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';

const copy = bilingual({
  title: 'Mesure d’audience',
  text: 'Avec ton accord, on utilise Google Analytics et Metricool pour savoir quelles pages et quels outils sont utiles. Ces services déposent des cookies. Sans accord, rien n’est chargé et le site fonctionne pareil.',
  learnMore: 'En savoir plus',
  refuse: 'Refuser',
  accept: 'Accepter',
}, {
  title: 'Audience measurement',
  text: 'With your consent, we use Google Analytics and Metricool to find out which pages and tools are useful. These services set cookies. Without your consent, nothing is loaded and the site works the same.',
  learnMore: 'Learn more',
  refuse: 'Decline',
  accept: 'Accept',
});

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
  const t = copy[useLocale()];
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
        <section role="dialog" aria-modal="false" aria-labelledby="consent-title" className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[80] mx-auto max-h-[calc(100dvh-1.5rem)] max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-slate-700 shadow-2xl shadow-slate-950/20 sm:inset-x-6 sm:bottom-6 sm:p-5">
          <h2 id="consent-title" className="text-sm font-bold text-slate-900">{t.title}</h2>
          <p className="mt-1.5 break-words text-xs leading-5">
            {t.text}{' '}
            <Link href="/confidentialite" className="font-semibold text-blue-700 underline-offset-2 hover:underline">{t.learnMore}</Link>
          </p>
          {/* Side by side even on phones: the banner stays short and hides less of the page. */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:flex sm:justify-end">
            <button type="button" onClick={() => decide('denied')} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">{t.refuse}</button>
            <button type="button" onClick={() => decide('granted')} className="min-h-11 rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">{t.accept}</button>
          </div>
        </section>
      )}
    </>
  );
}
