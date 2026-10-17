import { loadImage } from '@napi-rs/canvas';
import { jsPDF } from 'jspdf';
import { NextRequest, NextResponse } from 'next/server';
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
    return NextResponse.json({ error: 'Demande de conversion invalide.' }, { status: 400 });
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
    !['a4', 'letter', 'image'].includes(String(body.pageSize)) ||
    !('orientation' in body) ||
    (body.orientation !== 'portrait' && body.orientation !== 'landscape') ||
    !('fit' in body) ||
    (body.fit !== 'contain' && body.fit !== 'cover')
  ) {
    return NextResponse.json({ error: 'Paramètres de conversion invalides.' }, { status: 400 });
  }

  const urls = body.urls;
  try {
    const files = [];
    let totalSize = 0;
    for (const url of urls) {
      const file = await readTemporaryBlob(url, 'images-to-pdf');
      totalSize += file.size;
      if (totalSize > MAX_TOTAL_SIZE) {
        return NextResponse.json({ error: 'La taille totale des images ne doit pas dépasser 50 Mo.' }, { status: 413 });
      }
      files.push(file);
    }

    const limited = await enforceDailyConversionQuota(request, 'images-to-pdf');
    if (limited) return limited;

    const pageSize = body.pageSize as 'a4' | 'letter' | 'image';
    const orientation = body.orientation;
    const fit = body.fit;
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize === 'image' ? 'a4' : pageSize,
      compress: true,
    });

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const image = await loadImage(file.buffer);
      let width: number;
      let height: number;

      if (pageSize === 'image') {
        width = image.width * 25.4 / 96;
        height = image.height * 25.4 / 96;
        if (orientation === 'landscape' && height > width) [width, height] = [height, width];
        if (orientation === 'portrait' && width > height) [width, height] = [height, width];
        if (index === 0) pdf.deletePage(1);
        pdf.addPage([width, height], orientation);
      } else {
        if (index > 0) pdf.addPage(pageSize, orientation);
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imageRatio = image.width / image.height;
        const pageRatio = pageWidth / pageHeight;
        if ((fit === 'contain' && imageRatio > pageRatio) || (fit === 'cover' && imageRatio < pageRatio)) {
          width = pageWidth;
          height = pageWidth / imageRatio;
        } else {
          height = pageHeight;
          width = pageHeight * imageRatio;
        }
        if (fit === 'contain') {
          width = Math.min(width, pageWidth);
          height = Math.min(height, pageHeight);
        }
      }

      const x = (pdf.internal.pageSize.getWidth() - width) / 2;
      const y = (pdf.internal.pageSize.getHeight() - height) / 2;
      pdf.addImage(
        file.buffer,
        file.contentType === 'image/png' ? 'PNG' : 'JPEG',
        x,
        y,
        width,
        height,
        undefined,
        'FAST',
      );
    }

    return new NextResponse(new Uint8Array(pdf.output('arraybuffer')), {
      headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof TemporaryBlobError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    reportUserError();
    return NextResponse.json({ error: 'La création du PDF a échoué. Vérifie les images puis réessaie.' }, { status: 500 });
  } finally {
    await cleanUpTemporaryBlobs(urls, 'images-to-pdf');
  }
}
