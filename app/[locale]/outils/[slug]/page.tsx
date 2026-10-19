import { notFound, permanentRedirect, redirect } from 'next/navigation';
import NextLink from 'next/link';
import { Metadata } from 'next';
import { ArrowRight, ArrowUpRight, ChevronRight, Gift, Lock, ShieldCheck, Trash2, Zap, type LucideIcon } from 'lucide-react';
import { getPublishedTools, getToolBySlug, localizeTool, toolPath, tools } from '@/lib/tools';
import { isToolComponentName, SERVER_PROCESSED_TOOLS } from '@/lib/tool-components';
import { ToolRenderer } from '@/components/tools/ToolRenderer';
import { ShareButton } from '@/components/tools/ShareButton';
import { Link } from '@/i18n/navigation';
import { bilingual, OG_LOCALE } from '@/i18n/copy';
import { isLocale, type Locale } from '@/i18n/routing';
import { getPublicBaseUrl } from '@/lib/site-url';
import { defaultSocialImage, languageAlternates } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type Params = Promise<{ locale: string; slug: string }>;
type Highlight = { icon: LucideIcon; title: string; desc: string };

const copy = bilingual({
  serverHighlights: (partner?: string): Highlight[] => [
    { icon: Lock, title: 'Transfert chiffré', desc: `Ton fichier est envoyé en HTTPS à nos serveurs${partner ? ` et, selon le format, à notre prestataire ${partner}` : ''} pour être converti.` },
    { icon: Trash2, title: 'Supprimé après usage', desc: 'Le fichier est effacé de nos serveurs dès la fin de la conversion.' },
    { icon: Gift, title: 'Gratuit et sans pub', desc: '5 conversions par jour, sans inscription ni publicité.' },
  ],
  browserHighlights: [
    { icon: ShieldCheck, title: '100% privé', desc: 'Tout se passe dans ton navigateur' },
    { icon: Zap, title: 'Instantané', desc: 'Pas d\'attente, pas de serveur' },
    { icon: Gift, title: 'Sans pub', desc: 'Gratuit, sans pub ni inscription' },
  ] as Highlight[],
  breadcrumb: 'Fil d’Ariane',
  home: 'Accueil',
  tools: 'Outils',
  free: '✓ 100% gratuit',
  serverProcessing: 'Transfert chiffré, fichier supprimé après conversion',
  browserProcessing: 'Traité dans ton navigateur',
  filesDetails: 'Détails sur le traitement des fichiers dans notre',
  privacyPolicy: 'politique de confidentialité',
  otherTools: 'Autres outils utiles',
  allTools: 'Tous les outils',
}, {
  serverHighlights: (partner?: string): Highlight[] => [
    { icon: Lock, title: 'Encrypted transfer', desc: `Your file is sent over HTTPS to our servers${partner ? ` and, depending on the format, to our provider ${partner}` : ''} to be converted.` },
    { icon: Trash2, title: 'Deleted after use', desc: 'The file is erased from our servers as soon as the conversion ends.' },
    { icon: Gift, title: 'Free and ad-free', desc: '5 conversions a day, no sign-up and no ads.' },
  ],
  browserHighlights: [
    { icon: ShieldCheck, title: '100% private', desc: 'Everything happens in your browser' },
    { icon: Zap, title: 'Instant', desc: 'No waiting, no server' },
    { icon: Gift, title: 'Ad-free', desc: 'Free, no ads and no sign-up' },
  ],
  breadcrumb: 'Breadcrumb',
  home: 'Home',
  tools: 'Tools',
  free: '✓ 100% free',
  serverProcessing: 'Encrypted transfer, file deleted after conversion',
  browserProcessing: 'Processed in your browser',
  filesDetails: 'Details about how files are processed in our',
  privacyPolicy: 'privacy policy',
  otherTools: 'Other useful tools',
  allTools: 'All tools',
});

/** Promises shown under the tool: they must match where the file is actually processed. */
function toolHighlights(component: string, locale: Locale): Highlight[] {
  if (component === 'ImageOptimizer') {
    return locale === 'en'
      ? [
          { icon: Lock, title: 'Encrypted transfer', desc: 'Sent securely over HTTPS' },
          { icon: Trash2, title: 'Deleted after use', desc: 'Erased after conversion' },
        ]
      : [
          { icon: Lock, title: 'Transfert chiffré', desc: 'Envoi en HTTPS' },
          { icon: Trash2, title: 'Supprimé après usage', desc: 'Effacé après conversion' },
        ];
  }
  const serverProcessing = isToolComponentName(component) ? SERVER_PROCESSED_TOOLS[component] : undefined;
  if (serverProcessing) return copy[locale].serverHighlights(serverProcessing.partner);
  return copy[locale].browserHighlights;
}

