'use client';

import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen, Clock, Headphones, Lock, Download, Sparkles, Check,
  Volume2, FileText, Play, Pause, Heart, Share2, ChevronRight
} from 'lucide-react';
import { ProtectedDownload } from '@/components/books/ProtectedDownload';
import { useEffect, useRef, useState } from 'react';
import { getBookBySlug } from '@/lib/books';
import { formatXAF } from '@/lib/pricing';

export default function BookDetailPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const initialBook = slug ? getBookBySlug(slug) : null;
  const [book, setBook] = useState<any>(initialBook ?? null);
  const [bookLoading, setBookLoading] = useState(!initialBook);

  const [isPlaying, setIsPlaying] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!slug) {
      setBook(null);
      setBookLoading(false);
      return;
    }

    if (initialBook) return;

    fetch(`/api/books?slug=${encodeURIComponent(slug)}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setBook(data?.book ?? null))
      .catch(() => setBook(null))
      .finally(() => setBookLoading(false));
  }, [initialBook, slug]);

  useEffect(() => {
    if (!autoAdvance) return;
    audioRef.current?.play().catch(() => setIsPlaying(false));
    setAutoAdvance(false);
  }, [activeChapter, autoAdvance]);

  if (bookLoading) {
    return <div className="min-h-screen grid place-items-center text-gray-500">Chargement du livre…</div>;
  }

  if (!slug) {
    notFound();
  }

  if (!book) notFound();

  const isFree = book.pricing === 'free';
  const hasAudio = book.audioStatus !== 'not_available';
  const price = book.oneTimePriceXAF;
  const audioChapters = Array.isArray(book.audioChapters) && book.audioChapters.length
    ? book.audioChapters
    : book.audioUrl
      ? [{ index: 1, title: 'Lecture intégrale', url: book.audioUrl }]
      : [];
  const currentAudio = audioChapters[activeChapter] || audioChapters[0];

  const toggleAudio = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
    } else {
      audio.pause();
    }
  };

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 min-h-screen">
      {/* Hero avec cover */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-purple-50" />
        <div className="blob bg-brand-300 w-96 h-96 -top-20 -right-20 opacity-30" />
        <div className="blob bg-pink-300 w-96 h-96 -bottom-20 -left-20 opacity-30" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
            <Link href="/" className="hover:text-brand-600">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/livres" className="hover:text-brand-600">Livres</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 font-semibold">{book.title}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cover avec gradient */}
            <div className="md:col-span-1">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-br from-brand-500 to-pink-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition" />
                <div className={`relative aspect-[3/4] rounded-2xl shadow-2xl flex flex-col items-center justify-center p-6 ${
                  isFree
                    ? 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600'
                    : 'bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600'
                }`}>
                  {book.cover && (
                    <img src={book.cover} alt={`Couverture de ${book.title}`} className="absolute inset-0 h-full w-full rounded-2xl object-cover" />
                  )}
                  {/* Decorative circles */}
                  <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10" />
                  <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5" />

                  {/* Format badges */}
                  <div className="absolute top-4 left-4 flex gap-1.5">
                    <span className="px-2.5 py-1 bg-white/30 backdrop-blur rounded-md text-[10px] font-bold text-white flex items-center gap-1">
                      <FileText className="w-3 h-3" />PDF
                    </span>
                    {hasAudio && <span className="px-2.5 py-1 bg-white/30 backdrop-blur rounded-md text-[10px] font-bold text-white flex items-center gap-1">
                      <Volume2 className="w-3 h-3" />AUDIO
                    </span>}
                  </div>

                  <BookOpen className="w-20 h-20 text-white/90 mb-3" />
                  <h2 className="text-white font-black text-xl text-center leading-tight">
                    {book.title}
                  </h2>
                  <p className="text-white/80 text-sm mt-2">{book.author}</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {isFree ? (
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                    <Check className="w-4 h-4" />
                    Accès libre
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full">
                    <Sparkles className="w-4 h-4" />
                    Premium
                  </span>
                )}
                {book.isNew && (
                  <span className="text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-1 rounded-full animate-pulse">
                    🆕 NOUVEAU
                  </span>
                )}
                <span className="text-xs text-gray-500">{book.category}</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black mb-3 leading-tight">{book.title}</h1>
              <p className="text-lg text-gray-600 mb-6">par <span className="font-semibold text-gray-900">{book.author}</span></p>

              <p className="text-gray-700 leading-relaxed mb-6">{book.description}</p>

              {/* Métadonnées */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {hasAudio && <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                  <FileText className="w-5 h-5 mx-auto mb-1 text-brand-600" />
                  <div className="text-xs text-gray-500">PDF</div>
                  <div className="font-bold text-sm">{book.totalPages} pages</div>
                </div>}
                {hasAudio && <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                  <Volume2 className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                  <div className="text-xs text-gray-500">Audio</div>
                  <div className="font-bold text-sm">{book.estimatedAudioHours}h</div>
                </div>}
                <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                  <BookOpen className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  <div className="text-xs text-gray-500">Chapitres</div>
                  <div className="font-bold text-sm">{book.totalChapters}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                  <div className="text-xs text-gray-500">Durée</div>
                  <div className="font-bold text-sm">{Math.round(book.estimatedAudioHours * 60)} min</div>
                </div>
              </div>

              {/* Boutons PDF et Audio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* PDF Download */}
                <ProtectedDownload slug={book.slug} isFree={isFree} totalPages={book.totalPages} />

                {/* Audio */}
                {hasAudio && (book.audioStatus === 'available' ? (
                  <button
                    onClick={toggleAudio}
                    className="group relative bg-gradient-to-r from-brand-600 to-purple-600 rounded-2xl p-4 hover:shadow-2xl hover:shadow-brand-500/40 transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition" />
                    <div className="relative flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center group-hover:scale-110 transition">
                        {isPlaying ? <Pause className="w-6 h-6 text-white fill-current" /> : <Play className="w-6 h-6 text-white fill-current" />}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-white">
                          {isPlaying ? 'Pause audio' : isFree ? 'Écouter gratuitement' : 'Écouter l\'aperçu'}
                        </div>
                        <div className="text-xs text-white/80">{book.estimatedAudioHours}h · Chapitre 1 offert</div>
                      </div>
                      <Volume2 className="w-5 h-5 text-white/70" />
                    </div>
                  </button>
                ) : (
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-4 flex items-center gap-3 opacity-75">
                    <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-gray-700">Audio bientôt disponible</div>
                      <div className="text-xs text-gray-500">En cours de conversion</div>
                    </div>
                  </div>
                ))}
              </div>

              {book.audioStatus === 'available' && currentAudio?.url && (
                <audio
                  key={currentAudio.url}
                  ref={audioRef}
                  src={currentAudio.url}
                  preload="metadata"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => {
                    if (activeChapter < audioChapters.length - 1) {
                      setActiveChapter((chapter) => chapter + 1);
                      setAutoAdvance(true);
                    } else {
                      setIsPlaying(false);
                    }
                  }}
                  className="mt-1 w-full"
                  controls
                />
              )}

              {audioChapters.length > 1 && (
                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
                  <p className="mb-2 text-sm font-bold text-gray-800">Chapitres</p>
                  <div className="flex flex-wrap gap-2">
                    {audioChapters.map((chapter: any, index: number) => (
                      <button key={chapter.publicId || chapter.url} type="button" onClick={() => { setAutoAdvance(false); setActiveChapter(index); }} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${index === activeChapter ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {chapter.title || `Chapitre ${index + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions secondaires */}
              <div className="flex items-center gap-3 mb-6">
                {!isFree && (
                  <Link
                    href={`/pricing`}
                    className="inline-flex items-center gap-2 text-sm bg-gray-900 text-white px-4 py-2 rounded-full font-semibold hover:bg-gray-800 transition"
                  >
                    <Lock className="w-4 h-4" />
                    Débloquer pour {formatXAF(price!)}
                  </Link>
                )}
                <button
                  onClick={() => setFavorited(!favorited)}
                  className={`p-2.5 rounded-full border-2 transition ${
                    favorited
                      ? 'border-pink-500 bg-pink-50 text-pink-600'
                      : 'border-gray-200 text-gray-600 hover:border-pink-300'
                  }`}
                  aria-label="Favori"
                >
                  <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
                </button>
                <button className="p-2.5 rounded-full border-2 border-gray-200 text-gray-600 hover:border-brand-300 transition" aria-label="Partager">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {!isFree && (
                <p className="text-sm text-gray-600">
                  💎 Ou <Link href="/pricing" className="text-brand-600 font-semibold hover:underline">abonnez-vous à JcHub+</Link> pour un accès illimité à tous les livres
                </p>
              )}

              {/* Note légale */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Licence :</strong> {book.rightsNote}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {hasAudio && <>
      {/* Chapitres */}
      <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-6 h-6 text-brand-600" />
          <h2 className="text-2xl font-black">Chapitres</h2>
          <span className="text-sm text-gray-500">({book.totalChapters} chapitres · {book.estimatedAudioHours}h)</span>
        </div>

        <div className="space-y-2">
          {Array.from({ length: book.totalChapters }).map((_, i) => {
            const isFreeChapter = i === 0;
            const isLocked = !isFree && !isFreeChapter;
            return (
              <div
                key={i}
                className="group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-brand-300 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    isFreeChapter
                      ? 'bg-gradient-to-br from-emerald-400 to-cyan-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {i === 0 ? 'Introduction' : `Chapitre ${i}`}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {Math.round((book.estimatedAudioHours * 60) / book.totalChapters)} min
                      {isFreeChapter && (
                        <span className="text-emerald-600 font-semibold">· Gratuit</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isLocked ? (
                    <Lock className="w-4 h-4 text-gray-400" />
                  ) : (
                    <button className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition">
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!isFree && (
          <div className="mt-6 p-6 bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-200 rounded-2xl text-center">
            <Lock className="w-8 h-8 mx-auto text-brand-600 mb-2" />
            <h3 className="font-bold text-lg mb-1">Débloquez tous les chapitres</h3>
            <p className="text-sm text-gray-600 mb-4">
              Achetez ce livre pour {formatXAF(price!)} ou abonnez-vous à JcHub+ pour un accès illimité.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link
                href={`/api/checkout?plan=book&book=${book.slug}&price=${price}`}
                className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-gray-800 transition"
              >
                Acheter pour {formatXAF(price!)}
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 border border-brand-200 px-5 py-2.5 rounded-full font-semibold hover:bg-brand-50 transition"
              >
                Voir JcHub+
              </Link>
            </div>
          </div>
        )}
      </section>
      </>}
    </div>
  );
}
