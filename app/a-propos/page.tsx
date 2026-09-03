import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Globe2,
  HeartHandshake,
  Lightbulb,
  MapPin,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

export const metadata = {
  title: 'À propos de JcHub',
  description: "Découvrez la mission de JcHub : rendre l'apprentissage numérique plus accessible aux développeurs africains.",
};

const values = [
  { icon: HeartHandshake, number: '01', title: 'Pensé pour le terrain', description: 'Des formats et des outils conçus pour les réalités locales et les besoins du jour.', tone: 'bg-orange-50 text-orange-600' },
  { icon: Lightbulb, number: '02', title: 'Utile avant tout', description: "Chaque ressource doit résoudre un problème concret et t'aider à passer à l'action.", tone: 'bg-amber-50 text-amber-600' },
  { icon: Users, number: '03', title: 'Ensemble, vraiment', description: 'Une communauté ouverte où les savoirs circulent entre débutants, créateurs et experts.', tone: 'bg-teal-50 text-teal-600' },
  { icon: Target, number: '04', title: 'Exigeant sur la qualité', description: 'Des contenus clairs, vérifiés et sans bruit pour respecter ton temps et ton attention.', tone: 'bg-sky-50 text-sky-600' },
];

const milestones = [
  { year: '2026', title: 'Le premier chapitre', description: 'JcHub prend forme au Congo Brazzaville avec des outils pratiques et une vision claire pour les développeurs.' },
  { year: '2026', title: 'Une base utile', description: 'Les premiers contenus donnent aux développeurs des ressources concrètes, accessibles depuis le navigateur.' },
  { year: '2027', title: "L'Afrique francophone", description: 'La plateforme s’ouvre à cinq nouveaux pays et à davantage de créateurs locaux.' },
  { year: '2027', title: 'Apprendre partout', description: 'Une expérience mobile et hors-ligne pour continuer à progresser même avec une connexion limitée.' },
];

const commitments = [
  'Des ressources de niveau international, pensées pour le terrain',
  'Des outils utiles et accessibles directement depuis le navigateur',
  'Une expérience claire, sans bruit ni surcharge',
  'Une plateforme pensée pour avancer plus vite',
];

