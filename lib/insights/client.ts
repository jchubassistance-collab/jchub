'use client';

import type { TrackedEvent } from '@/lib/insights/events';

/**
 * Browser side of the Control Center collection: events wait a few seconds in memory and leave
 * together with sendBeacon (text/plain, no preflight), also when the page is hidden or closed.
 * Nothing is written to cookies or storage.
 */

const queue: TrackedEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

function flush() {
  if (timer) { clearTimeout(timer); timer = null; }
  while (queue.length) {
    const batch = queue.splice(0, 25);
    const body = JSON.stringify({ events: batch });
    const sent = typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function' && navigator.sendBeacon('/api/track', new Blob([body], { type: 'text/plain' }));
    if (!sent) void fetch('/api/track', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => undefined);
  }
}

export function trackInsight(event: Omit<TrackedEvent, 'path'> & { path?: string }) {
  if (typeof window === 'undefined') return;
  const path = event.path ?? window.location.pathname;
  if (path.startsWith('/admin')) return;
  queue.push({ ...event, path });
  if (!listening) {
    listening = true;
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  }
  if (queue.length >= 20) flush();
  else timer ??= setTimeout(flush, 4000);
}
