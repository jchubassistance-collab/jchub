import Link from 'next/link';
import { Building2, ChevronLeft, Mail, Scale } from 'lucide-react';

export const metadata = {
  title: 'Mentions Légales',
};

export default function MentionsLegalesPage() {
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
            <Scale className="h-4 w-4" />
            Mentions légales
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-[-.045em] text-[#0f172a] sm:text-5xl lg:text-6xl">
            Mentions Légales
          </h1>
          <p className="mt-3 text-base text-slate-600 md:text-lg">
            Dernière mise à jour : 18 août 2026
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
                <h2 className="text-xl font-black text-[#0f172a] md:text-2xl">Éditeur du site</h2>
              </div>
              <p className="space-y-1 leading-relaxed text-slate-700">
                <strong className="text-slate-900">JcHub</strong><br />
                Statut : Entreprise en création / Auto-entrepreneur<br />
                Siège social : Brazzaville, République du Congo 🇨🇬<br />
                Email : <a href="mailto:contact@jchub.dev" className="font-semibold text-blue-700 underline-offset-2 hover:underline">contact@jchub.dev</a><br />
                Directeur de la publication : Jessy Ngnambongo
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">Hébergement</h2>
              <p className="leading-relaxed text-slate-600">
                <strong className="text-slate-900">Vercel Inc.</strong><br />
                340 S Lemon Ave #4133, Walnut, CA 91789, USA<br />
                Site web : <a href="https://vercel.com" target="_blank" rel="noopener" className="font-semibold text-blue-700 underline-offset-2 hover:underline">vercel.com</a>
              </p>
              <p className="mt-3 leading-relaxed text-slate-600">
                <strong className="text-slate-900">Firebase / Google Cloud</strong> (base de données) : Google LLC
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">Propriété intellectuelle</h2>
              <p className="leading-relaxed text-slate-600">
                L&apos;ensemble des éléments du site (textes, images, logos, code source) est protégé par le droit
                d&apos;auteur. Toute reproduction est interdite sans autorisation préalable.
              </p>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">Crédits</h2>
              <p className="leading-relaxed text-slate-600">
                Icônes : <a href="https://lucide.dev" target="_blank" rel="noopener" className="font-semibold text-blue-700 underline-offset-2 hover:underline">Lucide</a> (licence ISC)<br />
                Framework : <a href="https://nextjs.org" target="_blank" rel="noopener" className="font-semibold text-blue-700 underline-offset-2 hover:underline">Next.js</a> (MIT)<br />
                UI : <a href="https://tailwindcss.com" target="_blank" rel="noopener" className="font-semibold text-blue-700 underline-offset-2 hover:underline">Tailwind CSS</a> (MIT)
              </p>
            </section>

            <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 sm:p-6">
              <h2 className="mb-3 text-xl font-black text-[#0f172a] md:text-2xl">Contact</h2>
              <p className="mb-0 flex items-center gap-2 text-slate-700">
                <Mail className="h-4 w-4 text-blue-700" />
                Pour toute demande :
                <a href="mailto:contact@jchub.dev" className="font-semibold text-blue-700 underline-offset-2 hover:underline">
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
