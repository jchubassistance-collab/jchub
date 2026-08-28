import Link from 'next/link';
import { ChevronLeft, FileText, Mail, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Conditions Générales d\'Utilisation (CGU)',
};

export default function CGUPage() {
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
            <FileText className="h-4 w-4" />
            CGU
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            Conditions Générales d&apos;Utilisation
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
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black md:text-2xl">1. Présentation</h2>
              </div>
              <p>
                JcHub (ci-après « la Plateforme ») est une plateforme d&apos;apprentissage et de ressources pour
a développeurs, opérée par JcHub. Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent
                l&apos;accès et l&apos;utilisation de la plateforme par tout utilisateur.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">2. Acceptation des CGU</h2>
              <p>
                L&apos;utilisation de JcHub implique l&apos;acceptation pleine et entière des présentes CGU. Si vous
                n&apos;acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">3. Inscription et compte</h2>
              <p>
                L&apos;inscription est gratuite. Vous vous engagez à fournir des informations exactes lors de votre
                inscription et à maintenir la confidentialité de vos identifiants. Toute activité réalisée depuis
                votre compte est sous votre responsabilité.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">4. Services proposés</h2>
              <p>JcHub propose notamment :</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Outils en ligne gratuits pour développeurs</li>
                <li>Livres audio et PDF, gratuits ou payants selon la licence</li>
                <li>Assistant IA conversationnel</li>
                <li>Système d&apos;abonnement (JcHub+)</li>
                <li>Communauté et partage</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">5. Abonnements et paiements</h2>
              <p>
                Les abonnements JcHub+ (mensuel ou annuel) sont renouvelés automatiquement. Vous pouvez annuler à
                tout moment depuis votre espace personnel. Les paiements sont sécurisés par notre prestataire
                CinetPay (MTN Mobile Money, Airtel Money, cartes). Conformément au Code de la consommation, vous
                disposez d&apos;un délai de rétractation de 7 jours.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">6. Propriété intellectuelle</h2>
              <p>
                Les contenus présents sur JcHub (livres, articles, illustrations) sont protégés par le droit
                d&apos;auteur. Certains contenus sont placés sous licences Creative Commons (CC BY-SA, CC BY-NC-SA) avec
                mention de l&apos;auteur et de la licence. Toute reproduction non autorisée est interdite.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">7. Données personnelles</h2>
              <p>
                Vos données sont traitées conformément à notre <Link href="/confidentialite" className="font-semibold text-orange-700 underline-offset-2 hover:underline">Politique de Confidentialité</Link>.
                Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">8. Responsabilité</h2>
              <p>
                JcHub s&apos;efforce de maintenir la plateforme accessible et fonctionnelle, mais ne peut garantir une
                disponibilité totale. La plateforme n&apos;est pas responsable de l&apos;usage fait des contenus mis à disposition.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">9. Suspension et résiliation</h2>
              <p>
                En cas de non-respect des présentes CGU, JcHub se réserve le droit de suspendre ou résilier votre
                compte sans préavis ni indemnité.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">10. Modification des CGU</h2>
              <p>
                JcHub peut modifier les présentes CGU. Les utilisateurs seront informés par email ou par
                notification sur la plateforme.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">11. Droit applicable</h2>
              <p>
                Les présentes CGU sont régies par le droit congolais. Tout litige sera soumis à la compétence des
                tribunaux de Brazzaville.
              </p>
            </section>

            <section className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
              <h2 className="mb-3 text-2xl font-black text-slate-900">12. Contact</h2>
              <p className="flex items-center gap-2 text-slate-700">
                <Mail className="h-4 w-4 text-orange-700" />
                Pour toute question :
                <a href="mailto:legal@jchub.dev" className="font-semibold text-orange-700 underline-offset-2 hover:underline">
                  legal@jchub.dev
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
