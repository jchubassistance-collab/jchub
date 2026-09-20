import { Activity, ArrowRight, Code2, Command, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import Link from 'next/link';
import { getPublishedTools } from '@/lib/tools';
import { ToolsCatalog } from '@/components/tools/ToolsCatalog';

export const metadata = {
  title: 'Outils gratuits pour développeurs',
  description:
    'Collection d\'outils gratuits pour développeurs : générateur de mot de passe, JSON formatter, Base64, UUID, regex tester.',
};

export default async function ToolsPage() {
  const tools = await getPublishedTools();

  return (
    <div className="min-h-screen bg-[#020b1a] text-white">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(89,126,255,0.30),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(94,138,230,0.20),_transparent_35%),linear-gradient(135deg,_#020b1a_0%,_#091b3d_32%,_#123f8c_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08),_transparent_55%)]" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
            maskImage: 'radial-gradient(circle at center, black 32%, transparent 100%)',
          }}
        />
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full border border-[#9ccbff]/20 bg-[#80b5ff]/10 blur-3xl" />
        <div className="absolute -left-28 bottom-[-80px] h-80 w-80 rounded-full border border-white/10 bg-[#3a68d9]/10 blur-2xl" />
        <div className="absolute right-[-60px] top-[-40px] h-72 w-72 rounded-full border border-white/10 bg-[#96c7ff]/10 blur-2xl" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:gap-12 sm:px-6 sm:py-14 lg:grid-cols-[1fr_390px] lg:items-center lg:py-20">
          <div className="relative order-last lg:order-first" style={{ transform: 'perspective(1200px) rotateX(1.5deg) rotateY(-2deg)' }}>
            <div className="mb-5 hidden items-center gap-2 border border-[#9ccbff]/30 bg-[#9ccbff]/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.18em] text-[#dfeeff] sm:inline-flex"><Wrench className="h-4 w-4" />Dev utility lab</div>
            <h1 className="max-w-3xl text-4xl font-black leading-[.95] tracking-tight sm:text-7xl">Moins de friction.<br /><span className="text-[#9ccbff]">Plus de flow.</span></h1>
            <p className="mt-4 hidden max-w-2xl text-lg leading-8 text-slate-300 sm:mt-6 sm:block">Des outils rapides, privés et gratuits pour débloquer les détails qui ralentissent les grands projets.</p>
            <div className="mt-5 hidden flex-wrap gap-5 text-sm font-bold text-slate-300 sm:mt-8 sm:flex"><span className="inline-flex items-center gap-2"><Activity className="h-4 w-4 text-[#9ccbff]" />Instantané</span><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#9ccbff]" />Traitement local</span></div>
          </div>

          <div className="relative order-first overflow-hidden rounded-[2rem] border border-[#9ccbff]/20 bg-white/5 p-3 shadow-[0_35px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm lg:order-last sm:p-4" style={{ transform: 'perspective(1200px) rotateX(4deg) rotateY(-5deg)' }}>
            <div className="tools-terminal relative overflow-hidden border border-[#9ccbff]/20 bg-[#071427]/80 p-5 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 text-[10px] font-black uppercase tracking-[.18em] text-[#9ccbff]"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />JcHub tools</span><Command className="h-4 w-4" /></div>
              <div className="mt-5 space-y-3 font-mono text-xs"><p className="text-slate-400"><span className="text-[#9ccbff]">$</span> choose_your_tool</p><p className="text-[#9ccbff]">{tools.length} utilities loaded</p><div className="tools-terminal-bars"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div><p className="text-slate-400"><span className="text-[#9ccbff]">$</span> build_something_great<span className="tools-cursor" /></p></div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-12">

        <div className="relative mb-12 overflow-hidden rounded-[2rem] border border-white/10 bg-[#17324d] shadow-[0_22px_55px_rgba(10,20,40,0.45)]" style={{ transform: 'perspective(1200px) rotateX(2deg) rotateY(-2deg)' }}>
          <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85" alt="Composants électroniques et code" className="h-44 w-full object-cover opacity-40 sm:h-52" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#102a43] via-[#17324d]/80 to-transparent" />
          <div className="absolute inset-y-0 left-0 flex max-w-xl items-center p-6 text-white sm:p-8"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#9ccbff]"><Sparkles className="h-4 w-4" />Boîte à outils</p><p className="mt-2 text-2xl font-black sm:text-3xl">Un raccourci pour chaque blocage.</p><p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">Sécurité, code, données et productivité réunis au même endroit.</p></div></div>
        </div>
        <ToolsCatalog tools={tools} />

      <div className="mt-14 flex flex-col justify-between gap-5 rounded-[2rem] border border-[#9ccbff]/20 bg-[rgba(13,28,52,0.8)] p-6 shadow-[0_18px_40px_rgba(7,19,40,0.24)] backdrop-blur-sm sm:flex-row sm:items-center sm:p-8" style={{ transform: 'perspective(1200px) rotateX(2deg) rotateY(-2deg)' }}>
        <div><h3 className="text-lg font-black text-white">Un outil manque à l’appel ?</h3><p className="mt-1 text-sm text-slate-300">Dis-nous ce qui te ferait gagner du temps.</p></div>
        <Link href="/contact" className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#4a74d6] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#6fa3ff]">Suggérer un outil <ArrowRight className="h-4 w-4" /></Link>
      </div>
      <div className="mt-8 hidden">
        <h3 className="font-semibold text-lg mb-2">📬 Reçois nos nouveaux outils chaque semaine</h3>
        <p className="text-sm text-gray-600 mb-4">
          Des mises à jour utiles pour rester productif. Pas de spam, désabonnement en 1 clic.
        </p>
        <form className="flex flex-col sm:flex-row gap-2 max-w-md">
          <input
            type="email"
            placeholder="ton@email.com"
            required
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="bg-brand-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-brand-700"
          >
            S'inscrire
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:min-w-32"><span className="text-orange-600">{icon}</span><p className="mt-3 text-2xl font-black text-[#17324d]">{value}</p><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p></div>;
}
