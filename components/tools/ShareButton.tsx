'use client';

import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';

const copy = bilingual({ copied: 'Lien copié', share: 'Partager' }, { copied: 'Link copied', share: 'Share' });

/** Opens the phone's share sheet when available, otherwise copies the page link. */
export function ShareButton({ title }: { title: string }) {
  const t = copy[useLocale()];
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* Clipboard blocked: nothing else to offer. */ }
  };

  return (
    <button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm transition hover:border-blue-400 hover:text-blue-900">
      {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
      <span aria-live="polite">{copied ? t.copied : t.share}</span>
    </button>
  );
}
