import { apiMessage } from '@/lib/api-messages';
import { NextRequest, NextResponse } from 'next/server';
import { convertWordWithAdobe, hasAdobePdfServicesConfig } from '@/lib/document-services';
import { reportUserError } from '@/lib/user-error';
import { enforceDailyConversionQuota } from '@/lib/rate-limit';
import {
  cleanUpTemporaryBlobs,
  readTemporaryBlob,
  TemporaryBlobError,
} from '@/lib/temporary-conversion-blobs';
import { downloadName } from '@/lib/download-name';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: apiMessage(request, 'Demande de conversion invalide.') }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || !('url' in body) || typeof body.url !== 'string') {
    return NextResponse.json({ error: apiMessage(request, 'Fichier temporaire manquant.') }, { status: 400 });
  }

  const url = body.url;
  try {
    const file = await readTemporaryBlob(url, 'word-to-pdf');
    if (!/\.docx$/i.test(file.pathname)) {
      return NextResponse.json({ error: apiMessage(request, 'Sélectionne un document Word au format .docx.') }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: apiMessage(request, 'Le fichier doit peser moins de 10 Mo.') }, { status: 400 });
    }
    const bytes = file.buffer;
    // DOCX is a ZIP archive and starts with the ZIP local-file signature.
    if (bytes.subarray(0, 4).toString('hex') !== '504b0304') {
      return NextResponse.json({ error: apiMessage(request, 'Le fichier reçu ne semble pas être un document DOCX valide.') }, { status: 400 });
    }
    if (!hasAdobePdfServicesConfig()) {
      return NextResponse.json({ error: apiMessage(request, 'La conversion Word vers PDF est momentanément indisponible.') }, { status: 503 });
    }
    const limited = await enforceDailyConversionQuota(request, 'word-to-pdf');
    if (limited) return limited;
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
        // The page names the file after the original document; this name only shows when opened directly.
        'Content-Disposition': `attachment; filename="${downloadName('document', 'pdf')}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof TemporaryBlobError) {
      return NextResponse.json({ error: apiMessage(request, error.message) }, { status: error.status });
    }
    reportUserError();
    return NextResponse.json({ error: apiMessage(request, 'Erreur pendant la conversion du document Word en PDF.') }, { status: 500 });
  } finally {
    await cleanUpTemporaryBlobs([url], 'word-to-pdf');
  }
}
