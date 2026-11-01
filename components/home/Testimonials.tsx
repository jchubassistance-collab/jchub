import Image from 'next/image';
import { Quote, Star } from 'lucide-react';
import type { Locale } from '@/i18n/routing';

const testimonials = [
  {
    name: 'Gabriel Ndinga',
    image: '/gabriel-ndinga.jpeg',
    fictional: false,
    quote: {
      fr: 'JcHub rassemble des outils utiles dans un seul espace. J’apprécie cette approche qui facilite l’accès aux solutions numériques sans compliquer le travail.',
      en: 'JcHub brings useful tools together in one place. I appreciate this approach because it makes digital solutions easier to access without complicating the work.',
    },
  },
  {
    name: 'Grâce Moukoko',
    image: '/testimonials/avatar-anime.svg',
    fictional: true,
    quote: {
      fr: 'Les outils de JcHub me permettent de trouver rapidement une solution simple quand j’en ai besoin.',
      en: 'JcHub helps me quickly find a simple tool whenever I need one.',
    },
  },
  {
    name: 'Junior Bissiki',
    image: '/testimonials/avatar-cat.svg',
    fictional: true,
    quote: {
      fr: 'J’aime avoir plusieurs outils pratiques réunis au même endroit. Je gagne du temps sur mes projets.',
      en: 'I like having several practical tools in one place. They save me time on my projects.',
    },
  },
  {
    name: 'Mireille Okemba',
    image: '/testimonials/avatar-dog.svg',
    fictional: true,
    quote: {
      fr: 'Les ressources sont claires et les outils faciles à utiliser, même quand on débute.',
      en: 'The resources are clear and the tools are easy to use, even when you are just starting out.',
    },
  },
] satisfies Array<{
  name: string;
  image: string;
  fictional: boolean;
  quote: Record<Locale, string>;
}>;

const copy = {
  fr: {
    eyebrow: 'Témoignages',
    title: 'Ils parlent de JcHub',
    fictional: 'Profil et avis fictifs',
    rating: '5 étoiles sur 5',
  },
  en: {
    eyebrow: 'Testimonials',
    title: 'What people say about JcHub',
    fictional: 'Fictional profile and review',
    rating: '5 out of 5 stars',
  },
} satisfies Record<Locale, { eyebrow: string; title: string; fictional: string; rating: string }>;

export function Testimonials({ locale }: { locale: Locale }) {
  const t = copy[locale];

  return (
    <section aria-labelledby="testimonials-title" className="rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50 p-6 shadow-[0_10px_40px_rgba(37,99,235,.08)] sm:p-10">
      <header className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
        <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.12em] text-blue-800 shadow-sm">
          <Quote className="h-4 w-4" aria-hidden="true" /> {t.eyebrow}
        </span>
        <h2 id="testimonials-title" className="mt-4 text-3xl font-extrabold tracking-tight text-[#0f172a] sm:text-4xl" style={{ fontFamily: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' }}>
          {t.title}
        </h2>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        {testimonials.map((testimonial) => (
          <article key={testimonial.name} className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center gap-4">
              <Image
                src={testimonial.image}
                alt={testimonial.fictional ? `${testimonial.name} — ${t.fictional}` : testimonial.name}
                width={88}
                height={88}
                className="h-[5.5rem] w-[5.5rem] shrink-0 rounded-full border-4 border-blue-50 object-cover object-[center_20%] shadow-sm"
                style={{ borderRadius: '50%' }}
              />
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900">{testimonial.name}</h3>
                {testimonial.fictional && <p className="mt-1 text-xs font-medium text-slate-500">{t.fictional}</p>}
                <div className="mt-2 flex items-center gap-1" role="img" aria-label={t.rating}>
                  {Array.from({ length: 5 }, (_, index) => <Star key={index} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />)}
                </div>
              </div>
            </div>

            <blockquote className="mt-5 text-sm leading-7 text-slate-600">“{testimonial.quote[locale]}”</blockquote>
          </article>
        ))}
      </div>
    </section>
  );
}
