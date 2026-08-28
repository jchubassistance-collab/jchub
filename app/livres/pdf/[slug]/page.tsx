import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Check, FileText, Lock } from 'lucide-react';
import { getAvailableBooks, hasPdf } from '@/lib/book-catalog';
import { ProtectedDownload } from '@/components/books/ProtectedDownload';
import { formatXAF } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export default async function PdfBookDetailPage({ params }: { params: { slug: string } }) {
  const book = (await getAvailableBooks()).find((item) => item.slug === params.slug) as Record<string, any> | undefined;
  if (!book || !hasPdf(book)) notFound();
  const isFree = book.pricing === 'free';
  const price = Number(book.oneTimePriceXAF || 0);

  return <main className="min-h-screen bg-slate-50 text-slate-900"><div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><Link href="/livres/pdf" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Retour aux PDF</Link><section className="mt-8 grid gap-10 lg:grid-cols-[280px_1fr] lg:items-start"><div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-xl">{book.cover ? <img src={book.cover} alt={`Couverture de ${book.title}`} className="h-full w-full object-cover" /> : <FileText className="m-auto h-16 w-16 text-white/80" />}<span className="absolute left-3 top-3 bg-white px-2 py-1 text-xs font-black">PDF</span></div><div><p className="text-xs font-black uppercase tracking-[.18em] text-orange-600">Livre PDF · {book.category || 'Ressource'}</p><h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">{book.title}</h1><p className="mt-3 text-lg text-slate-500">par <strong className="text-slate-900">{book.author || 'JcHub'}</strong></p><p className="mt-7 max-w-2xl text-base leading-8 text-slate-600">{book.description || 'Les informations détaillées de ce livre sont bientôt disponibles.'}</p><div className="mt-8 grid max-w-lg grid-cols-2 gap-3"><div className="border border-slate-200 bg-white p-4"><FileText className="mb-3 h-5 w-5 text-orange-500" /><p className="text-xs text-slate-500">Format</p><p className="mt-1 font-black">PDF · {book.totalPages || 0} pages</p></div><div className="border border-slate-200 bg-white p-4"><BookOpen className="mb-3 h-5 w-5 text-teal-600" /><p className="text-xs text-slate-500">Chapitres</p><p className="mt-1 font-black">{book.totalChapters || 1}</p></div></div><div className="mt-8 max-w-md"><ProtectedDownload slug={book.slug} isFree={isFree} totalPages={Number(book.totalPages || 0)} /></div>{!isFree && <div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Lock className="h-4 w-4" /> Achat à l’unité : <strong className="text-slate-900">{formatXAF(price)}</strong></div>}<div className="mt-5 flex gap-3">{!isFree && <Link href={`/checkout?plan=book&book=${book.slug}&price=${price}`} className="inline-flex items-center gap-2 bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600">Acheter le PDF</Link>}<Link href="/pricing" className="inline-flex items-center gap-2 border border-slate-300 px-5 py-3 text-sm font-bold hover:border-orange-400">Voir les abonnements</Link></div></div></section></div></main>;
}
