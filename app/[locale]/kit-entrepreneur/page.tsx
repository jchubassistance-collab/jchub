import NextLink from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Briefcase, Check, FolderOpen, Gift, Palette, Receipt, Store, Sparkles } from 'lucide-react';
import { getPublishedTools, localizeTool, toolPath, type Tool } from '@/lib/tools';
import { pageMetadata } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import { isLocale, type Locale } from '@/i18n/routing';

/**
 * The shopkeeper's needs, each with the tools that answer it. Only slugs live here: names,
 * icons and translations come from the catalog, and a tool not yet published is left out.
 */
const NEEDS = [
  { icon: Palette, slugs: ['logo-studio', 'convertisseur-couleurs'] },
  { icon: Receipt, slugs: ['generateur-facture'] },
  { icon: Store, slugs: ['generateur-de-qr-code', 'redimensionneur-recadreur-images', 'optimiseur-convertisseur-webp-png'] },
  { icon: FolderOpen, slugs: ['fusionner-decouper-pdf', 'compresser-pdf', 'images-en-pdf', 'ocr-image-en-texte', 'word-to-pdf'] },
  { icon: Briefcase, slugs: ['generateur-cv'] },
];

/** Step-by-step paths through the tools. A scenario with fewer than two live steps is hidden. */
const SCENARIOS = [
  ['logo-studio', 'generateur-de-qr-code', 'redimensionneur-recadreur-images'],
  ['generateur-facture', 'compresser-pdf'],
  ['ocr-image-en-texte', 'images-en-pdf', 'fusionner-decouper-pdf'],
];

