'use client';
import { trackInsight } from '@/lib/insights/client';

declare global {
  interface Window {
    gtag?: (...arguments_: unknown[]) => void;
  }
}

export function trackEvent(name: string, parameters: Record<string, string | number> = {}) {
  if (typeof window !== 'undefined') window.gtag?.('event', name, parameters);
  // Also counted by the site's own measurement (Control Center), which needs no cookie.
  trackInsight({ type: 'custom', name: name.slice(0, 80), meta: Object.fromEntries(Object.entries(parameters).map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 120) : value])) });
}