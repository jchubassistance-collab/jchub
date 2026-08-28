import { ArrowDownRight, BookOpen, Sparkles, Terminal } from 'lucide-react';
import { BlogCatalog } from '@/components/blog/BlogCatalog';
import { Newsletter } from '@/components/Newsletter';
import { getPublishedArticles } from '@/lib/blog';

export const metadata = {
  title: 'Blog JcHub — Ressources pour développeurs',
  description:
    'Articles, tutoriels et conseils pour les développeurs qui veulent monter en compétences.',
};

export default async function BlogPage() {
  const blogArticles = await getPublishedArticles();
  const featuredArticle = blogArticles[0];

  return (
    <div className="min-h-screen bg-[#f7f8f4] text-slate-950">
      <section className="relative overflow-hidden bg-[#101827] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(20,184,166,.15),transparent_38%,rgba(249,115,22,.14))]" />
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full border border-teal-300/20" />
        <div className="absolute -right-10 top-24 h-48 w-48 rounded-full border border-orange-300/20" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 lg:px-8 lg:pb-20 lg:pt-24">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div className="animate-page-in">
              <div className="mb-6 inline-flex items-center gap-2 border border-teal-300/30 bg-teal-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-teal-200"><BookOpen className="h-3.5 w-3.5" /> JcHub / Journal</div>
              <h1 className="max-w-3xl text-5xl font-black leading-[.95] tracking-tight sm:text-7xl">Des idées qui<br /><span className="text-orange-300">font avancer</span><br />le code.</h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Guides pratiques, retours terrain et raccourcis intelligents pour construire mieux, apprendre plus vite et créer depuis l’Afrique.</p>
              <a href="#articles" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-white transition hover:text-orange-300">Explorer les articles <ArrowDownRight className="h-4 w-4" /></a>
            </div>
            {featuredArticle ? <a href={`/blog/${featuredArticle.slug}`} className="group relative overflow-hidden border border-white/15 bg-white/10 p-3 backdrop-blur-sm animate-slide-up">
              <div className="aspect-[16/10] overflow-hidden"><img src={featuredArticle.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /></div>
              <div className="p-3 pb-2"><p className="text-xs font-bold uppercase tracking-[.16em] text-orange-300">À la une · {featuredArticle.category}</p><h2 className="mt-2 text-xl font-black leading-tight group-hover:text-orange-200">{featuredArticle.title}</h2></div>
            </a> : null}
          </div>
          <div className="mt-14 grid grid-cols-3 border-t border-white/15 pt-5 text-sm sm:max-w-xl">
            <div><p className="text-2xl font-black text-white">{blogArticles.length}</p><p className="mt-1 text-slate-400">articles publiés</p></div>
            <div><p className="text-2xl font-black text-white">{new Set(blogArticles.map((article) => article.category)).size}</p><p className="mt-1 text-slate-400">univers à explorer</p></div>
            <div><p className="text-2xl font-black text-white">100%</p><p className="mt-1 text-slate-400">concret & local</p></div>
          </div>
        </div>
      </section>

      <section id="articles" className="border-b border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4"><div><p className="mb-2 text-xs font-black uppercase tracking-[.18em] text-teal-600">Bibliothèque active</p><h2 className="text-3xl font-black tracking-tight sm:text-4xl">À lire maintenant</h2></div><Terminal className="hidden h-8 w-8 text-orange-500 sm:block" /></div>
          <BlogCatalog articles={blogArticles} />
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-[#101827] py-16 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="border border-teal-300/20 bg-teal-300/10 p-8 sm:p-10">
            <Sparkles className="w-10 h-10 mx-auto mb-3 text-orange-300" />

            {/* Correction : h2 fermé avec h2 */}
            <h2 className="text-2xl font-black mb-2">
              Reçois les nouveaux articles
            </h2>

            <p className="text-slate-300 mb-4">
              1 article par semaine. Pas de spam.
            </p>

            <Newsletter />
          </div>
        </div>
      </section>
    </div>
  );
}