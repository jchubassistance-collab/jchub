import Link from 'next/link';
import { ChevronLeft, FileText, Mail, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Conditions Générales d\'Utilisation (CGU)',
};

export default function CGUPage() {
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
            <FileText className="h-4 w-4" />
            CGU
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-[-.045em] text-[#0f172a] sm:text-5xl lg:text-6xl">
            Conditions Générales d&apos;Utilisation
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
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-[#0f172a] md:text-2xl">1. Présentation</h2>
              </div>
              <p className="leading-relaxed text-slate-600">
                JcHub (ci-après « la Plateforme ») est une plateforme d&apos;apprentissage et de ressources pour
                développeurs, opérée par JcHub. Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent
                l&apos;accès et l&apos;utilisation de la plateforme par tout utilisateur.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">2. Acceptation des CGU</h2>
              <p className="leading-relaxed text-slate-600">
                L&apos;utilisation de JcHub implique l&apos;acceptation pleine et entière des présentes CGU. Si vous
                n&apos;acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">3. Accès et utilisation</h2>
              <p className="leading-relaxed text-slate-600">
                L&apos;utilisation de JcHub est libre et gratuite. Vous vous engagez à fournir des informations
                exactes lors de l&apos;utilisation des formulaires de contact ou des services liés à l&apos;inscription,
                et à utiliser la plateforme de manière responsable et conforme à la loi.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">4. Services proposés</h2>
              <p className="mb-3 leading-relaxed text-slate-600">JcHub propose notamment :</p>
              <ul className="list-disc space-y-2 pl-6 text-slate-600 marker:text-blue-600">
                <li>Outils en ligne gratuits pour développeurs</li>
                <li>Ressources et guides de mise en pratique</li>
                <li>Assistant IA conversationnel</li>
                <li>Contenus éducatifs et documentaires</li>
                <li>Espace de contact et d&apos;échange</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">5. Utilisation du service</h2>
              <p className="leading-relaxed text-slate-600">
                Les services de JcHub sont fournis sans frais pour l&apos;instant. Toute utilisation du site doit rester
                conforme aux présentes conditions ainsi qu&apos;aux lois et règlements applicables dans le cadre de
                l&apos;utilisation d&apos;outils numériques et de contenus pédagogiques.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">6. Propriété intellectuelle</h2>
              <p className="leading-relaxed text-slate-600">
                Les contenus présents sur JcHub (articles, illustrations, ressources premium) sont protégés par le droit
                d&apos;auteur. Certains contenus sont placés sous licences Creative Commons (CC BY-SA, CC BY-NC-SA) avec
                mention de l&apos;auteur et de la licence. Toute reproduction non autorisée est interdite.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">7. Données personnelles</h2>
              <p className="leading-relaxed text-slate-600">
                Vos données sont traitées conformément à notre <Link href="/confidentialite" className="font-semibold text-blue-700 underline-offset-2 hover:underline">Politique de Confidentialité</Link>.
                Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">8. Responsabilité</h2>
              <p className="leading-relaxed text-slate-600">
                JcHub s&apos;efforce de maintenir la plateforme accessible et fonctionnelle, mais ne peut garantir une
                disponibilité totale. La plateforme n&apos;est pas responsable de l&apos;usage fait des contenus mis à disposition.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">9. Suspension et résiliation</h2>
              <p className="leading-relaxed text-slate-600">
                En cas de non-respect des présentes CGU, JcHub se réserve le droit de suspendre ou résilier votre
                compte sans préavis ni indemnité.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">10. Modification des CGU</h2>
              <p className="leading-relaxed text-slate-600">
                JcHub peut modifier les présentes CGU. Les utilisateurs seront informés par email ou par
                notification sur la plateforme.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">11. Droit applicable</h2>
              <p className="leading-relaxed text-slate-600">
                Les présentes CGU sont régies par le droit congolais. Tout litige sera soumis à la compétence des
                tribunaux de Brazzaville.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">12. Contact</h2>
              <p className="flex items-center gap-2 text-slate-700">
                <Mail className="h-4 w-4 text-blue-700" />
                Pour toute question :
                <a href="mailto:legal@jchub.dev" className="font-semibold text-blue-700 underline-offset-2 hover:underline">
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
