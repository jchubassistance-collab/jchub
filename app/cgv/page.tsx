import Link from 'next/link';
import { BadgeCheck, ChevronLeft, CreditCard, Mail, Truck } from 'lucide-react';

export const metadata = {
  title: 'Conditions Générales de Vente (CGV)',
};

export default function CGVPage() {
  return (
    <div className="template-home min-h-screen overflow-hidden bg-[#eff6ff] text-[#0f172a]">
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(147,197,253,.48),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(191,219,254,.55),transparent_32%),#eff6ff] py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(37,99,235,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,.045)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_76%)]" />
        <div className="pointer-events-none absolute -right-36 top-8 h-80 w-80 rounded-full bg-blue-200/70 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-sky-200/70 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-800 transition hover:text-blue-600">
            <ChevronLeft className="h-4 w-4" />
            Retour à l&apos;accueil
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-900 shadow-sm">
            <BadgeCheck className="h-4 w-4" />
            CGV
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-[-.045em] text-[#0f172a] sm:text-5xl lg:text-6xl">
            Conditions Générales de Vente
          </h1>
          <p className="mt-3 text-base text-slate-600 md:text-lg">
            Dernière mise à jour : 18 août 2026
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
                <h2 className="text-xl font-black text-[#0f172a] md:text-2xl">1. Objet</h2>
              </div>
              <p className="leading-relaxed text-slate-600">
                Les présentes Conditions Générales de Vente (CGV) encadrent les services et contenus mis à disposition
                sur JcHub dans le cadre de son offre actuelle, sans vente payante ni abonnement à ce jour.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">2. Tarification</h2>
              <p className="leading-relaxed text-slate-600">
                Les services de JcHub sont accessibles sans paiement à l&apos;heure actuelle. Toute évolution future des
                conditions tarifaires fera l&apos;objet d&apos;une information préalable avant mise en application.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">3. Modalités d&apos;accès</h2>
              <p className="mb-3 leading-relaxed text-slate-600">
                L&apos;accès aux outils et ressources de la plateforme se fait par l&apos;utilisation de la plateforme elle-même,
                sur la base des conditions générales d&apos;utilisation et selon les éventuelles restrictions techniques
                en vigueur sur le service.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">4. Livraison et accès</h2>
              <p className="leading-relaxed text-slate-600">
                Les contenus et outils disponibles sur JcHub sont rendus immédiatement accessibles, sous réserve de la
                disponibilité du service et des conditions techniques du navigateur ou de l&apos;appareil utilisé.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">5. Droit de rétractation</h2>
              <p className="leading-relaxed text-slate-600">
                À l&apos;heure actuelle, aucune vente payante n&apos;est proposée sur la plateforme. En cas d&apos;évolution future
                des offres commerciales, les conditions de rétractation et de remboursement seront précisées au
                moment de la commande et avant validation de l&apos;achat.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">6. Demandes particulières</h2>
              <p className="leading-relaxed text-slate-600">
                En cas de problème technique avéré ou de demande d&apos;assistance, contactez <a href="mailto:support@jchub.dev" className="font-semibold text-blue-700 underline-offset-2 hover:underline">support@jchub.dev</a>.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-3 text-[#0f172a]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#34d399] to-[#14b8a6] text-white shadow-lg shadow-[#14b8a6]/20">
                  <Truck className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-[#0f172a] md:text-2xl">8. Service client</h2>
              </div>
              <p className="flex items-center gap-2 text-slate-700">
                <Mail className="h-4 w-4 text-blue-700" />
                Pour toute question, contactez-nous à
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
