import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { hasAccess } from '@/lib/subscription';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const bookSnapshot = await getAdminDb().collection('books').doc(params.slug).get();
  const book = bookSnapshot.data();
  if (!bookSnapshot.exists || book?.status !== 'available' || !book.audioUrl) return NextResponse.json({ error: 'Livre audio introuvable.' }, { status: 404 });

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Abonnement ou achat requis.' }, { status: 401 });
  try {
    const user = await getAdminAuth().verifyIdToken(token);
    const access = await hasAccess(user.uid);
    const purchased = Boolean((await getAdminDb().collection('users').doc(user.uid).collection('purchasedBooks').doc(params.slug).get()).exists);
    if (!access.isPremium && !purchased) return NextResponse.json({ error: 'Abonnement ou achat requis.' }, { status: 403 });
    const audio = await fetch(book.audioUrl);
    if (!audio.ok || !audio.body) return NextResponse.json({ error: 'Audio indisponible.' }, { status: 502 });
    return new NextResponse(audio.body, { headers: { 'Content-Type': 'audio/mpeg', 'Content-Disposition': `attachment; filename="${params.slug}.mp3"`, 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Session invalide.' }, { status: 401 });
  }
}
