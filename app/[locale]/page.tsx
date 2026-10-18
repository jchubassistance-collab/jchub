import Image from 'next/image';
import NextLink from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, Code2, Compass, Mail, ShieldCheck, Wrench, Zap } from 'lucide-react';
import { isToolVisibleToday, localizeTool, toolPath, tools } from '@/lib/tools';
import { Newsletter } from '@/components/Newsletter';
import { PartnerCarousel } from '@/components/home/PartnerCarousel';
import { pageMetadata } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import { isLocale, type StaticPathname } from '@/i18n/routing';

const copy = bilingual({
  metaTitle: 'Outils pratiques pour développeurs | JcHub',
  metaDescription: 'JcHub regroupe des outils gratuits, des ressources utiles et des workflows pratiques pour développeurs, créateurs et équipes.',
  eyebrow: 'Des outils utiles, accessibles tout de suite',
  titleStart: 'Découvre, utilise ',
  titleHighlight: 'et partage',
  titleEnd: ' des outils utiles.',
  intro: 'JcHub rassemble des outils pratiques et des ressources claires pour t’aider à avancer dans tes projets numériques, sans détour.',
  explore: 'Explorer les outils',
  learnMore: 'En savoir plus',
  perks: ['Des outils gratuits', 'Simples à utiliser', 'Pensés pour le quotidien'],
  imageAlt: 'Travail en équipe',
  badgeBottomLabel: 'Rapide à prendre en main',
  badgeBottomTitle: 'Un outil à la fois',
  badgeTopLabel: 'Un espace pratique',
  badgeTopTitle: 'Outils & ressources',
  partnersBadge: 'PARTENAIRES JCHUB',
  partnersTitle: 'Des talents qui font avancer le numérique.',
  becomePartner: 'Devenir partenaire',
  partnersLabel: 'Partenaires JcHub',
  officialSite: 'Site officiel',
  agency: 'Agence',
  njd: {
    description: 'Entreprise technologique africaine basée à Brazzaville, en République du Congo. Fondée par Jonas Ambeto, NJD Web conçoit des solutions numériques innovantes pour le marché mondial.',
    intro: 'Un écosystème tourné vers l’innovation, l’éducation et la transformation digitale :',
    items: [
      ['NJD Web Agency', 'agence web et applications sur mesure.'],
      ['Bibliothèque numérique', 'des eBooks gratuits en PDF.'],
      ['Academy & Community', 'formation et partage entre talents tech.'],
      ['NJD Web Apps, Business, Shop & Hosting', 'applications et services numériques.'],
    ] as [string, string][],
  },
  twoMd: {
    description: 'Créateur de contenu et graphiste numérique basé à Brazzaville, 2MD Designer réalise notamment des portraits personnalisés et des visuels graphiques.',
    studio: 'Studio de création graphique et de personnalisation : portraits sur mesure, objets personnalisés et créations graphiques professionnelles.',
    address: '165 rue Ndolo, arrêt Foulanguengue, quartier Mboualé / Petit Chose, Talangaï, près de l’agence MTN.',
    pricing: 'Portraits personnalisés dès 2 500 FCFA selon le format ; livraison à Brazzaville et expédition dans tout le Congo.',
    phone: 'Téléphone :',
  },
  quickAccess: 'Accès rapides',
  quickTools: ['Outils gratuits', 'Trouver une solution pratique'],
  quickContact: ['Parlons de ton projet', 'Une question ou une idée ?'],
  toolsEyebrow: 'OUTILS PRATIQUES',
  toolsTitleStart: 'Ce dont tu as besoin,',
  toolsTitleEnd: 'sans distraction.',
  allTools: 'Tous les outils',
  use: 'Utiliser',
  howEyebrow: 'COMMENT ÇA MARCHE',
  howTitle: 'Une expérience simple et efficace.',
  steps: [
    ['Explore', 'Trouve un outil qui répond à ton besoin du moment.'],
    ['Utilise', 'Suis les étapes et travaille directement avec la ressource choisie.'],
    ['Progresse', 'Garde le cap sur ton projet, sans perdre du temps à chercher.'],
  ] as [string, string][],
  whyEyebrow: 'POURQUOI JCHUB',
  whyTitle: 'Une plateforme utile, sans surplus.',
  whyText: 'Nous réunissons des outils clairs et des ressources pratiques pour faire avancer tes projets numériques plus sereinement.',
  benefits: ['Des outils gratuits à utiliser immédiatement', 'Des étapes simples pour résoudre un besoin précis', 'Des ressources pensées pour les projets numériques', 'Un accès direct aux outils, sans détour'],
  newsletterTitle: 'Une dose utile, pas de bruit.',
  newsletterText: 'Nouveaux outils, ressources utiles et conseils pratiques directement dans ta boîte mail.',
  unsubscribe: 'Tu peux te désinscrire à tout moment.',
  logo: (name: string) => `Logo ${name}`,
}, {
  metaTitle: 'Practical tools for developers | JcHub',
  metaDescription: 'JcHub brings together free tools, useful resources and practical workflows for developers, creators and teams.',
  eyebrow: 'Useful tools, ready to use right away',
  titleStart: 'Discover, use ',
  titleHighlight: 'and share',
  titleEnd: ' useful tools.',
  intro: 'JcHub brings together practical tools and clear resources to help you move your digital projects forward, without detours.',
  explore: 'Explore the tools',
  learnMore: 'Learn more',
  perks: ['Free tools', 'Easy to use', 'Built for everyday work'],
  imageAlt: 'Teamwork',
  badgeBottomLabel: 'Quick to get started',
  badgeBottomTitle: 'One tool at a time',
  badgeTopLabel: 'A practical space',
  badgeTopTitle: 'Tools & resources',
  partnersBadge: 'JCHUB PARTNERS',
  partnersTitle: 'Talented people moving digital forward.',
  becomePartner: 'Become a partner',
  partnersLabel: 'JcHub partners',
  officialSite: 'Official website',
  agency: 'Agency',
  njd: {
    description: 'African technology company based in Brazzaville, Republic of the Congo. Founded by Jonas Ambeto, NJD Web designs innovative digital solutions for the global market.',
    intro: 'An ecosystem focused on innovation, education and digital transformation:',
    items: [
      ['NJD Web Agency', 'custom web agency and applications.'],
      ['Digital library', 'free eBooks in PDF.'],
      ['Academy & Community', 'training and sharing between tech talents.'],
      ['NJD Web Apps, Business, Shop & Hosting', 'applications and digital services.'],
    ],
  },
  twoMd: {
    description: 'Content creator and digital graphic designer based in Brazzaville, 2MD Designer creates custom portraits and graphic visuals, among other things.',
    studio: 'Graphic design and customization studio: made-to-order portraits, personalized items and professional graphic creations.',
    address: '165 rue Ndolo, Foulanguengue stop, Mboualé / Petit Chose neighborhood, Talangaï, near the MTN agency.',
    pricing: 'Custom portraits from 2,500 FCFA depending on the size; delivery in Brazzaville and shipping across Congo.',
    phone: 'Phone:',
  },
  quickAccess: 'Quick access',
  quickTools: ['Free tools', 'Find a practical solution'],
  quickContact: ['Let’s talk about your project', 'A question or an idea?'],
  toolsEyebrow: 'PRACTICAL TOOLS',
  toolsTitleStart: 'What you need,',
  toolsTitleEnd: 'without distractions.',
  allTools: 'All tools',
  use: 'Use',
  howEyebrow: 'HOW IT WORKS',
  howTitle: 'A simple and effective experience.',
  steps: [
    ['Explore', 'Find a tool that meets your current need.'],
    ['Use', 'Follow the steps and work directly with the resource you chose.'],
    ['Progress', 'Stay focused on your project without wasting time searching.'],
  ],
  whyEyebrow: 'WHY JCHUB',
  whyTitle: 'A useful platform, without the clutter.',
  whyText: 'We bring together clear tools and practical resources to move your digital projects forward with peace of mind.',
  benefits: ['Free tools you can use immediately', 'Simple steps to solve a specific need', 'Resources designed for digital projects', 'Direct access to the tools, without detours'],
  newsletterTitle: 'A useful dose, no noise.',
  newsletterText: 'New tools, useful resources and practical tips straight to your inbox.',
  unsubscribe: 'You can unsubscribe at any time.',
  logo: (name: string) => `${name} logo`,
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, title: copy[locale].metaTitle, description: copy[locale].metaDescription, href: '/', absoluteTitle: true });
}

