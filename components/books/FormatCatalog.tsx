import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, Headphones, Lock, Sparkles } from 'lucide-react';
import { formatXAF } from '@/lib/pricing';
import { hasAudio, hasPdf } from '@/lib/book-catalog';

type CatalogBook = Record<string, any>;

export function FormatCatalog({ books, format }: { books: CatalogBook[]; format: 'pdf' | 'audio' }) {
  const filtered = books.filter((book) => format === 'pdf' ? hasPdf(book) : hasAudio(book));
  return (
    <div className={`${format === 'pdf' ? 'pdf-catalog' : 'audio-catalog'} grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`}>
      {filtered.map((book, index) => {
        const paid = book.pricing !== 'free';
        return <Link key={book.slug} href={format === 'audio' ? `/livres/audio/${book.slug}` : `/livres/pdf/${book.slug}`} style={{ animationDelay: `${index * 60}ms` }} className="book-card group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl">
          <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-[#17324d] via-teal-700 to-orange-500">
            {book.cover ? <img src={book.cover} alt={`Couverture de ${book.title}`} className="absolute inset-0 h-full w-full object-cover" /> : <BookOpen className="mx-auto h-10 w-10 text-white/80" />}
            <div className="absolute inset-x-2 top-2 flex justify-between gap-1"><span className="bg-white/90 px-2 py-1 text-[10px] font-black text-slate-900">{format === 'pdf' ? 'PDF' : 'AUDIO'}</span>{paid && <span className="bg-slate-950/75 px-2 py-1 text-[10px] font-bold text-orange-200"><Lock className="mr-1 inline h-3 w-3" />Premium</span>}</div>
          </div>
          <div className="p-3"><p className="line-clamp-1 text-[10px] font-bold uppercase tracking-wide text-teal-700">{book.category || 'Ressource'}</p><h2 className="mt-1 line-clamp-2 text-sm font-black leading-tight text-slate-900 group-hover:text-orange-600">{book.title}</h2><p className="mt-1 line-clamp-1 text-xs text-slate-500">{book.author || 'JcHub'}</p><div className="mt-3 flex items-center justify-between gap-2 text-xs font-bold">{paid ? <span className="text-orange-600">{formatXAF(Number(book.oneTimePriceXAF || 0))}</span> : <span className="text-emerald-600">Accès libre</span>}<ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-orange-500" /></div></div>
        </Link>;
      })}
      {!filtered.length && <div className="col-span-full border border-dashed border-slate-300 px-6 py-14 text-center text-slate-500">Aucun {format === 'pdf' ? 'PDF' : 'livre audio'} disponible pour le moment.</div>}
    </div>
  );
}
