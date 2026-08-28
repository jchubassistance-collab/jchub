import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function publicBook(id: string, data: Record<string, any>) {
  return {
    slug: data.slug || id,
    title: data.title || 'Livre sans titre',
    author: data.author || 'Auteur inconnu',
    description: data.description || '',
    longDescription: data.longDescription || '',
    category: data.category || 'Autre',
    tags: Array.isArray(data.tags) ? data.tags : [],
    language: data.language || 'fr',
    totalPages: Number(data.totalPages || 0),
    estimatedAudioHours: Number(data.estimatedAudioHours || 0),
    difficulty: data.difficulty || 'intermediate',
    totalChapters: Number(data.totalChapters || 1),
    pricing: data.pricing || (Number(data.oneTimePriceXAF ?? data.priceXAF ?? 0) > 0 ? 'paid' : 'free'),
    oneTimePriceXAF: Number(data.oneTimePriceXAF ?? data.priceXAF ?? 0),
    cover: data.cover || null,
    audioStatus: data.audioStatus || (data.audioChapters?.length ? 'available' : 'coming_soon'),
    audioUrl: data.audioUrl || null,
    audioChapters: Array.isArray(data.audioChapters) ? data.audioChapters : [],
    views: Number(data.views || 0),
    downloads: Number(data.downloads || 0),
  };
}

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const slug = request.nextUrl.searchParams.get('slug');

    if (slug) {
      const document = await db.collection('books').doc(slug).get();
      const data = document.data();
      if (!document.exists || data?.status !== 'available') {
        return NextResponse.json({ error: 'Livre introuvable.' }, { status: 404 });
      }
      await document.ref.update({
        views: FieldValue.increment(1),
        lastViewedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ book: publicBook(document.id, data) });
    }

    const snapshot = await db.collection('books').where('status', '==', 'available').get();
    return NextResponse.json({
      books: snapshot.docs.map((document) => publicBook(document.id, document.data())),
    });
  } catch (error) {
    console.error('Erreur API livres:', error);
    return NextResponse.json({ error: 'Impossible de récupérer les livres.' }, { status: 500 });
  }
}
