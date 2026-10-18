import { notFound } from 'next/navigation';
import { ChevronLeft, Facebook, Instagram, Lock, Mail, ShieldCheck } from 'lucide-react';
import { pageMetadata } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import { isLocale } from '@/i18n/routing';

type Labeled = [label: string, text: string];

const copy = bilingual({
  metaTitle: 'Politique de Confidentialité',
  sep: ' : ',
  metaDescription: 'Découvre quelles données JcHub collecte, comment elles sont utilisées et quels sont tes droits concernant leur traitement.',
  back: 'Retour à l’accueil',
  badge: 'Confidentialité',
  title: 'Politique de Confidentialité',
  updated: 'Dernière mise à jour : 17 octobre 2026 · Conforme RGPD',
  commitment: 'Notre engagement',
  commitmentText: 'Chez JcHub, on prend ta vie privée très au sérieux. Cette politique explique quelles données on collecte, pourquoi, et comment tu peux les contrôler.',
  s1Title: '1. Données collectées',
  s1Intro: 'Quand tu utilises JcHub, on collecte :',
  s1Items: [
    ['Compte', 'nom, email, photo de profil si tu te connectes à ton espace'],
    ['Préférences', 'niveau, langages connus, centres d’intérêt, objectif, si tu les renseignes'],
    ['Contact', 'nom, email, sujet et message envoyés via le formulaire'],
    ['Newsletter', 'adresse email si tu t’inscris'],
    ['Fichiers', 'documents et images que tu soumets aux outils de conversion (voir la section 4)'],
    ['Recherche d’outils', 'le texte que tu tapes dans la recherche assistée'],
    ['Technique', 'adresse IP (seule une empreinte hachée est enregistrée, pour la sécurité et les limites d’usage), type de navigateur, pages visitées'],
  ] as Labeled[],
  s2Title: '2. Pourquoi on collecte ces données',
  s2Items: [
    'Fournir les outils, notamment la conversion de fichiers, et appliquer les limites d’usage',
    'Personnaliser ton expérience et tes recommandations',
    'Améliorer la plateforme (mesure d’audience, avec ton accord pour les outils qui déposent des cookies)',
    'Répondre à tes demandes et aux éventuelles demandes de contact',
    'Te contacter pour des informations utiles sur les services',
    'Respecter nos obligations légales',
  ],
  s3Title: '3. Partage de tes données',
  s3Intro: 'On ne vend jamais tes données. On les partage uniquement avec les prestataires qui font fonctionner le site :',
  s3Items: [
    ['Vercel', 'hébergement du site, stockage temporaire des fichiers à convertir, mesure d’audience sans cookie (Vercel Analytics et Speed Insights)'],
    ['Cloudflare', 'diffusion du site et protection contre les attaques'],
    ['Firebase / Google Cloud', 'base de données et authentification'],
    ['Adobe PDF Services', 'conversion PDF vers Word et Word vers PDF'],
    ['Mistral AI, Groq et OpenRouter', 'recherche assistée d’outils (seul le texte de ta recherche leur est transmis, par nos serveurs)'],
    ['Brevo', 'envoi d’emails (newsletter, notifications)'],
    ['Cloudinary', 'stockage des médias du site'],
    ['Google Analytics et Metricool', 'mesure d’audience, uniquement si tu l’acceptes'],
    ['Giscus / GitHub', 'affichage des commentaires des articles ; publier un commentaire nécessite un compte GitHub'],
  ] as Labeled[],
  s3Outro: 'Certains de ces prestataires traitent les données hors de l’Union européenne, notamment aux États-Unis. Ces transferts s’appuient sur les garanties qu’ils proposent, comme les clauses contractuelles types de la Commission européenne.',
  s4Title: '4. Fichiers envoyés aux outils',
  s4Items: [
    'Les outils de génération et de transformation de texte (mots de passe, JSON, Base64, hash, QR code, regex…) fonctionnent entièrement dans ton navigateur : rien n’est envoyé.',
    'Les outils de conversion de fichiers (PDF vers Word, Word vers PDF, compression PDF, images vers PDF, optimiseur d’images, Excel vers CSV et CSV vers Excel) envoient ton fichier en HTTPS à nos serveurs. Il est placé dans un espace privé temporaire, effacé dès la fin de la conversion, et au plus tard sous 24 heures par une purge automatique.',
    'Pour PDF vers Word et Word vers PDF, le fichier est aussi transmis à Adobe PDF Services, qui réalise la conversion selon ses propres conditions de traitement.',
    'On n’utilise tes fichiers pour rien d’autre que la conversion demandée.',
    'Les limites (5 conversions par jour et par outil) sont appliquées grâce à une empreinte hachée de ton adresse IP : l’adresse elle-même n’est pas enregistrée.',
  ],
  s5Title: '5. Cookies',
  s5Necessary: ['Nécessaires', 'session de connexion et préférences, dont ton choix concernant les cookies (enregistré dans ton navigateur)'] as Labeled,
  s5Audience: ['Mesure d’audience', 'Google Analytics et Metricool ne sont chargés, et ne déposent leurs cookies, que si tu cliques sur « Accepter ». Tu peux changer d’avis à tout moment avec le lien « Gérer les cookies » en bas de chaque page. Ton choix t’est redemandé tous les 6 mois.'] as Labeled,
  s5Vercel: ['Vercel Analytics', 'mesure d’audience sans cookie'] as Labeled,
  s5NoAds: 'Aucun cookie publicitaire.',
  s6Title: '6. Tes droits (RGPD)',
  s6Intro: 'Tu peux à tout moment :',
  s6Items: [
    ['Accéder', 'à tes données'],
    ['Rectifier', 'tes informations'],
    ['Supprimer', 'tes données liées au contact ou à l’usage du site'],
    ['Exporter', 'tes données dans un format ouvert'],
    ['Refuser', 'les emails marketing (lien de désabonnement)'],
  ] as Labeled[],
  s6Exercise: 'Pour exercer ces droits :',
  findUs: 'Retrouve JcHub :',
  onFacebook: 'JcHub sur Facebook',
  onInstagram: 'JcHub sur Instagram',
  s7Title: '7. Conservation des données',
  s7Text: 'On conserve tes données tant que ton compte est actif. Après suppression, elles sont effacées sous 30 jours (sauf obligations légales contraires). Les fichiers soumis aux outils de conversion sont effacés au plus tard sous 24 heures (voir la section 4). Le texte de tes recherches d’outils n’est pas conservé : seule la réponse est gardée 7 jours, sans lien avec toi, pour être resservie.',
  s8Title: '8. Sécurité',
  s8Text: 'Tes données sont stockées sur des serveurs sécurisés (Firebase, Vercel, Cloudinary) avec chiffrement en transit et au repos. L’accès est protégé par Firebase Auth.',
  s9Title: '9. Modifications',
  s9Text: 'On peut modifier cette politique. Tu seras informé(e) par email en cas de changement majeur.',
}, {
  metaTitle: 'Privacy Policy',
  sep: ': ',
  metaDescription: 'Find out what data JcHub collects, how it is used and what your rights are regarding its processing.',
  back: 'Back to home',
  badge: 'Privacy',
  title: 'Privacy Policy',
  updated: 'Last updated: October 17, 2026 · GDPR compliant · In case of discrepancy, the French version prevails.',
  commitment: 'Our commitment',
  commitmentText: 'At JcHub, we take your privacy very seriously. This policy explains what data we collect, why, and how you can control it.',
  s1Title: '1. Data we collect',
  s1Intro: 'When you use JcHub, we collect:',
  s1Items: [
    ['Account', 'name, email, profile picture if you sign in to your space'],
    ['Preferences', 'level, known languages, interests, goal, if you fill them in'],
    ['Contact', 'name, email, subject and message sent through the form'],
    ['Newsletter', 'email address if you subscribe'],
    ['Files', 'documents and images you submit to the conversion tools (see section 4)'],
    ['Tool search', 'the text you type in the assisted search'],
    ['Technical', 'IP address (only a hashed fingerprint is stored, for security and usage limits), browser type, pages visited'],
  ],
  s2Title: '2. Why we collect this data',
  s2Items: [
    'Provide the tools, including file conversion, and enforce usage limits',
    'Personalize your experience and recommendations',
    'Improve the platform (audience measurement, with your consent for tools that set cookies)',
    'Answer your requests and any contact requests',
    'Contact you with useful information about the services',
    'Meet our legal obligations',
  ],
  s3Title: '3. Sharing your data',
  s3Intro: 'We never sell your data. We only share it with the providers that run the site:',
  s3Items: [
    ['Vercel', 'site hosting, temporary storage of files to convert, cookieless audience measurement (Vercel Analytics and Speed Insights)'],
    ['Cloudflare', 'site delivery and protection against attacks'],
    ['Firebase / Google Cloud', 'database and authentication'],
    ['Adobe PDF Services', 'PDF to Word and Word to PDF conversion'],
    ['Mistral AI, Groq and OpenRouter', 'assisted tool search (only the text of your search is sent to them, by our servers)'],
    ['Brevo', 'sending emails (newsletter, notifications)'],
    ['Cloudinary', 'storage of the site’s media'],
    ['Google Analytics and Metricool', 'audience measurement, only if you accept it'],
    ['Giscus / GitHub', 'display of article comments; posting a comment requires a GitHub account'],
  ],
  s3Outro: 'Some of these providers process data outside the European Union, notably in the United States. These transfers rely on the safeguards they offer, such as the European Commission’s standard contractual clauses.',
  s4Title: '4. Files sent to the tools',
  s4Items: [
    'The text generation and transformation tools (passwords, JSON, Base64, hash, QR code, regex…) run entirely in your browser: nothing is sent.',
    'The file conversion tools (PDF to Word, Word to PDF, PDF compression, images to PDF, image optimizer, Excel to CSV and CSV to Excel) send your file over HTTPS to our servers. It is placed in a temporary private space, erased as soon as the conversion ends, and within 24 hours at the latest by an automatic purge.',
    'For PDF to Word and Word to PDF, the file is also sent to Adobe PDF Services, which performs the conversion under its own processing terms.',
    'We use your files for nothing other than the conversion you requested.',
    'The limits (5 conversions per day and per tool) are enforced with a hashed fingerprint of your IP address: the address itself is not stored.',
  ],
  s5Title: '5. Cookies',
  s5Necessary: ['Necessary', 'sign-in session and preferences, including your cookie choice (stored in your browser)'],
  s5Audience: ['Audience measurement', 'Google Analytics and Metricool are only loaded, and only set their cookies, if you click “Accept”. You can change your mind at any time with the “Manage cookies” link at the bottom of every page. You are asked again every 6 months.'],
  s5Vercel: ['Vercel Analytics', 'cookieless audience measurement'],
  s5NoAds: 'No advertising cookies.',
  s6Title: '6. Your rights (GDPR)',
  s6Intro: 'At any time, you can:',
  s6Items: [
    ['Access', 'your data'],
    ['Correct', 'your information'],
    ['Delete', 'your data related to contact or to your use of the site'],
    ['Export', 'your data in an open format'],
    ['Refuse', 'marketing emails (unsubscribe link)'],
  ],
  s6Exercise: 'To exercise these rights:',
  findUs: 'Find JcHub:',
  onFacebook: 'JcHub on Facebook',
  onInstagram: 'JcHub on Instagram',
  s7Title: '7. Data retention',
  s7Text: 'We keep your data as long as your account is active. After deletion, it is erased within 30 days (unless legal obligations require otherwise). Files submitted to the conversion tools are erased within 24 hours at the latest (see section 4). The text of your tool searches is not kept: only the answer is kept for 7 days, with no link to you, so it can be served again.',
  s8Title: '8. Security',
  s8Text: 'Your data is stored on secure servers (Firebase, Vercel, Cloudinary) with encryption in transit and at rest. Access is protected by Firebase Auth.',
  s9Title: '9. Changes',
  s9Text: 'We may change this policy. You will be informed by email in case of a major change.',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, title: copy[locale].metaTitle, description: copy[locale].metaDescription, href: '/confidentialite' });
}

