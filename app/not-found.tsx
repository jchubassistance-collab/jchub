import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
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
        <h2 className="text-2xl md:text-3xl font-black mb-3">Page introuvable</h2>
        <p className="text-gray-600 mb-8">
          Oups ! La page que tu cherches n'existe pas (ou plus). Mais t'inquiète, on a plein
          d'autres trucs sympas à te proposer.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition"
          >
            <Home className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <Link
            href="/outils"
            className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 border-2 border-gray-200 px-6 py-3 rounded-xl font-semibold hover:border-brand-300 transition"
          >
            <Search className="w-4 h-4" />
            Voir les outils
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <Link href="/outils" className="hover:text-brand-600 mx-2">Outils</Link>·
          <Link href="/a-propos" className="hover:text-brand-600 mx-2">À propos</Link>·
          <Link href="/contact" className="hover:text-brand-600 mx-2">Contact</Link>
        </div>
      </div>
    </div>
  );
}
