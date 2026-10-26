import { apiMessage } from '@/lib/api-messages';
import { loadImage } from '@napi-rs/canvas';
import { jsPDF } from 'jspdf';
import { NextRequest, NextResponse } from 'next/server';
import { isMargin, isPageSize, layoutImagePage, type Fit, type Orientation } from '@/lib/images-to-pdf';
import { enforceDailyConversionQuota } from '@/lib/rate-limit';
import {
  cleanUpTemporaryBlobs,
  readTemporaryBlob,
  TemporaryBlobError,
} from '@/lib/temporary-conversion-blobs';
import { reportUserError } from '@/lib/user-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_FILES = 20;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: apiMessage(request, 'Demande de conversion invalide.') }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== 'object' ||
    !('urls' in body) ||
    !Array.isArray(body.urls) ||
    body.urls.length === 0 ||
    body.urls.length > MAX_FILES ||
    !body.urls.every((url): url is string => typeof url === 'string') ||
    !('pageSize' in body) ||
    !isPageSize(body.pageSize) ||
    !('orientation' in body) ||
    (body.orientation !== 'portrait' && body.orientation !== 'landscape') ||
    !('fit' in body) ||
    (body.fit !== 'contain' && body.fit !== 'cover') ||
    // A page opened before margins existed sends none: it keeps the edge-to-edge layout.
    ('margin' in body && !isMargin(body.margin))
  ) {
    return NextResponse.json({ error: apiMessage(request, 'Paramètres de conversion invalides.') }, { status: 400 });
  }

  const urls = body.urls;
  try {
    const files = [];
    let totalSize = 0;
    for (const url of urls) {
      const file = await readTemporaryBlob(url, 'images-to-pdf');
      totalSize += file.size;
      if (totalSize > MAX_TOTAL_SIZE) {
        return NextResponse.json({ error: apiMessage(request, 'La taille totale des images ne doit pas dépasser 50 Mo.') }, { status: 413 });
      }
      files.push(file);
    }

    const limited = await enforceDailyConversionQuota(request, 'images-to-pdf');
    if (limited) return limited;

    const options = {
      pageSize: body.pageSize,
      orientation: body.orientation as Orientation,
      fit: body.fit as Fit,
      margin: 'margin' in body && isMargin(body.margin) ? body.margin : 'none' as const,
    };
    const pdf = new jsPDF({ unit: 'mm', compress: true });

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const image = await loadImage(file.buffer);
      const { page, frame, image: placement } = layoutImagePage(image.width, image.height, options);

      // jsPDF swaps the two sides when they disagree with the orientation it is given.
      pdf.addPage([page.width, page.height], page.width > page.height ? 'landscape' : 'portrait');
      if (index === 0) pdf.deletePage(1);
      pdf.saveGraphicsState();
      pdf.rect(frame.x, frame.y, frame.width, frame.height, null);
      pdf.clip();
      pdf.discardPath();
      pdf.addImage(
        file.buffer,
        file.contentType === 'image/png' ? 'PNG' : 'JPEG',
        placement.x,
        placement.y,
        placement.width,
        placement.height,
        undefined,
        'FAST',
      );
      pdf.restoreGraphicsState();
    }

    return new NextResponse(new Uint8Array(pdf.output('arraybuffer')), {
      headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof TemporaryBlobError) {
      return NextResponse.json({ error: apiMessage(request, error.message) }, { status: error.status });
    }
    reportUserError();
    return NextResponse.json({ error: apiMessage(request, 'La création du PDF a échoué. Vérifie les images puis réessaie.') }, { status: 500 });
  } finally {
    await cleanUpTemporaryBlobs(urls, 'images-to-pdf');
  }
}