const copy = bilingual({
  metaTitle: 'Kit entrepreneur : outils gratuits pour ton commerce',
  metaDescription: 'Logo, factures en FCFA, QR code, photos produits, PDF : les outils gratuits de JcHub rangés selon les besoins d’un commerce, avec des parcours pas à pas.',
  eyebrow: 'Gratuit, sans inscription',
  titleStart: 'Le kit pour lancer ',
  titleHighlight: 'et gérer ton commerce.',
  intro: 'Logo, factures, QR code, photos de produits, documents : les outils de JcHub rangés selon ce dont ton activité a besoin. Suis un parcours ou pioche directement l’outil qu’il te faut.',
  seeScenarios: 'Voir les parcours',
  customSite: 'Créer mon site sur mesure',
  perks: ['Tout est gratuit', 'Rien à installer', 'Factures en FCFA'],
  scenariosBadge: 'PAS À PAS',
  scenariosTitle: 'Choisis ce que tu veux faire.',
  scenariosText: 'Chaque parcours enchaîne les bons outils dans le bon ordre.',
  scenarios: [
    {
      title: 'J’ouvre ma boutique',
      text: 'Une identité, un moyen simple de te contacter et des photos qui donnent envie.',
      steps: ['Crée ou retouche ton logo.', 'Fais un QR code vers ton WhatsApp ou ta page, à afficher en boutique.', 'Mets-les au bon format pour tes réseaux.'],
    },
    {
      title: 'Je fais ma première facture',
      text: 'Une facture propre en FCFA, prête à envoyer.',
      steps: ['Remplis ta facture et télécharge-la en PDF.', 'Allège le PDF pour l’envoyer par WhatsApp ou par e-mail.'],
    },
    {
      title: 'Je numérise mes papiers',
      text: 'Tes documents papier rangés dans un seul fichier, faciles à retrouver.',
      steps: ['Récupère le texte d’un papier photographié.', 'Transforme tes photos de documents en PDF.', 'Rassemble tout en un seul fichier.'],
    },
  ],
  needsBadge: 'PAR BESOIN',
  needsTitle: 'Tous les outils du kit.',
  needs: [
    { title: 'Créer mon identité', text: 'Un logo net et des couleurs cohérentes partout.' },
    { title: 'Facturer mes clients', text: 'Des factures claires, en FCFA ou dans une autre devise.' },
    { title: 'Être visible', text: 'Ton menu, ta vitrine et tes réseaux, avec des visuels soignés.' },
    { title: 'Gérer mes documents', text: 'Fusionner, compresser, convertir et numériser tes PDF.' },
    { title: 'Recruter ou postuler', text: 'Un CV clair, prêt à imprimer ou à envoyer.' },
  ],
  use: 'Utiliser',
  ctaEyebrow: 'Besoin de plus qu’un outil ?',
  ctaTitle: 'Je crée ton site sur mesure.',
  ctaText: 'Site vitrine, réservation en ligne, outil de gestion : un site qui travaille pour ton activité.',
  ctaButton: 'Voir les services',
}, {
  metaTitle: 'Business kit: free tools for your shop',
  metaDescription: 'Logo, invoices, QR code, product photos, PDF: JcHub’s free tools sorted by what a small business needs, with step-by-step paths.',
  eyebrow: 'Free, no sign-up',
  titleStart: 'The kit to launch ',
  titleHighlight: 'and run your business.',
  intro: 'Logo, invoices, QR code, product photos, documents: JcHub’s tools sorted by what your business needs. Follow a path or go straight to the tool you need.',
  seeScenarios: 'See the paths',
  customSite: 'Get a custom website',
  perks: ['Everything is free', 'Nothing to install', 'Invoices in any currency'],
  scenariosBadge: 'STEP BY STEP',
  scenariosTitle: 'Pick what you want to do.',
  scenariosText: 'Each path takes you through the right tools in the right order.',
  scenarios: [
    {
      title: 'I’m opening my shop',
      text: 'An identity, an easy way to reach you and photos that make people want to buy.',
      steps: ['Create or edit your logo.', 'Make a QR code to your WhatsApp or page, to display in your shop.', 'Resize them for your social networks.'],
    },
    {
      title: 'I’m sending my first invoice',
      text: 'A clean invoice, ready to send.',
      steps: ['Fill in your invoice and download it as a PDF.', 'Make the PDF lighter to send it by WhatsApp or email.'],
    },
    {
      title: 'I’m going paperless',
      text: 'Your paper documents gathered in one file, easy to find.',
      steps: ['Get the text from a photographed document.', 'Turn your document photos into a PDF.', 'Put everything together in one file.'],
    },
  ],
  needsBadge: 'BY NEED',
  needsTitle: 'Every tool in the kit.',
  needs: [
    { title: 'Build my identity', text: 'A sharp logo and consistent colors everywhere.' },
    { title: 'Invoice my customers', text: 'Clear invoices in the currency you use.' },
    { title: 'Get noticed', text: 'Your menu, your storefront and your social networks, with polished visuals.' },
    { title: 'Manage my documents', text: 'Merge, compress, convert and digitize your PDFs.' },
    { title: 'Hire or apply', text: 'A clear resume, ready to print or send.' },
  ],
  use: 'Use',
  ctaEyebrow: 'Need more than a tool?',
  ctaTitle: 'I build your custom website.',
  ctaText: 'Showcase site, online booking, management tool: a website that works for your business.',
  ctaButton: 'See the services',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, title: copy[locale].metaTitle, description: copy[locale].metaDescription, href: '/kit-entrepreneur' });
}

// Tools go live on their publication date: the kit fills up without a new deployment.
export const dynamic = 'force-dynamic';

