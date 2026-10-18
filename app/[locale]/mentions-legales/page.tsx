import { notFound } from 'next/navigation';
import { Building2, ChevronLeft, Facebook, Instagram, Mail, Scale } from 'lucide-react';
import { pageMetadata } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import { isLocale } from '@/i18n/routing';

const copy = bilingual({
  metaTitle: 'Mentions Légales',
  metaDescription: 'Informations légales sur l’éditeur, l’hébergement et la publication du site JcHub.',
  back: 'Retour à l’accueil',
  badge: 'Mentions légales',
  title: 'Mentions Légales',
  updated: 'Dernière mise à jour : 18 août 2026',
  publisher: 'Éditeur du site',
  status: 'Statut : Entreprise en création / Auto-entrepreneur',
  office: 'Siège social : Brazzaville, République du Congo 🇨🇬',
  email: 'Email : ',
  director: 'Directeur de la publication : Jessy Ngnambongo',
  hosting: 'Hébergement',
  website: 'Site web : ',
  database: ' (base de données) : Google LLC',
  ip: 'Propriété intellectuelle',
  ipText: 'L’ensemble des éléments du site (textes, images, logos, code source) est protégé par le droit d’auteur. Toute reproduction est interdite sans autorisation préalable.',
  credits: 'Crédits',
  icons: 'Icônes : ',
  license: (name: string) => ` (licence ${name})`,
  framework: 'Framework : ',
  ui: 'UI : ',
  contact: 'Contact',
  request: 'Pour toute demande :',
  findUs: 'Retrouve JcHub :',
  onFacebook: 'JcHub sur Facebook',
  onInstagram: 'JcHub sur Instagram',
}, {
  metaTitle: 'Legal Notice',
  metaDescription: 'Legal information about the publisher, hosting and publication of the JcHub website.',
  back: 'Back to home',
  badge: 'Legal notice',
  title: 'Legal Notice',
  updated: 'Last updated: August 18, 2026 · In case of discrepancy, the French version prevails.',
  publisher: 'Site publisher',
  status: 'Status: Company being formed / Sole proprietor',
  office: 'Registered office: Brazzaville, Republic of the Congo 🇨🇬',
  email: 'Email: ',
  director: 'Publication director: Jessy Ngnambongo',
  hosting: 'Hosting',
  website: 'Website: ',
  database: ' (database): Google LLC',
  ip: 'Intellectual property',
  ipText: 'All elements of the site (texts, images, logos, source code) are protected by copyright. Any reproduction is prohibited without prior permission.',
  credits: 'Credits',
  icons: 'Icons: ',
  license: (name: string) => ` (${name} license)`,
  framework: 'Framework: ',
  ui: 'UI: ',
  contact: 'Contact',
  request: 'For any request:',
  findUs: 'Find JcHub:',
  onFacebook: 'JcHub on Facebook',
  onInstagram: 'JcHub on Instagram',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, title: copy[locale].metaTitle, description: copy[locale].metaDescription, href: '/mentions-legales' });
}

export default async function MentionsLegalesPage({ params }: { params: Promise<{ locale: string }> }) {
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
            <Scale className="h-4 w-4" />
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
                  <Building2 className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-[#0f172a] md:text-2xl">{t.publisher}</h2>
              </div>
              <p className="space-y-1 leading-relaxed text-slate-700">
                <strong className="text-slate-900">JcHub</strong><br />
                {t.status}<br />
                {t.office}<br />
                {t.email}<a href="mailto:contact@jchub.dev" className="font-semibold text-blue-700 underline-offset-2 hover:underline">contact@jchub.dev</a><br />
                {t.director}
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.hosting}</h2>
              <p className="leading-relaxed text-slate-600">
                <strong className="text-slate-900">Vercel Inc.</strong><br />
                340 S Lemon Ave #4133, Walnut, CA 91789, USA<br />
                {t.website}<a href="https://vercel.com" target="_blank" rel="noopener" className="font-semibold text-blue-700 underline-offset-2 hover:underline">vercel.com</a>
              </p>
              <p className="mt-3 leading-relaxed text-slate-600">
                <strong className="text-slate-900">Firebase / Google Cloud</strong>{t.database}
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.ip}</h2>
              <p className="leading-relaxed text-slate-600">
                {t.ipText}
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.credits}</h2>
              <p className="leading-relaxed text-slate-600">
                {t.icons}<a href="https://lucide.dev" target="_blank" rel="noopener" className="font-semibold text-blue-700 underline-offset-2 hover:underline">Lucide</a>{t.license('ISC')}<br />
                {t.framework}<a href="https://nextjs.org" target="_blank" rel="noopener" className="font-semibold text-blue-700 underline-offset-2 hover:underline">Next.js</a> (MIT)<br />
                {t.ui}<a href="https://tailwindcss.com" target="_blank" rel="noopener" className="font-semibold text-blue-700 underline-offset-2 hover:underline">Tailwind CSS</a> (MIT)
              </p>
            </section>

            <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">{t.contact}</h2>
              <p className="mb-0 flex items-center gap-2 text-slate-700">
                <Mail className="h-4 w-4 text-blue-700" />
                {t.request}
                <a href="mailto:contact@jchub.dev" className="font-semibold text-blue-700 underline-offset-2 hover:underline">
                  contact@jchub.dev
                </a>
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600"><span>{t.findUs}</span><a href="https://www.facebook.com/1393952223791842" target="_blank" rel="noopener noreferrer" aria-label={t.onFacebook} className="text-blue-700 hover:text-blue-900"><Facebook className="h-5 w-5" aria-hidden="true" /></a><a href="https://www.instagram.com/jchub.tech/" target="_blank" rel="noopener noreferrer" aria-label={t.onInstagram} className="text-pink-600 hover:text-pink-800"><Instagram className="h-5 w-5" aria-hidden="true" /></a></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
