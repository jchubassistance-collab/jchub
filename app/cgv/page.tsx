import Link from 'next/link';
import { BadgeCheck, ChevronLeft, CreditCard, Mail, Truck } from 'lucide-react';

export const metadata = {
  title: 'Conditions Générales de Vente (CGV)',
};

export default function CGVPage() {
  return (
    <div className="min-h-screen bg-[#020b1a] text-white">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(89,126,255,0.30),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(94,138,230,0.20),_transparent_35%),linear-gradient(135deg,_#020b1a_0%,_#091b3d_32%,_#123f8c_100%)] py-16 md:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08),_transparent_55%)]" />
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full border border-[#9ccbff]/20 bg-[#80b5ff]/10 blur-3xl" />
        <div className="absolute -left-28 bottom-[-80px] h-80 w-80 rounded-full border border-white/10 bg-[#3a68d9]/15 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#dfeeff] transition hover:text-white">
            <ChevronLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#9ccbff]/30 bg-[#9ccbff]/10 px-4 py-2 text-sm font-semibold text-[#dfeeff] shadow-sm backdrop-blur-sm">
            <BadgeCheck className="h-4 w-4" />
            CGV
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-5xl">
            Conditions Générales de Vente
          </h1>
          <p className="mt-3 text-base text-slate-300 md:text-lg">
            Dernière mise à jour : 18 août 2026
          </p>
        </div>
      </section>

      <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-[#9ccbff]/20 bg-[rgba(13,28,52,0.8)] p-6 shadow-[0_25px_70px_rgba(15,23,42,0.25)] backdrop-blur-sm md:p-8">
          <div className="space-y-8 text-slate-300">
            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <div className="mb-3 flex items-center gap-3 text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4a74d6] to-[#9ccbff] text-white shadow-lg shadow-[#4a74d6]/30">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black md:text-2xl">1. Objet</h2>
              </div>
              <p className="leading-relaxed text-slate-300">
                Les présentes Conditions Générales de Vente (CGV) encadrent les services et contenus mis à disposition
                sur JcHub dans le cadre de son offre actuelle, sans vente payante ni abonnement à ce jour.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">2. Tarification</h2>
              <p className="leading-relaxed text-slate-300">
                Les services de JcHub sont accessibles sans paiement à l&apos;heure actuelle. Toute évolution future des
                conditions tarifaires fera l&apos;objet d&apos;une information préalable avant mise en application.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">3. Modalités d&apos;accès</h2>
              <p className="mb-3 leading-relaxed text-slate-300">
                L&apos;accès aux outils et ressources de la plateforme se fait par l&apos;utilisation de la plateforme elle-même,
                sur la base des conditions générales d&apos;utilisation et selon les éventuelles restrictions techniques
                en vigueur sur le service.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">4. Livraison et accès</h2>
              <p className="leading-relaxed text-slate-300">
                Les contenus et outils disponibles sur JcHub sont rendus immédiatement accessibles, sous réserve de la
                disponibilité du service et des conditions techniques du navigateur ou de l&apos;appareil utilisé.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">5. Droit de rétractation</h2>
              <p className="leading-relaxed text-slate-300">
                À l&apos;heure actuelle, aucune vente payante n&apos;est proposée sur la plateforme. En cas d&apos;évolution future
                des offres commerciales, les conditions de rétractation et de remboursement seront précisées au
                moment de la commande et avant validation de l&apos;achat.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">6. Demandes particulières</h2>
              <p className="leading-relaxed text-slate-300">
                En cas de problème technique avéré ou de demande d&apos;assistance, contactez <a href="mailto:support@jchub.dev" className="font-semibold text-[#9ccbff] underline-offset-2 hover:underline">support@jchub.dev</a>.
              </p>
            </section>

            <section className="rounded-2xl border border-[#9ccbff]/30 bg-gradient-to-br from-[#1d3365] to-[#0b1730] p-5">
              <div className="mb-3 flex items-center gap-3 text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#34d399] to-[#14b8a6] text-white shadow-lg shadow-[#14b8a6]/20">
                  <Truck className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black md:text-2xl">8. Service client</h2>
              </div>
              <p className="flex items-center gap-2 text-slate-200">
                <Mail className="h-4 w-4 text-[#9ccbff]" />
                Pour toute question, contactez-nous à
                <a href="mailto:hello@jchub.dev" className="font-semibold text-[#9ccbff] underline-offset-2 hover:underline">
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
