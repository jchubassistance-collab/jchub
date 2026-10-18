'use client';

import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { MouseEvent } from 'react';
import { getPathname, usePathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

const LANGUAGES: Record<Locale, { short: string; name: string; label: string }> = {
  fr: { short: 'FR', name: 'Français', label: 'Choisir la langue' },
  en: { short: 'EN', name: 'English', label: 'Choose language' },
};

/** Same page in the other language, read from the page's hreflang links (they know translated slugs). */
function alternateAddress(target: Locale): string | null {
  const href = document.querySelector(`link[rel="alternate"][hreflang="${target}"]`)?.getAttribute('href');
  if (!href) return null;
  try {
    const url = new URL(href, window.location.origin);
    return url.origin === window.location.origin ? url.pathname : null;
  } catch {
    return null;
  }
}

/**
 * FR / EN toggle. Changing language reloads the page: the <html lang> attribute and
 * every text of the layout then switch together.
 */
export function LanguageSwitcher({ light = true, className = '' }: { light?: boolean; className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();

  // Server-rendered address: right for every page whose address has no translated slug.
  const fallbackHref = (target: Locale) => {
    const routeParams = Object.fromEntries(Object.entries(params ?? {}).filter(([key]) => key !== 'locale' && key !== 'rest'));
    try {
      return getPathname({ locale: target, href: { pathname, params: routeParams } as Parameters<typeof getPathname>[0]['href'] });
    } catch {
      return getPathname({ locale: target, href: '/' });
    }
  };

  const switchTo = (event: MouseEvent<HTMLAnchorElement>, target: Locale) => {
    const address = alternateAddress(target);
    if (!address) return; // The link's own href is the right page.
    event.preventDefault();
    window.location.assign(`${address}${window.location.search}${window.location.hash}`);
  };

  return (
    <nav aria-label={LANGUAGES[locale].label} className={`flex items-center gap-0.5 rounded-xl border p-0.5 text-xs font-bold ${light ? 'border-blue-100 bg-white/75' : 'border-white/10 bg-white/5'} ${className}`}>
      {routing.locales.map((target) => target === locale ? (
        <span key={target} aria-current="true" title={LANGUAGES[target].name} className={`rounded-lg px-2 py-1.5 ${light ? 'bg-blue-600 text-white' : 'bg-white/10 text-white'}`}>
          {LANGUAGES[target].short}
        </span>
      ) : (
        <a
          key={target}
          href={fallbackHref(target)}
          hrefLang={target}
          lang={target}
          title={LANGUAGES[target].name}
          onClick={(event) => switchTo(event, target)}
          className={`rounded-lg px-2 py-1.5 transition ${light ? 'text-slate-700 hover:bg-blue-50 hover:text-blue-800' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
        >
          {LANGUAGES[target].short}
        </a>
      ))}
    </nav>
  );
}
