import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowRight, ArrowUpRight, ChevronRight, Gift, Lock, ShieldCheck, Trash2, Zap, type LucideIcon } from 'lucide-react';
import { getPublishedTools, getToolBySlug, tools } from '@/lib/tools';
import { isToolComponentName, SERVER_PROCESSED_TOOLS } from '@/lib/tool-components';
import { ToolRenderer } from '@/components/tools/ToolRenderer';
import { ShareButton } from '@/components/tools/ShareButton';
import { getPublicBaseUrl } from '@/lib/site-url';
import { DEFAULT_SOCIAL_IMAGE } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type Highlight = { icon: LucideIcon; title: string; desc: string };

/** Promises shown under the tool: they must match where the file is actually processed. */
function toolHighlights(component: string): Highlight[] {
  const serverProcessing = isToolComponentName(component) ? SERVER_PROCESSED_TOOLS[component] : undefined;
  if (serverProcessing) {
    return [
      { icon: Lock, title: 'Transfert chiffré', desc: `Ton fichier est envoyé en HTTPS à nos serveurs${serverProcessing.partner ? ` et, selon le format, à notre prestataire ${serverProcessing.partner}` : ''} pour être converti.` },
      { icon: Trash2, title: 'Supprimé après usage', desc: 'Le fichier est effacé de nos serveurs dès la fin de la conversion.' },
      { icon: Gift, title: 'Gratuit et sans pub', desc: '5 conversions par jour, sans inscription ni publicité.' },
    ];
  }
  return [
    { icon: ShieldCheck, title: '100% privé', desc: 'Tout se passe dans ton navigateur' },
    { icon: Zap, title: 'Instantané', desc: 'Pas d\'attente, pas de serveur' },
    { icon: Gift, title: 'Sans pub', desc: 'Gratuit, sans pub ni inscription' },
  ];
}

export async function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return {};
  const baseUrl = getPublicBaseUrl();
  const toolUrl = `${baseUrl}${tool.path ?? `/outils/${tool.slug}`}`;
  return {
    title: { absolute: tool.seo.title },
    description: tool.seo.description,
    keywords: tool.seo.keywords,
    alternates: { canonical: toolUrl },
    openGraph: {
      title: tool.seo.title,
      description: tool.seo.description,
      url: toolUrl,
      type: 'website',
      siteName: 'JcHub',
      locale: 'fr_FR',
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: { card: 'summary_large_image', title: tool.seo.title, description: tool.seo.description, images: [DEFAULT_SOCIAL_IMAGE.url] },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();
  if (tool.path) redirect(tool.path);

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
        (candidate.category === tool.category ? 3 : 0) +
        candidate.tags.filter((tag) => tool.tags.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
    .slice(0, 4)
    .map(({ tool: candidate }) => candidate);

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
          <nav aria-label="Fil d’Ariane" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-600">
            <Link href="/" className="hover:text-blue-700">Accueil</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
            <Link href="/outils" className="hover:text-blue-700">Outils</Link>
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
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">✓ 100% gratuit</span>
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

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        <div className="overflow-hidden rounded-[1.75rem] bg-[#0d1c34] shadow-[0_24px_60px_rgba(7,19,40,.28)] ring-1 ring-blue-950/20">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3 sm:px-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
              <ProcessingIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {serverProcessed ? 'Transfert chiffré, fichier supprimé après conversion' : 'Traité dans ton navigateur'}
            </span>
          </div>
          <div className="p-5 sm:p-8">
            <ToolRenderer component={component} />
          </div>
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {toolHighlights(component).map(({ icon: Icon, title, desc }) => (
            <li key={title} className="flex gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_8px_24px_rgba(37,99,235,.05)]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <strong className="block text-sm text-slate-900">{title}</strong>
                <span className="mt-0.5 block text-xs leading-5 text-slate-600">{desc}</span>
              </span>
            </li>
          ))}
        </ul>
        {serverProcessed && (
          <p className="mt-4 text-center text-xs text-slate-600">
            Détails sur le traitement des fichiers dans notre{' '}
            <Link href="/confidentialite#fichiers" className="font-semibold text-blue-700 underline-offset-2 hover:underline">politique de confidentialité</Link>.
          </p>
        )}
      </section>

      <section className="border-t border-blue-100 py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-2xl font-black text-[#0f172a]">Autres outils utiles</h2>
            <Link href="/outils" className="flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900">
              Tous les outils
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {otherTools.map((t) => (
              <Link
                key={t.slug}
                href={`/outils/${t.slug}`}
                data-page-loader
                className="template-home__partner group flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-4 hover:border-blue-300"
              >
                <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-xl">{t.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900 transition group-hover:text-blue-700">{t.name}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{t.category}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-blue-700" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