export default function AboutPage() {
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
        <div className="absolute -left-28 bottom-[-80px] h-80 w-80 rounded-full border border-white/10 bg-[#3a68d9]/15 blur-3xl" />
        <div className="absolute right-[-60px] top-[-40px] h-72 w-72 rounded-full border border-white/10 bg-[#96c7ff]/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-8 sm:px-8 lg:min-h-[820px] lg:pb-20">
          <div className="flex items-center justify-end" aria-hidden="true" />

          <div className="mt-8 grid items-center gap-10 lg:mt-12 lg:grid-cols-[1.1fr_0.9fr]" style={{ transform: 'perspective(1200px) rotateX(1.5deg) rotateY(-2deg)' }}>
            <div className="max-w-xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-[#b6d6ff]">À propos de JcHub</p>
              <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Le numérique avance.<span className="mt-2 block text-[#9ccbff]">Nous aussi.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-200 sm:text-lg">
                JcHub construit un espace simple pour apprendre, expérimenter et progresser dans les métiers du numérique depuis l’Afrique.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/outils" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#0b1730] transition hover:scale-[1.02] hover:bg-[#eaf3ff]">
                  Découvrir JcHub <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/contact" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                  Nous écrire <ArrowUpRight className="h-4 w-4" />
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
                <Image
                  src="/abouts.png"
                  alt="Une personne apprend avec JcHub"
                  width={640}
                  height={640}
                  priority
                  className="h-[440px] w-full rounded-[1.5rem] object-cover sm:h-[500px] lg:h-[560px]"
                />
              </div>

              <div className="absolute -left-4 bottom-8 rounded-2xl border border-white/10 bg-[#0d1c38]/90 px-4 py-3 shadow-[0_20px_40px_rgba(5,12,25,0.4)] backdrop-blur-md">
                <div className="text-xs uppercase tracking-[0.2em] text-[#9ccbff]">Congo</div>
                <div className="mt-2 text-2xl font-black text-white">Brazzaville</div>
                <div className="text-xs text-slate-300">Là où tout commence</div>
              </div>

              <div className="absolute -right-3 top-8 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-[0_20px_40px_rgba(11,20,40,0.35)] backdrop-blur-md">
                <div className="text-xs uppercase tracking-[0.2em] text-[#dfeeff]">Mission</div>
                <div className="mt-2 text-sm font-semibold text-white">Rendre le progrès possible</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <section className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric value="7" label="outils gratuits" />
          <Metric value="1" label="objectif : être utile" />
          <Metric value="5" label="pays en ligne de mire" />
          <Metric value="100%" label="focus pratique" />
        </section>

        <section className="mb-16 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[#9ccbff]">POURQUOI NOUS EXISTONS</p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Les mêmes chances, sans devoir partir.</h2>
          </div>
          <div className="space-y-5">
            <p className="text-lg leading-relaxed text-slate-200">
              Un développeur à Brazzaville devrait pouvoir trouver des ressources exigeantes, des outils fiables et une communauté stimulante sans être limité par sa géographie.
            </p>
            <p className="leading-relaxed text-slate-300">
              C’est la conviction derrière JcHub. Nous rassemblons l’essentiel dans une expérience pensée pour les connexions réelles, les budgets réels et les ambitions bien réelles des talents africains.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {commitments.map((commitment) => (
                <div key={commitment} className="flex items-start gap-3 rounded-xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-4 text-sm font-semibold text-slate-100" style={{ transform: 'perspective(1200px) rotateX(2deg) rotateY(-2deg)' }}>
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#9ccbff]" aria-hidden="true" />
                  {commitment}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-[#9ccbff]">NOS REPÈRES</p>
              <h2 className="mt-2 text-3xl font-black text-white">Ce qui ne bouge pas.</h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-slate-300">Quatre principes simples pour rester proche des besoins de celles et ceux qui apprennent.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {values.map((value) => (
              <div key={value.number} className="rounded-2xl border border-white/10 bg-[rgba(13,28,52,0.8)] p-6 shadow-[0_18px_40px_rgba(7,19,40,0.24)] backdrop-blur-sm" style={{ transform: 'perspective(1200px) rotateX(2deg) rotateY(-2deg)' }}>
                <div className="flex items-start justify-between">
                  <span className={`grid h-11 w-11 place-items-center rounded-xl ${value.tone}`}>
                    <value.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-black text-slate-400">{value.number}</span>
                </div>
                <h3 className="mt-7 text-xl font-black text-white">{value.title}</h3>
                <p className="mt-2 max-w-sm leading-relaxed text-slate-300">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-[#9ccbff]">LA SUITE</p>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Une ambition qui se construit.</h2>
              <p className="mt-5 max-w-sm leading-relaxed text-slate-300">Pas de promesses abstraites : une progression par étapes, guidée par les usages.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {milestones.map((milestone, index) => (
                <div key={`${milestone.year}-${milestone.title}`} className="relative rounded-2xl border border-white/10 bg-[rgba(13,28,52,0.8)] p-5 shadow-[0_18px_35px_rgba(7,19,40,0.18)] backdrop-blur-sm" style={{ transform: 'perspective(1200px) rotateX(2deg) rotateY(-2deg)' }}>
                  <span className="absolute -left-2 top-6 h-3 w-3 rounded-full border-2 border-[#020b1a] bg-[#9ccbff]" />
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9ccbff]">{milestone.year} / 0{index + 1}</p>
                  <h3 className="mt-3 text-lg font-black text-white">{milestone.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{milestone.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-[#17324d] px-6 py-12 text-white shadow-[0_22px_55px_rgba(10,20,40,0.45)] ring-1 ring-white/10 sm:px-12" style={{ transform: 'perspective(1200px) rotateX(4deg) rotateY(-4deg)' }}>
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-5 flex items-center gap-3 text-[#dfeeff]">
                <Globe2 className="h-5 w-5" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">À toi de jouer</span>
              </div>
              <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">La prochaine étape peut commencer maintenant.</h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">Explore les outils, découvre la bibliothèque et construis ton propre chemin avec JcHub.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/outils" className="inline-flex items-center gap-2 rounded-xl bg-[#4a74d6] px-5 py-3 font-bold text-white transition hover:bg-[#6fa3ff]">Commencer gratuitement <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/outils" className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 font-bold text-white transition hover:border-white/60 hover:bg-white/10">Découvrir les outils <ArrowUpRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[rgba(13,28,52,0.8)] p-5 shadow-[0_18px_40px_rgba(7,19,40,0.24)] backdrop-blur-sm" style={{ transform: 'perspective(1200px) rotateX(2deg) rotateY(-2deg)' }}>
      <p className="text-3xl font-black tracking-tight text-white sm:text-4xl">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-300">{label}</p>
    </div>
  );
}