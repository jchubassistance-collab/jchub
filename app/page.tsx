import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Code2, Compass, Mail, ShieldCheck, Wrench, Zap } from 'lucide-react';
import { isToolVisibleToday, tools } from '@/lib/tools';
import { Newsletter } from '@/components/Newsletter';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const featuredTools = tools.filter((tool) => tool.status !== 'draft' && isToolVisibleToday(tool)).slice(0, 3);
  return (
    <div className="template-home overflow-hidden bg-[#eff6ff] text-[#0f172a]" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <section className="template-home__hero relative isolate overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(147,197,253,.48),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(191,219,254,.55),transparent_32%),#eff6ff]">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(rgba(37,99,235,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.045) 1px,transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse at center,black 20%,transparent 76%)' }} />
        <div className="pointer-events-none absolute -left-36 top-32 h-80 w-80 rounded-full bg-blue-200/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-sky-200/70 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-20 lg:min-h-[690px] lg:grid-cols-[1.05fr_.95fr] lg:gap-8 lg:px-10 lg:pb-24 lg:pt-16">
          <div className="template-home__intro order-2 max-w-2xl lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-sm font-semibold text-blue-900 shadow-sm shadow-blue-900/5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" /> Des outils utiles, accessibles tout de suite
            </div>
            <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-[-.045em] text-[#0f172a] sm:text-5xl lg:text-[4.25rem]" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>
              Découvre, utilise <span className="text-blue-700">et partage</span> des outils utiles.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              JcHub rassemble des outils pratiques et des ressources claires pour t’aider à avancer dans tes projets numériques, sans détour.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/outils" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#93c5fd] px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#60a5fa] hover:shadow-lg hover:shadow-blue-900/10">
                <Wrench className="h-4 w-4" /> Explorer les outils <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/a-propos" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-blue-100 bg-white px-7 py-3.5 text-sm font-bold text-[#0f172a] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-900/10">
                En savoir plus <ArrowRight className="h-4 w-4 text-blue-600" />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-blue-600" /> Des outils gratuits</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-blue-600" /> Simples à utiliser</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-blue-600" /> Pensés pour le quotidien</span>
            </div>
          </div>

          <div className="template-home__visual relative order-1 mx-auto flex w-full max-w-[510px] items-center justify-center lg:order-2 lg:justify-end">
            <div className="absolute inset-5 rounded-full bg-gradient-to-br from-blue-200 via-sky-100 to-blue-300 opacity-80 blur-2xl" />
            <span className="template-home__orbit template-home__orbit--one" aria-hidden="true" />
            <span className="template-home__orbit template-home__orbit--two" aria-hidden="true" />
            <span className="template-home__tech-dot template-home__tech-dot--one" aria-hidden="true" />
            <span className="template-home__tech-dot template-home__tech-dot--two" aria-hidden="true" />
            <span className="template-home__tech-dot template-home__tech-dot--three" aria-hidden="true" />
            <div className="template-home__circle relative aspect-square w-[min(82vw,400px)] rounded-full bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] p-[18px] shadow-[40px_40px_80px_rgba(37,99,235,.2),-15px_-15px_40px_rgba(255,255,255,.9)] ring-1 ring-white/60 sm:w-[440px] lg:w-[480px]">
              <div className="template-home__circle-image relative h-full w-full overflow-hidden rounded-full border-[10px] border-white bg-white shadow-inner">
                <Image src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=800&fit=crop" alt="Teamwork" fill priority fetchPriority="high" sizes="(max-width: 640px) 82vw, (max-width: 1024px) 440px, 480px" className="object-cover" />
              </div>
              <div className="template-home__badge template-home__badge--bottom absolute -bottom-1 left-0 flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-[0_16px_35px_rgba(15,23,42,.12)] sm:-left-8">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Zap className="h-5 w-5" /></span>
                <span><span className="block text-xs font-medium text-slate-500">Rapide à prendre en main</span><strong className="mt-0.5 block text-sm text-[#0f172a]">Un outil à la fois</strong></span>
              </div>
              <div className="template-home__badge template-home__badge--top absolute -right-1 top-7 hidden items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-[0_16px_35px_rgba(15,23,42,.12)] sm:flex">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><ShieldCheck className="h-5 w-5" /></span>
                <span><span className="block text-xs font-medium text-slate-500">Un espace pratique</span><strong className="mt-0.5 block text-sm text-[#0f172a]">Outils & ressources</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Partenaires JcHub" className="template-home__partners relative overflow-hidden pb-20">
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            <Partner name="njdwebs" logo="/partners/njdweb.svg" href="https://njdwebs.com" />
            <Partner name="2MD Designer" logo="/partners/2md_designer.png" href="https://2md-designer.com" />
          </div>
          <div className="mt-12 text-center">
            <Link href="/contact" className="group inline-flex items-center gap-2 rounded-full bg-[#93c5fd] px-8 py-3.5 text-sm font-semibold text-[#0f172a] shadow-sm transition hover:-translate-y-1 hover:bg-[#60a5fa] hover:shadow-[0_12px_25px_rgba(37,99,235,.15)]">
              Devenir partenaire <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-7xl space-y-20 px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <section aria-label="Accès rapides" className="grid gap-4 sm:grid-cols-2 lg:max-w-4xl">
          <QuickLink href="/outils" icon={<Wrench className="h-5 w-5" />} title="Outils gratuits" meta="Trouver une solution pratique" />
          <QuickLink href="/contact" icon={<Mail className="h-5 w-5" />} title="Parlons de ton projet" meta="Une question ou une idée ?" />
        </section>

        <section className="space-y-9">
          <SectionTitle eyebrow="OUTILS PRATIQUES" title={<>Ce dont tu as besoin,<br /><span className="text-slate-500">sans distraction.</span></>} action="Tous les outils" href="/outils" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredTools.map((tool) => (
              <Link href={`/outils/${tool.slug}`} key={tool.slug} className="template-home__card group rounded-[1.25rem] border border-blue-100/80 bg-white p-7 shadow-[0_2px_8px_rgba(15,23,42,.035)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_44px_rgba(37,99,235,.12)]">
                <span className="template-home__icon mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#eff6ff] text-3xl text-blue-700 transition duration-300 group-hover:rotate-[-4deg] group-hover:bg-blue-600 group-hover:text-white">{tool.icon}</span>
                <span className="mb-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-800">{tool.category}</span>
                <h3 className="mt-2 text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{tool.name}</h3>
                <p className="mt-3 min-h-[3.5rem] text-sm leading-6 text-slate-600">{tool.description}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-700">Utiliser <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-9">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <Badge>COMMENT ÇA MARCHE</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0f172a] sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>Une expérience simple et efficace.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <Step number="01" title="Explore" text="Trouve un outil qui répond à ton besoin du moment." icon={<Compass className="h-5 w-5" />} />
            <Step number="02" title="Utilise" text="Suis les étapes et travaille directement avec la ressource choisie." icon={<Zap className="h-5 w-5" />} />
            <Step number="03" title="Progresse" text="Garde le cap sur ton projet, sans perdre du temps à chercher." icon={<Check className="h-5 w-5" />} />
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-blue-100 bg-white p-7 shadow-[0_10px_40px_rgba(37,99,235,.06)] sm:p-10 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="max-w-xl">
              <Badge>POURQUOI JCHUB</Badge>
              <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-[#0f172a] sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>Une plateforme utile, sans surplus.</h2>
              <p className="mt-4 leading-7 text-slate-600">Nous réunissons des outils clairs et des ressources pratiques pour faire avancer tes projets numériques plus sereinement.</p>
            </div>
            <div className="space-y-3">
              <Benefit text="Des outils gratuits à utiliser immédiatement" icon={<ShieldCheck className="h-5 w-5" />} />
              <Benefit text="Des étapes simples pour résoudre un besoin précis" icon={<Zap className="h-5 w-5" />} />
              <Benefit text="Des ressources pensées pour les projets numériques" icon={<Code2 className="h-5 w-5" />} />
              <Benefit text="Un accès direct aux outils, sans détour" icon={<ArrowRight className="h-5 w-5" />} />
            </div>
          </div>
        </section>
        <section className="rounded-[1.75rem] border border-blue-100 bg-white p-7 shadow-[0_10px_40px_rgba(37,99,235,.06)] sm:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <Badge><Mail className="h-3.5 w-3.5" /> NEWSLETTER</Badge>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[#0f172a] sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>Une dose utile, pas de bruit.</h2>
            <p className="mt-3 leading-7 text-slate-600">Nouveaux outils, ressources utiles et conseils pratiques directement dans ta boîte mail.</p>
            <Newsletter appearance="light" />
            <p className="mt-3 text-xs text-slate-500">Tu peux te désinscrire à tout moment.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.12em] text-blue-800 shadow-sm">{children}</span>;
}

function QuickLink({ href, icon, title, meta }: { href: string; icon: React.ReactNode; title: string; meta: string }) {
  return <Link href={href} className="group flex items-center gap-4 rounded-[1.15rem] border border-blue-100 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/10">
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">{icon}</span>
    <span className="min-w-0 flex-1"><strong className="block text-sm font-bold text-[#0f172a]">{title}</strong><small className="mt-1 block text-xs text-slate-500">{meta}</small></span>
    <ArrowRight className="h-4 w-4 text-blue-600 transition-transform group-hover:translate-x-1" />
  </Link>;
}

function SectionTitle({ eyebrow, title, action, href }: { eyebrow: string; title: React.ReactNode; action: string; href: string }) {
  return <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge>{eyebrow}</Badge><h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-[#0f172a] sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{title}</h2></div><Link href={href} className="group inline-flex w-fit items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900">{action}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></div>;
}

function Step({ number, title, text, icon }: { number: string; title: string; text: string; icon: React.ReactNode }) {
  return <article className="rounded-[1.25rem] border border-blue-100 bg-white p-7 shadow-[0_2px_8px_rgba(15,23,42,.035)] transition hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/10"><div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">{icon}</span><span className="text-4xl font-extrabold tracking-tight text-blue-100">{number}</span></div><h3 className="mt-7 text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>;
}

function Benefit({ text, icon }: { text: string; icon: React.ReactNode }) {
  return <div className="flex items-center gap-4 rounded-2xl bg-[#eff6ff] p-4 text-sm font-semibold text-[#0f172a]"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-blue-700 shadow-sm">{icon}</span>{text}</div>;
}

function Partner({ name, logo, href }: { name: string; logo: string; href: string }) {
  const desktopPosition = name === 'njdwebs' ? 'lg:col-start-2' : 'lg:col-start-4';
  return <a href={href} target="_blank" rel="noreferrer" aria-label={`Visiter le site de ${name}`} className={`template-home__partner group flex min-h-[92px] items-center justify-center rounded-[20px] bg-white px-7 py-5 ${desktopPosition}`}><Image src={logo} alt={`Logo ${name}`} width={240} height={96} className="h-12 w-auto max-w-[80%] object-contain transition duration-300 group-hover:scale-[1.04]" /></a>;
}
