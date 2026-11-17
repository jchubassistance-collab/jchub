import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import NextLink from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { AlertTriangle, ArrowRight, ChevronRight, Mail } from 'lucide-react';
import { pageMetadata } from '@/lib/seo';
import type { Resource, ResourceKind } from '@/lib/resources';
import { findPublishedResource, getPublishedResources } from '@/lib/resource-store';
import { downloadName } from '@/lib/download-name';
import { ResourceKindIcon } from '@/components/resources/ResourceKindIcon';
import { ResourcePdfButton } from '@/components/resources/ResourcePdfButton';
import { ResourceRequestForm } from '@/components/resources/ResourceRequestForm';
import { ServicesCallout } from '@/components/resources/ServicesCallout';
import { getPathname, Link } from '@/i18n/navigation';
import { bilingual, INTL_LOCALE } from '@/i18n/copy';
import { isLocale, type Locale } from '@/i18n/routing';

type Params = Promise<{ locale: string; slug: string }>;

const copy = bilingual({
  breadcrumb: 'Fil d’Ariane',
  home: 'Accueil',
  resources: 'Ressources',
  kinds: { cheatsheet: 'Aide-mémoire', checklist: 'Checklist', template: 'Modèle' } as Record<ResourceKind, string>,
  free: 'Gratuit, sans inscription',
  byEmail: 'Gratuit, reçu par e-mail',
  updated: (date: string) => `Mis à jour le ${date}`,
  getTemplate: 'Recevoir le modèle',
  checklistHint: 'Coche les points au fur et à mesure : rien n’est enregistré, imprime le PDF pour garder une trace.',
  outlineTitle: 'Ce que contient le modèle',
  outlineText: 'Un fichier Word à compléter, avec le texte à remplacer surligné entre crochets.',
  stepsTitle: 'Comment l’utiliser',
  steps: ['Indique ton adresse e-mail et ouvre le lien reçu.', 'Télécharge le fichier Word et remplis les parties surlignées.', 'Supprime ce qui ne te concerne pas, relis et partage-le.'],
  others: 'Autres ressources',
  ctaEyebrow: 'Besoin d’aide pour ton site ?',
  ctaTitle: 'Je crée ton site sur mesure.',
  ctaText: 'Site vitrine, boutique en ligne, outil de gestion : parlons de ton projet.',
  ctaButton: 'Voir les services',
}, {
  breadcrumb: 'Breadcrumb',
  home: 'Home',
  resources: 'Resources',
  kinds: { cheatsheet: 'Cheat sheet', checklist: 'Checklist', template: 'Template' },
  free: 'Free, no sign-up',
  byEmail: 'Free, sent by email',
  updated: (date: string) => `Updated on ${date}`,
  getTemplate: 'Get the template',
  checklistHint: 'Tick the items as you go: nothing is saved, print the PDF to keep track.',
  outlineTitle: 'What the template contains',
  outlineText: 'A Word file to fill in, with the text to replace highlighted in brackets.',
  stepsTitle: 'How to use it',
  steps: ['Enter your email address and open the link you receive.', 'Download the Word file and fill in the highlighted parts.', 'Delete what does not apply, proofread and share it.'],
  others: 'Other resources',
  ctaEyebrow: 'Need help with your website?',
  ctaTitle: 'I build your custom website.',
  ctaText: 'Showcase site, online shop, management tool: let’s talk about your project.',
  ctaButton: 'See the services',
});

function resourceHref(resource: Resource, locale: Locale) {
  return { pathname: '/ressources/[slug]' as const, params: { slug: resource[locale].slug } };
}

