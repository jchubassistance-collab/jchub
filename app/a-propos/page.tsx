import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, Heart, HeartHandshake, Lightbulb, Mail, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react';
import { getPublishedTools } from '@/lib/tools';

export const metadata = {
  title: 'À propos de JcHub',
  description: 'Découvrez JcHub, sa mission et son engagement pour des outils numériques simples et accessibles.',
};

const values = [
  { icon: Zap, title: 'Simplicité', text: 'Chaque outil doit être compris rapidement. Pas de tutoriel interminable, ni de jargon inutile.' },
  { icon: ShieldCheck, title: 'Fiabilité', text: 'Des outils clairs et prévisibles, conçus pour faire le travail sans détour.' },
  { icon: Heart, title: 'Accessibilité', text: 'Le numérique doit être accessible à tous, quel que soit le niveau technique.' },
];

const timeline = [
  { year: '2023', title: 'L’idée naît', text: 'Le constat est simple : trop d’outils, trop de complexité. Une première maquette voit le jour.' },
  { year: '2024', title: 'Les premiers outils', text: 'Les premiers outils pratiques prennent forme pour simplifier les tâches numériques du quotidien.' },
  { year: '2025', title: 'La communauté grandit', text: 'Le projet évolue avec les retours et les besoins de celles et ceux qui utilisent JcHub.' },
  { year: '2026', title: 'Et maintenant ?', text: 'De nouveaux outils et de nouvelles fonctionnalités : l’aventure continue.' },
];