export async function generateStaticParams() {
  return tools.flatMap((t) => [
    { locale: 'fr', slug: t.slug },
    { locale: 'en', slug: t.translations?.en?.slug ?? t.slug },
  ]);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const found = await getToolBySlug(slug, locale);
  if (!found) return {};
  const tool = localizeTool(found, locale);
  const baseUrl = getPublicBaseUrl();
  const paths = { fr: toolPath(found, 'fr'), en: toolPath(found, 'en') };
  const toolUrl = `${baseUrl}${paths[locale]}`;
  const image = defaultSocialImage(locale);
  return {
    title: { absolute: tool.seo.title },
    description: tool.seo.description,
    keywords: tool.seo.keywords,
    alternates: languageAlternates(locale, paths),
    openGraph: {
      title: tool.seo.title,
      description: tool.seo.description,
      url: toolUrl,
      type: 'website',
      siteName: 'JcHub',
      locale: OG_LOCALE[locale],
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: tool.seo.title, description: tool.seo.description, images: [image.url] },
  };
}

export default async function ToolPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const found = await getToolBySlug(slug, locale);
  if (!found) notFound();
  if (found.path) redirect(toolPath(found, locale));
  const tool = localizeTool(found, locale);
  // A French slug opened in English moves to the English address.
  if (tool.localSlug && tool.localSlug !== slug) permanentRedirect(toolPath(found, locale));
  const t = copy[locale];

  // A catalog entry pointing to an unknown component used to silently show the password generator.
  if (!isToolComponentName(tool.component)) notFound();
  const component = tool.component;
  const serverProcessed = Boolean(SERVER_PROCESSED_TOOLS[component]);
  const ProcessingIcon = serverProcessed ? Lock : ShieldCheck;
  const publishedTools = await getPublishedTools();
  const otherTools = publishedTools
    .filter((candidate) => candidate.slug !== tool.slug)
    .map((candidate) => ({
      tool: candidate,
      score:
        (candidate.category === found.category ? 3 : 0) +
        candidate.tags.filter((tag) => found.tags.includes(tag)).length,
    }))
    // Ties are broken on the French name so both languages suggest the same tools.
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
    .slice(0, 4)
    .map(({ tool: candidate }) => localizeTool(candidate, locale));

  return (
    <div className="template-home min-h-screen bg-[#eff6ff] text-[#0f172a]">
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

        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
          <nav aria-label={t.breadcrumb} className="flex flex-wrap items-center gap-1.5 text-sm text-slate-600">
            <Link href="/" className="hover:text-blue-700">{t.home}</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
            <Link href="/outils" className="hover:text-blue-700">{t.tools}</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
            <span className="font-semibold text-[#0f172a]">{tool.name}</span>
          </nav>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
            <div aria-hidden="true" className="hidden h-16 w-16 shrink-0 place-items-center rounded-2xl border border-blue-100 bg-white text-3xl shadow-[0_12px_30px_rgba(37,99,235,.14)] sm:grid">
              {tool.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {/* Sur mobile, l'icône rejoint les badges au lieu d'occuper une ligne. */}
                <span aria-hidden="true" className="mr-1 grid h-11 w-11 place-items-center rounded-xl border border-blue-100 bg-white text-2xl shadow-[0_8px_20px_rgba(37,99,235,.12)] sm:hidden">{tool.icon}</span>
                <span className="rounded-full border border-blue-100 bg-white/80 px-2.5 py-0.5 text-xs font-semibold text-blue-800">{tool.category}</span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">{t.free}</span>
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0f172a] [text-wrap:balance] md:text-4xl">{tool.name}</h1>
              <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">{tool.description}</p>
            </div>
            <div className="sm:pt-1">
              <ShareButton title={tool.name} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl rounded-[1.5rem] bg-[#f2f6ff] p-4 sm:p-8">
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white">
          <div className="flex items-center gap-2 px-5 pt-5 sm:px-8 sm:pt-7">
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
              <ProcessingIcon className="h-4 w-4 text-slate-500" aria-hidden="true" />
              {serverProcessed ? t.serverProcessing : t.browserProcessing}
            </span>
          </div>
          <div className="p-5 pt-4 sm:px-8 sm:pb-7">
            <div className="tool-workspace">
              <ToolRenderer component={component} />
            </div>
          </div>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {toolHighlights(component, locale).slice(0, 2).map(({ title, desc }) => (
            <li key={title} className="rounded-xl border border-slate-200 bg-white p-5">
              <span className="min-w-0">
                <strong className="block text-lg font-medium text-slate-900">{title}</strong>
                <span className="mt-1 block text-base text-slate-500">{desc}</span>
              </span>
            </li>
          ))}
        </ul>
        {serverProcessed && (
          <p className="mt-4 text-center text-xs text-slate-600">
            {t.filesDetails}{' '}
            <Link href={{ pathname: '/confidentialite', hash: 'fichiers' }} className="font-semibold text-blue-700 underline-offset-2 hover:underline">{t.privacyPolicy}</Link>.
          </p>
        )}
      </section>

      <section className="border-t border-blue-100 py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-2xl font-black text-[#0f172a]">{t.otherTools}</h2>
            <Link href="/outils" className="flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900">
              {t.allTools}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {otherTools.map((other) => (
              <NextLink
                key={other.slug}
                href={toolPath(other, locale)}
                data-page-loader
                className="template-home__partner group flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-4 hover:border-blue-300"
              >
                <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-xl">{other.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900 transition group-hover:text-blue-700">{other.name}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{other.category}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-blue-700" aria-hidden="true" />
              </NextLink>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
