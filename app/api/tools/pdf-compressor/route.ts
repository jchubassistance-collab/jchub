import { apiMessage } from '@/lib/api-messages';
import { createCanvas, DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas';
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

const MAX_PAGES = 100;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: apiMessage(request, 'Demande de compression invalide.') }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || !('url' in body) || typeof body.url !== 'string') {
    return NextResponse.json({ error: apiMessage(request, 'Fichier temporaire manquant.') }, { status: 400 });
  }

  const url = body.url;
  try {
    const file = await readTemporaryBlob(url, 'pdf-compressor');
    if (file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
      return NextResponse.json({ error: apiMessage(request, 'Le fichier reçu n’est pas un PDF valide.') }, { status: 400 });
    }

    const runtimeGlobals = globalThis as Record<string, unknown>;
    runtimeGlobals.DOMMatrix ??= DOMMatrix;
    runtimeGlobals.ImageData ??= ImageData;
    runtimeGlobals.Path2D ??= Path2D;

    const [{ getDocument }, { WorkerMessageHandler }] = await Promise.all([
      import('pdfjs-dist/legacy/build/pdf.mjs'),
      import('pdfjs-dist/legacy/build/pdf.worker.mjs'),
    ]);
    if (!runtimeGlobals.pdfjsWorker) runtimeGlobals.pdfjsWorker = { WorkerMessageHandler };

    const pdf = await getDocument({
      data: new Uint8Array(file.buffer),
      useWorkerFetch: false,
    }).promise;
    if (pdf.numPages > MAX_PAGES) {
      return NextResponse.json({ error: apiMessage(request, 'Le PDF ne doit pas dépasser {pages} pages.', { pages: MAX_PAGES }) }, { status: 413 });
    }

    const limited = await enforceDailyConversionQuota(request, 'pdf-compressor');
    if (limited) return limited;

    const output = new jsPDF({ unit: 'pt', format: 'a4', compress: true, orientation: 'portrait' });
    const pageWidth = output.internal.pageSize.getWidth();
    const pageHeight = output.internal.pageSize.getHeight();

    for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
      if (pageIndex > 1) output.addPage();
      const page = await pdf.getPage(pageIndex);
      const viewport = page.getViewport({ scale: 1.15 });
      const scale = Math.min((pageWidth - 40) / viewport.width, (pageHeight - 40) / viewport.height, 1.3);
      const renderViewport = page.getViewport({ scale });
      const canvas = createCanvas(Math.max(1, Math.round(renderViewport.width)), Math.max(1, Math.round(renderViewport.height)));
      const context = canvas.getContext('2d');

      await page.render({
        canvas: null,
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport: renderViewport,
      }).promise;

      const imageData = canvas.toDataURL('image/jpeg', 0.72);
      const imageWidth = pageWidth - 32;
      const imageHeight = (renderViewport.height / renderViewport.width) * imageWidth;
      output.addImage(imageData, 'JPEG', 16, 20, imageWidth, imageHeight, undefined, 'FAST');
    }

    const compressed = Buffer.from(output.output('arraybuffer'));
    const keptOriginal = compressed.length >= file.buffer.length;
    return new NextResponse(new Uint8Array(keptOriginal ? file.buffer : compressed), {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store',
        ...(keptOriginal ? { 'X-Pdf-Original-Kept': 'true' } : {}),
      },
    });
  } catch (error) {
    if (error instanceof TemporaryBlobError) {
      return NextResponse.json({ error: apiMessage(request, error.message) }, { status: error.status });
    }
    reportUserError();
    return NextResponse.json({ error: apiMessage(request, 'La compression du PDF a échoué. Vérifie le fichier puis réessaie.') }, { status: 500 });
  } finally {
    await cleanUpTemporaryBlobs([url], 'pdf-compressor');
  }
}
