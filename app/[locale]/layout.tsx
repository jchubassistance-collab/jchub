import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { OG_LOCALE } from '@/i18n/copy';
import { isLocale, type Locale } from '@/i18n/routing';
import { defaultSocialImage } from '@/lib/seo';

const defaults: Record<Locale, { title: string; description: string; keywords: string[]; manifest: string }> = {
  fr: {
    title: 'Outils pratiques pour développeurs | JcHub',
    description: 'JcHub regroupe des outils gratuits, des ressources utiles et des workflows pratiques pour développeurs, créateurs et équipes.',
    keywords: ['JcHub', 'développeur', 'outils dev', 'outils gratuits', 'ressources développeurs', 'IA', 'Jessy Ngnambongo'],
    manifest: '/fr/manifest.webmanifest',
  },
  en: {
    title: 'Practical tools for developers | JcHub',
    description: 'JcHub brings together free tools, useful resources and practical workflows for developers, creators and teams.',
    keywords: ['JcHub', 'developer', 'dev tools', 'free tools', 'developer resources', 'AI', 'Jessy Ngnambongo'],
    manifest: '/en/manifest.webmanifest',
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const image = defaultSocialImage(locale);
  return {
    // absolute: the root layout's template must not add a second "| JcHub" to this default.
    title: { absolute: defaults[locale].title, template: '%s | JcHub' },
    description: defaults[locale].description,
    keywords: defaults[locale].keywords,
    manifest: defaults[locale].manifest,
    openGraph: { type: 'website', locale: OG_LOCALE[locale], siteName: 'JcHub', images: [image] },
    twitter: { card: 'summary_large_image', images: [image.url] },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return children;
}
