'use client';

import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { MouseEvent } from 'react';
import { getPathname, usePathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

const LANGUAGES: Record<Locale, { label: string }> = {
  fr: { label: 'Français' },
  en: { label: 'English' },
};

function Flag({ locale }: { locale: Locale }) {
  return locale === 'fr' ? (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="h-full w-full">
      <defs><clipPath id="fr-flag-circle"><circle cx="16" cy="16" r="16" /></clipPath></defs>
      <g clipPath="url(#fr-flag-circle)">
        <rect width="32" height="32" fill="#1b3f8b" />
        <rect x="10.67" width="10.66" height="32" fill="#fff" />
        <rect x="21.33" width="10.67" height="32" fill="#ed2939" />
      </g>
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="h-full w-full">
      <defs><clipPath id="en-flag-circle"><circle cx="16" cy="16" r="16" /></clipPath></defs>
      <g clipPath="url(#en-flag-circle)">
        <rect width="32" height="32" fill="#012169" />
        <path d="M-2 0 34 32M34 0-2 32" stroke="#fff" strokeWidth="6" />
        <path d="M-2 0 34 32M34 0-2 32" stroke="#c8102e" strokeWidth="2.4" />
        <path d="M16 0v32M0 16h32" stroke="#fff" strokeWidth="10" />
        <path d="M16 0v32M0 16h32" stroke="#c8102e" strokeWidth="6" />
      </g>
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
export function LanguageSwitcher({ light = true, small = false, className = '' }: { light?: boolean; small?: boolean; className?: string }) {
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
      <ul className="flex list-none items-center gap-2 p-0">
        {routing.locales.map((target) => (
          <li key={target}>
            {target === locale ? (
              <span role="img" aria-current="true" aria-label={LANGUAGES[target].label} title={LANGUAGES[target].label} className={`block ${small ? 'h-8 w-8 p-px' : 'h-10 w-10 p-[2px]'} overflow-hidden rounded-full border-2 shadow-sm transition-transform ${light ? 'border-blue-600 bg-white shadow-blue-900/15' : 'border-white bg-white/10 shadow-black/20'}`}>
                <Flag locale={target} />
              </span>
            ) : (
              <a
                href={fallbackHref(target)}
                hrefLang={target}
                lang={target}
                title={LANGUAGES[target].label}
                aria-label={LANGUAGES[target].label}
                onClick={(event) => switchTo(event, target)}
                className={`block ${small ? 'h-8 w-8 p-px' : 'h-10 w-10 p-[2px]'} overflow-hidden rounded-full border-2 shadow-sm transition-transform hover:scale-105 ${light ? 'border-slate-200 bg-white hover:border-blue-300' : 'border-white/20 bg-white/10 hover:border-white/50'}`}
              >
                <Flag locale={target} />
              </a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
