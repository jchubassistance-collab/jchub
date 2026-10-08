import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { reportUserError } from '@/lib/user-error';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const limited = await enforceRateLimit(_request, 'blog-view', 30, 60_000);
  if (limited) return limited;
  const { slug } = await params;
  if (!hasFirebaseAdminConfig()) return NextResponse.json({ views: null }, { status: 503 });
  try {
    const ref = getAdminDb().collection('blog_articles').doc(slug);
    await ref.set({ slug, views: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    const snapshot = await ref.get();
    return NextResponse.json({ views: Number(snapshot.data()?.views || 0) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    reportUserError();
    return NextResponse.json({ views: null }, { status: 503 });
  }
}
