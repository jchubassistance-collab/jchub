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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
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

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();
  const relatedArticles = (await getPublishedArticles()).filter((item) => item.slug !== article.slug && item.category === article.category).slice(0, 3);

  return (
    <main className="template-home min-h-screen bg-[#eff6ff] text-[#0f172a]">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(147,197,253,.48),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(191,219,254,.55),transparent_32%),#eff6ff] text-[#0f172a]">
        <div className="absolute inset-0 bg-tech-grid" />
        <div className="absolute left-10 top-24 h-40 w-40 rounded-full border border-cyan-300/10" />
        <div className="absolute right-10 top-16 h-56 w-56 rounded-full border border-orange-300/10" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8 lg:pb-20">
          <Link href="/blog" className="mb-12 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700">
            <ArrowLeft className="h-4 w-4" />Retour au blog
          </Link>

          <div className="grid items-end gap-10 lg:grid-cols-[1fr_360px]">
            <div className="max-w-3xl">
              <div className="mb-5 flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">{article.category}</span>
                <span className="inline-flex items-center gap-1 text-slate-500"><Calendar className="h-4 w-4" />{article.publishedAt?.slice(0, 10) || 'Publié'}</span>
                <span className="inline-flex items-center gap-1 text-slate-500"><Clock className="h-4 w-4" />{article.readTime}</span>
              </div>
              <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.05em] text-[#0f172a] sm:text-6xl">{article.title}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{article.description}</p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <span className="text-sm text-slate-600">Par <strong className="text-slate-900">{article.author}</strong></span>
                <BlogInteractions slug={article.slug} title={article.title} />
              </div>
            </div>
            <img src={article.image} alt="" className="aspect-[1200/630] w-full rounded-[22px] border border-blue-100 object-cover shadow-[0_20px_60px_rgba(8,15,30,0.6)] transition duration-500 hover:rotate-[0.7deg] hover:scale-[1.01]" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,760px)_260px] lg:px-8 lg:py-16">
        <article className="min-w-0 rounded-[28px] border border-blue-100 bg-white px-5 py-8 shadow-[0_18px_50px_rgba(37,99,235,.08)] sm:px-10 sm:py-12 sm:px-10 sm:py-12">
          <div className="article-markdown article-markdown--light"><ReactMarkdown>{article.content}</ReactMarkdown></div>
          <div className="mt-10 flex flex-wrap gap-2 border-t border-blue-100 pt-6">
            {article.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-slate-600">#{tag}</span>
            ))}
          </div>
        </article>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[22px] border border-blue-100 bg-white p-5 shadow-[0_18px_38px_rgba(3,7,18,0.4)]">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">À retenir</p>
            <p className="text-sm leading-6 text-slate-600">Un guide pratique JcHub pour progresser avec des exemples concrets.</p>
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
            <h2 className="mb-5 text-2xl font-black text-slate-900">À lire ensuite</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {relatedArticles.map((related) => (
                <Link key={related.slug} href={`/blog/${related.slug}`} className="group rounded-[18px] border border-blue-100 bg-white p-4 shadow-[0_16px_32px_rgba(3,7,18,0.35)] transition hover:-translate-y-0.5 hover:border-cyan-400/40">
                  <span className="text-sm font-bold leading-6 text-slate-900 group-hover:text-blue-700">{related.title}</span>
                  <span className="mt-2 block text-xs text-slate-500">{related.readTime} de lecture</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