export default async function AboutPage() {
  const publishedTools = await getPublishedTools();
  return (
    <div className="template-home template-about overflow-hidden bg-[#eff6ff] text-[#0f172a]" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <section className="template-home__hero relative isolate overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(147,197,253,.48),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(191,219,254,.55),transparent_32%),#eff6ff]">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(rgba(37,99,235,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.045) 1px,transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse at center,black 20%,transparent 76%)' }} />
        <div className="pointer-events-none absolute -left-36 top-32 h-80 w-80 rounded-full bg-blue-200/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-sky-200/70 blur-3xl" />
        <div className="template-about__hero-content relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-20 lg:min-h-[690px] lg:grid-cols-[1.05fr_.95fr] lg:gap-8 lg:px-10 lg:pb-24 lg:pt-24">
          <div className="template-home__intro order-2 max-w-2xl lg:order-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-900 shadow-sm"><span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" /> À propos de JcHub</span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-[-.045em] sm:text-5xl lg:text-[4.25rem]" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>
              Notre mission :<br /><span className="text-blue-700">simplifier le numérique.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">JcHub est né d’une conviction simple : le numérique doit être un outil au service des gens, pas une source de frustration. Nous construisons des outils clairs, utiles et accessibles à tous.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/outils" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#93c5fd] px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#60a5fa] hover:shadow-lg"><ArrowRight className="h-4 w-4" /> Explorer les outils</Link>
              <Link href="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-blue-100 bg-white px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><Mail className="h-4 w-4 text-blue-600" /> Nous contacter</Link>
            </div>
          </div>

          <div className="template-home__visual relative order-1 mx-auto flex w-full max-w-[510px] items-center justify-center lg:order-2 lg:justify-end">
            <div className="absolute inset-5 rounded-full bg-gradient-to-br from-blue-200 via-sky-100 to-blue-300 opacity-80 blur-2xl" />
            <span className="template-home__orbit template-home__orbit--one" aria-hidden="true" /><span className="template-home__orbit template-home__orbit--two" aria-hidden="true" />
            <span className="template-home__tech-dot template-home__tech-dot--one" aria-hidden="true" /><span className="template-home__tech-dot template-home__tech-dot--two" aria-hidden="true" /><span className="template-home__tech-dot template-home__tech-dot--three" aria-hidden="true" />
            <div className="template-home__circle relative aspect-square w-[min(82vw,400px)] rounded-full bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] p-[18px] shadow-[40px_40px_80px_rgba(37,99,235,.2),-15px_-15px_40px_rgba(255,255,255,.9)] ring-1 ring-white/60 sm:w-[440px] lg:w-[480px]">
              <div className="template-home__circle-image relative h-full w-full overflow-hidden rounded-full border-[10px] border-white bg-white shadow-inner">
                <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=800&fit=crop" alt="Une équipe JcHub échange autour d’un projet" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
              </div>
              <div className="template-home__badge template-home__badge--bottom absolute -bottom-1 left-0 flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-[0_16px_35px_rgba(15,23,42,.12)] sm:-left-8"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Users className="h-5 w-5" /></span><span><span className="block text-xs font-medium text-slate-500">Une communauté</span><strong className="mt-0.5 block text-sm text-[#0f172a]">qui progresse ensemble</strong></span></div>
              <div className="template-home__badge template-home__badge--top absolute -right-1 top-7 hidden items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-[0_16px_35px_rgba(15,23,42,.12)] sm:flex"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Heart className="h-5 w-5" /></span><span><span className="block text-xs font-medium text-slate-500">Créé avec</span><strong className="mt-0.5 block text-sm text-[#0f172a]">passion</strong></span></div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-20 px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6" aria-label="JcHub en chiffres">
          <Metric value={String(publishedTools.length)} label="outils disponibles" /><Metric value="100 %" label="gratuit" /><Metric value="24/7" label="accessible en ligne" /><Metric value="1" label="mission : être utile" />
        </section>

        <section className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-5"><Badge>NOTRE HISTOIRE</Badge><h2 className="text-3xl font-extrabold leading-tight sm:text-5xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>Comment tout<br /><span className="text-blue-700">a commencé.</span></h2><p className="leading-7 text-slate-600">JcHub est le fruit d’une frustration : celle de voir des outils numériques compliqués, lents et inutilement complexes. Nous avons décidé de créer l’inverse : des outils simples, rapides et vraiment utiles.</p><div className="grid grid-cols-2 gap-4 pt-2"><div className="rounded-2xl bg-blue-100/70 p-5"><strong className="block text-2xl font-bold">2023</strong><span className="mt-1 block text-sm text-slate-600">Lancement du projet</span></div><div className="rounded-2xl bg-blue-100/70 p-5"><strong className="block text-2xl font-bold">2024</strong><span className="mt-1 block text-sm text-slate-600">Premiers outils</span></div></div></div>
          <div className="template-about__timeline space-y-4">{timeline.map((item) => <article key={item.year} className="template-about__timeline-item relative ml-4 rounded-[20px] border border-blue-100 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,.035)]"><span className="template-about__timeline-dot" aria-hidden="true"><span /></span><span className="mb-2 block text-xs font-extrabold uppercase tracking-[.18em] text-blue-700">{item.year}</span><h3 className="text-lg font-bold" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p></article>)}</div>
        </section>

        <section className="space-y-9">
          <div className="mx-auto max-w-2xl space-y-4 text-center"><Badge>NOS VALEURS</Badge><h2 className="text-3xl font-extrabold sm:text-5xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>Ce qui nous <span className="text-blue-700">anime.</span></h2><p className="leading-7 text-slate-600">Trois principes simples guident chacune de nos décisions et chacun de nos outils.</p></div>
          <div className="grid gap-5 md:grid-cols-3">{values.map(({ icon: Icon, title, text }, index) => <article key={title} className="template-about__value group rounded-[20px] border border-blue-100 bg-white p-8 shadow-[0_2px_8px_rgba(15,23,42,.035)]"><span className="template-about__value-icon mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700 transition"><Icon className="h-6 w-6" /></span><span className="text-xs font-bold tracking-widest text-blue-300">0{index + 1}</span><h3 className="mt-3 text-xl font-bold" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></article>)}</div>
        </section>

        <section className="space-y-9">
          <div className="mx-auto max-w-2xl space-y-4 text-center"><Badge>L’ÉQUIPE</Badge><h2 className="text-3xl font-extrabold sm:text-5xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>Derrière <span className="text-blue-700">JcHub.</span></h2><p className="leading-7 text-slate-600">Une équipe passionnée qui croit que le numérique peut être simple et utile.</p></div>
          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-3"><TeamCard initials="JN" name="Jessy Ngnambongo" role="Fondateur & développeur" text="Passionné de technologie et de simplicité." /><TeamCard initials="JC" name="JcHub Team" role="Contributeurs" text="Une communauté grandissante." /><TeamCard initials="+" name="Vous ?" role="Rejoignez-nous" text="Nous cherchons toujours des talents." /></div>
        </section>

        <section className="relative overflow-hidden rounded-[1.75rem] bg-[#0f172a] px-7 py-10 text-white shadow-[0_24px_55px_rgba(15,23,42,.18)] sm:px-10 sm:py-14 lg:px-14">
          <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between"><div className="max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-blue-200"><Sparkles className="h-3.5 w-3.5" /> Envie de collaborer ?</span><h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>Construisons ensemble<br />le numérique de demain.</h2></div><Link href="/contact" className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold text-[#0f172a] transition hover:-translate-y-0.5 hover:bg-blue-100">Nous contacter <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></div>
        </section>
      </main>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.12em] text-blue-800 shadow-sm">{children}</span>;
}

function Metric({ value, label }: { value: string; label: string }) {
  return <article className="template-about__metric rounded-[20px] border border-blue-100 bg-white p-5 text-center shadow-[0_2px_8px_rgba(15,23,42,.035)] sm:p-8"><p className="template-about__metric-value text-3xl font-extrabold tracking-tight text-blue-700 sm:text-4xl">{value}</p><p className="mt-2 text-xs font-semibold text-slate-600 sm:text-sm">{label}</p></article>;
}

function TeamCard({ initials, name, role, text }: { initials: string; name: string; role: string; text: string }) {
  return <article className="template-about__team rounded-[20px] border border-blue-100 bg-white p-8 shadow-[0_2px_8px_rgba(15,23,42,.035)]"><div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-blue-400 text-xl font-extrabold text-white shadow-lg shadow-blue-600/20">{initials}</div><h3 className="text-lg font-bold" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{name}</h3><p className="mt-1 text-sm font-semibold text-blue-700">{role}</p><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></article>;
}
