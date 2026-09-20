'use client';

declare global {
  interface Window {
    gtag?: (...arguments_: unknown[]) => void;
  }
}

export function trackEvent(name: string, parameters: Record<string, string | number> = {}) {
  if (typeof window !== 'undefined') window.gtag?.('event', name, parameters);
}