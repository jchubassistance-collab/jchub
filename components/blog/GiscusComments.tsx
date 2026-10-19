'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';

const copy = bilingual({
  title: 'Commentaires',
  intro: 'Partage ton expérience ou pose ta question à la communauté.',
  soon: 'Les commentaires seront bientôt disponibles.',
}, {
  title: 'Comments',
  intro: 'Share your experience or ask the community your question.',
  soon: 'Comments will be available soon.',
});

/**
 * One discussion per article, shared by its French and English pages: it is found by the
 * article id (also the name of its file), which does not change with the address or language.
 */
export function GiscusComments({ articleId }: { articleId: string }) {
  const locale = useLocale();
  const t = copy[locale];
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const repository = process.env.NEXT_PUBLIC_GISCUS_REPOSITORY;
    const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
    const container = containerRef.current;
    if (!repository || !category || !container) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', repository);
    script.setAttribute('data-repo-id', process.env.NEXT_PUBLIC_GISCUS_REPOSITORY_ID || '');
    script.setAttribute('data-category', category);
    script.setAttribute('data-category-id', process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || '');
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', `blog/${articleId}`);
    // Exact match on the term, so an article never picks up the discussion of a similar title.
    script.setAttribute('data-strict', '1');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', 'light');
    script.setAttribute('data-lang', locale);
    container.appendChild(script);
    // The script turns into an iframe: clear it so another article does not show two threads.
    return () => { container.replaceChildren(); };
  }, [locale, articleId]);

  const configured = process.env.NEXT_PUBLIC_GISCUS_REPOSITORY && process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
  return (
    <section className="mt-12 border-t border-gray-200 pt-8" aria-label={t.title}>
      <h2 className="mb-2 text-2xl font-black">{t.title}</h2>
      <p className="mb-6 text-sm text-gray-600">{t.intro}</p>
      {configured ? <div ref={containerRef} /> : <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">{t.soon}</p>}
    </section>
  );
}
