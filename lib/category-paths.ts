import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { categorySlug } from '@/lib/categories';

/** Address of a tool category page in `locale`, with the language prefix: /outils/categorie/securite, /en/tools/category/security. */
export function toolCategoryPath(category: string, locale: Locale): string {
  return getPathname({ locale, href: { pathname: '/outils/categorie/[category]', params: { category: categorySlug(category, locale) } } });
}

/** Address of a blog category page in `locale`: /blog/categorie/securite, /en/blog/category/security. */
export function blogCategoryPath(category: string, locale: Locale): string {
  return getPathname({ locale, href: { pathname: '/blog/categorie/[category]', params: { category: categorySlug(category, locale) } } });
}
