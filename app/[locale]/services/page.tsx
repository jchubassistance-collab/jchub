import { notFound } from 'next/navigation';
import { ArrowRight, Check, ChevronDown, Code2, FileText, Gift, Globe, Handshake, LayoutDashboard, Mail, MessageCircle, Rocket, Sparkles, Wrench, Workflow } from 'lucide-react';
import { getPublishedTools } from '@/lib/tools';
import { pageMetadata } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import { isLocale } from '@/i18n/routing';

/** Same number as the WhatsApp link of the contact page. */
const WHATSAPP_NUMBER = '242044793800';

const copy = bilingual({
  metaTitle: 'Création de sites web et d’applications à Brazzaville',
  metaDescription: 'Site vitrine, application web, outil interne ou automatisation : je crée des sites sur mesure pour les commerces, restaurants, églises et associations. Devis gratuit.',
  eyebrow: 'Sites et applications sur mesure',
  titleStart: 'Ton activité mérite ',
  titleHighlight: 'd’être trouvée en ligne.',
  intro: 'Je conçois des sites et des outils web pour les commerces, restaurants, salons, églises et associations. Tu m’expliques ton besoin, je m’occupe du reste, de la première page jusqu’à la mise en ligne.',
  whatsapp: 'Écrire sur WhatsApp',
  whatsappMessage: 'Bonjour, je voudrais un devis pour un site ou une application.',
  quote: 'Demander un devis',
  perks: ['Devis gratuit', 'Adapté au téléphone', 'Accompagnement après la mise en ligne'],
  offersBadge: 'LES OFFRES',
  offersTitle: 'Quatre façons de faire avancer ton activité.',
  offersText: 'Chaque projet est différent : le prix dépend de ce dont tu as besoin, et tu le connais avant de t’engager.',
  forWho: 'Pour qui :',
  price: 'Sur devis',
  offers: [
    {
      title: 'Site vitrine',
      forWho: 'Commerces, restaurants, salons, églises, associations.',
      includes: ['Quelques pages : accueil, services, galerie, contact', 'Bouton WhatsApp et carte Google Maps', 'Référencement local sur Google', 'Lisible sur téléphone comme sur ordinateur'],
    },
    {
      title: 'Application web',
      forWho: 'Activités qui ont un besoin plus précis qu’une simple vitrine.',
      includes: ['Réservation ou prise de rendez-vous', 'Catalogue de produits', 'Espace membres', 'Tableau de bord'],
    },
    {
      title: 'Outil interne',
      forWho: 'Équipes qui partagent encore un fichier Excel.',
      includes: ['Stock, suivi de clients, contrats', 'Un compte par personne, avec ses droits', 'Une seule version à jour des données', 'Historique de qui a modifié quoi'],
    },
    {
      title: 'Automatisation',
      forWho: 'Tous ceux qui refont les mêmes tâches chaque semaine.',
      includes: ['Formulaires qui envoient des e-mails', 'Rapports générés automatiquement', 'Outils qui se transmettent les données', 'Moins de copier-coller, moins d’erreurs'],
    },
  ],
  maintenanceTitle: 'Et après la mise en ligne ?',
  maintenanceText: 'Un forfait mensuel de maintenance couvre l’hébergement, les mises à jour et les petites modifications. Ton site reste à jour sans que tu aies à t’en occuper.',
  proofBadge: 'LA PREUVE',
  proofTitle: 'Tu peux tester mon travail en direct.',
  proofText: (count: number) => `JcHub, le site sur lequel tu te trouves, et ses ${count} outils ont été conçus et développés par moi : de l’interface jusqu’au serveur.`,
  proofPoints: ['Disponible en français et en anglais', 'Pensé pour le téléphone', 'Comptes utilisateurs, blog et espace d’administration'],
  proofSignature: 'Jessy Ngnambongo, fondateur et développeur de JcHub',
  tryTools: 'Tester les outils',
  kitTitle: 'Le kit entrepreneur, offert à tous',
  kitText: 'Logo, factures, QR code, photos produits : les outils gratuits pour ton commerce, en attendant ton site.',
  kitLink: 'Voir le kit',
  processBadge: 'COMMENT ÇA SE PASSE',
  processTitle: 'Quatre étapes, sans surprise.',
  process: [
    ['Échange', 'Tu me présentes ton activité et ce que tu attends du site, sur WhatsApp ou par le formulaire.'],
    ['Devis', 'Je te propose un devis écrit : contenu, prix, délai et modalités de paiement.'],
    ['Réalisation', 'Je construis le site et je te le montre en cours de route pour l’ajuster.'],
    ['Mise en ligne', 'Le site est publié, et je reste disponible pour la suite.'],
  ] as [string, string][],
  faqBadge: 'QUESTIONS FRÉQUENTES',
  faqTitle: 'Ce qu’on me demande souvent.',
  faq: [
    ['Combien de temps faut-il ?', 'Cela dépend de la taille du projet. Le délai est fixé dans le devis, avant de commencer.'],
    ['Combien de modifications sont incluses ?', 'Le nombre de séries de modifications est précisé dans le devis. Tu vois le site avant sa mise en ligne pour demander les ajustements.'],
    ['Qui s’occupe de l’hébergement et du nom de domaine ?', 'Je peux m’en charger avec le forfait de maintenance, ou travailler avec ceux que tu as déjà.'],
    ['Comment se passe le paiement ?', 'Les modalités (acompte, échéances, moyen de paiement) sont indiquées dans le devis, avant tout début de travaux.'],
    ['Je n’ai pas encore de textes ni de photos, c’est un problème ?', 'Non. On en parle pendant l’échange : je t’aide à préparer le contenu, et les outils gratuits de JcHub peuvent déjà servir pour ton logo et tes photos.'],
  ] as [string, string][],
  ctaEyebrow: 'Parlons de ton projet',
  ctaTitle: 'Un message suffit pour commencer.',
  ctaText: 'Beaucoup de clients préfèrent WhatsApp : écris-moi directement, ou passe par le formulaire si tu préfères l’e-mail.',
  form: 'Utiliser le formulaire',
}, {
  metaTitle: 'Custom websites and web apps',
  metaDescription: 'Showcase site, web app, internal tool or automation: I build custom websites for shops, restaurants, churches and associations. Free quote.',
  eyebrow: 'Custom websites and apps',
  titleStart: 'Your business deserves ',
  titleHighlight: 'to be found online.',
  intro: 'I design websites and web tools for shops, restaurants, salons, churches and associations. You tell me what you need, I take care of the rest, from the first page to going live.',
  whatsapp: 'Message on WhatsApp',
  whatsappMessage: 'Hello, I would like a quote for a website or an app.',
  quote: 'Request a quote',
  perks: ['Free quote', 'Works on phones', 'Support after launch'],
  offersBadge: 'THE OFFERS',
  offersTitle: 'Four ways to move your business forward.',
  offersText: 'Every project is different: the price depends on what you need, and you know it before you commit.',
  forWho: 'For:',
  price: 'Quote on request',
  offers: [
    {
      title: 'Showcase website',
      forWho: 'Shops, restaurants, salons, churches, associations.',
      includes: ['A few pages: home, services, gallery, contact', 'WhatsApp button and Google Maps', 'Local search on Google', 'Easy to read on phones and computers'],
    },
    {
      title: 'Web application',
      forWho: 'Businesses that need more than a showcase.',
      includes: ['Booking or appointments', 'Product catalog', 'Members area', 'Dashboard'],
    },
    {
      title: 'Internal tool',
      forWho: 'Teams still sharing an Excel file.',
      includes: ['Stock, customer follow-up, contracts', 'One account per person, with its own rights', 'One up-to-date version of the data', 'History of who changed what'],
    },
    {
      title: 'Automation',
      forWho: 'Anyone who repeats the same tasks every week.',
      includes: ['Forms that send emails', 'Reports generated automatically', 'Tools that pass data to each other', 'Less copy-paste, fewer mistakes'],
    },
  ],
  maintenanceTitle: 'And after launch?',
  maintenanceText: 'A monthly maintenance plan covers hosting, updates and small changes. Your site stays up to date without you having to deal with it.',
  proofBadge: 'THE PROOF',
  proofTitle: 'You can try my work right now.',
  proofText: (count: number) => `JcHub, the site you are on, and its ${count} tools were designed and built by me, from the interface to the server.`,
  proofPoints: ['Available in French and English', 'Built for phones', 'User accounts, blog and admin area'],
  proofSignature: 'Jessy Ngnambongo, founder and developer of JcHub',
  tryTools: 'Try the tools',
  kitTitle: 'The business kit, free for everyone',
  kitText: 'Logo, invoices, QR code, product photos: free tools for your shop while your site is being built.',
  kitLink: 'See the kit',
  processBadge: 'HOW IT WORKS',
  processTitle: 'Four steps, no surprises.',
  process: [
    ['Talk', 'You tell me about your business and what you expect from the site, on WhatsApp or through the form.'],
    ['Quote', 'I send you a written quote: content, price, timeline and payment terms.'],
    ['Build', 'I build the site and show it to you along the way to adjust it.'],
    ['Launch', 'The site goes live, and I stay available for what comes next.'],
  ],
  faqBadge: 'FAQ',
  faqTitle: 'What people often ask me.',
  faq: [
    ['How long does it take?', 'It depends on the size of the project. The timeline is set in the quote, before work starts.'],
    ['How many changes are included?', 'The number of revision rounds is stated in the quote. You see the site before it goes live to ask for adjustments.'],
    ['Who takes care of hosting and the domain name?', 'I can handle them with the maintenance plan, or work with the ones you already have.'],
    ['How does payment work?', 'The terms (deposit, installments, payment method) are stated in the quote, before any work starts.'],
    ['I don’t have texts or photos yet. Is that a problem?', 'No. We talk about it at the start: I help you prepare the content, and JcHub’s free tools can already help with your logo and photos.'],
  ],
  ctaEyebrow: 'Let’s talk about your project',
  ctaTitle: 'One message is enough to get started.',
  ctaText: 'Many clients prefer WhatsApp: message me directly, or use the form if you prefer email.',
  form: 'Use the form',
});

