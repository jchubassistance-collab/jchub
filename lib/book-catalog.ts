import { books as localBooks } from '@/lib/books';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';

export async function getAvailableBooks() {
  if (!hasFirebaseAdminConfig()) return localBooks;
  try {
    const snapshot = await getAdminDb().collection('books').where('status', '==', 'available').get();
    if (!snapshot.size) return localBooks;
    return snapshot.docs.map((document) => {
      const data = document.data();
      const price = Number(data.oneTimePriceXAF ?? data.priceXAF ?? 0);
      return {
        ...data,
        slug: data.slug || document.id,
        status: data.status,
        pricing: data.pricing || (price > 0 ? 'paid' : 'free'),
        oneTimePriceXAF: price,
        audioStatus: data.audioStatus || (data.audioUrl ? 'available' : 'not_available'),
      };
    });
  } catch (error) {
    console.error('Erreur chargement catalogue:', error);
    return localBooks;
  }
}

export function hasPdf(book: { pdfUrl?: string | null; pdfPublicId?: string | null }) {
  return Boolean(book.pdfUrl || book.pdfPublicId);
}

export function hasAudio(book: { audioUrl?: string | null; audioPublicId?: string | null; audioStatus?: string }) {
  return Boolean(book.audioUrl || book.audioPublicId || book.audioStatus === 'available');
}
