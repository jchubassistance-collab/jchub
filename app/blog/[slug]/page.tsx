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
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').replace(/\/$/, '');
  const articleUrl = `${baseUrl}/blog/${article.slug}`;
  const imageUrl = article.image.startsWith('http') ? article.image : `${baseUrl}${article.image.startsWith('/') ? '' : '/'}${article.image}`;
  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    authors: [{ name: article.author }],
    alternates: { canonical: articleUrl },
    openGraph: { title: article.title, description: article.description, url: articleUrl, type: 'article', images: [{ url: imageUrl, width: 1200, height: 630, alt: article.title }] },
    twitter: { card: 'summary_large_image', title: article.title, description: article.description, images: [imageUrl] },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getPublishedArticleBySlug(params.slug);
  if (!article) notFound();
  const relatedArticles = (await getPublishedArticles()).filter((item) => item.slug !== article.slug && item.category === article.category).slice(0, 3);

  return (
    <main className="min-h-screen bg-[#030b16] text-slate-100">
      <section className="relative overflow-hidden bg-[#071827] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,.14),transparent_26%),linear-gradient(135deg,#05131f_0%,#081b2b_42%,#090f18_100%)]" />
        <div className="absolute left-10 top-24 h-40 w-40 rounded-full border border-cyan-300/10" />
        <div className="absolute right-10 top-16 h-56 w-56 rounded-full border border-orange-300/10" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8 lg:pb-20">
          <Link href="/blog" className="mb-12 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />Retour au blog
          </Link>

          <div className="grid items-end gap-10 lg:grid-cols-[1fr_360px]">
            <div className="max-w-3xl">
              <div className="mb-5 flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 font-semibold text-cyan-200">{article.category}</span>
                <span className="inline-flex items-center gap-1 text-slate-300"><Calendar className="h-4 w-4" />{article.publishedAt?.slice(0, 10) || 'Publié'}</span>
                <span className="inline-flex items-center gap-1 text-slate-300"><Clock className="h-4 w-4" />{article.readTime}</span>
              </div>
              <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.05em] text-white sm:text-6xl">{article.title}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">{article.description}</p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <span className="text-sm text-slate-300">Par <strong className="text-white">{article.author}</strong></span>
                <BlogInteractions slug={article.slug} title={article.title} />
              </div>
            </div>
            <img src={article.image} alt="" className="aspect-[1200/630] w-full rounded-[22px] border border-white/10 object-cover shadow-[0_20px_60px_rgba(8,15,30,0.6)] transition duration-500 hover:rotate-[0.7deg] hover:scale-[1.01]" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,760px)_260px] lg:px-8 lg:py-16">
        <article className="min-w-0 rounded-[28px] border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(11,24,48,.97),rgba(6,14,24,.94))] px-5 py-8 shadow-[0_24px_60px_rgba(3,7,18,0.45)] ring-1 ring-white/5 sm:px-10 sm:py-12">
          <div className="prose prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:font-black prose-headings:tracking-[-0.03em] prose-h2:mt-12 prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-3 prose-h3:mt-8 prose-p:leading-8 prose-p:text-slate-200 prose-a:font-semibold prose-a:text-cyan-300 prose-blockquote:border-cyan-400 prose-blockquote:bg-cyan-500/10 prose-blockquote:px-5 prose-blockquote:py-1 prose-pre:rounded-2xl prose-pre:border prose-pre:border-white/10 prose-pre:bg-[#020b16] prose-code:text-orange-300"><ReactMarkdown>{article.content}</ReactMarkdown></div>
          <div className="mt-10 flex flex-wrap gap-2 border-t border-white/10 pt-6">
            {article.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">#{tag}</span>
            ))}
          </div>
        </article>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,24,48,.95),rgba(7,20,34,.9))] p-5 shadow-[0_18px_38px_rgba(3,7,18,0.4)]">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">À retenir</p>
            <p className="text-sm leading-6 text-slate-300">Un guide pratique JcHub pour progresser avec des exemples concrets.</p>
          </div>

          <div className="rounded-[22px] bg-gradient-to-br from-cyan-500 via-sky-600 to-violet-700 p-5 text-white shadow-[0_22px_45px_rgba(35,104,211,0.42)]">
            <Sparkles className="mb-3 h-6 w-6" />
            <h2 className="font-black">Passe à la pratique</h2>
            <p className="mt-2 text-sm leading-6 text-white/80">Teste directement les outils liés à cet article.</p>
            <Link href="/outils" className="mt-4 inline-flex rounded-lg bg-white px-3 py-2 text-sm font-bold text-sky-700">Voir les outils</Link>
          </div>
        </aside>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
        <GiscusComments />
        {relatedArticles.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-5 text-2xl font-black text-white">À lire ensuite</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {relatedArticles.map((related) => (
                <Link key={related.slug} href={`/blog/${related.slug}`} className="group rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,24,48,.95),rgba(7,20,34,.9))] p-4 shadow-[0_16px_32px_rgba(3,7,18,0.35)] transition hover:-translate-y-0.5 hover:border-cyan-400/40">
                  <span className="text-sm font-bold leading-6 text-white group-hover:text-cyan-200">{related.title}</span>
                  <span className="mt-2 block text-xs text-slate-400">{related.readTime} de lecture</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
