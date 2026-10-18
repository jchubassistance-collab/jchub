import { apiMessage } from '@/lib/api-messages';
import { NextRequest, NextResponse } from 'next/server';
import { buildVisuallyFaithfulWordDocument } from '@/lib/pdf-to-word';
import { convertPdfWithAdobe, hasAdobePdfServicesConfig } from '@/lib/document-services';
import { reportUserError } from '@/lib/user-error';
import { enforceDailyConversionQuota } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_PDF_SIZE_BYTES = 4 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_PDF_SIZE_BYTES + 128 * 1024) {
      return NextResponse.json({ error: apiMessage(request, 'Le fichier est trop volumineux. La taille maximale autorisée est de 4 Mo.') }, { status: 413 });
    }
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: apiMessage(request, 'Aucun fichier PDF reçu.') }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: apiMessage(request, 'Le fichier doit être un PDF.') }, { status: 400 });
    }
    if (file.size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json({ error: apiMessage(request, 'Le fichier est trop volumineux. La taille maximale autorisée est de 4 Mo.') }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
      return NextResponse.json({ error: apiMessage(request, 'Le fichier reçu n’est pas un PDF valide.') }, { status: 400 });
    }
    const limited = await enforceDailyConversionQuota(request, 'pdf-to-word');
    if (limited) return limited;

    let usedAdobe = false;
    let output: Buffer;

    if (hasAdobePdfServicesConfig()) {
      try {
        output = await convertPdfWithAdobe(bytes);
        usedAdobe = true;
      } catch (adobeError) {
        reportUserError();
        output = await buildVisuallyFaithfulWordDocument(bytes);
      }
    } else {
      output = await buildVisuallyFaithfulWordDocument(bytes);
    }

    try {
      const { getAdminDb, hasFirebaseAdminConfig } = await import('@/lib/firebase-admin');

      if (hasFirebaseAdminConfig()) {
        const db = getAdminDb();
        const now = new Date();
        const statsRef = db.collection('stats').doc('pdf_to_word');
        const snapshot = await statsRef.get();
        const current = snapshot.data() || {};

        await statsRef.set({
          totalUses: Number(current.totalUses || 0) + 1,
          today: Number(current.today || 0) + 1,
          lastUsed: now.toISOString(),
          updatedAt: now.toISOString(),
        }, { merge: true });
      }
    } catch (statsError) {
      reportUserError();
    }

    const response = new NextResponse(new Uint8Array(output), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="document.docx"; filename*=UTF-8''${encodeURIComponent(file.name.replace(/\.pdf$/i, '') + '.docx')}`,
        'X-Word-Mode': 'visual',
        'X-Document-Service': usedAdobe ? 'adobe' : 'local',
      },
    });

    return response;
  } catch (error) {
    reportUserError();
    return NextResponse.json({ error: apiMessage(request, 'Erreur pendant la conversion du PDF en Word.') }, { status: 500 });
  }
}
