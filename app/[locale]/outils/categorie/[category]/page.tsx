import { notFound, permanentRedirect } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { ArrowRight, ChevronRight, Lightbulb, Wrench } from 'lucide-react';
import { ToolsCatalog } from '@/components/tools/ToolsCatalog';
import { CategoryLinks } from '@/components/CategoryLinks';
import { getPublishedTools, localizeTool, toolPath, type Tool } from '@/lib/tools';
import { categoryFromSlug, categoryLabel, categorySlug, countByCategory } from '@/lib/categories';
import { toolCategoryPath } from '@/lib/category-paths';
import { pageMetadata, type LocalizedPaths } from '@/lib/seo';
import { getPublicBaseUrl } from '@/lib/site-url';
import { getPathname, Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import { isLocale, type Locale } from '@/i18n/routing';

// The list depends on the tools visible today.
export const dynamic = 'force-dynamic';

type Params = Promise<{ locale: string; category: string }>;
type CategoryText = { title: string; intro: string };

const copy = bilingual({
  categories: {
    Développement: { title: 'Outils de développement gratuits', intro: 'Formate du JSON, teste tes regex, décode un JWT, génère des UUID ou convertis un timestamp : les petits outils qui font gagner du temps au quotidien, sans rien installer.' },
    Document: { title: 'Outils PDF et documents gratuits', intro: 'Convertis un PDF en Word, compresse un PDF ou passe un fichier Excel en CSV en quelques secondes, sans installer de logiciel.' },
    Design: { title: 'Outils de design gratuits', intro: 'Convertis tes couleurs d’un format à l’autre et optimise tes images WebP ou PNG pour qu’elles se chargent plus vite sur le web.' },
    Encodage: { title: 'Outils d’encodage gratuits', intro: 'Encode et décode du Base64 ou des URL sans erreur, pour tes API, tes intégrations et tes tests.' },
    Sécurité: { title: 'Outils de sécurité gratuits', intro: 'Génère des mots de passe solides et calcule des empreintes (hash) directement dans ton navigateur : rien n’est envoyé à un serveur.' },
    Productivité: { title: 'Outils de productivité gratuits', intro: 'Crée un QR code en quelques secondes, prêt à partager ou à imprimer, et gagne du temps sur les petites tâches du quotidien.' },
    Texte: { title: 'Outils de texte gratuits', intro: 'Transforme, nettoie et analyse tes textes en quelques clics, directement dans ton navigateur.' },
    Autre: { title: 'Autres outils gratuits', intro: 'Des outils pratiques qui ne rentrent dans aucune autre case, mais qui rendent service au quotidien.' },
  } as Record<string, CategoryText>,
  fallback: (label: string): CategoryText => ({ title: `Outils « ${label} » gratuits`, intro: `Tous les outils JcHub de la catégorie « ${label} », gratuits et sans inscription.` }),
  eyebrow: 'Catégorie d’outils',
  breadcrumb: 'Fil d’Ariane',
  home: 'Accueil',
  tools: 'Outils',
  count: (count: number) => `${count} outil${count > 1 ? 's' : ''} gratuit${count > 1 ? 's' : ''}`,
  allTools: 'Voir tous les outils',
  suggest: 'Suggérer un outil',
  otherCategories: 'Autres catégories',
  otherCategoriesTitle: 'Explore les autres outils.',
  categoriesLabel: 'Catégories d’outils',
}, {
  categories: {
    Développement: { title: 'Free developer tools', intro: 'Format JSON, test your regexes, decode a JWT, generate UUIDs or convert a timestamp: small tools that save you time every day, with nothing to install.' },
    Document: { title: 'Free PDF and document tools', intro: 'Convert a PDF to Word, compress a PDF or turn an Excel file into CSV in seconds, without installing any software.' },
    Design: { title: 'Free design tools', intro: 'Convert your colors from one format to another and optimize your WebP or PNG images so they load faster on the web.' },
    Encodage: { title: 'Free encoding tools', intro: 'Encode and decode Base64 or URLs without mistakes, for your APIs, integrations and tests.' },
    Sécurité: { title: 'Free security tools', intro: 'Generate strong passwords and compute hashes right in your browser: nothing is sent to a server.' },
    Productivité: { title: 'Free productivity tools', intro: 'Create a QR code in seconds, ready to share or print, and save time on small everyday tasks.' },
    Texte: { title: 'Free text tools', intro: 'Transform, clean up and analyze your texts in a few clicks, right in your browser.' },
    Autre: { title: 'Other free tools', intro: 'Handy tools that don’t fit in any other box but come in useful every day.' },
  },
  fallback: (label: string): CategoryText => ({ title: `Free ${label} tools`, intro: `All JcHub tools in the ${label} category, free and with no sign-up.` }),
  eyebrow: 'Tool category',
  breadcrumb: 'Breadcrumb',
  home: 'Home',
  tools: 'Tools',
  count: (count: number) => `${count} free tool${count === 1 ? '' : 's'}`,
  allTools: 'See all the tools',
  suggest: 'Suggest a tool',
  otherCategories: 'Other categories',
  otherCategoriesTitle: 'Explore the other tools.',
  categoriesLabel: 'Tool categories',
});

function categoryText(category: string, locale: Locale): CategoryText {
  return copy[locale].categories[category] ?? copy[locale].fallback(categoryLabel(category, locale));
}

/** The French category of the page, or null when no published tool has it. */
async function findCategory(slug: string, locale: Locale): Promise<{ category: string | null; tools: Tool[] }> {
  const tools = await getPublishedTools();
  const categories = countByCategory(tools.map((tool) => tool.category)).map(({ category }) => category);
  const category = categoryFromSlug(slug, locale, categories);
  if (category) return { category, tools };
  // The address of the other language moves to the right one, like the tool pages.
  const other = categoryFromSlug(slug, locale === 'fr' ? 'en' : 'fr', categories);
  if (other) permanentRedirect(toolCategoryPath(other, locale));
  return { category: null, tools };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, category: slug } = await params;
  if (!isLocale(locale)) return {};
  const { category } = await findCategory(slug, locale);
  if (!category) return {};
  const text = categoryText(category, locale);
  const paths: LocalizedPaths = { fr: toolCategoryPath(category, 'fr'), en: toolCategoryPath(category, 'en') };
  return pageMetadata({ locale, title: text.title, description: text.intro, href: '/outils', paths });
}

