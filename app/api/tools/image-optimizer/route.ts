import { createCanvas, loadImage } from '@napi-rs/canvas';
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

const MAX_IMAGE_PIXELS = 40_000_000;

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
    !('url' in body) ||
    typeof body.url !== 'string' ||
    !('format' in body) ||
    (body.format !== 'webp' && body.format !== 'png') ||
    !('quality' in body) ||
    typeof body.quality !== 'number' ||
    !Number.isInteger(body.quality) ||
    body.quality < 10 ||
    body.quality > 100
  ) {
    return NextResponse.json({ error: 'Paramètres de conversion invalides.' }, { status: 400 });
  }

  const url = body.url;
  try {
    const file = await readTemporaryBlob(url, 'image-optimizer');
    try {
      const image = await loadImage(file.buffer);
      if (image.width * image.height > MAX_IMAGE_PIXELS) {
        return NextResponse.json({ error: 'La résolution de cette image est trop élevée.' }, { status: 413 });
      }

      const limited = await enforceDailyConversionQuota(request, 'image-optimizer');
      if (limited) return limited;

      const canvas = createCanvas(image.width, image.height);
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      let output: Buffer;
      let contentType: string;
      let keptOriginal = false;

      if (body.format === 'webp') {
        output = canvas.toBuffer('image/webp', body.quality / 100);
        for (let quality = body.quality - 5; output.length >= file.size && quality >= 10; quality -= 5) {
          output = canvas.toBuffer('image/webp', quality / 100);
        }

        if (output.length >= file.size) {
          output = file.buffer;
          contentType = file.contentType;
          keptOriginal = true;
        } else {
          contentType = 'image/webp';
        }
      } else {
        output = canvas.toBuffer('image/png');
        contentType = 'image/png';
      }

      return new NextResponse(new Uint8Array(output), {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-store',
          ...(keptOriginal ? { 'X-Image-Original-Kept': 'true' } : {}),
        },
      });
    } catch (error) {
      if (error instanceof TemporaryBlobError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      reportUserError();
      return NextResponse.json({ error: 'La conversion de cette image a échoué.' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof TemporaryBlobError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    reportUserError();
    return NextResponse.json({ error: 'Impossible de lire le fichier temporaire.' }, { status: 503 });
  } finally {
    await cleanUpTemporaryBlobs([url], 'image-optimizer');
  }
}