const offerIcons = [Globe, LayoutDashboard, FileText, Workflow];
const processIcons = [MessageCircle, Handshake, Code2, Rocket];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, title: copy[locale].metaTitle, description: copy[locale].metaDescription, href: '/services' });
}

// The tool count follows the catalog: tools go live on their publication date.
export const dynamic = 'force-dynamic';

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const publishedTools = await getPublishedTools();
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t.whatsappMessage)}`;

  return (
    <div className="template-home overflow-hidden bg-[#eff6ff] text-[#0f172a]" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(147,197,253,.48),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(191,219,254,.55),transparent_32%),#eff6ff]">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(rgba(37,99,235,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.045) 1px,transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse at center,black 20%,transparent 76%)' }} />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-sky-200/70 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-5 pb-16 pt-14 text-center sm:px-8 sm:pb-20 lg:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-900 shadow-sm"><span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" /> {t.eyebrow}</span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-[-.045em] sm:text-5xl lg:text-6xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>
            {t.titleStart}<span className="text-blue-700">{t.titleHighlight}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{t.intro}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <WhatsAppButton href={whatsappHref} label={t.whatsapp} />
            <Link href="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-blue-100 bg-white px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><Mail className="h-4 w-4 text-blue-600" /> {t.quote}</Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
            {t.perks.map((perk) => <span key={perk} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-blue-600" /> {perk}</span>)}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-20 px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <section className="space-y-9">
          <div className="mx-auto max-w-2xl space-y-4 text-center"><Badge>{t.offersBadge}</Badge><h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.offersTitle}</h2><p className="leading-7 text-slate-600">{t.offersText}</p></div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {t.offers.map((offer, index) => {
              const Icon = offerIcons[index];
              return (
                <article key={offer.title} className="flex flex-col rounded-[1.25rem] border border-blue-100 bg-white p-7 shadow-[0_2px_8px_rgba(15,23,42,.035)]">
                  <span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" /></span>
                  <h3 className="text-xl font-bold" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{offer.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600"><strong className="text-slate-800">{t.forWho}</strong> {offer.forWho}</p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {offer.includes.map((item) => <li key={item} className="flex gap-2.5 text-sm leading-6 text-slate-700"><Check className="mt-1 h-4 w-4 shrink-0 text-blue-600" />{item}</li>)}
                  </ul>
                  <p className="mt-6 border-t border-blue-50 pt-4 text-sm font-extrabold text-blue-700">{t.price}</p>
                </article>
              );
            })}
          </div>
          <div className="flex flex-col gap-4 rounded-[1.25rem] border border-blue-100 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,.035)] sm:flex-row sm:items-center sm:p-7">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white"><Wrench className="h-5 w-5" /></span>
            <div><h3 className="font-bold">{t.maintenanceTitle}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{t.maintenanceText}</p></div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-[1.75rem] border border-blue-100 bg-white p-7 shadow-[0_10px_40px_rgba(37,99,235,.06)] sm:p-10">
            <Badge>{t.proofBadge}</Badge>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.proofTitle}</h2>
            <p className="mt-4 leading-7 text-slate-600">{t.proofText(publishedTools.length)}</p>
            <ul className="mt-6 space-y-2.5">
              {t.proofPoints.map((point) => <li key={point} className="flex items-center gap-2.5 text-sm font-semibold text-slate-700"><Check className="h-4 w-4 shrink-0 text-blue-600" />{point}</li>)}
            </ul>
            <p className="mt-6 text-sm italic text-slate-500">{t.proofSignature}</p>
            <Link href="/outils" className="group mt-6 inline-flex items-center gap-2 rounded-full bg-[#93c5fd] px-6 py-3 text-sm font-bold text-[#0f172a] transition hover:-translate-y-0.5 hover:bg-[#60a5fa]">{t.tryTools} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
          </div>
          <div className="flex flex-col justify-between rounded-[1.75rem] bg-blue-600 p-7 text-white shadow-[0_10px_40px_rgba(37,99,235,.2)] sm:p-10">
            <div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><Gift className="h-5 w-5" /></span>
              <h2 className="mt-5 text-2xl font-extrabold leading-tight" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.kitTitle}</h2>
              <p className="mt-3 leading-7 text-blue-50">{t.kitText}</p>
            </div>
            <Link href="/kit-entrepreneur" className="group mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-blue-800 transition hover:-translate-y-0.5 hover:bg-blue-50">{t.kitLink} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
          </div>
        </section>

        <section className="space-y-9">
          <div className="mx-auto max-w-2xl space-y-4 text-center"><Badge>{t.processBadge}</Badge><h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.processTitle}</h2></div>
          <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {t.process.map(([title, text], index) => {
              const Icon = processIcons[index];
              return (
                <li key={title} className="rounded-[1.25rem] border border-blue-100 bg-white p-7 shadow-[0_2px_8px_rgba(15,23,42,.035)]">
                  <div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" /></span><span className="text-4xl font-extrabold tracking-tight text-blue-100" aria-hidden="true">0{index + 1}</span></div>
                  <h3 className="mt-7 text-lg font-bold" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="mx-auto max-w-3xl space-y-9">
          <div className="space-y-4 text-center"><Badge>{t.faqBadge}</Badge><h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.faqTitle}</h2></div>
          <div className="space-y-3">
            {t.faq.map(([question, answer]) => (
              <details key={question} className="group rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,.035)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-[#0f172a] [&::-webkit-details-marker]:hidden">{question}<ChevronDown className="h-5 w-5 shrink-0 text-blue-600 transition-transform group-open:rotate-180" /></summary>
                <p className="mt-3 text-sm leading-6 text-slate-600">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[1.75rem] bg-[#0f172a] px-7 py-10 text-white shadow-[0_24px_55px_rgba(15,23,42,.18)] sm:px-10 sm:py-14 lg:px-14">
          <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-blue-200"><Sparkles className="h-3.5 w-3.5" /> {t.ctaEyebrow}</span>
              <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{t.ctaTitle}</h2>
              <p className="mt-3 leading-7 text-slate-300">{t.ctaText}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
              <WhatsAppButton href={whatsappHref} label={t.whatsapp} />
              <Link href="/contact" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#0f172a] transition hover:-translate-y-0.5 hover:bg-blue-100">{t.form} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.12em] text-blue-800 shadow-sm">{children}</span>;
}

function WhatsAppButton({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#25d366] px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#1ebe5b] hover:shadow-lg"><MessageCircle className="h-4 w-4" /> {label}</a>;
}
