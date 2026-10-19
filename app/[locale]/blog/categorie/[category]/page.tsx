import { notFound, permanentRedirect } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { ArrowRight, BookOpen, ChevronRight, Sparkles, Tag } from 'lucide-react';
import { BlogCatalog } from '@/components/blog/BlogCatalog';
import { CategoryLinks } from '@/components/CategoryLinks';
import { Newsletter } from '@/components/Newsletter';
import { getPublishedArticles, type BlogArticle } from '@/lib/blog';
import { categoryFromSlug, categoryLabel, categorySlug, countByCategory } from '@/lib/categories';
import { blogCategoryPath } from '@/lib/category-paths';
import { pageMetadata, type LocalizedPaths } from '@/lib/seo';
import { getPublicBaseUrl } from '@/lib/site-url';
import { getPathname, Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import { isLocale, type Locale } from '@/i18n/routing';

type Params = Promise<{ locale: string; category: string }>;
type CategoryText = { title: string; intro: string };

const copy = bilingual({
  categories: {
    Développement: { title: 'Articles sur le développement', intro: 'Des guides pratiques pour coder plus vite et déboguer plus sereinement : JSON, API, regex, JWT, encodage et tous les petits problèmes du quotidien.' },
    Sécurité: { title: 'Articles sur la sécurité', intro: 'Mots de passe, hachage, jetons : les bonnes pratiques pour protéger tes comptes, tes données et tes applications.' },
    Technologie: { title: 'Articles sur la technologie', intro: 'Agents IA, nouveaux usages du web et outils qui changent la façon de travailler : des décryptages et des conseils concrets.' },
    Frontend: { title: 'Articles sur le frontend', intro: 'Couleurs, CSS, images et interfaces : des astuces concrètes pour construire des pages plus belles et plus rapides.' },
    Informatique: { title: 'Articles d’informatique', intro: 'Les bases qui servent tous les jours : systèmes de numération, formats de données et notions clés expliquées simplement.' },
    'Base de données': { title: 'Articles sur les bases de données', intro: 'Identifiants, clés primaires et modélisation : des conseils pour concevoir des bases de données solides.' },
    Productivité: { title: 'Articles sur la productivité', intro: 'Des astuces et des outils pour gagner du temps sur les tâches répétitives et mieux organiser ton travail.' },
  } as Record<string, CategoryText>,
  fallback: (label: string): CategoryText => ({ title: `Articles : ${label}`, intro: `Tous les articles JcHub sur le thème « ${label} » : guides pratiques, retours d’expérience et conseils.` }),
  eyebrow: 'Catégorie du blog',
  breadcrumb: 'Fil d’Ariane',
  home: 'Accueil',
  blog: 'Blog',
  count: (count: number) => `${count} article${count > 1 ? 's' : ''}`,
  allArticles: 'Tous les articles',
  otherCategories: 'Autres catégories',
  otherCategoriesTitle: 'Explore les autres thèmes.',
  categoriesLabel: 'Catégories du blog',
  newsletterTitle: 'Reçois les nouveaux articles',
  newsletterText: 'Un article par semaine. Pas de spam.',
}, {
  categories: {
    Développement: { title: 'Articles about development', intro: 'Practical guides to code faster and debug with confidence: JSON, APIs, regexes, JWTs, encoding and all the small everyday problems.' },
    Sécurité: { title: 'Articles about security', intro: 'Passwords, hashing, tokens: good practices to protect your accounts, your data and your applications.' },
    Technologie: { title: 'Articles about technology', intro: 'AI agents, new ways of using the web and tools that change how we work: clear explanations and practical tips.' },
    Frontend: { title: 'Articles about frontend', intro: 'Colors, CSS, images and interfaces: practical tips to build better-looking, faster pages.' },
    Informatique: { title: 'Computer science articles', intro: 'The basics you use every day: number systems, data formats and key concepts explained simply.' },
    'Base de données': { title: 'Articles about databases', intro: 'IDs, primary keys and data modeling: advice to design solid databases.' },
    Productivité: { title: 'Articles about productivity', intro: 'Tips and tools to save time on repetitive tasks and organize your work better.' },
  },
  fallback: (label: string): CategoryText => ({ title: `Articles: ${label}`, intro: `All JcHub articles about ${label}: practical guides, lessons learned and tips.` }),
  eyebrow: 'Blog category',
  breadcrumb: 'Breadcrumb',
  home: 'Home',
  blog: 'Blog',
  count: (count: number) => `${count} article${count === 1 ? '' : 's'}`,
  allArticles: 'All articles',
  otherCategories: 'Other categories',
  otherCategoriesTitle: 'Explore the other topics.',
  categoriesLabel: 'Blog categories',
  newsletterTitle: 'Get the new articles',
  newsletterText: 'One article a week. No spam.',
});

function categoryText(category: string, locale: Locale): CategoryText {
  return copy[locale].categories[category] ?? copy[locale].fallback(categoryLabel(category, locale));
}

/** The French category of the page, or null when no published article has it. */
async function findCategory(slug: string, locale: Locale): Promise<{ category: string | null; articles: BlogArticle[] }> {
  const articles = await getPublishedArticles(locale);
  const categories = countByCategory(articles.map((article) => article.categoryKey)).map(({ category }) => category);
  const category = categoryFromSlug(slug, locale, categories);
  if (category) return { category, articles };
  // The address of the other language moves to the right one, like the articles.
  const other = categoryFromSlug(slug, locale === 'fr' ? 'en' : 'fr', categories);
  if (other) permanentRedirect(blogCategoryPath(other, locale));
  return { category: null, articles };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, category: slug } = await params;
  if (!isLocale(locale)) return {};
  const { category } = await findCategory(slug, locale);
  if (!category) return {};
  const text = categoryText(category, locale);
  const paths: LocalizedPaths = { fr: blogCategoryPath(category, 'fr'), en: blogCategoryPath(category, 'en') };
  return pageMetadata({ locale, title: text.title, description: text.intro, href: '/blog', paths });
}

