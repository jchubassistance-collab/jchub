import type { MetadataRoute } from 'next';
import { getPublishedArticlesByLocale } from '@/lib/blog';
import { getPublishedTools, toolPath } from '@/lib/tools';
import { getPublicBaseUrl } from '@/lib/site-url';
import { localizedPaths, type LocalizedPaths } from '@/lib/seo';
import { countByCategory } from '@/lib/categories';
import { blogCategoryPath, toolCategoryPath } from '@/lib/category-paths';
import type { StaticPathname } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

type Entry = MetadataRoute.Sitemap[number];

/**
 * Every public page in French and in English. Each address lists its other-language
 * version, so search engines index both as translations of one page.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicBaseUrl();
  // The articles come from content/articles, in both languages.
  const [{ fr: articles, en: englishArticles }, tools] = await Promise.all([getPublishedArticlesByLocale(), getPublishedTools()]);
  const publicPages: { href: StaticPathname; changeFrequency: Entry['changeFrequency']; priority: number }[] = [
    { href: '/', changeFrequency: 'weekly', priority: 1 },
    { href: '/blog', changeFrequency: 'daily', priority: 0.8 },
    { href: '/a-propos', changeFrequency: 'monthly', priority: 0.5 },
    { href: '/outils', changeFrequency: 'weekly', priority: 0.9 },
    { href: '/aide', changeFrequency: 'monthly', priority: 0.6 },
    { href: '/contact', changeFrequency: 'monthly', priority: 0.5 },
    { href: '/cgu', changeFrequency: 'yearly', priority: 0.2 },
    { href: '/cgv', changeFrequency: 'yearly', priority: 0.2 },
    { href: '/confidentialite', changeFrequency: 'yearly', priority: 0.2 },
    { href: '/mentions-legales', changeFrequency: 'yearly', priority: 0.2 },
  ];

  const absolute = (path: string) => `${baseUrl}${path}`;
  const bothLanguages = (paths: LocalizedPaths, entry: Omit<Entry, 'url' | 'alternates'>, english = true): MetadataRoute.Sitemap => {
    const languages = english
      ? { fr: absolute(paths.fr), en: absolute(paths.en), 'x-default': absolute(paths.fr) }
      : undefined;
    return [
      { ...entry, url: absolute(paths.fr), ...(languages ? { alternates: { languages } } : {}) },
      ...(english ? [{ ...entry, url: absolute(paths.en), alternates: { languages: languages! } }] : []),
    ];
  };

  const englishById = new Map(englishArticles.map((article) => [article.id, article]));
  const entries: MetadataRoute.Sitemap = [
    ...publicPages.flatMap((page) => bothLanguages(localizedPaths(page.href), { changeFrequency: page.changeFrequency, priority: page.priority })),
    ...articles.filter((article) => article.slug.trim()).flatMap((article) => {
      const english = englishById.get(article.id);
      // An article not translated yet is listed in French only: its English address shows the French text.
      const articlePath = (locale: 'fr' | 'en', slug: string) => getPathname({ locale, href: { pathname: '/blog/[slug]', params: { slug } } });
      return bothLanguages(
        { fr: articlePath('fr', article.slug), en: articlePath('en', english?.slug ?? article.slug) },
        { lastModified: article.updatedAt || article.publishedAt || undefined, changeFrequency: 'monthly', priority: 0.7 },
        Boolean(english?.translated),
      );
    }),
    ...tools.filter((tool) => tool.slug.trim()).flatMap((tool) => bothLanguages(
      { fr: toolPath(tool, 'fr'), en: toolPath(tool, 'en') },
      { changeFrequency: 'monthly', priority: 0.7 },
    )),
    ...countByCategory(tools.map((tool) => tool.category)).flatMap(({ category }) => bothLanguages(
      { fr: toolCategoryPath(category, 'fr'), en: toolCategoryPath(category, 'en') },
      { changeFrequency: 'weekly', priority: 0.6 },
    )),
    ...countByCategory(articles.map((article) => article.categoryKey)).flatMap(({ category }) => bothLanguages(
      { fr: blogCategoryPath(category, 'fr'), en: blogCategoryPath(category, 'en') },
      { changeFrequency: 'weekly', priority: 0.5 },
    )),
  ];

  const uniqueEntries = new Map(entries.map((entry) => [entry.url, entry]));
  return Array.from(uniqueEntries.values());
}