export default async function BusinessKitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const published = new Map((await getPublishedTools()).map((tool) => [tool.slug, tool]));
  const needs = NEEDS
    .map((need, index) => ({ ...need, ...t.needs[index], tools: need.slugs.flatMap((slug) => published.get(slug) ?? []) }))
    .filter((need) => need.tools.length);
  const scenarios = SCENARIOS
    .map((slugs, index) => ({
      ...t.scenarios[index],
      steps: slugs.flatMap((slug, step) => {
        const tool = published.get(slug);
        return tool ? [{ tool, text: t.scenarios[index].steps[step] }] : [];
      }),
    }))
    .filter((scenario) => scenario.steps.length >= 2);

  return (
    <div className="template-home overflow-hidden bg-[#eff6ff] text-[#0f172a]" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(147,197,253,.48),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(191,219,254,.55),transparent_32%),#eff6ff]">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(rgba(37,99,235,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.045) 1px,transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse at center,black 20%,transparent 76%)' }} />
        <div className="pointer-events-none absolute -left-36 top-32 h-80 w-80 rounded-full bg-blue-200/70 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-5 pb-16 pt-14 text-center sm:px-8 sm:pb-20 lg:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-900 shadow-sm"><Gift className="h-4 w-4 text-blue-600" /> {t.eyebrow}</span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-[-.045em] sm:text-5xl lg:text-6xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>
            {t.titleStart}<span className="text-blue-700">{t.titleHighlight}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{t.intro}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#parcours" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#93c5fd] px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#60a5fa] hover:shadow-lg">{t.seeScenarios} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></a>
            <Link href="/services" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-blue-100 bg-white px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">{t.customSite} <ArrowRight className="h-4 w-4 text-blue-600" /></Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
            {t.perks.map((perk) => <span key={perk} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-blue-600" /> {perk}</span>)}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-20 px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        {scenarios.length > 0 && (
          <section id="parcours" className="scroll-mt-24 space-y-9">
            <div className="mx-auto max-w-2xl space-y-4 text-center"><Badge>{t.scenariosBadge}</Badge><h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.scenariosTitle}</h2><p className="leading-7 text-slate-600">{t.scenariosText}</p></div>
            <div className="grid gap-5 lg:grid-cols-3">
              {scenarios.map((scenario) => (
                <article key={scenario.title} className="flex flex-col rounded-[1.25rem] border border-blue-100 bg-white p-7 shadow-[0_2px_8px_rgba(15,23,42,.035)]">
                  <h3 className="text-xl font-bold" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{scenario.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{scenario.text}</p>
                  <ol className="mt-6 space-y-3">
                    {scenario.steps.map(({ tool, text }, index) => <ScenarioStep key={tool.slug} tool={tool} text={text} number={index + 1} locale={locale} />)}
                  </ol>
                </article>
              ))}
            </div>
          </section>
        )}

        <section id="outils" className="scroll-mt-24 space-y-9">
          <div className="mx-auto max-w-2xl space-y-4 text-center"><Badge>{t.needsBadge}</Badge><h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.needsTitle}</h2></div>
          <div className="space-y-10">
            {needs.map(({ icon: Icon, title, text, tools }) => (
              <div key={title}>
                <div className="mb-5 flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-blue-700 shadow-sm"><Icon className="h-5 w-5" /></span>
                  <div><h3 className="text-xl font-bold" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{title}</h3><p className="text-sm text-slate-600">{text}</p></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tools.map((featured) => {
                    const tool = localizeTool(featured, locale);
                    return (
                      <NextLink key={tool.slug} href={toolPath(featured, locale)} className="group flex flex-col rounded-[1.25rem] border border-blue-100/80 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,.035)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_44px_rgba(37,99,235,.12)]">
                        <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#eff6ff] text-2xl">{tool.icon}</span>
                        <span className="text-base font-bold text-[#0f172a]">{tool.name}</span>
                        <span className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{tool.description}</span>
                        <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700">{t.use} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                      </NextLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[1.75rem] bg-[#0f172a] px-7 py-10 text-white shadow-[0_24px_55px_rgba(15,23,42,.18)] sm:px-10 sm:py-14 lg:px-14">
          <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-blue-200"><Sparkles className="h-3.5 w-3.5" /> {t.ctaEyebrow}</span>
              <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.ctaTitle}</h2>
              <p className="mt-3 leading-7 text-slate-300">{t.ctaText}</p>
            </div>
            <Link href="/services" className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold text-[#0f172a] transition hover:-translate-y-0.5 hover:bg-blue-100">{t.ctaButton} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.12em] text-blue-800 shadow-sm">{children}</span>;
}

function ScenarioStep({ tool: featured, text, number, locale }: { tool: Tool; text: string; number: number; locale: Locale }) {
  const tool = localizeTool(featured, locale);
  return (
    <li>
      <NextLink href={toolPath(featured, locale)} className="group flex items-start gap-3 rounded-2xl bg-[#eff6ff] p-4 transition hover:bg-blue-100">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white" aria-hidden="true">{number}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-[#0f172a]">{tool.icon} {tool.name}</span>
          <span className="mt-1 block text-sm leading-6 text-slate-600">{text}</span>
        </span>
        <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-blue-600 transition-transform group-hover:translate-x-1" />
      </NextLink>
    </li>
  );
}
