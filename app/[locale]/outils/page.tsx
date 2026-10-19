import { notFound } from 'next/navigation';
import { ArrowRight, Check, Grid2X2, Lightbulb, ShieldCheck, Sparkles, Wrench, Zap } from 'lucide-react';
import { getPublishedTools, localizeTool, toolPath } from '@/lib/tools';
import { ToolsCatalog } from '@/components/tools/ToolsCatalog';
import { CategoryLinks } from '@/components/CategoryLinks';
import { categoryLabel, categorySlug, countByCategory } from '@/lib/categories';
import { pageMetadata } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import { isLocale } from '@/i18n/routing';

const copy = bilingual({
  metaTitle: 'Outils en ligne gratuits pour développeurs',
  metaDescription: 'Des outils numériques gratuits, pratiques et accessibles directement depuis ton navigateur.',
  eyebrow: 'Tous les outils en un seul endroit',
  titleStart: 'Des outils simples,',
  titleEnd: 'des résultats immédiats.',
  intro: 'Utilise-les directement dans ton navigateur : aucune installation, aucun compte, et un accès gratuit.',
  seeAll: 'Voir tous les outils',
  suggest: 'Suggérer un outil',
  perks: ['Résultats immédiats', 'Traitement privé', 'Accès gratuit'],
  imageAlt: 'Composants électroniques représentant les outils numériques',
  badgeInstant: 'Instantané',
  badgeNoWait: 'Sans attente',
  badgeSecure: 'Sécurisé',
  badgeProtected: 'Données protégées',
  library: 'Bibliothèque',
  libraryTitle: 'Tous les outils JcHub.',
  libraryText: 'Recherche un outil, filtre par catégorie et ouvre directement celui qui répond à ton besoin.',
  categoriesEyebrow: 'Catégories',
  categoriesTitle: 'Parcourir par catégorie.',
  categoriesLabel: 'Catégories d’outils',
  toolCount: (count: number) => `${count} outil${count > 1 ? 's' : ''}`,
  statsLabel: 'Les outils en chiffres',
  stats: ['Outils disponibles', 'Gratuits', 'Inscription requise', 'Utilisations'],
  faqTitle: 'Questions fréquentes.',
  faq: [
    ['Les outils sont-ils vraiment gratuits ?', 'Oui, les outils JcHub sont gratuits. Aucune inscription n’est nécessaire pour les utiliser.'],
    ['Mes données sont-elles envoyées sur un serveur ?', 'La plupart des outils fonctionnent directement dans ton navigateur. La page de chaque outil précise son fonctionnement.'],
    ['Puis-je proposer un nouvel outil ?', 'Oui. Envoie-nous ton idée depuis la page Contact et nous l’étudierons.'],
    ['Les outils fonctionnent-ils hors ligne ?', 'Certains outils peuvent continuer à fonctionner après le chargement de la page. Cela dépend de l’outil utilisé.'],
  ] as [string, string][],
  ideaEyebrow: 'Une idée en tête ?',
  ideaTitleStart: 'Propose-nous le prochain outil,',
  ideaTitleEnd: 'on le construit ensemble.',
  contactUs: 'Nous contacter',
}, {
  metaTitle: 'Free online tools for developers',
  metaDescription: 'Free, practical digital tools you can use right in your browser.',
  eyebrow: 'All the tools in one place',
  titleStart: 'Simple tools,',
  titleEnd: 'instant results.',
  intro: 'Use them right in your browser: nothing to install, no account, and free access.',
  seeAll: 'See all the tools',
  suggest: 'Suggest a tool',
  perks: ['Instant results', 'Private processing', 'Free access'],
  imageAlt: 'Electronic components representing digital tools',
  badgeInstant: 'Instant',
  badgeNoWait: 'No waiting',
  badgeSecure: 'Secure',
  badgeProtected: 'Protected data',
  library: 'Library',
  libraryTitle: 'All JcHub tools.',
  libraryText: 'Search for a tool, filter by category and open the one that fits your need.',
  categoriesEyebrow: 'Categories',
  categoriesTitle: 'Browse by category.',
  categoriesLabel: 'Tool categories',
  toolCount: (count: number) => `${count} tool${count === 1 ? '' : 's'}`,
  statsLabel: 'The tools in numbers',
  stats: ['Tools available', 'Free', 'Sign-up required', 'Uses'],
  faqTitle: 'Frequently asked questions.',
  faq: [
    ['Are the tools really free?', 'Yes, JcHub tools are free. You don’t need to sign up to use them.'],
    ['Is my data sent to a server?', 'Most tools work right in your browser. Each tool’s page explains how it works.'],
    ['Can I suggest a new tool?', 'Yes. Send us your idea from the Contact page and we’ll look into it.'],
    ['Do the tools work offline?', 'Some tools can keep working once the page has loaded. It depends on the tool you use.'],
  ],
  ideaEyebrow: 'Got an idea?',
  ideaTitleStart: 'Suggest the next tool,',
  ideaTitleEnd: 'we’ll build it together.',
  contactUs: 'Contact us',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, title: copy[locale].metaTitle, description: copy[locale].metaDescription, href: '/outils' });
}

