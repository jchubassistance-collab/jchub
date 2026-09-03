import Link from 'next/link';
import { ChevronLeft, Lock, Mail, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Politique de Confidentialité',
};

export default function ConfidentialitePage() {
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
            <ShieldCheck className="h-4 w-4" />
            Confidentialité
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-5xl">
            Politique de Confidentialité
          </h1>
          <p className="mt-3 text-base text-slate-300 md:text-lg">
            Dernière mise à jour : 18 août 2026 · Conforme RGPD
          </p>
        </div>
      </section>

      <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-[#9ccbff]/20 bg-[rgba(13,28,52,0.8)] p-6 shadow-[0_25px_70px_rgba(15,23,42,0.25)] backdrop-blur-sm md:p-8">
          <div className="space-y-8 text-slate-300">
            <section className="rounded-2xl border border-[#9ccbff]/20 bg-gradient-to-br from-[#18315f] to-[#0d1c38] p-5">
              <div className="mb-3 flex items-center gap-3 text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4a74d6] to-[#9ccbff] text-white shadow-lg shadow-[#4a74d6]/30">
                  <Lock className="h-5 w-5" />
                </div>
                <p className="m-0 text-sm font-semibold uppercase tracking-[0.12em] text-[#dfeeff]">
                  Notre engagement
                </p>
              </div>
              <p className="m-0 text-base font-medium text-slate-200">
                Chez JcHub, on prend ta vie privée très au sérieux. Cette politique explique quelles données on
                collecte, pourquoi, et comment tu peux les contrôler.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">1. Données collectées</h2>
              <p className="mb-3 leading-relaxed text-slate-300">Quand tu utilises JcHub, on collecte :</p>
              <ul className="list-disc space-y-2 pl-6 text-slate-300">
                <li><strong className="text-white">Profil public</strong> : nom, email, photo de profil si tu l&apos;utilises</li>
                <li><strong className="text-white">Onboarding</strong> : niveau, langages connus, centres d&apos;intérêt, objectif</li>
                <li><strong className="text-white">Usage</strong> : contenus consultés, outils utilisés, progression</li>
                <li><strong className="text-white">Contact</strong> : demande via le formulaire, email ou message reçu</li>
                <li><strong className="text-white">Technique</strong> : adresse IP, type de navigateur, pages visitées</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">2. Pourquoi on collecte ces données</h2>
              <ul className="list-disc space-y-2 pl-6 text-slate-300">
                <li>Personnaliser ton expérience et tes recommandations</li>
                <li>Améliorer la plateforme (analyse d&apos;usage anonymisée)</li>
                <li>Répondre à tes demandes et aux éventuelles demandes de contact</li>
                <li>Te contacter pour des informations utiles sur les services</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">3. Partage de tes données</h2>
              <p className="mb-3 leading-relaxed text-slate-300">On ne vend jamais tes données. On les partage uniquement avec :</p>
              <ul className="list-disc space-y-2 pl-6 text-slate-300">
                <li><strong className="text-white">Firebase / Google Cloud</strong> : hébergement et base de données</li>
                <li><strong className="text-white">Cloudinary</strong> : stockage des médias (PDF, audio)</li>
                <li><strong className="text-white">Brevo</strong> : envoi d&apos;emails (newsletter, notifications)</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">4. Cookies</h2>
              <p className="leading-relaxed text-slate-300">
                On utilise des cookies fonctionnels (session, préférences) et analytics (anonyme). Aucun cookie
                publicitaire ou de tracking tiers.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">5. Tes droits (RGPD)</h2>
              <p className="mb-3 leading-relaxed text-slate-300">Tu peux à tout moment :</p>
              <ul className="list-disc space-y-2 pl-6 text-slate-300">
                <li><strong className="text-white">Accéder</strong> à tes données</li>
                <li><strong className="text-white">Rectifier</strong> tes informations</li>
                <li><strong className="text-white">Supprimer</strong> tes données liées au contact ou à l&apos;usage du site</li>
                <li><strong className="text-white">Exporter</strong> tes données dans un format ouvert</li>
                <li><strong className="text-white">Refuser</strong> les emails marketing (lien de désabonnement)</li>
              </ul>
              <p className="mt-3 leading-relaxed text-slate-300">
                Pour exercer ces droits :
                <a href="mailto:privacy@jchub.dev" className="ml-2 font-semibold text-[#9ccbff] underline-offset-2 hover:underline">
                  privacy@jchub.dev
                </a>
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">6. Conservation des données</h2>
              <p className="leading-relaxed text-slate-300">
                On conserve tes données tant que ton compte est actif. Après suppression, elles sont effacées sous 30
                jours (sauf obligations légales contraires).
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">7. Sécurité</h2>
              <p className="leading-relaxed text-slate-300">
                Tes données sont stockées sur des serveurs sécurisés (Firebase + Cloudinary) avec chiffrement en
                transit et au repos. L&apos;accès est protégé par Firebase Auth.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">8. Modifications</h2>
              <p className="mb-0 leading-relaxed text-slate-300">
                On peut modifier cette politique. Tu seras informé(e) par email en cas de changement majeur.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
