'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import { trackInsight } from '@/lib/insights/client';
import { articlePageOf, toolPageOf } from '@/lib/insights/paths';

const SCROLL_STEPS = [25, 50, 75, 100];
/** Web Vitals already sent: each measure leaves once, even if reported twice. */
const sentVitals = new Set<string>();
/** Last page counted: React may run an effect twice (strict mode), a page counts once. */
let lastView = { path: '', at: 0 };
let visitStarted = false;
/** Reading counts only while the visitor moved, scrolled or typed in the last 30 seconds. */
const IDLE_MS = 30_000;

/**
 * Audience measurement of the Control Center, mounted once on the public site. It reads what
 * happens on the page and sends anonymous events: page views, the tools' funnel (file sent,
 * result downloaded, error shown), reading of articles, clicks to other sites and Web Vitals.
 */
export function InsightsTracker() {
  const pathname = usePathname() ?? '/';
  const lastUpload = useRef<number | null>(null);

  useReportWebVitals((metric) => {
    // Two registrations of the same page report the same measure under different ids.
    const key = `${metric.name}:${window.location.pathname}:${metric.value.toFixed(3)}`;
    if (!['LCP', 'INP', 'CLS', 'FCP', 'TTFB'].includes(metric.name) || sentVitals.has(key)) return;
    sentVitals.add(key);
    trackInsight({ type: 'web_vital', name: metric.name, value: Math.max(0, metric.value) });
  });

  // Page view; the first one of the visit says where the visitor came from.
  useEffect(() => {
    if (lastView.path === pathname && Date.now() - lastView.at < 2000) return;
    lastView = { path: pathname, at: Date.now() };
    const event: Parameters<typeof trackInsight>[0] = { type: 'pageview', path: pathname };
    if (!visitStarted) {
      visitStarted = true;
      event.referrer = document.referrer.slice(0, 300);
      const utm = new URLSearchParams(window.location.search).get('utm_source');
      if (utm) event.utm = utm.slice(0, 60);
    }
    trackInsight(event);
    lastUpload.current = null;
  }, [pathname]);

  // Tools: file sent, result downloaded, error shown in the tool's area.
  useEffect(() => {
    if (!toolPageOf(pathname)) return;
    const inWorkspace = (node: EventTarget | null) => node instanceof Element && Boolean(node.closest('.tool-workspace'));
    const sent = (files: FileList | null | undefined) => {
      if (!files?.length) return;
      const size = Array.from(files).reduce((total, file) => total + file.size, 0);
      lastUpload.current = Date.now();
      trackInsight({ type: 'tool_upload', path: pathname, value: size, meta: { files: files.length } });
    };
    const onChange = (event: Event) => {
      const input = event.target;
      if (input instanceof HTMLInputElement && input.type === 'file' && inWorkspace(input)) sent(input.files);
    };
    const onDrop = (event: DragEvent) => { if (inWorkspace(event.target)) sent(event.dataTransfer?.files); };
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('.btn-download, a[download]') : null;
      if (!target || !inWorkspace(target)) return;
      const elapsed = lastUpload.current ? Date.now() - lastUpload.current : undefined;
      trackInsight({ type: 'tool_download', path: pathname, value: elapsed, meta: { afterUpload: elapsed !== undefined } });
    };
    const reported = new WeakSet<Element>();
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          const alert = node.matches('[role="alert"]') ? node : node.querySelector('[role="alert"]');
          if (!alert || reported.has(alert) || !inWorkspace(alert) || !alert.textContent?.trim()) return;
          reported.add(alert);
          trackInsight({ type: 'tool_error', path: pathname, name: alert.textContent.trim().slice(0, 80) });
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('change', onChange, true);
    document.addEventListener('drop', onDrop, true);
    document.addEventListener('click', onClick, true);
    return () => {
      observer.disconnect();
      document.removeEventListener('change', onChange, true);
      document.removeEventListener('drop', onDrop, true);
      document.removeEventListener('click', onClick, true);
    };
  }, [pathname]);

  // Articles: how far the text was read, and for how long really.
  useEffect(() => {
    if (!articlePageOf(pathname)) return;
    const reached = new Set<number>();
    let active = 0;
    let lastTick = Date.now();
    let lastActivity = Date.now();
    const onScroll = () => {
      lastActivity = Date.now();
      const article = document.querySelector('.article-markdown');
      if (!article) return;
      const box = article.getBoundingClientRect();
      const read = Math.min(100, Math.max(0, ((window.innerHeight - box.top) / Math.max(1, box.height)) * 100));
      for (const step of SCROLL_STEPS) {
        if (read >= step && !reached.has(step)) { reached.add(step); trackInsight({ type: 'scroll', path: pathname, value: step }); }
      }
    };
    const onActivity = () => { lastActivity = Date.now(); };
    const tick = setInterval(() => {
      const now = Date.now();
      if (document.visibilityState === 'visible' && now - lastActivity < IDLE_MS) active += now - lastTick;
      lastTick = now;
    }, 1000);
    const report = () => {
      const seconds = Math.round(active / 1000);
      active = 0;
      if (seconds >= 5) trackInsight({ type: 'read_time', path: pathname, value: Math.min(seconds, 3600) });
    };
    const onHide = () => { if (document.visibilityState === 'hidden') report(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onActivity, { passive: true });
    window.addEventListener('keydown', onActivity);
    document.addEventListener('visibilitychange', onHide);
    onScroll();
    return () => {
      report();
      clearInterval(tick);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onActivity);
      window.removeEventListener('keydown', onActivity);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [pathname]);

  // Clicks to other sites (partners, social networks, sources).
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      let url: URL;
      try { url = new URL(anchor.href); } catch { return; }
      if (!/^https?:$/.test(url.protocol) || url.hostname === window.location.hostname) return;
      trackInsight({ type: 'outbound', name: url.hostname.replace(/^www\./, '').slice(0, 80) });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
