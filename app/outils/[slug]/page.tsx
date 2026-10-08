import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
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
import { PdfToWord } from '@/components/tools/PdfToWord';
import { ExcelToCsvTool } from '@/components/tools/ExcelToCsvTool';
import { CsvToExcelTool } from '@/components/tools/CsvToExcelTool';
import { WordToPdf } from '@/components/tools/WordToPdf';
import { ImagesToPdf } from '@/components/tools/ImagesToPdf';

export const dynamic = 'force-dynamic';

const componentMap = {
  PasswordGenerator,
  JsonFormatter,
  Base64Tool,
  UuidGenerator,
  RegexTester,
  PdfToWord,
  ExcelToCsvTool,
  CsvToExcelTool,
  WordToPdf,
  ImagesToPdf,
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return {};
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').replace(/\/$/, '');
  const toolUrl = `${baseUrl}${tool.path ?? `/outils/${tool.slug}`}`;
  return {
    title: tool.seo.title,
    description: tool.seo.description,
    keywords: tool.seo.keywords,
    alternates: { canonical: toolUrl },
    openGraph: {
      title: tool.seo.title,
      description: tool.seo.description,
      url: toolUrl,
      type: 'website',
    },
    twitter: { card: 'summary', title: tool.seo.title, description: tool.seo.description },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();
  if (tool.path) redirect(tool.path);

  const Component = componentMap[tool.component as keyof typeof componentMap] ?? componentMap.PasswordGenerator;
  const publishedTools = await getPublishedTools();
  const otherTools = publishedTools
    .filter((candidate) => candidate.slug !== tool.slug)
    .map((candidate) => ({
      tool: candidate,
      score:
        (candidate.category === tool.category ? 3 : 0) +
        candidate.tags.filter((tag) => tool.tags.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score || a.tool.name.localeCompare(b.tool.name))
    .slice(0, 4)
    .map(({ tool: candidate }) => candidate);

  return (
    <div className="template-home min-h-screen bg-[#eff6ff] text-[#0f172a]">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_12%_20%,rgba(147,197,253,.48),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(191,219,254,.55),transparent_32%),#eff6ff] py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08),_transparent_55%)]" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)',
            backgroundSize: '34px 34px',
            maskImage: 'radial-gradient(circle at center, black 32%, transparent 100%)',
          }}
        />
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full border border-blue-100 bg-[#80b5ff]/10 blur-3xl" />
        <div className="absolute -left-28 bottom-[-80px] h-80 w-80 rounded-full border border-white/10 bg-[#3a68d9]/10 blur-2xl" />
        <div className="absolute right-[-60px] top-[-40px] h-72 w-72 rounded-full border border-white/10 bg-[#96c7ff]/10 blur-2xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-slate-600 mb-4 flex items-center gap-1.5">
            <Link href="/" className="hover:text-blue-700">Accueil</Link>
            <ChevronRight className="w-3 h-3 text-slate-500" />
            <Link href="/outils" className="hover:text-blue-700">Outils</Link>
            <ChevronRight className="w-3 h-3 text-slate-500" />
            <span className="text-[#0f172a] font-semibold">{tool.name}</span>
          </nav>

          <div className="flex items-start gap-4 flex-wrap" style={{ transform: 'perspective(1200px) rotateX(1.5deg) rotateY(-2deg)' }}>
            <div className="w-16 h-16 rounded-2xl border border-blue-100 bg-[#9ccbff]/10 flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
              {tool.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  {tool.category}
                </span>
                <span className="text-xs font-bold text-emerald-300 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-300/20">
                  ✓ 100% GRATUIT
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black mb-2 text-[#0f172a]">{tool.name}</h1>
              <p className="text-slate-600 text-lg">{tool.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2.5 rounded-full border border-white/10 bg-white/5 text-slate-200 hover:border-[#9ccbff]/40 hover:text-blue-700 transition" aria-label="Favori">
                <Heart className="w-4 h-4" />
              </button>
              <button className="p-2.5 rounded-full border border-white/10 bg-white/5 text-slate-200 hover:border-[#9ccbff]/40 hover:text-blue-700 transition" aria-label="Partager">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 bg-[#eff6ff]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-blue-100 bg-[rgba(13,28,52,0.8)] p-6 md:p-8 shadow-[0_18px_40px_rgba(7,19,40,0.24)] backdrop-blur-sm" style={{ transform: 'perspective(1200px) rotateX(3deg) rotateY(-3deg)' }}>
            <Component />
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { emoji: '🔒', title: '100% privé', desc: 'Tout se passe dans ton navigateur' },
              { emoji: '⚡', title: 'Instantané', desc: 'Pas d\'attente, pas de serveur' },
              { emoji: '🎨', title: 'Sans pub', desc: 'Pas de tracking, pas de pub' },
            ].map((f) => (
              <div key={f.title} className="text-center p-4 rounded-[1.25rem] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,.06)]" style={{ transform: 'perspective(1200px) rotateX(2deg) rotateY(-2deg)' }}>
                <div className="text-3xl mb-2">{f.emoji}</div>
                <div className="font-bold text-sm mb-1 text-slate-900">{f.title}</div>
                <div className="text-xs text-slate-600">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-[#eff6ff] border-t border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h2 className="text-2xl font-black text-[#0f172a]">Autres outils utiles</h2>
            <Link href="/outils" className="text-blue-700 font-semibold hover:text-blue-900 flex items-center gap-1">
              Tous les outils
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {otherTools.map((t) => (
              <Link
                key={t.slug}
                href={`/outils/${t.slug}`}
                data-page-loader
                className="group p-4 rounded-[1.5rem] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,.06)] hover:border-blue-300 hover:shadow-[0_18px_40px_rgba(37,99,235,.12)] transition"
                style={{ transform: 'perspective(1200px) rotateX(2deg) rotateY(-2deg)' }}
              >
                <div className="text-2xl mb-2">{t.icon}</div>
                <div className="font-semibold text-sm text-slate-900 group-hover:text-blue-700 transition">{t.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{t.category}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
