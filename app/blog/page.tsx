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
    <div className="min-h-screen bg-[#030b16] text-slate-100">
      <section className="relative overflow-hidden bg-[#071827] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,.12),transparent_30%),linear-gradient(135deg,#05131f_0%,#081b2b_40%,#0b1220_100%)]" />
        <div className="absolute -left-16 top-20 h-64 w-64 rounded-full border border-cyan-300/20" />
        <div className="absolute right-0 top-12 h-72 w-72 rounded-full border border-orange-300/20" />
        <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full border border-violet-300/20" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 lg:px-8 lg:pb-20 lg:pt-24">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div className="animate-page-in">
              <div className="mb-6 inline-flex items-center gap-2 border border-cyan-300/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-cyan-200">
                <BookOpen className="h-3.5 w-3.5" /> JcHub / Journal
              </div>
              <h1 className="max-w-4xl text-5xl font-black leading-[.88] tracking-[-0.05em] text-white sm:text-7xl lg:text-[5.5rem]">
                Des idées qui
                <span className="mt-2 block bg-gradient-to-r from-orange-300 via-orange-200 to-cyan-300 bg-clip-text text-transparent">font avancer</span>
                le code.
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                Guides pratiques, retours terrain et raccourcis intelligents pour construire mieux, apprendre plus vite et créer depuis l’Afrique.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <a href="#articles" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(255,255,255,0.16)]">
                  Explorer les articles <ArrowDownRight className="h-4 w-4" />
                </a>
                <span className="text-xs uppercase tracking-[.18em] text-slate-400">Tech • Product • Growth</span>
              </div>
            </div>

            {featuredArticle ? (
              <a href={`/blog/${featuredArticle.slug}`} className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-white/5 p-3 shadow-[0_24px_70px_rgba(8,15,30,0.6)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:rotate-[1deg] hover:border-cyan-300/30 animate-slide-up">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.18),transparent_30%)]" />
                <div className="relative aspect-[16/10] overflow-hidden rounded-[18px]">
                  <img src={featuredArticle.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                </div>
                <div className="relative p-3 pb-2">
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-300">À la une · {featuredArticle.category}</p>
                  <h2 className="mt-2 text-xl font-black leading-tight text-white group-hover:text-orange-200">{featuredArticle.title}</h2>
                </div>
              </a>
            ) : null}
          </div>

          <div className="mt-14 grid grid-cols-3 border-t border-white/15 pt-5 text-sm sm:max-w-xl">
            <div>
              <p className="text-2xl font-black text-white">{blogArticles.length}</p>
              <p className="mt-1 text-slate-400">articles publiés</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">{new Set(blogArticles.map((article) => article.category)).size}</p>
              <p className="mt-1 text-slate-400">univers à explorer</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">100%</p>
              <p className="mt-1 text-slate-400">concret & local</p>
            </div>
          </div>
        </div>
      </section>

      <section id="articles" className="border-b border-white/10 bg-[#040d19] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[.18em] text-cyan-300">Ressources pratiques</p>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">À lire maintenant</h2>
            </div>
            <Terminal className="hidden h-8 w-8 text-orange-400 sm:block" />
          </div>
          <BlogCatalog articles={blogArticles} />
        </div>
      </section>

      <section className="bg-[#040d19] py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-cyan-400/20 bg-[linear-gradient(135deg,rgba(10,22,38,0.96),rgba(8,15,30,0.9))] p-8 shadow-[0_18px_50px_rgba(8,15,30,0.45)] sm:p-10">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-orange-300" />
            <h2 className="mb-2 text-2xl font-black">Reçois les nouveaux articles</h2>
            <p className="mb-4 text-slate-300">1 article par semaine. Pas de spam.</p>
            <Newsletter />
          </div>
        </div>
      </section>
    </div>
  );
}