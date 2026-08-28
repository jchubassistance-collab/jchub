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
  { icon: HeartHandshake, number: '01', title: 'Pensé pour le terrain', description: 'Des prix, des paiements et des formats qui tiennent compte des réalités locales.', tone: 'bg-orange-50 text-orange-600' },
  { icon: Lightbulb, number: '02', title: 'Utile avant tout', description: "Chaque ressource doit résoudre un problème concret et t'aider à passer à l'action.", tone: 'bg-amber-50 text-amber-600' },
  { icon: Users, number: '03', title: 'Ensemble, vraiment', description: 'Une communauté ouverte où les savoirs circulent entre débutants, créateurs et experts.', tone: 'bg-teal-50 text-teal-600' },
  { icon: Target, number: '04', title: 'Exigeant sur la qualité', description: 'Des contenus clairs, vérifiés et sans bruit pour respecter ton temps et ton attention.', tone: 'bg-sky-50 text-sky-600' },
];

const milestones = [
  { year: '2026', title: 'Le premier chapitre', description: 'JcHub prend forme au Congo Brazzaville avec un catalogue de livres audio et des outils dev.' },
  { year: '2026', title: 'Une base utile', description: 'Les premiers contenus donnent aux développeurs des ressources concrètes, accessibles depuis le navigateur.' },
  { year: '2027', title: "L'Afrique francophone", description: 'La plateforme s’ouvre à cinq nouveaux pays et à davantage de créateurs locaux.' },
  { year: '2027', title: 'Apprendre partout', description: 'Une expérience mobile et hors-ligne pour continuer à progresser même avec une connexion limitée.' },
];

const commitments = [
  'Des ressources de niveau international à prix local',
  'Des paiements adaptés : Mobile Money et cartes',
  'Des outils gratuits utilisables immédiatement',
  'Une plateforme sans publicité intrusive',
];

export default function AboutPage() {
  return (
    <div className="overflow-hidden bg-white text-slate-900">
      <section className="relative border-b border-slate-200 bg-[#f7f8fa]">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-28">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-orange-700"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" />À propos de JcHub</p>
            <h1 className="max-w-2xl text-5xl font-black leading-[.98] tracking-[-0.04em] sm:text-7xl">Le numérique avance.<span className="mt-2 block text-orange-600">Nous aussi.</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">JcHub construit un espace simple pour apprendre, expérimenter et progresser dans les métiers du numérique depuis l’Afrique.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href="/outils" className="inline-flex items-center gap-2 rounded-xl bg-[#17324d] px-5 py-3 font-bold text-white transition hover:bg-orange-600">Découvrir JcHub <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="/contact" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 transition hover:border-slate-500">Nous écrire <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link></div>
          </div>
          <div className="relative mx-auto w-full max-w-lg lg:pl-8">
            <div className="absolute -inset-4 rounded-[2rem] bg-orange-100/70" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[1.75rem] bg-[#17324d] shadow-2xl"><Image src="/about.jpg" alt="Une personne apprend avec JcHub" width={640} height={640} priority className="h-auto w-full object-cover" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#102a43] via-[#102a43]/75 to-transparent px-6 pb-6 pt-20 text-white"><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">Notre point de départ</p><p className="mt-2 text-xl font-black">Rendre le progrès possible, même avec peu.</p></div></div>
            <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:left-0"><span className="grid h-9 w-9 place-items-center rounded-lg bg-orange-100 text-orange-600"><MapPin className="h-4 w-4" aria-hidden="true" /></span><span><strong className="block text-sm text-slate-900">Congo Brazzaville</strong><span className="text-xs text-slate-500">Là où tout commence</span></span></div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white"><div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-slate-200 px-4 sm:px-6 md:grid-cols-4"><Metric value="8+" label="livres audio" /><Metric value="7" label="outils gratuits" /><Metric value="5" label="pays en ligne de mire" /><Metric value="1" label="objectif : être utile" /></div></section>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:py-28"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Pourquoi nous existons</p><h2 className="mt-4 max-w-sm text-4xl font-black leading-tight tracking-tight sm:text-5xl">Les mêmes chances, sans devoir partir.</h2></div><div className="max-w-2xl"><p className="text-xl leading-relaxed text-slate-700">Un développeur à Brazzaville devrait pouvoir trouver des ressources exigeantes, des outils fiables et une communauté stimulante sans être limité par sa géographie.</p><p className="mt-6 leading-relaxed text-slate-500">C’est la conviction derrière JcHub. Nous rassemblons l’essentiel dans une expérience pensée pour les connexions réelles, les budgets réels et les ambitions bien réelles des talents africains.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{commitments.map((commitment) => <div key={commitment} className="flex items-start gap-3 border-t border-slate-200 pt-3 text-sm font-semibold text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" aria-hidden="true" />{commitment}</div>)}</div></div></section>

      <section className="border-y border-slate-200 bg-[#f7f8fa]"><div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24"><div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Nos repères</p><h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Ce qui ne bouge pas.</h2></div><p className="max-w-sm text-sm leading-relaxed text-slate-500">Quatre principes simples pour rester proche des besoins de celles et ceux qui apprennent.</p></div><div className="grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 md:grid-cols-2">{values.map((value) => <div key={value.number} className="group bg-white p-7 transition hover:bg-[#fffaf5] sm:p-8"><div className="flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-xl ${value.tone}`}><value.icon className="h-5 w-5" aria-hidden="true" /></span><span className="text-xs font-black text-slate-300 transition group-hover:text-orange-400">{value.number}</span></div><h3 className="mt-7 text-xl font-black">{value.title}</h3><p className="mt-2 max-w-sm leading-relaxed text-slate-500">{value.description}</p></div>)}</div></div></section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28"><div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">La suite</p><h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Une ambition qui se construit.</h2><p className="mt-5 max-w-sm leading-relaxed text-slate-500">Pas de promesses abstraites : une progression par étapes, guidée par les usages.</p></div><div className="grid gap-4 sm:grid-cols-2">{milestones.map((milestone, index) => <div key={`${milestone.year}-${milestone.title}`} className="relative border-l-2 border-slate-200 pl-6 pb-6 sm:pb-8"><span className="absolute -left-[7px] top-0 h-3 w-3 rounded-full border-2 border-white bg-orange-500 ring-1 ring-orange-200" /><p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">{milestone.year} / 0{index + 1}</p><h3 className="mt-3 text-lg font-black">{milestone.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-500">{milestone.description}</p></div>)}</div></div></section>

      <section className="bg-[#17324d] px-4 py-20 text-white sm:px-6 lg:py-24"><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="mb-5 flex items-center gap-3 text-orange-300"><Globe2 className="h-5 w-5" aria-hidden="true" /><span className="text-xs font-bold uppercase tracking-[0.2em]">À toi de jouer</span></div><h2 className="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">La prochaine étape peut commencer maintenant.</h2><p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">Explore les outils, découvre la bibliothèque et construis ton propre chemin avec JcHub.</p></div><div className="flex flex-wrap gap-3"><Link href="/outils" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-400">Commencer gratuitement <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="/pricing" className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 font-bold text-white transition hover:border-white/60 hover:bg-white/10">Voir les formules <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link></div></div></section>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return <div className="px-4 py-7 sm:px-6 sm:py-9"><p className="text-3xl font-black tracking-tight text-[#17324d] sm:text-4xl">{value}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p></div>;
}