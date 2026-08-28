import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth } from '@/lib/firebase-admin';
import { hasAccess } from '@/lib/subscription';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function fileName(value: string) {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100) || 'livre'
  );
}

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const adminDb = getAdminDb();

  const book = await adminDb
    .collection('books')
    .doc(params.slug)
    .get();

  const data = book.data();

  if (
    !book.exists ||
    data?.status !== 'available' ||
    !data.pdfUrl
  ) {
    return NextResponse.json(
      { error: 'Livre introuvable.' },
      { status: 404 }
    );
  }

  if (data.pricing !== 'free') {
    const token = _request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
    try {
      const user = await getAdminAuth().verifyIdToken(token);
      const access = await hasAccess(user.uid);
      const purchased = Boolean((await adminDb.collection('users').doc(user.uid).collection('purchasedBooks').doc(params.slug).get()).exists);
      if (!access.isPremium && !purchased) return NextResponse.json({ error: 'Abonnement ou achat requis.' }, { status: 403 });
    } catch {
      return NextResponse.json({ error: 'Session invalide.' }, { status: 401 });
    }
  }

  const pdf = await fetch(data.pdfUrl);

  if (!pdf.ok || !pdf.body) {
    return NextResponse.json(
      { error: 'Le PDF est indisponible.' },
      { status: 502 }
    );
  }

  const name = `${fileName(
    data.title || data.slug || params.slug
  )}.pdf`;

  await book.ref.update({
    downloads: FieldValue.increment(1),
    lastDownloadedAt:
      FieldValue.serverTimestamp(),
  });

  return new NextResponse(pdf.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}