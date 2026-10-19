'use client';

import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { MouseEvent } from 'react';
import { getPathname, usePathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

const LANGUAGES: Record<Locale, { name: string; label: string }> = {
  fr: { name: 'Fran\u00e7ais', label: 'Choisir la langue' },
  en: { name: 'English', label: 'Choose language' },
};

function Flag({ locale }: { locale: Locale }) {
  return locale === 'fr' ? (
    <svg aria-hidden="true" viewBox="0 0 30 20" className="h-4 w-6 shrink-0 overflow-hidden rounded-[2px] shadow-sm">
      <rect width="10" height="20" fill="#1b3f8b" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#ed2939" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 60 30" className="h-4 w-6 shrink-0 overflow-hidden rounded-[2px] shadow-sm">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0 0 60 30M60 0 0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0 60 30M60 0 0 30" stroke="#c8102e" strokeWidth="2.4" />
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0v30M0 15h60" stroke="#c8102e" strokeWidth="6" />
    </svg>
  );
}

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
 * Language list. Changing language reloads the page: the <html lang> attribute and
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
    <nav aria-label={LANGUAGES[locale].label} className={className}>
      <ul className={`flex list-none items-center gap-1 rounded-xl border p-1 text-xs font-bold ${light ? 'border-blue-100 bg-white/75' : 'border-white/10 bg-white/5'}`}>
        {routing.locales.map((target) => (
          <li key={target}>
            {target === locale ? (
              <span aria-current="true" title={LANGUAGES[target].name} className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${light ? 'bg-blue-600 text-white' : 'bg-white/10 text-white'}`}>
                <Flag locale={target} /><span>{LANGUAGES[target].name}</span>
              </span>
            ) : (
              <a
                href={fallbackHref(target)}
                hrefLang={target}
                lang={target}
                title={LANGUAGES[target].name}
                onClick={(event) => switchTo(event, target)}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition ${light ? 'text-slate-700 hover:bg-blue-50 hover:text-blue-800' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
              >
                <Flag locale={target} /><span>{LANGUAGES[target].name}</span>
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
