import type { Metadata } from 'next';

/** Site-wide social card, rendered by the article-cover route with its default text. */
export const DEFAULT_SOCIAL_IMAGE = {
  url: '/api/article-cover',
  width: 1200,
  height: 630,
  alt: 'JcHub — outils pratiques et gratuits pour développeurs',
};

/**
 * Metadata for a public page. Next.js merges `openGraph` shallowly, so a page that
 * omits it inherits the home page's title and URL in link previews; this helper
 * always gives the page its own card.
 */
export function pageMetadata({ title, description, path, absoluteTitle = false }: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
}): Metadata {
  const shareTitle = absoluteTitle ? title : `${title} | JcHub`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', locale: 'fr_FR', siteName: 'JcHub', url: path, title: shareTitle, description, images: [DEFAULT_SOCIAL_IMAGE] },
    twitter: { card: 'summary_large_image', title: shareTitle, description, images: [DEFAULT_SOCIAL_IMAGE.url] },
  };
}
