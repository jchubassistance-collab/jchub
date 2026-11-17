'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import { THEME_STORAGE_KEY, type Theme } from '@/lib/theme';

const copy = bilingual({
  toDark: 'Passer en mode sombre',
  toLight: 'Passer en mode clair',
}, {
  toDark: 'Switch to dark mode',
  toLight: 'Switch to light mode',
});

const listeners = new Set<() => void>();

function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

/** Sun or moon button; the choice is remembered in this browser, light being the default. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const t = copy[useLocale()];
  // The server does not know the theme: it renders the light state, corrected after hydration.
  const theme = useSyncExternalStore(subscribe, currentTheme, () => 'light' as Theme);

  // React rebuilds <html> after a hydration error and drops the attribute set by the boot script.
  // Light unless the visitor picked dark: the device setting is ignored on purpose.
  useEffect(() => {
    const expected = storedTheme() ?? 'light';
    if (document.documentElement.getAttribute('data-theme') !== expected) applyTheme(expected);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage refused (private browsing): the theme still changes for this page.
    }
    applyTheme(next);
  };

  const label = theme === 'dark' ? t.toLight : t.toDark;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-blue-100 bg-white text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 ${className}`}
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}
