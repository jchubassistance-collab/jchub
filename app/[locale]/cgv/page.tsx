import { notFound } from 'next/navigation';
import { BadgeCheck, ChevronLeft, CreditCard, Mail, Truck } from 'lucide-react';
import { pageMetadata } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import { isLocale } from '@/i18n/routing';

const copy = bilingual({
  metaTitle: 'Conditions Générales de Vente (CGV)',
  metaDescription: 'Consulte les conditions de vente de JcHub : les services sont actuellement gratuits, sans paiement ni abonnement.',
  back: 'Retour à l’accueil',
  badge: 'CGV',
  title: 'Conditions Générales de Vente',
  updated: 'Dernière mise à jour : 18 août 2026',
  s1: ['1. Objet', 'Les présentes Conditions Générales de Vente (CGV) encadrent les services et contenus mis à disposition sur JcHub dans le cadre de son offre actuelle, sans vente payante ni abonnement à ce jour.'],
  s2: ['2. Tarification', 'Les services de JcHub sont accessibles sans paiement à l’heure actuelle. Toute évolution future des conditions tarifaires fera l’objet d’une information préalable avant mise en application.'],
  s3: ['3. Modalités d’accès', 'L’accès aux outils et ressources de la plateforme se fait par l’utilisation de la plateforme elle-même, sur la base des conditions générales d’utilisation et selon les éventuelles restrictions techniques en vigueur sur le service.'],
  s4: ['4. Livraison et accès', 'Les contenus et outils disponibles sur JcHub sont rendus immédiatement accessibles, sous réserve de la disponibilité du service et des conditions techniques du navigateur ou de l’appareil utilisé.'],
  s5: ['5. Droit de rétractation', 'À l’heure actuelle, aucune vente payante n’est proposée sur la plateforme. En cas d’évolution future des offres commerciales, les conditions de rétractation et de remboursement seront précisées au moment de la commande et avant validation de l’achat.'],
  s6Title: '6. Demandes particulières',
  s6Text: 'En cas de problème technique avéré ou de demande d’assistance, contactez ',
  s8Title: '8. Service client',
  s8Text: 'Pour toute question, contactez-nous à',
}, {
  metaTitle: 'Terms of Sale',
  metaDescription: 'Read JcHub’s terms of sale: the services are currently free, with no payment or subscription.',
  back: 'Back to home',
  badge: 'Terms of sale',
  title: 'Terms of Sale',
  updated: 'Last updated: August 18, 2026 · In case of discrepancy, the French version prevails.',
  s1: ['1. Purpose', 'These Terms of Sale govern the services and content made available on JcHub as part of its current offer, with no paid sale or subscription to date.'],
  s2: ['2. Pricing', 'JcHub services are currently available without payment. Any future change to the pricing terms will be announced before it takes effect.'],
  s3: ['3. Access terms', 'The platform’s tools and resources are accessed by using the platform itself, under the Terms of Use and any technical restrictions in force on the service.'],
  s4: ['4. Delivery and access', 'The content and tools available on JcHub are made available immediately, subject to the availability of the service and the technical conditions of the browser or device used.'],
  s5: ['5. Right of withdrawal', 'No paid sale is currently offered on the platform. If commercial offers are introduced in the future, the withdrawal and refund conditions will be specified at the time of ordering and before the purchase is confirmed.'],
  s6Title: '6. Specific requests',
  s6Text: 'For a confirmed technical problem or a request for help, contact ',
  s8Title: '8. Customer service',
  s8Text: 'For any question, contact us at',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, title: copy[locale].metaTitle, description: copy[locale].metaDescription, href: '/cgv' });
}

export default async function CGVPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  return (
    <div className="template-home min-h-screen overflow-hidden bg-[#eff6ff] text-[#0f172a]">
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(147,197,253,.48),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(191,219,254,.55),transparent_32%),#eff6ff] py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(37,99,235,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,.045)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_76%)]" />
        <div className="pointer-events-none absolute -right-36 top-8 h-80 w-80 rounded-full bg-blue-200/70 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-sky-200/70 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-800 transition hover:text-blue-600">
            <ChevronLeft className="h-4 w-4" />
            {t.back}
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-900 shadow-sm">
            <BadgeCheck className="h-4 w-4" />
            {t.badge}
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-[-.045em] text-[#0f172a] sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>
          <p className="mt-3 text-base text-slate-600 md:text-lg">
            {t.updated}
          </p>
        </div>
      </section>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-[0_18px_40px_rgba(7,19,40,0.12)] md:p-8">
          <div className="space-y-5 text-slate-600">
            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-3 text-[#0f172a]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4a74d6] to-[#9ccbff] text-white shadow-lg shadow-[#4a74d6]/30">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-[#0f172a] md:text-2xl">{t.s1[0]}</h2>
              </div>
              <p className="leading-relaxed text-slate-600">{t.s1[1]}</p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.s2[0]}</h2>
              <p className="leading-relaxed text-slate-600">{t.s2[1]}</p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.s3[0]}</h2>
              <p className="mb-3 leading-relaxed text-slate-600">{t.s3[1]}</p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.s4[0]}</h2>
              <p className="leading-relaxed text-slate-600">{t.s4[1]}</p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.s5[0]}</h2>
              <p className="leading-relaxed text-slate-600">{t.s5[1]}</p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.s6Title}</h2>
              <p className="leading-relaxed text-slate-600">
                {t.s6Text}<a href="mailto:support@jchub.dev" className="font-semibold text-blue-700 underline-offset-2 hover:underline">support@jchub.dev</a>.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-3 text-[#0f172a]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#34d399] to-[#14b8a6] text-white shadow-lg shadow-[#14b8a6]/20">
                  <Truck className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-[#0f172a] md:text-2xl">{t.s8Title}</h2>
              </div>
              <p className="flex items-center gap-2 text-slate-700">
                <Mail className="h-4 w-4 text-blue-700" />
                {t.s8Text}
                <a href="mailto:hello@jchub.dev" className="font-semibold text-blue-700 underline-offset-2 hover:underline">
                  hello@jchub.dev
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