export const dynamic = 'force-dynamic';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const featuredTools = tools.filter((tool) => tool.status !== 'draft' && isToolVisibleToday(tool)).slice(0, 3);
  return (
    <div className="template-home overflow-hidden bg-[#eff6ff] text-[#0f172a]" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <section className="template-home__hero relative isolate overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(147,197,253,.48),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(191,219,254,.55),transparent_32%),#eff6ff]">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(rgba(37,99,235,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.045) 1px,transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse at center,black 20%,transparent 76%)' }} />
        <div className="pointer-events-none absolute -left-36 top-32 h-80 w-80 rounded-full bg-blue-200/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-sky-200/70 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-20 lg:min-h-[690px] lg:grid-cols-[1.05fr_.95fr] lg:gap-8 lg:px-10 lg:pb-24 lg:pt-16">
          <div className="template-home__intro order-2 max-w-2xl lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-900 shadow-sm shadow-blue-900/5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" /> {t.eyebrow}
            </div>
            <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-[-.045em] text-[#0f172a] sm:text-5xl lg:text-[4.25rem]" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>
              {t.titleStart}<span className="text-blue-700">{t.titleHighlight}</span>{t.titleEnd}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              {t.intro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/outils" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#93c5fd] px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#60a5fa] hover:shadow-lg hover:shadow-blue-900/10">
                <Wrench className="h-4 w-4" /> {t.explore} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/a-propos" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-blue-100 bg-white px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/10">
                {t.learnMore} <ArrowRight className="h-4 w-4 text-blue-600" />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
              {t.perks.map((perk) => <span key={perk} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-blue-600" /> {perk}</span>)}
            </div>
          </div>

          <div className="template-home__visual relative order-1 mx-auto flex w-full max-w-[510px] items-center justify-center lg:order-2 lg:justify-end">
            <div className="absolute inset-5 rounded-full bg-gradient-to-br from-blue-200 via-sky-100 to-blue-300 opacity-80 blur-2xl" />
            <span className="template-home__orbit template-home__orbit--one" aria-hidden="true" />
            <span className="template-home__orbit template-home__orbit--two" aria-hidden="true" />
            <span className="template-home__tech-dot template-home__tech-dot--one" aria-hidden="true" />
            <span className="template-home__tech-dot template-home__tech-dot--two" aria-hidden="true" />
            <span className="template-home__tech-dot template-home__tech-dot--three" aria-hidden="true" />
            <div className="template-home__circle relative aspect-square w-[min(82vw,400px)] rounded-full bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] p-[18px] shadow-[40px_40px_80px_rgba(37,99,235,.2),-15px_-15px_40px_rgba(255,255,255,.9)] ring-1 ring-white/60 sm:w-[440px] lg:w-[480px]">
              <div className="template-home__circle-image relative h-full w-full overflow-hidden rounded-full border-[10px] border-white bg-white shadow-inner">
                <Image src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=800&fit=crop" alt={t.imageAlt} fill priority fetchPriority="high" sizes="(max-width: 640px) 82vw, (max-width: 1024px) 440px, 480px" className="object-cover" />
              </div>
              <div className="template-home__badge template-home__badge--bottom absolute -bottom-1 left-0 flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-[0_16px_35px_rgba(15,23,42,.12)] sm:-left-8">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Zap className="h-5 w-5" /></span>
                <span><span className="block text-xs font-medium text-slate-500">{t.badgeBottomLabel}</span><strong className="mt-0.5 block text-sm text-[#0f172a]">{t.badgeBottomTitle}</strong></span>
              </div>
              <div className="template-home__badge template-home__badge--top absolute -right-1 top-7 hidden items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-[0_16px_35px_rgba(15,23,42,.12)] sm:flex">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><ShieldCheck className="h-5 w-5" /></span>
                <span><span className="block text-xs font-medium text-slate-500">{t.badgeTopLabel}</span><strong className="mt-0.5 block text-sm text-[#0f172a]">{t.badgeTopTitle}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="partners-title" className="template-home__partners relative overflow-hidden pb-20">
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Badge>{t.partnersBadge}</Badge>
              <h2 id="partners-title" className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-[#0f172a] sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>
                {t.partnersTitle}
              </h2>
            </div>
            <Link href="/contact" className="group inline-flex w-fit items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900">
              {t.becomePartner} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <PartnerCarousel label={t.partnersLabel}>
            <Partner
              name="NJD Web"
              logo="/partners/njdweb.svg"
              logoAlt={t.logo('NJD Web')}
              description={t.njd.description}
              details={
                <>
                  <p className="text-sm font-bold text-[#0f172a]">{t.njd.intro}</p>
                  <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-600">
                    {t.njd.items.map(([name, text]) => <li key={name}><strong className="text-slate-800">{name}</strong> — {text}</li>)}
                  </ul>
                </>
              }
              links={[
                { label: t.officialSite, href: 'https://www.njdwebs.com/' },
                { label: t.agency, href: 'https://www.instagram.com/njdwebs_com/' },
                { label: 'LinkedIn', href: 'https://cg.linkedin.com/company/njdweb' },
                { label: 'X', href: 'https://x.com/njdwebs' },
                { label: 'Facebook', href: 'https://www.facebook.com/njdwebs/' },
                { label: 'Jonas Ambeto', href: 'https://cg.linkedin.com/in/jonasambeto' },
              ]}
            />
            <Partner
              name="2MD Designer officiel"
              logo="/partners/2md_designer.png"
              logoAlt={t.logo('2MD Designer officiel')}
              description={t.twoMd.description}
              details={
                <>
                  <p className="text-sm leading-6 text-slate-600">{t.twoMd.studio}</p>
                  <p className="text-sm leading-6 text-slate-600">{t.twoMd.address}</p>
                  <p className="text-sm leading-6 text-slate-600">{t.twoMd.pricing}</p>
                  <p className="text-sm font-semibold text-slate-700">{t.twoMd.phone} <a className="text-blue-700 hover:underline" href="tel:+242064920849">+242 06 492 0849</a></p>
                </>
              }
              links={[
                { label: t.officialSite, href: 'https://2md-designer.com' },
                { label: 'Facebook', href: 'https://www.facebook.com/61585215170141/?locale=fa_IR' },
                { label: 'TikTok', href: 'https://www.tiktok.com/@2md.designer.offi' },
              ]}
            />
          </PartnerCarousel>
        </div>
      </section>
      <div className="mx-auto max-w-7xl space-y-20 px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <section aria-label={t.quickAccess} className="grid gap-4 sm:grid-cols-2 lg:max-w-4xl">
          <QuickLink href="/outils" icon={<Wrench className="h-5 w-5" />} title={t.quickTools[0]} meta={t.quickTools[1]} />
          <QuickLink href="/contact" icon={<Mail className="h-5 w-5" />} title={t.quickContact[0]} meta={t.quickContact[1]} />
        </section>

        <section className="space-y-9">
          <SectionTitle eyebrow={t.toolsEyebrow} title={<>{t.toolsTitleStart}<br /><span className="text-slate-500">{t.toolsTitleEnd}</span></>} action={t.allTools} href="/outils" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredTools.map((featured) => {
              const tool = localizeTool(featured, locale);
              return (
                <NextLink href={toolPath(featured, locale)} key={tool.slug} className="template-home__card group rounded-[1.25rem] border border-blue-100/80 bg-white p-7 shadow-[0_2px_8px_rgba(15,23,42,.035)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_44px_rgba(37,99,235,.12)]">
                  <span className="template-home__icon mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#eff6ff] text-3xl text-blue-700 transition duration-300 group-hover:rotate-[-4deg] group-hover:bg-blue-600 group-hover:text-white">{tool.icon}</span>
                  <span className="mb-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-800">{tool.category}</span>
                  <h3 className="mt-2 text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{tool.name}</h3>
                  <p className="mt-3 min-h-[3.5rem] text-sm leading-6 text-slate-600">{tool.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-700">{t.use} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </NextLink>
              );
            })}
          </div>
        </section>

        <section className="space-y-9">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <Badge>{t.howEyebrow}</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a] sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.howTitle}</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <Step number="01" title={t.steps[0][0]} text={t.steps[0][1]} icon={<Compass className="h-5 w-5" />} />
            <Step number="02" title={t.steps[1][0]} text={t.steps[1][1]} icon={<Zap className="h-5 w-5" />} />
            <Step number="03" title={t.steps[2][0]} text={t.steps[2][1]} icon={<Check className="h-5 w-5" />} />
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-blue-100 bg-white p-7 shadow-[0_10px_40px_rgba(37,99,235,.06)] sm:p-10 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="max-w-xl">
              <Badge>{t.whyEyebrow}</Badge>
              <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-[#0f172a] sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.whyTitle}</h2>
              <p className="mt-4 leading-7 text-slate-600">{t.whyText}</p>
            </div>
            <div className="space-y-3">
              <Benefit text={t.benefits[0]} icon={<ShieldCheck className="h-5 w-5" />} />
              <Benefit text={t.benefits[1]} icon={<Zap className="h-5 w-5" />} />
              <Benefit text={t.benefits[2]} icon={<Code2 className="h-5 w-5" />} />
              <Benefit text={t.benefits[3]} icon={<ArrowRight className="h-5 w-5" />} />
            </div>
          </div>
        </section>
        <section className="rounded-[1.75rem] border border-blue-100 bg-white p-7 shadow-[0_10px_40px_rgba(37,99,235,.06)] sm:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <Badge><Mail className="h-3.5 w-3.5" /> NEWSLETTER</Badge>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[#0f172a] sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.newsletterTitle}</h2>
            <p className="mt-3 leading-7 text-slate-600">{t.newsletterText}</p>
            <Newsletter appearance="light" />
            <p className="mt-3 text-xs text-slate-500">{t.unsubscribe}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.12em] text-blue-800 shadow-sm">{children}</span>;
}

function QuickLink({ href, icon, title, meta }: { href: StaticPathname; icon: React.ReactNode; title: string; meta: string }) {
  return <Link href={href} className="group flex items-center gap-4 rounded-[1.15rem] border border-blue-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/10">
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">{icon}</span>
    <span className="min-w-0 flex-1"><strong className="block text-sm font-bold text-[#0f172a]">{title}</strong><small className="mt-1 block text-xs text-slate-500">{meta}</small></span>
    <ArrowRight className="h-4 w-4 text-blue-600 transition-transform group-hover:translate-x-1" />
  </Link>;
}

function SectionTitle({ eyebrow, title, action, href }: { eyebrow: string; title: React.ReactNode; action: string; href: StaticPathname }) {
  return <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge>{eyebrow}</Badge><h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-[#0f172a] sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{title}</h2></div><Link href={href} className="group inline-flex w-fit items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900">{action}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></div>;
}

function Step({ number, title, text, icon }: { number: string; title: string; text: string; icon: React.ReactNode }) {
  return <article className="rounded-[1.25rem] border border-blue-100 bg-white p-7 shadow-[0_2px_8px_rgba(15,23,42,.035)] transition hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/10"><div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">{icon}</span><span className="text-4xl font-extrabold tracking-tight text-blue-100">{number}</span></div><h3 className="mt-7 text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>;
}

function Benefit({ text, icon }: { text: string; icon: React.ReactNode }) {
  return <div className="flex items-center gap-4 rounded-2xl bg-[#eff6ff] p-4 text-sm font-semibold text-[#0f172a]"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-blue-700 shadow-sm">{icon}</span>{text}</div>;
}

function Partner({
  name,
  logo,
  logoAlt,
  description,
  details,
  links,
}: {
  name: string;
  logo: string;
  logoAlt: string;
  description: string;
  details: React.ReactNode;
  links: { label: string; href: string }[];
}) {
  return (
    <article className="template-home__partner grid min-h-[320px] items-center gap-7 rounded-[1.25rem] border border-blue-100 bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-[minmax(0,1fr)_250px] lg:gap-8">
      <div className="min-w-0">
        <h3 className="text-lg font-bold text-[#0f172a]">{name}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-4 space-y-2">{details}</div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-4">
          {links.map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline">
              {label}
            </a>
          ))}
        </div>
      </div>
      <div className="relative mx-auto flex aspect-square w-full max-w-[250px] items-center justify-center rounded-2xl bg-[#eff6ff] p-7">
        <Image src={logo} alt={logoAlt} width={240} height={240} className="h-full w-full object-contain" />
      </div>
    </article>
  );
}
