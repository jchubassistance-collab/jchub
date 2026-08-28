import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';

export async function POST(_request: NextRequest, { params }: { params: { slug: string } }) {
  if (!hasFirebaseAdminConfig()) return NextResponse.json({ views: null }, { status: 503 });
  try {
    const ref = getAdminDb().collection('blog_articles').doc(params.slug);
    await ref.set({ slug: params.slug, views: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    const snapshot = await ref.get();
    return NextResponse.json({ views: Number(snapshot.data()?.views || 0) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Erreur compteur article:', error);
    return NextResponse.json({ views: null }, { status: 503 });
  }
}