export default async function ToolCategoryPage({ params }: { params: Params }) {
  const { locale, category: slug } = await params;
  if (!isLocale(locale)) notFound();
  const { category, tools } = await findCategory(slug, locale);
  if (!category) notFound();
  const t = copy[locale];
  const text = categoryText(category, locale);
  const label = categoryLabel(category, locale);
  const categoryTools = tools
    .filter((tool) => tool.category === category)
    .map((tool) => ({ ...localizeTool(tool, locale), href: toolPath(tool, locale) }));
  const otherCategories = countByCategory(tools.map((tool) => tool.category)).filter((item) => item.category !== category);

  const baseUrl = getPublicBaseUrl();
  const pageUrl = `${baseUrl}${toolCategoryPath(category, locale)}`;
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
          itemListElement: categoryTools.map((tool, index) => ({ '@type': 'ListItem', position: index + 1, name: tool.name, url: `${baseUrl}${tool.href}` })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t.home, item: `${baseUrl}${getPathname({ locale, href: '/' })}` },
          { '@type': 'ListItem', position: 2, name: t.tools, item: `${baseUrl}${getPathname({ locale, href: '/outils' })}` },
          { '@type': 'ListItem', position: 3, name: label, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <div className="template-home min-h-screen bg-[#eff6ff] text-[#0f172a]">
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
            <Link href="/outils" className="hover:text-blue-700">{t.tools}</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
            <span className="font-semibold text-[#0f172a]">{label}</span>
          </nav>
          <div className="mt-6 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-900 shadow-sm"><Wrench className="h-4 w-4 text-blue-600" aria-hidden="true" /> {t.eyebrow} · {label}</span>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-[#0f172a] [text-wrap:balance] sm:text-4xl md:text-5xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{text.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">{text.intro}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/outils" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#93c5fd] px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#60a5fa] hover:shadow-lg">{t.allTools} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link>
              <Link href="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-blue-100 bg-white px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><Lightbulb className="h-4 w-4 text-blue-600" aria-hidden="true" /> {t.suggest}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16" aria-label={t.count(categoryTools.length)}>
        <ToolsCatalog tools={categoryTools} showCategories={false} />
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
                href: { pathname: '/outils/categorie/[category]', params: { category: categorySlug(item.category, locale) } },
                label: categoryLabel(item.category, locale),
                detail: t.count(item.count),
                icon: tools.find((tool) => tool.category === item.category)?.icon ?? <Wrench className="h-5 w-5" />,
              }))}
            />
          </div>
        </section>
      )}
    </div>
  );
}
