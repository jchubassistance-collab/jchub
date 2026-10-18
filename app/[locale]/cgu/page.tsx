import { notFound } from 'next/navigation';
import { ChevronLeft, FileText, Mail, ShieldCheck } from 'lucide-react';
import { pageMetadata } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import { isLocale } from '@/i18n/routing';

const copy = bilingual({
  metaTitle: 'Conditions Générales d\'Utilisation (CGU)',
  metaDescription: 'Consulte les conditions qui encadrent l’accès et l’utilisation des services et outils proposés par JcHub.',
  back: 'Retour à l’accueil',
  badge: 'CGU',
  title: 'Conditions Générales d’Utilisation',
  updated: 'Dernière mise à jour : 18 août 2026',
  s1: ['1. Présentation', 'JcHub (ci-après « la Plateforme ») est une plateforme d’apprentissage et de ressources pour développeurs, opérée par JcHub. Les présentes Conditions Générales d’Utilisation (CGU) régissent l’accès et l’utilisation de la plateforme par tout utilisateur.'],
  s2: ['2. Acceptation des CGU', 'L’utilisation de JcHub implique l’acceptation pleine et entière des présentes CGU. Si vous n’acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.'],
  s3: ['3. Accès et utilisation', 'L’utilisation de JcHub est libre et gratuite. Vous vous engagez à fournir des informations exactes lors de l’utilisation des formulaires de contact ou des services liés à l’inscription, et à utiliser la plateforme de manière responsable et conforme à la loi.'],
  s4Title: '4. Services proposés',
  s4Intro: 'JcHub propose notamment :',
  s4Items: ['Outils en ligne gratuits pour développeurs', 'Ressources et guides de mise en pratique', 'Assistant IA conversationnel', 'Contenus éducatifs et documentaires', 'Espace de contact et d’échange'],
  s5: ['5. Utilisation du service', 'Les services de JcHub sont fournis sans frais pour l’instant. Toute utilisation du site doit rester conforme aux présentes conditions ainsi qu’aux lois et règlements applicables dans le cadre de l’utilisation d’outils numériques et de contenus pédagogiques.'],
  s6: ['6. Propriété intellectuelle', 'Les contenus présents sur JcHub (articles, illustrations, outils et ressources) sont protégés par le droit d’auteur. Certains contenus sont placés sous licences Creative Commons (CC BY-SA, CC BY-NC-SA) avec mention de l’auteur et de la licence. Toute reproduction non autorisée est interdite.'],
  s7Title: '7. Données personnelles',
  s7Start: 'Vos données sont traitées conformément à notre ',
  s7Link: 'Politique de Confidentialité',
  s7End: '. Vous disposez d’un droit d’accès, de rectification et de suppression.',
  s8: ['8. Responsabilité', 'JcHub s’efforce de maintenir la plateforme accessible et fonctionnelle, mais ne peut garantir une disponibilité totale. La plateforme n’est pas responsable de l’usage fait des contenus mis à disposition.'],
  s9: ['9. Suspension et résiliation', 'En cas de non-respect des présentes CGU, JcHub se réserve le droit de suspendre ou résilier votre compte sans préavis ni indemnité.'],
  s10: ['10. Modification des CGU', 'JcHub peut modifier les présentes CGU. Les utilisateurs seront informés par email ou par notification sur la plateforme.'],
  s11: ['11. Droit applicable', 'Les présentes CGU sont régies par le droit congolais. Tout litige sera soumis à la compétence des tribunaux de Brazzaville.'],
  s12Title: '12. Contact',
  s12Text: 'Pour toute question :',
}, {
  metaTitle: 'Terms of Use',
  metaDescription: 'Read the terms that govern access to and use of the services and tools offered by JcHub.',
  back: 'Back to home',
  badge: 'Terms',
  title: 'Terms of Use',
  updated: 'Last updated: August 18, 2026 · In case of discrepancy, the French version prevails.',
  s1: ['1. Overview', 'JcHub (hereinafter “the Platform”) is a learning and resource platform for developers, operated by JcHub. These Terms of Use govern access to and use of the platform by any user.'],
  s2: ['2. Acceptance of the Terms', 'Using JcHub implies full and complete acceptance of these Terms. If you do not accept them, please do not use the platform.'],
  s3: ['3. Access and use', 'Using JcHub is open and free of charge. You agree to provide accurate information when using the contact forms or sign-up related services, and to use the platform responsibly and lawfully.'],
  s4Title: '4. Services offered',
  s4Intro: 'JcHub offers, among other things:',
  s4Items: ['Free online tools for developers', 'Practical resources and guides', 'Conversational AI assistant', 'Educational and documentary content', 'Contact and discussion space'],
  s5: ['5. Use of the service', 'JcHub services are provided free of charge for now. Any use of the site must comply with these terms and with the laws and regulations that apply to the use of digital tools and educational content.'],
  s6: ['6. Intellectual property', 'The content on JcHub (articles, illustrations, tools and resources) is protected by copyright. Some content is published under Creative Commons licenses (CC BY-SA, CC BY-NC-SA) with credit to the author and the license. Any unauthorized reproduction is prohibited.'],
  s7Title: '7. Personal data',
  s7Start: 'Your data is processed in accordance with our ',
  s7Link: 'Privacy Policy',
  s7End: '. You have the right to access, correct and delete it.',
  s8: ['8. Liability', 'JcHub strives to keep the platform available and working, but cannot guarantee full availability. The platform is not responsible for how the content it provides is used.'],
  s9: ['9. Suspension and termination', 'If these Terms are not respected, JcHub reserves the right to suspend or terminate your account without notice or compensation.'],
  s10: ['10. Changes to the Terms', 'JcHub may change these Terms. Users will be informed by email or by a notification on the platform.'],
  s11: ['11. Governing law', 'These Terms are governed by Congolese law. Any dispute will be submitted to the courts of Brazzaville.'],
  s12Title: '12. Contact',
  s12Text: 'For any question:',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, title: copy[locale].metaTitle, description: copy[locale].metaDescription, href: '/cgu' });
}

export default async function CGUPage({ params }: { params: Promise<{ locale: string }> }) {
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
            <FileText className="h-4 w-4" />
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
            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-3 text-[#0f172a]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4a74d6] to-[#9ccbff] text-white shadow-lg shadow-[#4a74d6]/30">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-[#0f172a] md:text-2xl">{t.s1[0]}</h2>
              </div>
              <p className="leading-relaxed text-slate-600">{t.s1[1]}</p>
            </section>

            {[t.s2, t.s3].map(([title, text]) => <Section key={title} title={title} text={text} />)}

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.s4Title}</h2>
              <p className="mb-3 leading-relaxed text-slate-600">{t.s4Intro}</p>
              <ul className="list-disc space-y-2 pl-6 text-slate-600 marker:text-blue-600">
                {t.s4Items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>

            {[t.s5, t.s6].map(([title, text]) => <Section key={title} title={title} text={text} />)}

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.s7Title}</h2>
              <p className="leading-relaxed text-slate-600">
                {t.s7Start}<Link href="/confidentialite" className="font-semibold text-blue-700 underline-offset-2 hover:underline">{t.s7Link}</Link>{t.s7End}
              </p>
            </section>

            {[t.s8, t.s9, t.s10, t.s11].map(([title, text]) => <Section key={title} title={title} text={text} />)}

            <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.s12Title}</h2>
              <p className="flex items-center gap-2 text-slate-700">
                <Mail className="h-4 w-4 text-blue-700" />
                {t.s12Text}
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

function Section({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
      <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{title}</h2>
      <p className="leading-relaxed text-slate-600">{text}</p>
    </section>
  );
}
