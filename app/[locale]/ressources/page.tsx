import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, FolderDown } from 'lucide-react';
import { pageMetadata } from '@/lib/seo';
import type { ResourceKind } from '@/lib/resources';
import { getPublishedResources } from '@/lib/resource-store';
import { ResourceLibrary, type LibraryItem } from '@/components/resources/ResourceLibrary';
import { ServicesCallout } from '@/components/resources/ServicesCallout';
import { getPathname, Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import { isLocale } from '@/i18n/routing';

const copy = bilingual({
  metaTitle: 'Ressources gratuites : aide-mémoire, checklists et modèles',
  metaDescription: 'Aide-mémoire SQL, codes HTTP, checklist de lancement de site, modèles de contrat et de cahier des charges : des fichiers gratuits à lire en ligne ou à télécharger.',
  eyebrow: 'Fichiers gratuits',
  titleStart: 'Les bons fichiers, ',
  titleHighlight: 'prêts à servir.',
  intro: 'Des aide-mémoire à garder sous la main, une checklist pour lancer ton site et des modèles de documents pour tes projets web. Lis-les en ligne ou télécharge-les.',
  seeAll: 'Voir les ressources',
  tools: 'Voir les outils',
  perks: ['Aide-mémoire en PDF, sans inscription', 'Modèles Word reçus par e-mail', 'En français et en anglais'],
  libraryBadge: 'Bibliothèque',
  libraryTitle: 'Choisis ta ressource.',
  libraryText: 'Filtre par type, puis ouvre une ressource pour la lire et la télécharger.',
  filterLabel: 'Filtrer les ressources par type',
  all: 'Toutes',
  kinds: { cheatsheet: 'Aide-mémoire', checklist: 'Checklists', template: 'Modèles' } as Record<ResourceKind, string>,
  free: 'Gratuit',
  byEmail: 'Gratuit, par e-mail',
  open: 'Ouvrir',
  empty: 'Aucune ressource de ce type pour le moment.',
  ctaEyebrow: 'Un projet de site ?',
  ctaTitle: 'Je le construis avec toi.',
  ctaText: 'Site vitrine, boutique, outil de gestion : envoie-moi ton cahier des charges et je te réponds avec une proposition.',
  ctaButton: 'Voir les services',
}, {
  metaTitle: 'Free resources: cheat sheets, checklists and templates',
  metaDescription: 'SQL cheat sheet, HTTP status codes, website launch checklist, contract and requirements templates: free files to read online or download.',
  eyebrow: 'Free files',
  titleStart: 'The right files, ',
  titleHighlight: 'ready to use.',
  intro: 'Cheat sheets to keep at hand, a checklist to launch your website and document templates for your web projects. Read them online or download them.',
  seeAll: 'See the resources',
  tools: 'See the tools',
  perks: ['PDF cheat sheets, no sign-up', 'Word templates sent by email', 'In English and French'],
  libraryBadge: 'Library',
  libraryTitle: 'Pick your resource.',
  libraryText: 'Filter by type, then open a resource to read and download it.',
  filterLabel: 'Filter resources by type',
  all: 'All',
  kinds: { cheatsheet: 'Cheat sheets', checklist: 'Checklists', template: 'Templates' },
  free: 'Free',
  byEmail: 'Free, by email',
  open: 'Open',
  empty: 'No resource of this type yet.',
  ctaEyebrow: 'A website project?',
  ctaTitle: 'Let’s build it together.',
  ctaText: 'Showcase site, online shop, management tool: send me your requirements and I will reply with a proposal.',
  ctaButton: 'See the services',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, title: copy[locale].metaTitle, description: copy[locale].metaDescription, href: '/ressources' });
}

// Resources change from the admin (see forgetStoredResources); this is only a safety net.
export const revalidate = 3600;

export default async function ResourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = copy[locale];
  const items: LibraryItem[] = (await getPublishedResources()).map((resource) => ({
    id: resource.id,
    kind: resource.kind,
    title: resource[locale].title,
    summary: resource[locale].summary,
    href: getPathname({ locale, href: { pathname: '/ressources/[slug]', params: { slug: resource[locale].slug } } }),
    access: resource.gated ? t.byEmail : t.free,
    format: resource.format === 'docx' ? 'Word' : 'PDF',
  }));

  return (
    <div className="template-home overflow-hidden bg-[#eff6ff] text-[#0f172a]" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(147,197,253,.48),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(191,219,254,.55),transparent_32%),#eff6ff]">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(rgba(37,99,235,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.045) 1px,transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse at center,black 20%,transparent 76%)' }} />
        <div className="pointer-events-none absolute -left-36 top-32 h-80 w-80 rounded-full bg-blue-200/70 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-5 pb-16 pt-14 text-center sm:px-8 sm:pb-20 lg:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-blue-900 shadow-sm"><FolderDown className="h-4 w-4 text-blue-600" /> {t.eyebrow}</span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-[-.045em] sm:text-5xl lg:text-6xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>
            {t.titleStart}<span className="text-blue-700">{t.titleHighlight}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{t.intro}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#bibliotheque" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#93c5fd] px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:bg-[#60a5fa] hover:shadow-lg">{t.seeAll} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></a>
            <Link href="/outils" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:shadow-lg">{t.tools} <ArrowRight className="h-4 w-4 text-blue-600 transition-transform group-hover:translate-x-1" /></Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
            {t.perks.map((perk) => <span key={perk} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-blue-600" /> {perk}</span>)}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-20 px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <section id="bibliotheque" className="scroll-mt-24">
          <div className="mb-8 space-y-3">
            <Badge>{t.libraryBadge}</Badge>
            <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.libraryTitle}</h2>
            <p className="max-w-xl text-sm leading-6 text-slate-600">{t.libraryText}</p>
          </div>
          <ResourceLibrary items={items} labels={{ all: t.all, filterLabel: t.filterLabel, kinds: t.kinds, open: t.open, empty: t.empty }} />
        </section>

        <ServicesCallout eyebrow={t.ctaEyebrow} title={t.ctaTitle} text={t.ctaText} button={t.ctaButton} />
      </main>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.12em] text-blue-800 shadow-sm">{children}</span>;
}
