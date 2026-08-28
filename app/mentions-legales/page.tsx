import Link from 'next/link';
import { Building2, ChevronLeft, Mail, Scale } from 'lucide-react';

export const metadata = {
  title: 'Mentions Légales',
};

export default function MentionsLegalesPage() {
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
            <Scale className="h-4 w-4" />
            Mentions légales
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
            Mentions Légales
          </h1>
          <p className="mt-3 text-base text-slate-600 md:text-lg">
            Dernière mise à jour : 18 août 2026
          </p>
        </div>
      </section>

      <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="legal-card rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-[0_25px_70px_rgba(15,23,42,0.07)] backdrop-blur-sm md:p-8">
          <div className="prose prose-lg max-w-none space-y-8 text-slate-700">
            <section className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="mb-3 flex items-center gap-3 text-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20">
                  <Building2 className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black md:text-2xl">Éditeur du site</h2>
              </div>
              <p className="space-y-1 leading-relaxed">
                <strong>JcHub</strong><br />
                Statut : Entreprise en création / Auto-entrepreneur<br />
                Siège social : Brazzaville, République du Congo 🇨🇬<br />
                Email : <a href="mailto:contact@jchub.dev" className="font-semibold text-orange-700 underline-offset-2 hover:underline">contact@jchub.dev</a><br />
                Directeur de la publication : Jessy Ngnambongo
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">Hébergement</h2>
              <p>
                <strong>Vercel Inc.</strong><br />
                340 S Lemon Ave #4133, Walnut, CA 91789, USA<br />
                Site web : <a href="https://vercel.com" target="_blank" rel="noopener" className="font-semibold text-orange-700 underline-offset-2 hover:underline">vercel.com</a>
              </p>
              <p className="mt-3">
                <strong>Firebase / Google Cloud</strong> (base de données) : Google LLC
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">Propriété intellectuelle</h2>
              <p>
                L&apos;ensemble des éléments du site (textes, images, logos, code source) est protégé par le droit
                d&apos;auteur. Toute reproduction est interdite sans autorisation préalable.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-black text-slate-900">Crédits</h2>
              <p>
                Icônes : <a href="https://lucide.dev" target="_blank" rel="noopener" className="font-semibold text-orange-700 underline-offset-2 hover:underline">Lucide</a> (licence ISC)<br />
                Framework : <a href="https://nextjs.org" target="_blank" rel="noopener" className="font-semibold text-orange-700 underline-offset-2 hover:underline">Next.js</a> (MIT)<br />
                UI : <a href="https://tailwindcss.com" target="_blank" rel="noopener" className="font-semibold text-orange-700 underline-offset-2 hover:underline">Tailwind CSS</a> (MIT)
              </p>
            </section>

            <section className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
              <h2 className="mb-3 text-2xl font-black text-slate-900">Contact</h2>
              <p className="mb-0 flex items-center gap-2 text-slate-700">
                <Mail className="h-4 w-4 text-orange-700" />
                Pour toute demande :
                <a href="mailto:contact@jchub.dev" className="font-semibold text-orange-700 underline-offset-2 hover:underline">
                  contact@jchub.dev
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