export default async function BlogCategoryPage({ params }: { params: Params }) {
  const { locale, category: slug } = await params;
  if (!isLocale(locale)) notFound();
  const { category, articles } = await findCategory(slug, locale);
  if (!category) notFound();
  const t = copy[locale];
  const text = categoryText(category, locale);
  const label = categoryLabel(category, locale);
  const categoryArticles = articles.filter((article) => article.categoryKey === category);
  const otherCategories = countByCategory(articles.map((article) => article.categoryKey)).filter((item) => item.category !== category);

  const baseUrl = getPublicBaseUrl();
  const pageUrl = `${baseUrl}${blogCategoryPath(category, locale)}`;
  const nonce = (await headers()).get('x-nonce') || undefined;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: text.title,
        description: text.intro,
        url: pageUrl,
        inLanguage: locale,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: categoryArticles.map((article, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: article.title,
            url: `${baseUrl}${getPathname({ locale, href: { pathname: '/blog/[slug]', params: { slug: article.slug } } })}`,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t.home, item: `${baseUrl}${getPathname({ locale, href: '/' })}` },
          { '@type': 'ListItem', position: 2, name: t.blog, item: `${baseUrl}${getPathname({ locale, href: '/blog' })}` },
          { '@type': 'ListItem', position: 3, name: label, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <div className="template-home min-h-screen overflow-hidden bg-[#eff6ff] text-[#0f172a]">
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <section className="relative overflow-hidden border-b border-blue-100/80 bg-[radial-gradient(circle_at_12%_15%,rgba(147,197,253,.45),transparent_32%),radial-gradient(circle_at_88%_85%,rgba(191,219,254,.6),transparent_34%),#eff6ff]">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
            maskImage: 'radial-gradient(circle at center, black 30%, transparent 100%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-8 sm:px-8 lg:px-10">
          <nav aria-label={t.breadcrumb} className="flex flex-wrap items-center gap-1.5 text-sm text-slate-600">
            <Link href="/" className="hover:text-blue-700">{t.home}</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
            <Link href="/blog" className="hover:text-blue-700">{t.blog}</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
            <span className="font-semibold text-[#0f172a]">{label}</span>
          </nav>
          <div className="mt-6 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-900 shadow-sm"><BookOpen className="h-4 w-4 text-blue-600" aria-hidden="true" /> {t.eyebrow} · {label}</span>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-[#0f172a] [text-wrap:balance] sm:text-4xl md:text-5xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{text.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">{text.intro}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/blog" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#93c5fd] px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#60a5fa] hover:shadow-lg">{t.allArticles} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16" aria-label={t.count(categoryArticles.length)}>
        <BlogCatalog articles={categoryArticles} showCategories={false} />
      </section>

      {otherCategories.length > 0 && (
        <section className="border-t border-blue-100 py-12">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">{t.otherCategories}</p>
            <h2 className="mb-6 mt-2 text-2xl font-black text-[#0f172a]">{t.otherCategoriesTitle}</h2>
            <CategoryLinks
              label={t.categoriesLabel}
              items={otherCategories.map((item) => ({
                key: item.category,
                href: { pathname: '/blog/categorie/[category]', params: { category: categorySlug(item.category, locale) } },
                label: categoryLabel(item.category, locale),
                detail: t.count(item.count),
                icon: <Tag className="h-5 w-5" />,
              }))}
            />
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10 lg:pb-20"><div className="rounded-[1.75rem] border border-blue-100 bg-white p-7 shadow-[0_12px_36px_rgba(37,99,235,.07)] sm:p-10"><div className="mx-auto max-w-3xl text-center"><Sparkles className="mx-auto mb-3 h-8 w-8 text-blue-700" /><h2 className="text-2xl font-black sm:text-3xl">{t.newsletterTitle}</h2><p className="mt-2 text-slate-600">{t.newsletterText}</p><div className="mt-6"><Newsletter /></div></div></div></section>
    </div>
  );
}
