import Link from 'next/link';
import { ArrowRight, Check, Code2, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { tools } from '@/lib/tools';
import { Newsletter } from '@/components/Newsletter';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
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

        <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-8 sm:px-8 lg:min-h-[820px] lg:pb-20">
          <div className="flex items-center justify-end" aria-hidden="true" />

          <div className="mt-8 grid items-center gap-10 lg:mt-12 lg:grid-cols-[1.1fr_0.9fr]" style={{ transform: 'perspective(1200px) rotateX(1.5deg) rotateY(-2deg)' }}>
            <div className="max-w-xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-[#b6d6ff]">Trouvez le bon outil</p>
              <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Des solutions utiles pour avancer sans friction.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-200 sm:text-lg">
                JcHub regroupe des outils pratiques, des ressources claires et des workflows pensé pour gagner du temps dans le quotidien numérique.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/outils"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#0b1730] transition hover:scale-[1.02] hover:bg-[#eaf3ff]"
                >
                  Voir les outils <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-200">
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#9ccbff]" /> Outils gratuits</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#9ccbff]" /> Sans jargon</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#9ccbff]" /> 100% utiles</span>
              </div>
            </div>

            <div className="relative mx-auto ml-auto w-full max-w-[560px]">
              <div className="absolute -left-8 top-10 h-36 w-36 rounded-full bg-[#a9d0ff]/20 blur-3xl" />
              <div className="absolute -right-8 bottom-6 h-32 w-32 rounded-full bg-[#dfeeff]/10 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-[#9ccbff]/20 bg-white/5 p-3 shadow-[0_35px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm" style={{ transform: 'perspective(1200px) rotateX(4deg) rotateY(-5deg)' }}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(110,168,255,0.15),_transparent_30%),linear-gradient(135deg,_rgba(8,13,23,0.5),_rgba(24,37,58,0.15))]" />
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(156,203,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(156,203,255,0.14) 1px, transparent 1px)', backgroundSize: '22px 22px', maskImage: 'radial-gradient(circle at center, black 35%, transparent 100%)' }} />
                <img
                  src="/heros.png"
                  alt="Illustration JcHub"
                  className="relative h-[440px] w-full rounded-[1.5rem] object-cover sm:h-[500px] lg:h-[560px]"
                />

                <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-cyan-300/30 bg-[#081426]/75 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-100 shadow-[0_0_18px_rgba(103,184,255,0.15)] backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                  live stack
                </div>

                <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-[#071224]/90 p-4 shadow-[0_22px_45px_rgba(7,17,34,0.5)] backdrop-blur-md">
                  <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-slate-300">
                    <span>system</span>
                    <span className="text-emerald-300">online</span>
                  </div>
                  <div className="space-y-2 font-mono text-[11px] text-slate-200">
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-2 py-1.5">
                      <span className="text-cyan-200">const stack</span>
                      <span className="text-emerald-300">= [</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-2 text-slate-300">
                      <span>next.js</span>
                      <span className="text-cyan-200">UI</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-2 text-slate-300">
                      <span>tailwind</span>
                      <span className="text-cyan-200">styles</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-2 text-slate-300">
                      <span>api / tools</span>
                      <span className="text-cyan-200">ready</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-4 bottom-8 rounded-2xl border border-white/10 bg-[#0d1c38]/90 px-4 py-3 shadow-[0_20px_40px_rgba(5,12,25,0.4)] backdrop-blur-md">
                <div className="text-xs uppercase tracking-[0.2em] text-[#9ccbff]">Performance</div>
                <div className="mt-2 text-2xl font-black text-white">+45%</div>
                <div className="text-xs text-slate-300">gain de temps</div>
              </div>

              <div className="absolute -right-3 top-8 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-[0_20px_40px_rgba(11,20,40,0.35)] backdrop-blur-md">
                <div className="text-xs uppercase tracking-[0.2em] text-[#dfeeff]">Focus</div>
                <div className="mt-2 text-sm font-semibold text-white">Outils & ressources</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <section className="mb-16 grid gap-4 sm:grid-cols-3">
          <QuickLink href="/outils" icon={<Wrench className="h-5 w-5 text-[#9ccbff]" />} title="Outils gratuits" meta="Résoudre maintenant" />
          <QuickLink href="/blog" icon={<Sparkles className="h-5 w-5 text-[#9ccbff]" />} title="Ressources" meta="Guides pratiques" />
          <QuickLink href="/contact" icon={<Code2 className="h-5 w-5 text-[#9ccbff]" />} title="Contact" meta="Parlons projets" />
        </section>

        <section className="mb-16">
          <SectionTitle eyebrow="OUTILS PRATIQUES" title="Ce dont tu as besoin, sans distraction." action="Tous les outils" href="/outils" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.slice(0, 3).map((tool, index) => (
              <Link
                href={`/outils/${tool.slug}`}
                key={tool.slug}
                style={{ animationDelay: `${index * 70}ms`, transform: 'perspective(1200px) rotateX(2deg) rotateY(-2deg)' }}
                className="group rounded-2xl border border-white/10 bg-[rgba(13,28,52,0.8)] p-6 shadow-[0_18px_40px_rgba(7,19,40,0.24)] transition hover:-translate-y-1 hover:border-[#9ccbff]/40 hover:shadow-[0_20px_50px_rgba(70,103,182,0.24)]"
              >
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-[#9ccbff]/15 text-3xl transition group-hover:rotate-3 group-hover:scale-110">
                  {tool.icon}
                </div>
                <h2 className="text-xl font-bold text-white">{tool.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{tool.description}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#9ccbff]">
                  Utiliser <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <SectionTitle eyebrow="COMMENT ÇA MARCHE" title="Une expérience pensée pour aller à l’essentiel." action="Voir les outils" href="/outils" />
          <div className="grid gap-5 md:grid-cols-3">
            <Step number="01" title="Explore" text="Trouve un outil adapté à ton objectif du moment." icon={<Wrench className="h-5 w-5 text-[#9ccbff]" />} />
            <Step number="02" title="Utilise" text="Travaille directement dans le navigateur et gagne du temps." icon={<Code2 className="h-5 w-5 text-[#9ccbff]" />} />
            <Step number="03" title="Progresse" text="Garde ton activité dans ton espace personnel." icon={<Check className="h-5 w-5 text-[#9ccbff]" />} />
          </div>
        </section>

        <section className="mb-16 rounded-[2rem] border border-white/10 bg-[rgba(13,28,52,0.8)] p-7 shadow-[0_22px_55px_rgba(6,18,40,0.35)] sm:p-10">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-[#9ccbff]">POURQUOI JCHUB</p>
              <h2 className="mt-3 text-3xl font-black text-white">Une plateforme utile, sans surplus.</h2>
              <p className="mt-4 max-w-lg leading-relaxed text-slate-300">Nous privilégions des outils utiles, clairs et fiables pour faire avancer les projets sans friction.</p>
            </div>
            <div className="space-y-4">
              <Benefit text="Des outils gratuits utilisables immédiatement" />
              <Benefit text="Des workflows plus rapides" />
              <Benefit text="Une expérience pensée pour les développeurs" />
              <Benefit text="Un accès simple et sans friction" />
            </div>
          </div>
        </section>

        <section className="mb-16 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,24,48,0.96),rgba(9,18,35,0.9))] p-7 shadow-[0_22px_55px_rgba(6,18,40,0.35)] sm:p-10">
          <div className="flex flex-col gap-6 text-center">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-[#9ccbff]">ILS NOUS SOUTIENNENT</p>
              <h2 className="mt-3 text-3xl font-black text-white">Construisons l’apprentissage numérique ensemble.</h2>
            </div>
            <p className="mx-auto max-w-2xl text-slate-300">JcHub est ouvert aux écoles, communautés, entreprises et créateurs qui souhaitent rendre les compétences numériques plus accessibles.</p>

            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              <Partner name="GitHub" logo="/partners/github.svg" />
              <Partner name="2MD Designer" logo="/partners/2md-designer.svg" />
            </div>

            <div className="pt-2">
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-full border border-[#9ccbff]/30 bg-[#9ccbff]/10 px-5 py-3 text-sm font-bold text-[#dfeeff] transition hover:border-[#9ccbff]/60 hover:bg-[#9ccbff]/15 hover:text-white">Devenir partenaire <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>

        <section className="mb-16 rounded-[2rem] border border-white/10 bg-[#17324d] px-6 py-12 text-center text-white shadow-[0_22px_55px_rgba(10,20,40,0.45)] sm:px-12">
          <p className="text-xs font-bold tracking-[0.2em] text-[#dfeeff]">NEWSLETTER</p>
          <h2 className="mt-3 text-3xl font-black">Une dose utile, pas de bruit.</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Nouveaux outils, ressources utiles et conseils pratiques : directement dans ta boîte mail.</p>
          <div className="mt-8"><Newsletter /></div>
          <p className="mt-4 text-xs text-slate-400">Tu peux te désinscrire à tout moment.</p>
        </section>

        <section className="rounded-[2rem] bg-[#17324d] px-6 py-12 text-white shadow-[0_22px_55px_rgba(10,20,40,0.45)] sm:px-12">
          <p className="text-sm font-bold text-[#dfeeff]">NOUS AIDER À PROGRESSER</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black sm:text-4xl">Tu as besoin d’un outil plus pratique pour ton quotidien ?</h2>
          <p className="mt-4 max-w-xl text-slate-300">On construit des ressources utiles, simples et directement actionnables.</p>
          <Link href="/contact" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#4a74d6] px-5 py-3 font-bold text-white transition hover:bg-[#6fa3ff]">Nous écrire <ArrowRight className="h-4 w-4" /></Link>
        </section>
      </main>
    </div>
  );
}

function QuickLink({ href, icon, title, meta }: { href: string; icon: React.ReactNode; title: string; meta: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-[rgba(11,24,48,0.8)] p-4 text-white transition hover:border-[#9ccbff]/40 hover:bg-[rgba(17,33,63,0.95)] backdrop-blur-sm" style={{ transform: 'perspective(1200px) rotateX(2deg) rotateY(-2deg)' }}>
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#9ccbff]/10">{icon}</div>
      <div className="min-w-0 flex-1">
        <strong className="block text-sm font-semibold">{title}</strong>
        <small className="text-xs text-slate-300">{meta}</small>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 text-[#9ccbff] transition group-hover:translate-x-1" />
    </Link>
  );
}

function SectionTitle({ eyebrow, title, action, href }: { eyebrow: string; title: string; action: string; href: string }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-bold tracking-[0.2em] text-[#9ccbff]">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black text-white">{title}</h2>
      </div>
      <Link href={href} className="inline-flex items-center gap-1 text-sm font-bold text-[#dfeeff] hover:text-white">
        {action} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function Step({ number, title, text, icon }: { number: string; title: string; text: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[rgba(13,28,52,0.8)] p-6 shadow-[0_18px_40px_rgba(7,19,40,0.24)] backdrop-blur-sm" style={{ transform: 'perspective(1200px) rotateX(2deg) rotateY(-2deg)' }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-black text-[#9ccbff]">{number}</span>
        <span className="text-[#9ccbff]">{icon}</span>
      </div>
      <h3 className="mt-8 text-xl font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{text}</p>
    </div>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-4 text-sm font-semibold text-slate-100 backdrop-blur-sm" style={{ transform: 'perspective(1200px) rotateX(2deg) rotateY(-2deg)' }}>
      <ShieldCheck className="h-5 w-5 shrink-0 text-[#9ccbff]" />
      {text}
    </div>
  );
}

function Partner({ name, logo }: { name: string; logo: string }) {
  return (
    <div className="group grid min-h-40 place-items-center rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(156,203,255,0.12),_rgba(9,18,35,0.7))] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#9ccbff]/50 hover:shadow-[0_18px_40px_rgba(60,110,210,0.18)] backdrop-blur-sm" style={{ transform: 'perspective(1200px) rotateX(2deg) rotateY(-2deg)' }}>
      <div className="flex h-24 w-full items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/5">
        <img src={logo} alt={`Logo ${name}`} className="h-16 w-auto max-w-[72%] object-contain opacity-90 transition duration-300 group-hover:scale-[1.04] group-hover:opacity-100" />
      </div>
    </div>
  );
}