export default async function ToolsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const publishedTools = await getPublishedTools();
  const tools = publishedTools.map((tool) => ({ ...localizeTool(tool, locale), href: toolPath(tool, locale) }));
  const categories = countByCategory(publishedTools.map((tool) => tool.category));
  const { q = '' } = await searchParams;

  return (
    <div className="template-home template-tools-page overflow-hidden bg-[#eff6ff] text-[#0f172a]" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <section className="template-home__hero relative isolate overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(147,197,253,.48),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(191,219,254,.55),transparent_32%),#eff6ff]">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(rgba(37,99,235,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.045) 1px,transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse at center,black 20%,transparent 76%)' }} />
        <div className="pointer-events-none absolute -left-36 top-32 h-80 w-80 rounded-full bg-blue-200/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-sky-200/70 blur-3xl" />
        <span className="template-tools__dot template-tools__dot--one" aria-hidden="true" /><span className="template-tools__dot template-tools__dot--two" aria-hidden="true" /><span className="template-tools__dot template-tools__dot--three" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-20 lg:min-h-[690px] lg:grid-cols-[1.05fr_.95fr] lg:gap-8 lg:px-10 lg:pb-24 lg:pt-20">
          <div className="template-home__intro order-2 max-w-2xl lg:order-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-900 shadow-sm"><span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" /> {t.eyebrow}</span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-[-.045em] sm:text-5xl lg:text-[4.25rem]" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.titleStart}<br /><span className="text-blue-700">{t.titleEnd}</span></h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">{t.intro}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#tools" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#93c5fd] px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#60a5fa] hover:shadow-lg"><Grid2X2 className="h-4 w-4" /> {t.seeAll} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></a>
              <Link href="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-blue-100 bg-white px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><Lightbulb className="h-4 w-4 text-blue-600" /> {t.suggest}</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
              <span className="inline-flex items-center gap-2"><Zap className="h-4 w-4 text-blue-600" /> {t.perks[0]}</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-600" /> {t.perks[1]}</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-blue-600" /> {t.perks[2]}</span>
            </div>
          </div>

          <div className="template-home__visual relative order-1 mx-auto flex w-full max-w-[510px] items-center justify-center lg:order-2 lg:justify-end">
            <div className="absolute inset-5 rounded-full bg-gradient-to-br from-blue-200 via-sky-100 to-blue-300 opacity-80 blur-2xl" />
            <span className="template-home__orbit template-home__orbit--one" aria-hidden="true" /><span className="template-home__orbit template-home__orbit--two" aria-hidden="true" />
            <span className="template-home__tech-dot template-home__tech-dot--one" aria-hidden="true" /><span className="template-home__tech-dot template-home__tech-dot--two" aria-hidden="true" /><span className="template-home__tech-dot template-home__tech-dot--three" aria-hidden="true" />
            <div className="template-tools__cube template-tools__cube--one" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span key={index} />)}</div>
            <div className="template-tools__cube template-tools__cube--two" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span key={index} />)}</div>
            <div className="template-home__circle relative aspect-square w-[min(82vw,340px)] rounded-full bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] p-[18px] shadow-[40px_40px_80px_rgba(37,99,235,.2),-15px_-15px_40px_rgba(255,255,255,.9)] ring-1 ring-white/60 sm:w-[380px] lg:w-[440px]">
              <div className="template-home__circle-image relative h-full w-full overflow-hidden rounded-full border-[10px] border-white bg-white shadow-inner"><img src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&h=900&fit=crop" alt={t.imageAlt} className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" /></div>
              <div className="template-home__badge template-home__badge--bottom absolute -bottom-1 left-0 flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-[0_16px_35px_rgba(15,23,42,.12)] sm:-left-8"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Zap className="h-5 w-5" /></span><span><span className="block text-xs font-medium text-slate-500">{t.badgeInstant}</span><strong className="mt-0.5 block text-sm text-[#0f172a]">{t.badgeNoWait}</strong></span></div>
              <div className="template-home__badge template-home__badge--top absolute -right-1 top-7 hidden items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-[0_16px_35px_rgba(15,23,42,.12)] sm:flex"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><ShieldCheck className="h-5 w-5" /></span><span><span className="block text-xs font-medium text-slate-500">{t.badgeSecure}</span><strong className="mt-0.5 block text-sm text-[#0f172a]">{t.badgeProtected}</strong></span></div>
            </div>
          </div>
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-7xl scroll-mt-24 px-5 pb-14 sm:px-8 lg:px-10 lg:pb-20">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3"><Badge>{t.library}</Badge><h2 className="text-3xl font-extrabold leading-tight sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.libraryTitle}</h2><p className="max-w-xl text-sm leading-6 text-slate-600">{t.libraryText}</p></div>
        </div>
        <ToolsCatalog tools={tools} initialQuery={q} />
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10 lg:pb-20">
        <div className="mb-6 space-y-3"><Badge>{t.categoriesEyebrow}</Badge><h2 className="text-3xl font-extrabold leading-tight sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.categoriesTitle}</h2></div>
        <CategoryLinks
          label={t.categoriesLabel}
          items={categories.map((item) => ({
            key: item.category,
            href: { pathname: '/outils/categorie/[category]', params: { category: categorySlug(item.category, locale) } },
            label: categoryLabel(item.category, locale),
            detail: t.toolCount(item.count),
            icon: publishedTools.find((tool) => tool.category === item.category)?.icon ?? <Wrench className="h-5 w-5" />,
          }))}
        />
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10 lg:pb-20" aria-label={t.statsLabel}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5"><Stat value={String(tools.length)} label={t.stats[0]} /><Stat value={locale === 'en' ? '100%' : '100 %'} label={t.stats[1]} /><Stat value="0" label={t.stats[2]} /><Stat value="∞" label={t.stats[3]} /></div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-16 sm:px-8 lg:pb-20">
        <div className="mb-10 space-y-4 text-center"><Badge>FAQ</Badge><h2 className="text-3xl font-extrabold sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.faqTitle}</h2></div>
        <div className="divide-y divide-blue-100 rounded-[1.5rem] border border-blue-100 bg-white p-6 shadow-[0_10px_40px_rgba(37,99,235,.06)] sm:p-9">
          {t.faq.map(([question, answer]) => <Faq key={question} question={question}>{answer}</Faq>)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10 lg:pb-20">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-[#0f172a] px-7 py-10 text-white shadow-[0_24px_55px_rgba(15,23,42,.18)] sm:px-10 sm:py-14 lg:px-14"><div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" /><div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between"><div className="max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-blue-200"><Sparkles className="h-3.5 w-3.5" /> {t.ideaEyebrow}</span><h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.ideaTitleStart}<br />{t.ideaTitleEnd}</h2></div><Link href="/contact" className="group inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold text-[#0f172a] transition hover:-translate-y-0.5 hover:bg-blue-100">{t.contactUs} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></div></div>
      </section>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.12em] text-blue-800 shadow-sm">{children}</span>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="template-tools__stat rounded-[20px] border border-blue-100 bg-white p-5 text-center shadow-[0_2px_6px_rgba(15,23,42,.04)] sm:p-7"><p className="text-3xl font-extrabold text-blue-700 sm:text-4xl">{value}</p><p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p></div>;
}

function Faq({ question, children }: { question: string; children: React.ReactNode }) {
  return <details className="template-tools__faq py-5 first:pt-0 last:pb-0"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-[#0f172a]">{question}<span className="text-xl text-blue-600 transition-transform">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{children}</p></details>;
}
