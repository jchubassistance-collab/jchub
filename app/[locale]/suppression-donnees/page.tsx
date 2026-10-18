import { notFound } from 'next/navigation';
import { ChevronLeft, Mail, ShieldCheck, Trash2 } from 'lucide-react';
import { pageMetadata } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import { isLocale } from '@/i18n/routing';

const copy = bilingual({
  metaTitle: 'Suppression des données utilisateur',
  metaDescription: 'Comment demander la suppression de vos données personnelles associées à JcHub.',
  back: 'Retour à l’accueil',
  badge: 'Données personnelles',
  title: 'Suppression des données utilisateur',
  updated: 'Dernière mise à jour : 14 octobre 2026',
  requestTitle: 'Demander la suppression',
  requestText: 'Pour demander la suppression des données personnelles associées à votre compte JcHub ou à votre utilisation de nos services, envoyez un email à notre équipe en charge de la confidentialité.',
  mailSubject: 'Demande de suppression de mes données',
  includeTitle: 'Informations à inclure',
  includeIntro: 'Pour nous aider à retrouver et vérifier votre compte, indiquez dans votre message :',
  includeItems: ['L’adresse email associée à votre compte JcHub', 'La méthode de connexion utilisée, par exemple Facebook, le cas échéant', 'Votre demande explicite de suppression des données'],
  includeOutro: 'N’envoyez pas votre mot de passe. Nous pouvons vous contacter pour vérifier votre identité avant de traiter la demande.',
  processTitle: 'Traitement de la demande',
  processText: 'Après vérification, les données personnelles concernées seront supprimées sous 30 jours. Certaines informations peuvent être conservées lorsque la loi l’impose. Nous vous confirmerons par email lorsque la demande aura été traitée.',
  moreStart: 'Pour plus de détails sur les données traitées et vos droits, consultez notre',
  moreLink: 'Politique de confidentialité',
}, {
  metaTitle: 'User data deletion',
  metaDescription: 'How to request the deletion of your personal data associated with JcHub.',
  back: 'Back to home',
  badge: 'Personal data',
  title: 'User data deletion',
  updated: 'Last updated: October 14, 2026',
  requestTitle: 'Request deletion',
  requestText: 'To request the deletion of the personal data associated with your JcHub account or your use of our services, send an email to our privacy team.',
  mailSubject: 'Request to delete my data',
  includeTitle: 'Information to include',
  includeIntro: 'To help us find and verify your account, include in your message:',
  includeItems: ['The email address associated with your JcHub account', 'The sign-in method you used, for example Facebook, if applicable', 'Your explicit request to delete your data'],
  includeOutro: 'Do not send your password. We may contact you to verify your identity before processing the request.',
  processTitle: 'Processing the request',
  processText: 'After verification, the personal data concerned will be deleted within 30 days. Some information may be kept when the law requires it. We will confirm by email once the request has been processed.',
  moreStart: 'For more details on the data processed and your rights, see our',
  moreLink: 'Privacy Policy',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, title: copy[locale].metaTitle, description: copy[locale].metaDescription, href: '/suppression-donnees' });
}

export default async function SuppressionDonneesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  return (
    <div className="template-home min-h-screen overflow-hidden bg-[#eff6ff] text-[#0f172a]">
      <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(147,197,253,.48),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(191,219,254,.55),transparent_32%),#eff6ff] py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(37,99,235,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,.045)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_76%)]" />
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

      <main className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-[0_18px_40px_rgba(7,19,40,0.12)] md:p-8">
          <div className="space-y-5 text-slate-600">
            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-3 text-[#0f172a]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4a74d6] to-[#9ccbff] text-white shadow-lg shadow-[#4a74d6]/30">
                  <Trash2 className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black md:text-2xl">{t.requestTitle}</h2>
              </div>
              <p className="leading-relaxed">
                {t.requestText}
              </p>
              <a
                href={`mailto:privacy@jchub.dev?subject=${encodeURIComponent(t.mailSubject)}`}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                <Mail className="h-4 w-4" />
                privacy@jchub.dev
              </a>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.includeTitle}</h2>
              <p className="mb-3 leading-relaxed">{t.includeIntro}</p>
              <ul className="list-disc space-y-2 pl-6 marker:text-blue-600">
                {t.includeItems.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <p className="mt-3 leading-relaxed">
                {t.includeOutro}
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.processTitle}</h2>
              <p className="leading-relaxed">
                {t.processText}
              </p>
            </section>

            <p className="leading-relaxed">
              {t.moreStart}{' '}
              <Link href="/confidentialite" className="font-semibold text-blue-700 underline-offset-2 hover:underline">
                {t.moreLink}
              </Link>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
