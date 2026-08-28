'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageLoader } from '@/components/layout/PageLoader';

/** Keeps the public storefront chrome out of private admin and account pages. */
export function AppChrome({ children, isAdminHost = false }: { children: React.ReactNode; isAdminHost?: boolean }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    setMounted(true);

    const onScroll = () => {
      setShowBackToTop(window.scrollY > 240);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!mounted) return <PageLoader />;

  const safePathname = pathname ?? '';

  const isPrivateArea =
    isAdminHost ||
    safePathname === '/admin' ||
    safePathname.startsWith('/admin/') ||
    safePathname === '/compte' ||
    safePathname.startsWith('/compte/');

  if (isPrivateArea) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen animate-page-in">{children}</main>
      <Footer />
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
