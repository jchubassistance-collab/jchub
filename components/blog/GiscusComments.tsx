'use client';

import { useEffect, useRef } from 'react';

export function GiscusComments() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const repository = process.env.NEXT_PUBLIC_GISCUS_REPOSITORY;
    const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
    if (!repository || !category || !containerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', repository);
    script.setAttribute('data-repo-id', process.env.NEXT_PUBLIC_GISCUS_REPOSITORY_ID || '');
    script.setAttribute('data-category', category);
    script.setAttribute('data-category-id', process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || '');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', 'light');
    script.setAttribute('data-lang', 'fr');
    containerRef.current.appendChild(script);
    return () => { script.remove(); };
  }, []);

  const configured = process.env.NEXT_PUBLIC_GISCUS_REPOSITORY && process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
  return (
    <section className="mt-12 border-t border-gray-200 pt-8" aria-label="Commentaires">
      <h2 className="mb-2 text-2xl font-black">Commentaires</h2>
      <p className="mb-6 text-sm text-gray-600">Partage ton expérience ou pose ta question à la communauté.</p>
      {configured ? <div ref={containerRef} /> : <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Les commentaires seront bientôt disponibles.</p>}
    </section>
  );
}
