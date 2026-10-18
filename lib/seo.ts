import type { Metadata } from 'next';
import { getPathname } from '@/i18n/navigation';
import { OG_LOCALE } from '@/i18n/copy';
import { routing, type Locale } from '@/i18n/routing';

type Href = Parameters<typeof getPathname>[0]['href'];

/** Site-wide social card, rendered by the article-cover route with its default text. */
export const DEFAULT_SOCIAL_IMAGE = {
  url: '/api/article-cover',
  width: 1200,
  height: 630,
  alt: 'JcHub — outils pratiques et gratuits pour développeurs',
};

export function defaultSocialImage(locale: Locale) {
  return locale === 'en'
    ? { ...DEFAULT_SOCIAL_IMAGE, url: '/api/article-cover?lang=en', alt: 'JcHub — free, practical tools for developers' }
    : DEFAULT_SOCIAL_IMAGE;
}

/** Address of a page in each language, e.g. { fr: '/outils', en: '/en/tools' }. */
export type LocalizedPaths = Record<Locale, string>;

export function localizedPaths(href: Href): LocalizedPaths {
  return { fr: getPathname({ locale: 'fr', href }), en: getPathname({ locale: 'en', href }) };
}

/**
 * Canonical address and hreflang links. Search engines see both language versions
 * as the same page, and French is offered to visitors of any other language.
 */
export function languageAlternates(locale: Locale, paths: LocalizedPaths): Metadata['alternates'] {
  return {
    canonical: paths[locale],
    languages: { ...paths, 'x-default': paths[routing.defaultLocale] },
  };
}

/**
 * Metadata for a public page. Next.js merges `openGraph` shallowly, so a page that
 * omits it inherits the home page's title and URL in link previews; this helper
 * always gives the page its own card. `paths` overrides the addresses when the
 * slug itself is translated (tools, articles).
 */
export function pageMetadata({ locale, title, description, href, paths, absoluteTitle = false }: {
  locale: Locale;
  title: string;
  description: string;
  href: Href;
  paths?: LocalizedPaths;
  absoluteTitle?: boolean;
}): Metadata {
  const shareTitle = absoluteTitle ? title : `${title} | JcHub`;
  const addresses = paths ?? localizedPaths(href);
  const image = defaultSocialImage(locale);
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: languageAlternates(locale, addresses),
    openGraph: { type: 'website', locale: OG_LOCALE[locale], siteName: 'JcHub', url: addresses[locale], title: shareTitle, description, images: [image] },
    twitter: { card: 'summary_large_image', title: shareTitle, description, images: [image.url] },
  };
}
