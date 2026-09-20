import { BookOpen, Download, FileText, ShieldCheck } from 'lucide-react';
import { GuideDownloadForm } from '@/components/GuideDownloadForm';
import { getGuides } from '@/lib/guides-server';

export const metadata = {
  title: 'Guides gratuits',
  description: 'Des fiches pratiques gratuites pour avancer avec les outils numériques.',
};

export default async function GuidesPage() {
  const guides = await getGuides();
  return (
    <div className="min-h-screen bg-[#030b16] text-slate-100">
      <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.18),transparent_28%),linear-gradient(135deg,#05131f_0%,#081b2b_48%,#0b1220_100%)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">JcHub / Guides</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl">Des fiches pratiques à garder sous la main.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Des ressources gratuites, courtes et directement applicables. L’adresse e-mail sert uniquement à débloquer le téléchargement, sauf si tu choisis aussi la newsletter.</p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <Info icon={<BookOpen className="h-5 w-5" />} title="Pratiques" text="Des commandes et procédures concrètes." />
          <Info icon={<Download className="h-5 w-5" />} title="Gratuits" text="Aucun abonnement obligatoire pour télécharger." />
          <Info icon={<ShieldCheck className="h-5 w-5" />} title="Clairs" text="Une adresse e-mail, sans inscription marketing imposée." />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <article key={guide.slug} className="group relative overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,24,48,0.96),rgba(7,20,34,0.9))] shadow-[0_18px_40px_rgba(3,7,18,0.45)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-[0_22px_50px_rgba(34,211,238,0.14)]">
              <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden rounded-t-[20px] bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.24),transparent_35%),linear-gradient(135deg,#102b43,#071526)]">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(156,203,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(156,203,255,0.14) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                <div className="relative grid h-16 w-16 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200 shadow-[0_12px_30px_rgba(34,211,238,.16)] transition duration-500 group-hover:scale-105 group-hover:rotate-2">
                  <FileText className="h-8 w-8" />
                </div>
              </div>
              <div className="p-3.5">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-300">
                  <span className="rounded-full bg-orange-500/15 px-2 py-1 font-semibold text-orange-300">{guide.category}</span>
                  <span className="rounded-full bg-white/5 px-2 py-1 text-slate-400">{guide.format}</span>
                </div>
                <h2 className="mb-1.5 line-clamp-2 text-base font-black leading-snug text-white transition group-hover:text-cyan-200">{guide.title}</h2>
                <p className="mb-3 line-clamp-2 text-sm leading-5 text-slate-300">{guide.description}</p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-slate-300">{guide.level}</span>
                  <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-slate-300">{guide.size}</span>
                </div>
                <GuideDownloadForm guideSlug={guide.slug} />
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

function Info({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[.03] p-4"><span className="text-cyan-300">{icon}</span><div><h2 className="font-bold text-white">{title}</h2><p className="mt-1 text-sm text-slate-400">{text}</p></div></div>;
}
