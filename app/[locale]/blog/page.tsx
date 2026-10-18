import { notFound } from 'next/navigation';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { BlogCatalog } from '@/components/blog/BlogCatalog';
import { Newsletter } from '@/components/Newsletter';
import { getPublishedArticles } from '@/lib/blog';
import { pageMetadata } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';
import { isLocale } from '@/i18n/routing';

const copy = bilingual({
  metaTitle: 'Ressources et conseils pour développeurs',
  metaDescription: 'Guides pratiques, retours d’expérience et tutoriels pour apprendre, créer et progresser dans tes projets numériques.',
  titleStart: 'Des idées qui font ',
  titleEnd: 'avancer le code.',
  intro: 'Guides pratiques, retours terrain et raccourcis intelligents pour construire mieux et apprendre plus vite.',
  explore: 'Explorer les articles',
  stats: (count: number) => `${count} articles publiés · Tech · Produit · Numérique`,
  featured: 'À la une',
  eyebrow: 'Ressources pratiques',
  readNow: 'À lire maintenant',
  newsletterTitle: 'Reçois les nouveaux articles',
  newsletterText: 'Un article par semaine. Pas de spam.',
}, {
  metaTitle: 'Resources and tips for developers',
  metaDescription: 'Practical guides, lessons learned and tutorials to learn, build and grow in your digital projects.',
  titleStart: 'Ideas that move ',
  titleEnd: 'code forward.',
  intro: 'Practical guides, field notes and smart shortcuts to build better and learn faster.',
  explore: 'Explore the articles',
  stats: (count: number) => `${count} articles published · Tech · Product · Digital`,
  featured: 'Featured',
  eyebrow: 'Practical resources',
  readNow: 'Read now',
  newsletterTitle: 'Get the new articles',
  newsletterText: 'One article a week. No spam.',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return pageMetadata({ locale, title: copy[locale].metaTitle, description: copy[locale].metaDescription, href: '/blog' });
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const articles = await getPublishedArticles(locale);
  const featured = articles[0];
  return (
    <div className="template-home min-h-screen overflow-hidden bg-[#eff6ff] text-[#0f172a]">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(147,197,253,.48),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(191,219,254,.55),transparent_32%),#eff6ff] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div className="template-home__intro"><p className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-blue-800"><BookOpen className="h-4 w-4" /> JcHub / Blog</p><h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.02] tracking-[-.04em] sm:text-7xl">{t.titleStart}<span className="text-blue-700">{t.titleEnd}</span></h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">{t.intro}</p><a href="#articles" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#93c5fd] px-6 py-3.5 font-bold text-[#0f172a] transition hover:-translate-y-0.5 hover:bg-[#60a5fa]">{t.explore} <ArrowRight className="h-4 w-4" /></a><p className="mt-6 text-sm text-slate-500">{t.stats(articles.length)}</p></div>
          {featured && <Link href={{ pathname: '/blog/[slug]', params: { slug: featured.slug } }} className="group overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white p-3 shadow-[0_18px_55px_rgba(37,99,235,.12)]"><div className="aspect-[16/10] overflow-hidden rounded-[1.25rem] bg-blue-50"><img src={featured.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div><div className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">{t.featured} · {featured.category}</p><h2 className="mt-2 text-2xl font-black">{featured.title}</h2></div></Link>}
        </div>
      </section>
      <section id="articles" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-14 sm:px-8 lg:px-10 lg:py-20"><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">{t.eyebrow}</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">{t.readNow}</h2></div><BlogCatalog articles={articles} /></section>
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10 lg:pb-20"><div className="rounded-[1.75rem] border border-blue-100 bg-white p-7 shadow-[0_12px_36px_rgba(37,99,235,.07)] sm:p-10"><div className="mx-auto max-w-3xl text-center"><Sparkles className="mx-auto mb-3 h-8 w-8 text-blue-700" /><h2 className="text-2xl font-black sm:text-3xl">{t.newsletterTitle}</h2><p className="mt-2 text-slate-600">{t.newsletterText}</p><div className="mt-6"><Newsletter /></div></div></div></section>
    </div>
  );
}
