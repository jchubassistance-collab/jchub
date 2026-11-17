import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';

/** Closing call to the services, in the light colors of the page. */
export function ServicesCallout({ eyebrow, title, text, button }: { eyebrow: string; title: string; text: string; button: string }) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(120deg,#dbeafe_0%,#eff6ff_55%,#e0f2fe_100%)] px-7 py-10 sm:px-10 sm:py-14 lg:px-14">
      <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-blue-800 shadow-sm"><Sparkles className="h-3.5 w-3.5" /> {eyebrow}</span>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight text-[#0f172a] sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>{title}</h2>
          <p className="mt-3 leading-7 text-slate-600">{text}</p>
        </div>
        <Link href="/services" className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-4 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700">{button} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
      </div>
    </section>
  );
}
