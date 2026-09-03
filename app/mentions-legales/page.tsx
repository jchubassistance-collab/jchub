import Link from 'next/link';
import { Building2, ChevronLeft, Mail, Scale } from 'lucide-react';

export const metadata = {
  title: 'Mentions Légales',
};

export default function MentionsLegalesPage() {
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
            <Scale className="h-4 w-4" />
            Mentions légales
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-5xl">
            Mentions Légales
          </h1>
          <p className="mt-3 text-base text-slate-300 md:text-lg">
            Dernière mise à jour : 18 août 2026
          </p>
        </div>
      </section>

      <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-[#9ccbff]/20 bg-[rgba(13,28,52,0.8)] p-6 shadow-[0_25px_70px_rgba(15,23,42,0.25)] backdrop-blur-sm md:p-8">
          <div className="space-y-8 text-slate-300">
            <section className="rounded-2xl border border-[#9ccbff]/20 bg-gradient-to-br from-[#18315f] to-[#0d1c38] p-5">
              <div className="mb-3 flex items-center gap-3 text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#4a74d6] to-[#9ccbff] text-white shadow-lg shadow-[#4a74d6]/30">
                  <Building2 className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black md:text-2xl">Éditeur du site</h2>
              </div>
              <p className="space-y-1 leading-relaxed text-slate-200">
                <strong className="text-white">JcHub</strong><br />
                Statut : Entreprise en création / Auto-entrepreneur<br />
                Siège social : Brazzaville, République du Congo 🇨🇬<br />
                Email : <a href="mailto:contact@jchub.dev" className="font-semibold text-[#9ccbff] underline-offset-2 hover:underline">contact@jchub.dev</a><br />
                Directeur de la publication : Jessy Ngnambongo
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">Hébergement</h2>
              <p className="leading-relaxed text-slate-300">
                <strong className="text-white">Vercel Inc.</strong><br />
                340 S Lemon Ave #4133, Walnut, CA 91789, USA<br />
                Site web : <a href="https://vercel.com" target="_blank" rel="noopener" className="font-semibold text-[#9ccbff] underline-offset-2 hover:underline">vercel.com</a>
              </p>
              <p className="mt-3 leading-relaxed text-slate-300">
                <strong className="text-white">Firebase / Google Cloud</strong> (base de données) : Google LLC
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">Propriété intellectuelle</h2>
              <p className="leading-relaxed text-slate-300">
                L&apos;ensemble des éléments du site (textes, images, logos, code source) est protégé par le droit
                d&apos;auteur. Toute reproduction est interdite sans autorisation préalable.
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">Crédits</h2>
              <p className="leading-relaxed text-slate-300">
                Icônes : <a href="https://lucide.dev" target="_blank" rel="noopener" className="font-semibold text-[#9ccbff] underline-offset-2 hover:underline">Lucide</a> (licence ISC)<br />
                Framework : <a href="https://nextjs.org" target="_blank" rel="noopener" className="font-semibold text-[#9ccbff] underline-offset-2 hover:underline">Next.js</a> (MIT)<br />
                UI : <a href="https://tailwindcss.com" target="_blank" rel="noopener" className="font-semibold text-[#9ccbff] underline-offset-2 hover:underline">Tailwind CSS</a> (MIT)
              </p>
            </section>

            <section className="rounded-2xl border border-[#9ccbff]/30 bg-gradient-to-br from-[#1d3365] to-[#0b1730] p-5">
              <h2 className="mb-3 text-2xl font-black text-white">Contact</h2>
              <p className="mb-0 flex items-center gap-2 text-slate-200">
                <Mail className="h-4 w-4 text-[#9ccbff]" />
                Pour toute demande :
                <a href="mailto:contact@jchub.dev" className="font-semibold text-[#9ccbff] underline-offset-2 hover:underline">
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
