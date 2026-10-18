import Link from 'next/link';
import { ChevronLeft, Facebook, Instagram, Lock, Mail, ShieldCheck } from 'lucide-react';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Politique de Confidentialité',
  description: 'Découvre quelles données JcHub collecte, comment elles sont utilisées et quels sont tes droits concernant leur traitement.',
  path: '/confidentialite',
});

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
            Dernière mise à jour : 17 octobre 2026 · Conforme RGPD
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
                <li><strong className="text-slate-900">Compte</strong> : nom, email, photo de profil si tu te connectes à ton espace</li>
                <li><strong className="text-slate-900">Préférences</strong> : niveau, langages connus, centres d&apos;intérêt, objectif, si tu les renseignes</li>
                <li><strong className="text-slate-900">Contact</strong> : nom, email, sujet et message envoyés via le formulaire</li>
                <li><strong className="text-slate-900">Newsletter</strong> : adresse email si tu t&apos;inscris</li>
                <li><strong className="text-slate-900">Fichiers</strong> : documents et images que tu soumets aux outils de conversion (voir la section 4)</li>
                <li><strong className="text-slate-900">Recherche d&apos;outils</strong> : le texte que tu tapes dans la recherche assistée</li>
                <li><strong className="text-slate-900">Technique</strong> : adresse IP (seule une empreinte hachée est enregistrée, pour la sécurité et les limites d&apos;usage), type de navigateur, pages visitées</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">2. Pourquoi on collecte ces données</h2>
              <ul className="list-disc space-y-2 pl-6 text-slate-600 marker:text-blue-600">
                <li>Fournir les outils, notamment la conversion de fichiers, et appliquer les limites d&apos;usage</li>
                <li>Personnaliser ton expérience et tes recommandations</li>
                <li>Améliorer la plateforme (mesure d&apos;audience, avec ton accord pour les outils qui déposent des cookies)</li>
                <li>Répondre à tes demandes et aux éventuelles demandes de contact</li>
                <li>Te contacter pour des informations utiles sur les services</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">3. Partage de tes données</h2>
              <p className="mb-3 leading-relaxed text-slate-600">On ne vend jamais tes données. On les partage uniquement avec les prestataires qui font fonctionner le site :</p>
              <ul className="list-disc space-y-2 pl-6 text-slate-600 marker:text-blue-600">
                <li><strong className="text-slate-900">Vercel</strong> : hébergement du site, stockage temporaire des fichiers à convertir, mesure d&apos;audience sans cookie (Vercel Analytics et Speed Insights)</li>
                <li><strong className="text-slate-900">Cloudflare</strong> : diffusion du site et protection contre les attaques</li>
                <li><strong className="text-slate-900">Firebase / Google Cloud</strong> : base de données et authentification</li>
                <li><strong className="text-slate-900">Adobe PDF Services</strong> : conversion PDF vers Word et Word vers PDF</li>
                <li><strong className="text-slate-900">Mistral AI, Groq et OpenRouter</strong> : recherche assistée d&apos;outils (seul le texte de ta recherche leur est transmis, par nos serveurs)</li>
                <li><strong className="text-slate-900">Brevo</strong> : envoi d&apos;emails (newsletter, notifications)</li>
                <li><strong className="text-slate-900">Cloudinary</strong> : stockage des médias du site</li>
                <li><strong className="text-slate-900">Google Analytics et Metricool</strong> : mesure d&apos;audience, uniquement si tu l&apos;acceptes</li>
                <li><strong className="text-slate-900">Giscus / GitHub</strong> : affichage des commentaires des articles ; publier un commentaire nécessite un compte GitHub</li>
              </ul>
              <p className="mt-3 leading-relaxed text-slate-600">
                Certains de ces prestataires traitent les données hors de l&apos;Union européenne, notamment aux
                États-Unis. Ces transferts s&apos;appuient sur les garanties qu&apos;ils proposent, comme les clauses
                contractuelles types de la Commission européenne.
              </p>
            </section>

            <section id="fichiers" className="scroll-mt-24 rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">4. Fichiers envoyés aux outils</h2>
              <ul className="list-disc space-y-2 pl-6 text-slate-600 marker:text-blue-600">
                <li>
                  Les outils de génération et de transformation de texte (mots de passe, JSON, Base64, hash, QR code,
                  regex…) fonctionnent entièrement dans ton navigateur : rien n&apos;est envoyé.
                </li>
                <li>
                  Les outils de conversion de fichiers (PDF vers Word, Word vers PDF, compression PDF, images vers
                  PDF, optimiseur d&apos;images, Excel vers CSV et CSV vers Excel) envoient ton fichier en HTTPS à nos
                  serveurs. Il est placé dans un espace privé temporaire, effacé dès la fin de la conversion, et au
                  plus tard sous 24 heures par une purge automatique.
                </li>
                <li>
                  Pour PDF vers Word et Word vers PDF, le fichier est aussi transmis à Adobe PDF Services, qui
                  réalise la conversion selon ses propres conditions de traitement.
                </li>
                <li>On n&apos;utilise tes fichiers pour rien d&apos;autre que la conversion demandée.</li>
                <li>
                  Les limites (5 conversions par jour et par outil) sont appliquées grâce à une empreinte hachée de ton
                  adresse IP : l&apos;adresse elle-même n&apos;est pas enregistrée.
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">5. Cookies</h2>
              <ul className="list-disc space-y-2 pl-6 text-slate-600 marker:text-blue-600">
                <li><strong className="text-slate-900">Nécessaires</strong> : session de connexion et préférences, dont ton choix concernant les cookies (enregistré dans ton navigateur)</li>
                <li>
                  <strong className="text-slate-900">Mesure d&apos;audience</strong> : Google Analytics et Metricool ne sont chargés,
                  et ne déposent leurs cookies, que si tu cliques sur « Accepter ». Tu peux changer d&apos;avis à tout moment
                  avec le lien « Gérer les cookies » en bas de chaque page. Ton choix t&apos;est redemandé tous les 6 mois.
                </li>
                <li><strong className="text-slate-900">Vercel Analytics</strong> : mesure d&apos;audience sans cookie</li>
                <li>Aucun cookie publicitaire.</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">6. Tes droits (RGPD)</h2>
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
              <p className="mt-3 flex flex-wrap items-center gap-3 leading-relaxed text-slate-600"><span>Retrouve JcHub :</span><a href="https://www.facebook.com/1393952223791842" target="_blank" rel="noopener noreferrer" aria-label="JcHub sur Facebook" className="text-blue-700 hover:text-blue-900"><Facebook className="h-5 w-5" aria-hidden="true" /></a><a href="https://www.instagram.com/jchub.tech/" target="_blank" rel="noopener noreferrer" aria-label="JcHub sur Instagram" className="text-pink-600 hover:text-pink-800"><Instagram className="h-5 w-5" aria-hidden="true" /></a></p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">7. Conservation des données</h2>
              <p className="leading-relaxed text-slate-600">
                On conserve tes données tant que ton compte est actif. Après suppression, elles sont effacées sous 30
                jours (sauf obligations légales contraires). Les fichiers soumis aux outils de conversion sont effacés
                au plus tard sous 24 heures (voir la section 4). Le texte de tes recherches d&apos;outils n&apos;est pas
                conservé : seule la réponse est gardée 7 jours, sans lien avec toi, pour être resservie.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">8. Sécurité</h2>
              <p className="leading-relaxed text-slate-600">
                Tes données sont stockées sur des serveurs sécurisés (Firebase, Vercel, Cloudinary) avec chiffrement en
                transit et au repos. L&apos;accès est protégé par Firebase Auth.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">9. Modifications</h2>
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
