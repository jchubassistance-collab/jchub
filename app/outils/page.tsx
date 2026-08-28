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
    <div className="tools-page bg-[#f5f7f5]">
      <section className="tools-hero relative overflow-hidden border-b border-slate-200 bg-[#112333] text-white">
        <div className="tools-grid absolute inset-0 opacity-25" aria-hidden="true" />
        <div className="tools-glow" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_390px] lg:items-center lg:py-20">
          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 border border-orange-300/30 bg-orange-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.18em] text-orange-200"><Wrench className="h-4 w-4" />Dev utility lab</div>
            <h1 className="max-w-3xl text-5xl font-black leading-[.92] tracking-tight sm:text-7xl">Moins de friction.<br /><span className="text-orange-300">Plus de flow.</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Des outils rapides, privés et gratuits pour débloquer les détails qui ralentissent les grands projets.</p>
            <div className="mt-8 flex flex-wrap gap-5 text-sm font-bold text-slate-300"><span className="inline-flex items-center gap-2"><Activity className="h-4 w-4 text-teal-300" />Instantané</span><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-orange-300" />Traitement local</span></div>
          </div>
          <div className="tools-terminal relative overflow-hidden border border-teal-300/25 bg-white/10 p-5 shadow-2xl backdrop-blur-sm"><div className="flex items-center justify-between border-b border-white/10 pb-4 text-[10px] font-black uppercase tracking-[.18em] text-teal-200"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />JcHub tools</span><Command className="h-4 w-4" /></div><div className="mt-5 space-y-3 font-mono text-xs"><p className="text-slate-400"><span className="text-orange-300">$</span> choose_your_tool</p><p className="text-teal-200">{tools.length} utilities loaded</p><div className="tools-terminal-bars"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div><p className="text-slate-400"><span className="text-orange-300">$</span> build_something_great<span className="tools-cursor" /></p></div></div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-12">

        <div className="relative mb-12 overflow-hidden rounded-2xl bg-[#17324d] shadow-xl"><img src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=85" alt="Composants électroniques et code" className="h-44 w-full object-cover opacity-40 sm:h-52" /><div className="absolute inset-0 bg-gradient-to-r from-[#102a43] via-[#17324d]/80 to-transparent" /><div className="absolute inset-y-0 left-0 flex max-w-xl items-center p-6 text-white sm:p-8"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-300"><Sparkles className="h-4 w-4" />Boîte à outils</p><p className="mt-2 text-2xl font-black sm:text-3xl">Un raccourci pour chaque blocage.</p><p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">Sécurité, code, données et productivité réunis au même endroit.</p></div></div></div>
        <ToolsCatalog tools={tools} />

      <div className="mt-14 flex flex-col justify-between gap-5 rounded-2xl border border-orange-200 bg-orange-50/70 p-6 sm:flex-row sm:items-center sm:p-8">
        <div><h3 className="text-lg font-black text-[#17324d]">Un outil manque à l’appel ?</h3><p className="mt-1 text-sm text-slate-600">Dis-nous ce qui te ferait gagner du temps.</p></div>
        <Link href="/contact" className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#17324d] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600">Suggérer un outil <ArrowRight className="h-4 w-4" /></Link>
      </div>
      <div className="mt-8 hidden">
        <h3 className="font-semibold text-lg mb-2">📬 Reçois nos nouveaux outils chaque semaine</h3>
        <p className="text-sm text-gray-600 mb-4">
          1 outil gratuit + 1 livre audio offert par semaine. Pas de spam, désabonnement en 1 clic.
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
