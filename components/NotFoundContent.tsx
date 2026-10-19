import type { Metadata } from 'next';
import { Home, Search } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';

const copy = bilingual({
  title: 'Page introuvable',
  text: 'Oups ! La page que tu cherches n’existe pas (ou plus). Mais t’inquiète, on a plein d’autres trucs sympas à te proposer.',
  home: 'Retour à l’accueil',
  tools: 'Voir les outils',
  toolsLink: 'Outils',
  about: 'À propos',
  contact: 'Contact',
}, {
  title: 'Page not found',
  text: 'Oops! The page you’re looking for doesn’t exist (or no longer does). But don’t worry, we have plenty of other cool things to show you.',
  home: 'Back to home',
  tools: 'See the tools',
  toolsLink: 'Tools',
  about: 'About',
  contact: 'Contact',
});

/** Tab title and description of the 404 page, in the visitor's language. */
export function notFoundMetadata(locale: Locale): Metadata {
  return { title: copy[locale].title, description: copy[locale].text };
}

export function NotFoundContent({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh" />
      <div className="blob bg-brand-400 w-96 h-96 -top-20 -left-20 opacity-20 animate-float-slow" />
      <div className="blob bg-pink-400 w-96 h-96 -bottom-20 -right-20 opacity-20 animate-float" />

      <div className="relative max-w-md w-full text-center">
        <div className="mb-6">
          <div className="inline-block">
            <h1 className="text-[150px] font-black leading-none bg-gradient-to-br from-brand-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              404
            </h1>
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-black mb-3">{t.title}</h2>
        <p className="text-gray-600 mb-8">{t.text}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            locale={locale}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition"
          >
            <Home className="w-4 h-4" />
            {t.home}
          </Link>
          <Link
            href="/outils"
            locale={locale}
            className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 border-2 border-gray-200 px-6 py-3 rounded-xl font-semibold hover:border-brand-300 transition"
          >
            <Search className="w-4 h-4" />
            {t.tools}
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <Link href="/outils" locale={locale} className="hover:text-brand-600 mx-2">{t.toolsLink}</Link>·
          <Link href="/a-propos" locale={locale} className="hover:text-brand-600 mx-2">{t.about}</Link>·
          <Link href="/contact" locale={locale} className="hover:text-brand-600 mx-2">{t.contact}</Link>
        </div>
      </div>
    </div>
  );
}
