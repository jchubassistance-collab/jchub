import Link from 'next/link';
import { ChevronLeft, Lock, Mail, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Politique de Confidentialité',
};

export default function ConfidentialitePage() {
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
            <ShieldCheck className="h-4 w-4" />
            Confidentialité
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-[-.045em] text-[#0f172a] sm:text-5xl lg:text-6xl">
            Politique de Confidentialité
          </h1>
          <p className="mt-3 text-base text-slate-600 md:text-lg">
            Dernière mise à jour : 18 août 2026 · Conforme RGPD
          </p>
        </div>
      </section>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-[0_18px_40px_rgba(7,19,40,0.12)] md:p-8">
          <div className="space-y-5 text-slate-600">
            <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-3 text-[#0f172a]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4a74d6] to-[#9ccbff] text-white shadow-lg shadow-[#4a74d6]/30">
                  <Lock className="h-5 w-5" />
                </div>
                <p className="m-0 text-sm font-semibold uppercase tracking-[0.12em] text-blue-800">
                  Notre engagement
                </p>
              </div>
              <p className="m-0 text-base font-medium text-slate-700">
                Chez JcHub, on prend ta vie privée très au sérieux. Cette politique explique quelles données on
                collecte, pourquoi, et comment tu peux les contrôler.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">1. Données collectées</h2>
              <p className="mb-3 leading-relaxed text-slate-600">Quand tu utilises JcHub, on collecte :</p>
              <ul className="list-disc space-y-2 pl-6 text-slate-600 marker:text-blue-600">
                <li><strong className="text-slate-900">Profil public</strong> : nom, email, photo de profil si tu l&apos;utilises</li>
                <li><strong className="text-slate-900">Onboarding</strong> : niveau, langages connus, centres d&apos;intérêt, objectif</li>
                <li><strong className="text-slate-900">Usage</strong> : contenus consultés, outils utilisés, progression</li>
                <li><strong className="text-slate-900">Guides</strong> : adresse e-mail fournie pour débloquer un téléchargement et guide demandé</li>
                <li><strong className="text-slate-900">Contact</strong> : demande via le formulaire, email ou message reçu</li>
                <li><strong className="text-slate-900">Technique</strong> : adresse IP, type de navigateur, pages visitées</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">2. Pourquoi on collecte ces données</h2>
              <ul className="list-disc space-y-2 pl-6 text-slate-600 marker:text-blue-600">
                <li>Personnaliser ton expérience et tes recommandations</li>
                <li>Améliorer la plateforme (analyse d&apos;usage anonymisée)</li>
                <li>Répondre à tes demandes et aux éventuelles demandes de contact</li>
                <li>Te contacter pour des informations utiles sur les services</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">3. Partage de tes données</h2>
              <p className="mb-3 leading-relaxed text-slate-600">On ne vend jamais tes données. On les partage uniquement avec :</p>
              <ul className="list-disc space-y-2 pl-6 text-slate-600 marker:text-blue-600">
                <li><strong className="text-slate-900">Firebase / Google Cloud</strong> : hébergement et base de données</li>
                <li><strong className="text-slate-900">Cloudinary</strong> : stockage des médias (PDF, audio)</li>
                <li><strong className="text-slate-900">Brevo</strong> : envoi d&apos;emails (newsletter, notifications)</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">4. Cookies</h2>
              <p className="leading-relaxed text-slate-600">
                On utilise des cookies fonctionnels (session, préférences) et analytics (anonyme). Aucun cookie
                publicitaire ou de tracking tiers.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">5. Tes droits (RGPD)</h2>
              <p className="mb-3 leading-relaxed text-slate-600">Tu peux à tout moment :</p>
              <ul className="list-disc space-y-2 pl-6 text-slate-600 marker:text-blue-600">
                <li><strong className="text-slate-900">Accéder</strong> à tes données</li>
                <li><strong className="text-slate-900">Rectifier</strong> tes informations</li>
                <li><strong className="text-slate-900">Supprimer</strong> tes données liées au contact ou à l&apos;usage du site</li>
                <li><strong className="text-slate-900">Exporter</strong> tes données dans un format ouvert</li>
                <li><strong className="text-slate-900">Refuser</strong> les emails marketing (lien de désabonnement)</li>
              </ul>
              <p className="mt-3 leading-relaxed text-slate-600">
                Pour exercer ces droits :
                <a href="mailto:privacy@jchub.dev" className="ml-2 font-semibold text-blue-700 underline-offset-2 hover:underline">
                  privacy@jchub.dev
                </a>
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">6. Conservation des données</h2>
              <p className="leading-relaxed text-slate-600">
                On conserve tes données tant que ton compte est actif. Après suppression, elles sont effacées sous 30
                jours (sauf obligations légales contraires).
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">7. Sécurité</h2>
              <p className="leading-relaxed text-slate-600">
                Tes données sont stockées sur des serveurs sécurisés (Firebase + Cloudinary) avec chiffrement en
                transit et au repos. L&apos;accès est protégé par Firebase Auth.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">8. Modifications</h2>
              <p className="mb-0 leading-relaxed text-slate-600">
                On peut modifier cette politique. Tu seras informé(e) par email en cas de changement majeur.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
