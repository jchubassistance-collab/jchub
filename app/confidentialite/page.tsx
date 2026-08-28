import Link from 'next/link';
import { ChevronLeft, Lock, Mail, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Politique de Confidentialité',
};

export default function ConfidentialitePage() {
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
            <ShieldCheck className="h-4 w-4" />
            Confidentialité
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            Politique de Confidentialité
          </h1>
          <p className="mt-3 text-base text-slate-600 md:text-lg">
            Dernière mise à jour : 18 août 2026 · Conforme RGPD
          </p>
        </div>
      </section>

      <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="legal-card rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_25px_70px_rgba(15,23,42,0.07)] backdrop-blur-sm md:p-8">
          <div className="prose prose-lg max-w-none space-y-8 text-slate-700">
            <section className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
              <div className="mb-3 flex items-center gap-3 text-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20">
                  <Lock className="h-5 w-5" />
                </div>
                <p className="m-0 text-sm font-semibold uppercase tracking-[0.12em] text-orange-700">
                  Notre engagement
                </p>
              </div>
              <p className="m-0 text-base font-medium text-slate-700">
                Chez JcHub, on prend ta vie privée très au sérieux. Cette politique explique quelles données on
                collecte, pourquoi, et comment tu peux les contrôler.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">1. Données collectées</h2>
              <p>Quand tu utilises JcHub, on collecte :</p>
              <ul className="list-disc space-y-2 pl-6">
                <li><strong>Compte</strong> : nom, email, photo de profil (via Google/GitHub)</li>
                <li><strong>Onboarding</strong> : niveau, langages connus, centres d&apos;intérêt, objectif</li>
                <li><strong>Usage</strong> : livres consultés, outils utilisés, progression</li>
                <li><strong>Paiements</strong> : historique des transactions (pas tes coordonnées bancaires)</li>
                <li><strong>Technique</strong> : adresse IP, type de navigateur, pages visitées</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">2. Pourquoi on collecte ces données</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>Personnaliser ton expérience et tes recommandations</li>
                <li>Traiter tes paiements et te fournir un accès aux contenus payants</li>
                <li>Améliorer la plateforme (analyse d&apos;usage anonymisée)</li>
                <li>Te contacter pour des infos importantes sur ton compte</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">3. Partage de tes données</h2>
              <p>On ne vend jamais tes données. On les partage uniquement avec :</p>
              <ul className="list-disc space-y-2 pl-6">
                <li><strong>Firebase / Google Cloud</strong> : hébergement et base de données</li>
                <li><strong>Cloudinary</strong> : stockage des médias (PDF, audio)</li>
                <li><strong>CinetPay</strong> : traitement des paiements</li>
                <li><strong>Brevo</strong> : envoi d&apos;emails (newsletter, notifications)</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">4. Cookies</h2>
              <p>
                On utilise des cookies fonctionnels (session, préférences) et analytics (anonyme). Aucun cookie
                publicitaire ou de tracking tiers.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">5. Tes droits (RGPD)</h2>
              <p>Tu peux à tout moment :</p>
              <ul className="list-disc space-y-2 pl-6">
                <li><strong>Accéder</strong> à tes données (depuis ton profil)</li>
                <li><strong>Rectifier</strong> tes informations</li>
                <li><strong>Supprimer</strong> ton compte et toutes tes données</li>
                <li><strong>Exporter</strong> tes données dans un format ouvert</li>
                <li><strong>Refuser</strong> les emails marketing (lien de désabonnement)</li>
              </ul>
              <p>
                Pour exercer ces droits :
                <a href="mailto:privacy@jchub.dev" className="ml-2 font-semibold text-orange-700 underline-offset-2 hover:underline">
                  privacy@jchub.dev
                </a>
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">6. Conservation des données</h2>
              <p>
                On conserve tes données tant que ton compte est actif. Après suppression, elles sont effacées sous 30
                jours (sauf obligations légales contraires).
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">7. Sécurité</h2>
              <p>
                Tes données sont stockées sur des serveurs sécurisés (Firebase + Cloudinary) avec chiffrement en
                transit et au repos. L&apos;accès est protégé par Firebase Auth.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <h2 className="mb-3 text-2xl font-black text-slate-900">8. Modifications</h2>
              <p className="mb-0">
                On peut modifier cette politique. Tu seras informé(e) par email en cas de changement majeur.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
