import Link from 'next/link';
import { ChevronLeft, FileText, Mail, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Conditions Générales d\'Utilisation (CGU)',
};

export default function CGUPage() {
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
            <FileText className="h-4 w-4" />
            CGU
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-5xl">
            Conditions Générales d&apos;Utilisation
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
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black md:text-2xl">1. Présentation</h2>
              </div>
              <p className="leading-relaxed text-slate-300">
                JcHub (ci-après « la Plateforme ») est une plateforme d&apos;apprentissage et de ressources pour
                développeurs, opérée par JcHub. Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent
                l&apos;accès et l&apos;utilisation de la plateforme par tout utilisateur.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">2. Acceptation des CGU</h2>
              <p className="leading-relaxed text-slate-300">
                L&apos;utilisation de JcHub implique l&apos;acceptation pleine et entière des présentes CGU. Si vous
                n&apos;acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">3. Accès et utilisation</h2>
              <p className="leading-relaxed text-slate-300">
                L&apos;utilisation de JcHub est libre et gratuite. Vous vous engagez à fournir des informations
                exactes lors de l&apos;utilisation des formulaires de contact ou des services liés à l&apos;inscription,
                et à utiliser la plateforme de manière responsable et conforme à la loi.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">4. Services proposés</h2>
              <p className="mb-3 leading-relaxed text-slate-300">JcHub propose notamment :</p>
              <ul className="list-disc space-y-2 pl-6 text-slate-300">
                <li>Outils en ligne gratuits pour développeurs</li>
                <li>Ressources et guides de mise en pratique</li>
                <li>Assistant IA conversationnel</li>
                <li>Contenus éducatifs et documentaires</li>
                <li>Espace de contact et d&apos;échange</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">5. Utilisation du service</h2>
              <p className="leading-relaxed text-slate-300">
                Les services de JcHub sont fournis sans frais pour l&apos;instant. Toute utilisation du site doit rester
                conforme aux présentes conditions ainsi qu&apos;aux lois et règlements applicables dans le cadre de
                l&apos;utilisation d&apos;outils numériques et de contenus pédagogiques.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">6. Propriété intellectuelle</h2>
              <p className="leading-relaxed text-slate-300">
                Les contenus présents sur JcHub (articles, illustrations, ressources premium) sont protégés par le droit
                d&apos;auteur. Certains contenus sont placés sous licences Creative Commons (CC BY-SA, CC BY-NC-SA) avec
                mention de l&apos;auteur et de la licence. Toute reproduction non autorisée est interdite.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">7. Données personnelles</h2>
              <p className="leading-relaxed text-slate-300">
                Vos données sont traitées conformément à notre <Link href="/confidentialite" className="font-semibold text-[#9ccbff] underline-offset-2 hover:underline">Politique de Confidentialité</Link>.
                Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">8. Responsabilité</h2>
              <p className="leading-relaxed text-slate-300">
                JcHub s&apos;efforce de maintenir la plateforme accessible et fonctionnelle, mais ne peut garantir une
                disponibilité totale. La plateforme n&apos;est pas responsable de l&apos;usage fait des contenus mis à disposition.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">9. Suspension et résiliation</h2>
              <p className="leading-relaxed text-slate-300">
                En cas de non-respect des présentes CGU, JcHub se réserve le droit de suspendre ou résilier votre
                compte sans préavis ni indemnité.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">10. Modification des CGU</h2>
              <p className="leading-relaxed text-slate-300">
                JcHub peut modifier les présentes CGU. Les utilisateurs seront informés par email ou par
                notification sur la plateforme.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">11. Droit applicable</h2>
              <p className="leading-relaxed text-slate-300">
                Les présentes CGU sont régies par le droit congolais. Tout litige sera soumis à la compétence des
                tribunaux de Brazzaville.
              </p>
            </section>

            <section className="rounded-2xl border border-[#9ccbff]/30 bg-gradient-to-br from-[#1d3365] to-[#0b1730] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">12. Contact</h2>
              <p className="flex items-center gap-2 text-slate-200">
                <Mail className="h-4 w-4 text-[#9ccbff]" />
                Pour toute question :
                <a href="mailto:legal@jchub.dev" className="font-semibold text-[#9ccbff] underline-offset-2 hover:underline">
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
