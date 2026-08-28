import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { notFound } from 'next/navigation';
import { BlogInteractions } from '@/components/blog/BlogInteractions';
import { GiscusComments } from '@/components/blog/GiscusComments';
import { getPublishedArticles, getPublishedArticleBySlug, getPublishedArticleSlugs } from '@/lib/blog';

export async function generateStaticParams() {
  return getPublishedArticleSlugs();
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getPublishedArticleBySlug(params.slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    authors: [{ name: article.author }],
    openGraph: { title: article.title, description: article.description, type: 'article', images: [article.image] },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getPublishedArticleBySlug(params.slug);
  if (!article) notFound();
  const relatedArticles = (await getPublishedArticles()).filter((item) => item.slug !== article.slug && item.category === article.category).slice(0, 3);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-slate-950 to-pink-950" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8 lg:pb-20">
          <Link href="/blog" className="mb-12 inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white"><ArrowLeft className="h-4 w-4" />Retour au blog</Link>
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_360px]">
            <div className="max-w-3xl">
              <div className="mb-5 flex flex-wrap items-center gap-3 text-sm"><span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-brand-200">{article.category}</span><span className="inline-flex items-center gap-1 text-white/65"><Calendar className="h-4 w-4" />{article.publishedAt?.slice(0, 10) || 'Publié'}</span><span className="inline-flex items-center gap-1 text-white/65"><Clock className="h-4 w-4" />{article.readTime}</span></div>
              <h1 className="text-4xl font-black leading-[1.08] tracking-tight sm:text-6xl">{article.title}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">{article.description}</p>
              <div className="mt-7 flex flex-wrap items-center gap-4"><span className="text-sm text-white/60">Par <strong className="text-white">{article.author}</strong></span><BlogInteractions slug={article.slug} title={article.title} /></div>
            </div>
            <img src={article.image} alt="" className="aspect-[1200/630] w-full rounded-2xl border border-white/15 object-cover shadow-2xl" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,760px)_260px] lg:px-8 lg:py-16">
        <article className="min-w-0 rounded-2xl border border-slate-200 bg-white px-5 py-8 shadow-sm sm:px-10 sm:py-12">
          <div className="prose prose-slate max-w-none prose-headings:scroll-mt-24 prose-headings:font-black prose-headings:tracking-tight prose-h2:mt-12 prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-3 prose-h3:mt-8 prose-p:leading-8 prose-p:text-slate-700 prose-a:font-semibold prose-a:text-brand-600 prose-blockquote:border-brand-500 prose-blockquote:bg-brand-50 prose-blockquote:px-5 prose-blockquote:py-1 prose-pre:rounded-xl prose-pre:bg-slate-950 prose-code:text-pink-600"><ReactMarkdown>{article.content}</ReactMarkdown></div>
          <div className="mt-10 flex flex-wrap gap-2 border-t border-slate-100 pt-6">{article.tags.map((tag) => <span key={tag} className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">#{tag}</span>)}</div>
        </article>
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">À retenir</p><p className="text-sm leading-6 text-slate-600">Un guide pratique JcHub pour progresser avec des exemples concrets.</p></div>
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-purple-700 p-5 text-white shadow-lg"><Sparkles className="mb-3 h-6 w-6" /><h2 className="font-black">Passe à la pratique</h2><p className="mt-2 text-sm leading-6 text-white/80">Teste directement les outils liés à cet article.</p><Link href="/outils" className="mt-4 inline-flex rounded-lg bg-white px-3 py-2 text-sm font-bold text-brand-700">Voir les outils</Link></div>
        </aside>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8"><GiscusComments />{relatedArticles.length > 0 && <section className="mt-12"><h2 className="mb-5 text-2xl font-black text-slate-900">À lire ensuite</h2><div className="grid gap-4 sm:grid-cols-3">{relatedArticles.map((related) => <Link key={related.slug} href={`/blog/${related.slug}`} className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"><span className="text-sm font-bold leading-6 text-slate-800 group-hover:text-brand-600">{related.title}</span><span className="mt-2 block text-xs text-slate-400">{related.readTime} de lecture</span></Link>)}</div></section>}</div>
    </main>
  );
}
