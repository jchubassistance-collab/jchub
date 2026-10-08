import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { convertWordWithAdobe, hasAdobePdfServicesConfig } from '@/lib/document-services';
import { reportUserError } from '@/lib/user-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_WORD_SIZE_BYTES = 10 * 1024 * 1024;
const WORD_LIMIT = 5;
const WORD_WINDOW_MS = 60 * 60 * 1000;

function getClientIp(request: NextRequest) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '';
}

async function consumeWordQuota(request: NextRequest) {
  const clientIp = getClientIp(request);
  if (!clientIp) return true;

  const { getAdminDb, hasFirebaseAdminConfig } = await import('@/lib/firebase-admin');
  if (!hasFirebaseAdminConfig()) return true;

  const key = createHash('sha256')
    .update(`${process.env.PDF_QUOTA_SALT || 'jchub-pdf-quota'}:${clientIp}`)
    .digest('hex');
  const db = getAdminDb();
  const quotaRef = db.collection('api_rate_limits').doc(`word-to-pdf:${key}`);
  const now = Date.now();
  let allowed = false;

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(quotaRef);
    const data = snapshot.data() as { count?: number; windowStartedAt?: number } | undefined;
    const windowStartedAt = Number(data?.windowStartedAt || 0);
    const count = windowStartedAt && now - windowStartedAt < WORD_WINDOW_MS ? Number(data?.count || 0) : 0;
    allowed = count < WORD_LIMIT;
    if (allowed) {
      transaction.set(quotaRef, { count: count + 1, windowStartedAt: count ? windowStartedAt : now, updatedAt: now });
    }
  });
  return allowed;
}

export async function POST(request: NextRequest) {
  try {
    if (!hasAdobePdfServicesConfig()) {
      return NextResponse.json({ error: 'La conversion Word vers PDF est momentanément indisponible.' }, { status: 503 });
    }
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.docx')) {
      return NextResponse.json({ error: 'Sélectionne un document Word au format .docx.' }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_WORD_SIZE_BYTES) {
      return NextResponse.json({ error: 'Le fichier doit peser moins de 10 Mo.' }, { status: 400 });
    }
    if (!await consumeWordQuota(request)) {
      return NextResponse.json({ error: 'Limite atteinte : 5 conversions par heure. Réessaie plus tard.' }, { status: 429 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    // DOCX is a ZIP archive and starts with the ZIP local-file signature.
    if (bytes.subarray(0, 4).toString('hex') !== '504b0304') {
      return NextResponse.json({ error: 'Le fichier reçu ne semble pas être un document DOCX valide.' }, { status: 400 });
    }
    const output = await convertWordWithAdobe(bytes);

    try {
      const { getAdminDb, hasFirebaseAdminConfig } = await import('@/lib/firebase-admin');
      if (hasFirebaseAdminConfig()) {
        const db = getAdminDb();
        const now = new Date();
        const statsRef = db.collection('stats').doc('word_to_pdf');
        const snapshot = await statsRef.get();
        const current = snapshot.data() || {};

        await statsRef.set({
          totalUses: Number(current.totalUses || 0) + 1,
          today: Number(current.today || 0) + 1,
          lastUsed: now.toISOString(),
          updatedAt: now.toISOString(),
        }, { merge: true });
      }
    } catch {
      reportUserError();
    }

    return new NextResponse(new Uint8Array(output), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="document.pdf"; filename*=UTF-8''${encodeURIComponent(file.name.replace(/\.docx$/i, '') + '.pdf')}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    reportUserError();
    return NextResponse.json({ error: 'Erreur pendant la conversion du document Word en PDF.' }, { status: 500 });
  }
}
