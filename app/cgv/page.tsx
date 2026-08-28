import Link from 'next/link';
import { BadgeCheck, ChevronLeft, CreditCard, Mail, Truck } from 'lucide-react';

export const metadata = {
  title: 'Conditions Générales de Vente (CGV)',
};

export default function CGVPage() {
  return (
    <div className="legal-page min-h-screen bg-[#f5f7f5] text-slate-800">
      <section className="legal-hero relative overflow-hidden bg-[#f7f8fa] py-16 md:py-20">
        <div className="legal-grid absolute inset-0 opacity-30" />
        <div className="legal-glow legal-glow-one" />
        <div className="legal-glow legal-glow-two" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-orange-700 transition hover:text-orange-800">
            <ChevronLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/90 px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm backdrop-blur-sm">
            <BadgeCheck className="h-4 w-4" />
            CGV
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            Conditions Générales de Vente
          </h1>
          <p className="mt-3 text-base text-slate-600 md:text-lg">
            Dernière mise à jour : 18 août 2026
          </p>
        </div>
      </section>

      <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="legal-card rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_25px_70px_rgba(15,23,42,0.07)] backdrop-blur-sm md:p-8">
          <div className="prose prose-lg max-w-none space-y-8 text-slate-700">
            <section className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="mb-3 flex items-center gap-3 text-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black md:text-2xl">1. Objet</h2>
              </div>
              <p>
                Les présentes Conditions Générales de Vente (CGV) régissent les ventes de contenus numériques
                (livres audio, PDF, abonnements) effectuées sur la plateforme JcHub.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">2. Tarification</h2>
              <p>
                Les prix sont affichés en francs CFA (XAF), TTC. Ils peuvent être modifiés à tout moment. Les prix
                applicables sont ceux en vigueur au moment de la commande.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">3. Modalités de paiement</h2>
              <p>Les paiements sont sécurisés par CinetPay et s&apos;effectuent par :</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>MTN Mobile Money (Congo Brazzaville)</li>
                <li>Airtel Money (Congo Brazzaville)</li>
                <li>Cartes bancaires Visa / Mastercard</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">4. Livraison</h2>
              <p>
                Les contenus numériques sont accessibles immédiatement après validation du paiement, via votre espace
                personnel. Aucun envoi physique n&apos;est effectué.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">5. Droit de rétractation</h2>
              <p>
                Conformément à la législation en vigueur, vous disposez de 7 jours pour exercer votre droit de
                rétractation à compter de la date d&apos;achat, sauf si vous avez commencé à consommer le contenu (lecture
                ou écoute partielle).
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">6. Abonnements</h2>
              <p>
                Les abonnements JcHub+ sont renouvelés automatiquement à échéance (mensuelle ou annuelle). Vous
                pouvez annuler à tout moment depuis votre espace personnel, la résiliation prenant effet à la fin de
                la période en cours.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">7. Remboursement</h2>
              <p>
                En cas de problème technique avéré, un remboursement peut être accordé. Les demandes sont étudiées au
                cas par cas. Contactez <a href="mailto:support@jchub.dev" className="font-semibold text-orange-700 underline-offset-2 hover:underline">support@jchub.dev</a>.
              </p>
            </section>

            <section className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
              <div className="mb-3 flex items-center gap-3 text-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-cyan-500/20">
                  <Truck className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black md:text-2xl">8. Service client</h2>
              </div>
              <p className="flex items-center gap-2 text-slate-700">
                <Mail className="h-4 w-4 text-orange-700" />
                Pour toute question, contactez-nous à
                <a href="mailto:hello@jchub.dev" className="font-semibold text-orange-700 underline-offset-2 hover:underline">
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