export default async function ConfidentialitePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  return (
    <div className="template-home min-h-screen overflow-hidden bg-[#eff6ff] text-[#0f172a]">
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(147,197,253,.48),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(191,219,254,.55),transparent_32%),#eff6ff] py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(37,99,235,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,.045)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_76%)]" />
        <div className="pointer-events-none absolute -right-36 top-8 h-80 w-80 rounded-full bg-blue-200/70 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-sky-200/70 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-800 transition hover:text-blue-600">
            <ChevronLeft className="h-4 w-4" />
            {t.back}
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-900 shadow-sm">
            <ShieldCheck className="h-4 w-4" />
            {t.badge}
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-[-.045em] text-[#0f172a] sm:text-5xl lg:text-6xl">
            {t.title}
          </h1>
          <p className="mt-3 text-base text-slate-600 md:text-lg">
            {t.updated}
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
                  {t.commitment}
                </p>
              </div>
              <p className="m-0 text-base font-medium text-slate-700">
                {t.commitmentText}
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.s1Title}</h2>
              <p className="mb-3 leading-relaxed text-slate-600">{t.s1Intro}</p>
              <LabeledList items={t.s1Items} sep={t.sep} />
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.s2Title}</h2>
              <ul className="list-disc space-y-2 pl-6 text-slate-600 marker:text-blue-600">
                {t.s2Items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.s3Title}</h2>
              <p className="mb-3 leading-relaxed text-slate-600">{t.s3Intro}</p>
              <LabeledList items={t.s3Items} sep={t.sep} />
              <p className="mt-3 leading-relaxed text-slate-600">
                {t.s3Outro}
              </p>
            </section>

            <section id="fichiers" className="scroll-mt-24 rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.s4Title}</h2>
              <ul className="list-disc space-y-2 pl-6 text-slate-600 marker:text-blue-600">
                {t.s4Items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.s5Title}</h2>
              <ul className="list-disc space-y-2 pl-6 text-slate-600 marker:text-blue-600">
                <li><strong className="text-slate-900">{t.s5Necessary[0]}</strong>{t.sep}{t.s5Necessary[1]}</li>
                <li>
                  <strong className="text-slate-900">{t.s5Audience[0]}</strong>{t.sep}{t.s5Audience[1]}
                </li>
                <li><strong className="text-slate-900">{t.s5Vercel[0]}</strong>{t.sep}{t.s5Vercel[1]}</li>
                <li>{t.s5NoAds}</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.s6Title}</h2>
              <p className="mb-3 leading-relaxed text-slate-600">{t.s6Intro}</p>
              <ul className="list-disc space-y-2 pl-6 text-slate-600 marker:text-blue-600">
                {t.s6Items.map(([verb, rest]) => <li key={verb}><strong className="text-slate-900">{verb}</strong> {rest}</li>)}
              </ul>
              <p className="mt-3 leading-relaxed text-slate-600">
                {t.s6Exercise}
                <a href="mailto:privacy@jchub.dev" className="ml-2 font-semibold text-blue-700 underline-offset-2 hover:underline">
                  privacy@jchub.dev
                </a>
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-3 leading-relaxed text-slate-600"><span>{t.findUs}</span><a href="https://www.facebook.com/1393952223791842" target="_blank" rel="noopener noreferrer" aria-label={t.onFacebook} className="text-blue-700 hover:text-blue-900"><Facebook className="h-5 w-5" aria-hidden="true" /></a><a href="https://www.instagram.com/jchub.tech/" target="_blank" rel="noopener noreferrer" aria-label={t.onInstagram} className="text-pink-600 hover:text-pink-800"><Instagram className="h-5 w-5" aria-hidden="true" /></a></p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.s7Title}</h2>
              <p className="leading-relaxed text-slate-600">
                {t.s7Text}
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.s8Title}</h2>
              <p className="leading-relaxed text-slate-600">
                {t.s8Text}
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.s9Title}</h2>
              <p className="mb-0 leading-relaxed text-slate-600">
                {t.s9Text}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function LabeledList({ items, sep }: { items: Labeled[]; sep: string }) {
  return (
    <ul className="list-disc space-y-2 pl-6 text-slate-600 marker:text-blue-600">
      {items.map(([label, text]) => <li key={label}><strong className="text-slate-900">{label}</strong>{sep}{text}</li>)}
    </ul>
  );
}
