'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageLoader } from '@/components/layout/PageLoader';

/** Keeps the public storefront chrome out of private admin and account pages. */
export function AppChrome({ children, isAdminHost = false }: { children: React.ReactNode; isAdminHost?: boolean }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [toolLoading, setToolLoading] = useState(false);
  const toolLoadingStartedAt = useRef(0);
  const toolLoadingDestination = useRef('');

  useEffect(() => {
    setMounted(true);

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
      const isToolPage = /^\/outils\/[^/]+\/?$/.test(url.pathname);
      const isArticlePage = /^\/blog\/[^/]+\/?$/.test(url.pathname);
      if (anchor.hasAttribute('data-page-loader') || isToolPage || isArticlePage) {
        toolLoadingStartedAt.current = Date.now();
        toolLoadingDestination.current = url.pathname.replace(/\/$/, '');
        setToolLoading(true);
      }
    };
    document.addEventListener('click', onToolNavigation, true);
    return () => document.removeEventListener('click', onToolNavigation, true);
  }, []);

  useEffect(() => {
    if (!toolLoading) return;
    if ((pathname ?? '').replace(/\/$/, '') !== toolLoadingDestination.current) return;
    const remaining = Math.max(0, 450 - (Date.now() - toolLoadingStartedAt.current));
    const timeout = window.setTimeout(() => {
      setToolLoading(false);
      toolLoadingDestination.current = '';
    }, remaining);
    return () => window.clearTimeout(timeout);
  }, [pathname, toolLoading]);

  const safePathname = pathname ?? '';
  const isPrivateArea =
    isAdminHost ||
    safePathname === '/admin' ||
    safePathname.startsWith('/admin/') ||
    safePathname === '/compte' ||
    safePathname.startsWith('/compte/');

  if (!mounted && !isPrivateArea) return <PageLoader />;

  if (isPrivateArea) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen animate-page-in">{children}</main>
      <Footer />
      {toolLoading && (
        <div className="tool-navigation-loader" role="status" aria-label="Chargement de la page">
          <div className="loading-mark">
            <span className="loading-ring" aria-hidden="true" />
            <img src="/icone.svg" alt="" className="loading-logo" />
          </div>
          <span className="sr-only">Chargement de la page…</span>
        </div>
      )}
      <button
        type="button"
        aria-label="Retour en haut"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-5 right-5 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/25 transition-all duration-300 hover:scale-105 hover:bg-slate-700 ${showBackToTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </>
  );
}