export async function generateMetadata({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const found = await findPublishedResource(slug, locale);
  if (!found?.exact) return {};
  const { resource } = found;
  return pageMetadata({
    locale,
    title: resource[locale].seoTitle,
    description: resource[locale].seoDescription,
    href: resourceHref(resource, locale),
    paths: {
      fr: getPathname({ locale: 'fr', href: resourceHref(resource, 'fr') }),
      en: getPathname({ locale: 'en', href: resourceHref(resource, 'en') }),
    },
    absoluteTitle: true,
  });
}

// No page is built ahead: each one is built at its first visit, then served from the cache.
export function generateStaticParams() {
  return [];
}

// Resources change from the admin (see forgetStoredResources); this is only a safety net.
export const revalidate = 3600;

export default async function ResourcePage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const found = await findPublishedResource(slug, locale);
  if (!found) notFound();
  // A slug of the other language moves to this language's address.
  if (!found.exact) permanentRedirect(getPathname({ locale, href: resourceHref(found.resource, locale) }));
  const { resource } = found;
  const t = copy[locale];
  const text = resource[locale];
  const updated = new Intl.DateTimeFormat(INTL_LOCALE[locale], { dateStyle: 'long' }).format(new Date(`${resource.updated}T12:00:00Z`));
  const others = (await getPublishedResources()).filter((candidate) => candidate.id !== resource.id).slice(0, 4);

  return (
    <div className="template-home overflow-hidden bg-[#eff6ff] text-[#0f172a]" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_12%_15%,rgba(147,197,253,.45),transparent_32%),radial-gradient(circle_at_88%_85%,rgba(191,219,254,.6),transparent_34%),#eff6ff]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: 'linear-gradient(rgba(37,99,235,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.045) 1px,transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(circle at center,black 30%,transparent 100%)' }} />
        <div className="relative mx-auto max-w-5xl px-5 pb-12 pt-8 sm:px-8 lg:pb-16">
          <nav aria-label={t.breadcrumb} className="flex flex-wrap items-center gap-1.5 text-sm text-slate-600">
            <Link href="/" className="hover:text-blue-700">{t.home}</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
            <Link href="/ressources" className="hover:text-blue-700">{t.resources}</Link>
            <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
            <span className="font-semibold text-[#0f172a]">{text.title}</span>
          </nav>

          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-start">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white text-blue-700 shadow-[0_12px_30px_rgba(37,99,235,.14)]"><ResourceKindIcon kind={resource.kind} className="h-7 w-7" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="rounded-full bg-white px-3 py-1 uppercase tracking-[.12em] text-blue-800 shadow-sm">{t.kinds[resource.kind]}</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">{resource.gated ? t.byEmail : t.free}</span>
                <span className="rounded-full bg-white/80 px-3 py-1 text-slate-600">{resource.format === 'docx' ? 'Word' : 'PDF'}</span>
              </div>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-[-.03em] [text-wrap:balance] sm:text-4xl lg:text-5xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{text.title}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{text.summary}</p>
              <p className="mt-2 text-sm text-slate-500">{t.updated(updated)}</p>
              <div className="mt-7">
                {resource.gated
                  ? <a href="#recevoir" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#93c5fd] px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:bg-[#60a5fa] hover:shadow-lg"><Mail className="h-4 w-4" /> {t.getTemplate}</a>
                  : <ResourcePdfButton resource={resource} />}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl space-y-16 px-5 py-12 sm:px-8 sm:py-16">
        {text.notice && (
          <p className="flex gap-3 rounded-2xl bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
            {text.notice}
          </p>
        )}

        {resource.gated ? (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
            <div className="space-y-12">
              <section>
                <h2 className="text-2xl font-extrabold sm:text-3xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.outlineTitle}</h2>
                <p className="mt-2 text-slate-600">{t.outlineText}</p>
                <ol className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {text.outline?.map((title, index) => (
                    <li key={title} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-blue-700 shadow-sm">{index + 1}</span>
                      <span className="pt-0.5">{title}</span>
                    </li>
                  ))}
                </ol>
              </section>
              <section>
                <h2 className="text-2xl font-extrabold sm:text-3xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.stepsTitle}</h2>
                <ol className="mt-6 space-y-3">
                  {t.steps.map((step, index) => (
                    <li key={step} className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700 shadow-[0_2px_10px_rgba(15,23,42,.04)]">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">{index + 1}</span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
            <div id="recevoir" className="scroll-mt-24 lg:sticky lg:top-28">
              <Suspense>
                <ResourceRequestForm resourceId={resource.id} fileName={downloadName(text.slug, 'docx')} />
              </Suspense>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {resource.kind === 'checklist' && <p className="text-sm text-slate-600">{t.checklistHint}</p>}
            {text.sections?.map((section) => (
              <section key={section.title}>
                <h2 className="mb-4 text-2xl font-extrabold" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{section.title}</h2>
                <ul className="divide-y divide-blue-50 rounded-[1.25rem] bg-white px-5 shadow-[0_2px_10px_rgba(15,23,42,.05)] sm:px-7">
                  {section.rows.map((row) => resource.kind === 'checklist' ? (
                    <li key={row.term}>
                      <label className="flex cursor-pointer items-start gap-4 py-4">
                        <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 accent-blue-600" />
                        <span><span className="block font-bold text-[#0f172a]">{row.term}</span><span className="mt-1 block text-sm leading-6 text-slate-600">{row.text}</span></span>
                      </label>
                    </li>
                  ) : (
                    <li key={row.term} className="grid gap-2 py-4 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-6">
                      {resource.code
                        ? <code className="self-start whitespace-pre-wrap break-words rounded-lg bg-[#eff6ff] px-3 py-2 font-mono text-[13px] leading-5 text-blue-950">{row.term}</code>
                        : <span className="font-bold text-[#0f172a]">{row.term}</span>}
                      <span className="text-sm leading-6 text-slate-600">{row.text}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <section>
          <h2 className="mb-5 text-2xl font-extrabold" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.others}</h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {others.map((other) => (
              <li key={other.id}>
                <NextLink href={getPathname({ locale, href: resourceHref(other, locale) })} className="group flex items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,.05)] transition hover:shadow-[0_14px_32px_rgba(37,99,235,.12)]">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#eff6ff] text-blue-700"><ResourceKindIcon kind={other.kind} className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-[#0f172a]">{other[locale].title}</span>
                    <span className="block text-xs font-semibold uppercase tracking-[.1em] text-slate-500">{t.kinds[other.kind]}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-blue-600 transition-transform group-hover:translate-x-1" />
                </NextLink>
              </li>
            ))}
          </ul>
        </section>

        <ServicesCallout eyebrow={t.ctaEyebrow} title={t.ctaTitle} text={t.ctaText} button={t.ctaButton} />
      </main>
    </div>
  );
}
