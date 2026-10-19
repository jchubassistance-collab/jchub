'use client';

import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { usePathname as useInternalPathname } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';

const copy = bilingual({ backToTop: 'Retour en haut', loading: 'Chargement de la page', loadingText: 'Chargement de la page…' }, { backToTop: 'Back to top', loading: 'Loading page', loadingText: 'Loading page…' });

/** Keeps the public storefront chrome out of private admin and account pages. */
export function AppChrome({ children, isAdminHost = false }: { children: React.ReactNode; isAdminHost?: boolean }) {
  const pathname = usePathname();
  // French address of the page in either language: /en/account is /compte.
  const internalPathname = useInternalPathname();
  const t = copy[useLocale()];
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [toolLoading, setToolLoading] = useState(false);
  const toolLoadingStartedAt = useRef(0);
  const toolLoadingOrigin = useRef('');

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 240);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onToolNavigation = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank') return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === pathname) return;
      // Downloads, API routes and static files never change the page: the loader would stay forever.
      if (anchor.hasAttribute('download') || url.pathname.startsWith('/api/') || /\.[a-z0-9]+$/i.test(url.pathname)) return;
      toolLoadingStartedAt.current = Date.now();
      toolLoadingOrigin.current = (pathname ?? '').replace(/\/$/, '');
      setToolLoading(true);
    };
    document.addEventListener('click', onToolNavigation, true);
    return () => document.removeEventListener('click', onToolNavigation, true);
  }, [pathname]);

  useEffect(() => {
    if (!toolLoading) return;
    // Any new page ends the loader, including a redirect to another address than the clicked one.
    if ((pathname ?? '').replace(/\/$/, '') === toolLoadingOrigin.current) return;
    const remaining = Math.max(0, 450 - (Date.now() - toolLoadingStartedAt.current));
    const timeout = window.setTimeout(() => setToolLoading(false), remaining);
    return () => window.clearTimeout(timeout);
  }, [pathname, toolLoading]);

  useEffect(() => {
    if (!toolLoading) return;
    // Safety net when a click handler cancels the navigation or the page comes back from the back-forward cache.
    const timeout = window.setTimeout(() => setToolLoading(false), 10000);
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) setToolLoading(false); };
    window.addEventListener('pageshow', onPageShow);
    return () => { window.clearTimeout(timeout); window.removeEventListener('pageshow', onPageShow); };
  }, [toolLoading]);

  const safePathname: string = internalPathname ?? '';
  const isPrivateArea =
    isAdminHost ||
    safePathname === '/admin' ||
    safePathname.startsWith('/admin/') ||
    safePathname === '/compte' ||
    safePathname.startsWith('/compte/');

  // Public pages must render on the server: crawlers, link previews and slow phones see content before JS loads.
  if (isPrivateArea) {
    return <><main className="min-h-screen">{children}</main>{toolLoading && <PageNavigationLoader label={t.loading} text={t.loadingText} />}</>;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen animate-page-in">{children}</main>
      <Footer />
      {toolLoading && <PageNavigationLoader label={t.loading} text={t.loadingText} />}
      <button
        type="button"
        aria-label={t.backToTop}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-5 right-5 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/25 transition-all duration-300 hover:scale-105 hover:bg-slate-700 ${showBackToTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </>
  );
}

function PageNavigationLoader({ label, text }: { label: string; text: string }) {
  return (
    <div className="tool-navigation-loader" role="status" aria-label={label}>
      <div className="jchub-loader" aria-hidden="true">
        <span className="jchub-loader__dots">
          <span className="jchub-loader__dot jchub-loader__dot--top" />
          <span className="jchub-loader__dot jchub-loader__dot--right" />
          <span className="jchub-loader__dot jchub-loader__dot--bottom" />
          <span className="jchub-loader__dot jchub-loader__dot--left" />
        </span>
        <img src="/jchub-icon-192.png" alt="" width="192" height="192" className="jchub-loader__icon" />
      </div>
      <span className="sr-only">{text}</span>
    </div>
  );
}
