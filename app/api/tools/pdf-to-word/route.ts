import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { buildVisuallyFaithfulWordDocument } from '@/lib/pdf-to-word';
import { convertPdfWithAdobe, hasAdobePdfServicesConfig } from '@/lib/document-services';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { reportUserError } from '@/lib/user-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PDF_LIMIT = 5;
const PDF_WINDOW_MS = 60 * 60 * 1000;
const MAX_PDF_SIZE_BYTES = 4 * 1024 * 1024;

function getClientIp(request: NextRequest) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '';
}

async function consumePdfQuota(request: NextRequest) {
  const clientIp = getClientIp(request);
  if (!clientIp) return true;

  const { getAdminDb, hasFirebaseAdminConfig } = await import('@/lib/firebase-admin');
  if (!hasFirebaseAdminConfig()) return true;

  const key = createHash('sha256')
    .update(`${process.env.PDF_QUOTA_SALT || 'jchub-pdf-quota'}:${clientIp}`)
    .digest('hex');
  const quotaRef = getAdminDb().collection('api_rate_limits').doc(`pdf-to-word:${key}`);
  const now = Date.now();
  let allowed = false;

  await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(quotaRef);
    const data = snapshot.data() as { count?: number; windowStartedAt?: number } | undefined;
    const windowStartedAt = Number(data?.windowStartedAt || 0);
    const count = windowStartedAt && now - windowStartedAt < PDF_WINDOW_MS ? Number(data?.count || 0) : 0;
    allowed = count < PDF_LIMIT;
    if (allowed) {
      transaction.set(quotaRef, { count: count + 1, windowStartedAt: count ? windowStartedAt : now, updatedAt: now });
    }
  });

  return allowed;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier PDF reçu.' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Le fichier doit être un PDF.' }, { status: 400 });
    }
    if (file.size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json({ error: 'Le fichier est trop volumineux. La taille maximale autorisée est de 4 Mo.' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
      return NextResponse.json({ error: 'Le fichier reçu n’est pas un PDF valide.' }, { status: 400 });
    }
    if (!await verifyTurnstileToken(formData.get('turnstileToken'), request)) {
      return NextResponse.json({ error: 'Vérification anti-abus échouée. Réessaie.' }, { status: 403 });
    }
    if (!await consumePdfQuota(request)) {
      return NextResponse.json({ error: 'Limite atteinte : 5 conversions par heure. Réessaie plus tard.' }, { status: 429 });
    }
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

    const tempDir = join(tmpdir(), 'jchub-pdf-to-word');
    const tempFileName = `${randomUUID()}.docx`;
    const tempPath = join(tempDir, tempFileName);

    await mkdir(tempDir, { recursive: true });
    await writeFile(tempPath, output);

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

    await unlink(tempPath).catch(() => undefined);

    return response;
  } catch (error) {
    reportUserError();
    return NextResponse.json({ error: 'Erreur pendant la conversion du PDF en Word.' }, { status: 500 });
  }
}
