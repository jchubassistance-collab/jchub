import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowRight, BookOpen, Heart, Share2, ChevronRight, Sparkles, Code2 } from 'lucide-react';
import { getPublishedTools, getToolBySlug, tools } from '@/lib/tools';
import { PasswordGenerator } from '@/components/tools/PasswordGenerator';
import { JsonFormatter } from '@/components/tools/JsonFormatter';
import { Base64Tool } from '@/components/tools/Base64Tool';
import { UuidGenerator } from '@/components/tools/UuidGenerator';
import { RegexTester } from '@/components/tools/RegexTester';
import { ColorConverter } from '@/app/tools/jchub-tools/ColorConverter';
import { HashGenerator } from '@/app/tools/jchub-tools/HashGenerator';
import { JwtDecoder } from '@/app/tools/jchub-tools/JwtDecoder';
import { MarkdownPreview } from '@/app/tools/jchub-tools/MarkdownPreview';
import { NumberBaseConverter } from '@/app/tools/jchub-tools/NumberBaseConverter';
import { QrCodeGenerator } from '@/app/tools/jchub-tools/QrCodeGenerator';
import { TimestampConverter } from '@/app/tools/jchub-tools/TimestampConverter';
import { UrlEncoder } from '@/app/tools/jchub-tools/UrlEncoder';

const componentMap = {
  PasswordGenerator,
  JsonFormatter,
  Base64Tool,
  UuidGenerator,
  RegexTester,
  ColorConverter,
  HashGenerator,
  JwtDecoder,
  MarkdownPreview,
  NumberBaseConverter,
  QrCodeGenerator,
  TimestampConverter,
  UrlEncoder,
};

export async function generateStaticParams() {
  return tools.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const tool = await getToolBySlug(params.slug);
  if (!tool) return {};
  return {
    title: tool.seo.title,
    description: tool.seo.description,
    keywords: tool.seo.keywords,
    openGraph: {
      title: tool.seo.title,
      description: tool.seo.description,
      type: 'website',
    },
  };
}

export default async function ToolPage({ params }: { params: { slug: string } }) {
  const tool = await getToolBySlug(params.slug);
  if (!tool) notFound();

  const Component = componentMap[tool.component as keyof typeof componentMap] ?? componentMap.PasswordGenerator;
  const otherTools = (await getPublishedTools()).filter((t) => t.slug !== params.slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Hero compact */}
      <section className="relative overflow-hidden bg-mesh py-10">
        <div className="blob bg-brand-300 w-96 h-96 -top-20 -right-20 opacity-20 animate-float-slow" />
        <div className="blob bg-pink-300 w-96 h-96 -bottom-20 -left-20 opacity-20 animate-float" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-500 mb-4 flex items-center gap-1.5">
            <Link href="/" className="hover:text-brand-600">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/outils" className="hover:text-brand-600">Outils</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 font-semibold">{tool.name}</span>
          </nav>

          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
              {tool.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                  {tool.category}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  ✓ 100% GRATUIT
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black mb-2">{tool.name}</h1>
              <p className="text-gray-600 text-lg">{tool.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2.5 rounded-full border-2 border-gray-200 text-gray-600 hover:border-pink-300 hover:text-pink-600 transition" aria-label="Favori">
                <Heart className="w-4 h-4" />
              </button>
              <button className="p-2.5 rounded-full border-2 border-gray-200 text-gray-600 hover:border-brand-300 transition" aria-label="Partager">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* L'outil */}
      <section className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition">
            <Component />
          </div>

          {/* Features list */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { emoji: '🔒', title: '100% privé', desc: 'Tout se passe dans ton navigateur' },
              { emoji: '⚡', title: 'Instantané', desc: 'Pas d\'attente, pas de serveur' },
              { emoji: '🎨', title: 'Sans pub', desc: 'Pas de tracking, pas de pub' },
            ].map((f) => (
              <div key={f.title} className="text-center p-4 bg-white border border-gray-200 rounded-xl">
                <div className="text-3xl mb-2">{f.emoji}</div>
                <div className="font-bold text-sm mb-1">{f.title}</div>
                <div className="text-xs text-gray-500">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Autres outils */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h2 className="text-2xl font-black">Autres outils utiles</h2>
            <Link href="/outils" className="text-brand-600 font-semibold hover:underline flex items-center gap-1">
              Tous les outils
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {otherTools.map((t) => (
              <Link
                key={t.slug}
                href={`/outils/${t.slug}`}
                className="group p-4 bg-white border border-gray-200 rounded-xl hover:border-brand-300 hover:shadow-md transition"
              >
                <div className="text-2xl mb-2">{t.icon}</div>
                <div className="font-semibold text-sm group-hover:text-brand-600 transition">{t.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t.category}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Livres */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-brand-600 to-purple-600 rounded-3xl p-8 text-white">
            <Sparkles className="w-8 h-8 mx-auto mb-2" />
            <h3 className="text-2xl font-black mb-2">Tu aimes les outils ?</h3>
            <p className="mb-4 text-brand-100">Découvre aussi nos livres audio premium pour monter en compétences.</p>
            <Link href="/livres" className="inline-flex items-center gap-2 bg-white text-brand-700 px-6 py-3 rounded-full font-semibold hover:scale-105 transition">
              <BookOpen className="w-4 h-4" />
              Voir les livres
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
