import { NextRequest, NextResponse } from 'next/server';
import { convertImageToOcrPdfWithAdobe, hasAdobeImagePdfConfig } from '@/lib/image-to-pdf-services';
import { extractPdfLayout, joinPdfRuns } from '@/lib/pdf-to-word';
import { reportUserError } from '@/lib/user-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']);

type OcrSpaceWord = {
  WordText?: string;
  Left?: number;
  Top?: number;
  Width?: number;
  Height?: number;
};

type OcrSpaceResponse = {
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  ParsedResults?: Array<{
    ParsedText?: string;
    TextOverlay?: { Lines?: Array<{ LineText?: string; Words?: OcrSpaceWord[] }> };
  }>;
};

function normalizeOcrText(value: string): string {
  return value
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F\u00AD\uFFFE\uFFFF]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/([([{])\s+/g, '$1')
    .replace(/\s+»$/g, '')
    .replace(/^MAGERIE\b/, 'IMAGERIE')
    .replace(/\bADOL\s*TERATION\b/g, 'AGGLOMÉRATION')
    .replace(/\bAGOL\s*TRATION\b/g, 'AGGLOMÉRATION')
    .replace(/\bActivites\b/g, 'Activités')
    .replace(/\bexprcice\b/g, 'exercice')
    .replace(/\bresponsabilite\b/g, 'responsabilité')
    .replace(/\blimiteo\b/g, 'limitée')
    .replace(/(["“])Easydoct'/g, '$1Easydoct"')
    .trim();
}

function mergeOcrLineFragments(lines: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }>) {
  const merged: typeof lines = [];
  lines.forEach((line) => {
    const previous = merged[merged.length - 1];
    const verticalOverlap = previous && Math.min(previous.bbox.y1, line.bbox.y1) - Math.max(previous.bbox.y0, line.bbox.y0);
    const horizontalGap = previous ? line.bbox.x0 - previous.bbox.x1 : Number.POSITIVE_INFINITY;
    const lineHeight = previous ? Math.max(previous.bbox.y1 - previous.bbox.y0, line.bbox.y1 - line.bbox.y0) : 0;
    if (previous && verticalOverlap > 0 && horizontalGap >= 0 && horizontalGap <= lineHeight * 1.5) {
      previous.text = normalizeOcrText(`${previous.text}${line.text}`);
      previous.bbox.x1 = Math.max(previous.bbox.x1, line.bbox.x1);
      previous.bbox.y0 = Math.min(previous.bbox.y0, line.bbox.y0);
      previous.bbox.y1 = Math.max(previous.bbox.y1, line.bbox.y1);
    } else {
      merged.push({ text: normalizeOcrText(line.text), bbox: { ...line.bbox } });
    }
  });
  return merged;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OCR_API_KEY;
  const apiUrl = process.env.OCR_API_URL;
  if (!apiKey || !apiUrl) {
    return NextResponse.json({ error: 'La configuration OCR.space est absente.' }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Format accepté : JPG, PNG, GIF, WebP ou PDF.' }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Le fichier ne doit pas dépasser 10 Mo.' }, { status: 400 });
    }

    const requestedProvider = request.nextUrl.searchParams.get('provider');
    if (requestedProvider !== 'ocrspace' && hasAdobeImagePdfConfig() && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const pages = await extractPdfLayout(await convertImageToOcrPdfWithAdobe(Buffer.from(await file.arrayBuffer()), file.type));
      const page = pages[0];
      const lines = page?.lines.map((line) => ({
        text: joinPdfRuns(line.runs).trim(),
        bbox: {
          x0: line.x,
          y0: page.height - line.y - Math.max(...line.runs.map((run) => run.fontSize)),
          x1: line.x + line.width,
          y1: page.height - line.y,
        },
      })).filter((line) => line.text) ?? [];
      return NextResponse.json({
        text: lines.map((line) => line.text).join('\n'),
        words: [],
        lines,
        width: page?.width ?? 0,
        height: page?.height ?? 0,
        provider: 'adobe',
      });
    }

    const ocrForm = new FormData();
    ocrForm.append('file', file, file.name);
    ocrForm.append('language', 'fre');
    ocrForm.append('isOverlayRequired', 'true');
    ocrForm.append('detectOrientation', 'true');
    ocrForm.append('scale', 'true');
    ocrForm.append('OCREngine', '2');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { apikey: apiKey },
      body: ocrForm,
    });
    const payload = await response.json() as OcrSpaceResponse;
    if (!response.ok || payload.IsErroredOnProcessing) {
      const message = Array.isArray(payload.ErrorMessage) ? payload.ErrorMessage.join(' ') : payload.ErrorMessage;
      reportUserError();
      return NextResponse.json({ error: message || 'OCR.space n’a pas pu analyser ce fichier.' }, { status: 502 });
    }

    const results = payload.ParsedResults ?? [];
    const words = results.flatMap((result) =>
      (result.TextOverlay?.Lines ?? []).flatMap((line) =>
        (line.Words ?? []).map((word) => ({
          text: normalizeOcrText(word.WordText ?? ''),
          bbox: {
            x0: Number(word.Left ?? 0),
            y0: Number(word.Top ?? 0),
            x1: Number(word.Left ?? 0) + Number(word.Width ?? 0),
            y1: Number(word.Top ?? 0) + Number(word.Height ?? 0),
          },
        })),
      ),
    ).filter((word) => word.text);
    const lines = mergeOcrLineFragments(results.flatMap((result) =>
      (result.TextOverlay?.Lines ?? []).map((line) => {
        const lineWords = (line.Words ?? []).map((word) => ({
          text: normalizeOcrText(word.WordText ?? ''),
          x0: Number(word.Left ?? 0),
          y0: Number(word.Top ?? 0),
          x1: Number(word.Left ?? 0) + Number(word.Width ?? 0),
          y1: Number(word.Top ?? 0) + Number(word.Height ?? 0),
        })).filter((word) => word.text);
        return {
          text: normalizeOcrText(line.LineText ?? '') || lineWords.map((word) => word.text).join(' '),
          bbox: lineWords.length > 0 ? {
            x0: Math.min(...lineWords.map((word) => word.x0)),
            y0: Math.min(...lineWords.map((word) => word.y0)),
            x1: Math.max(...lineWords.map((word) => word.x1)),
            y1: Math.max(...lineWords.map((word) => word.y1)),
          } : { x0: 0, y0: 0, x1: 0, y1: 0 },
        };
      }).filter((line) => line.text),
    ));

    return NextResponse.json({
      text: results.map((result) => normalizeOcrText(result.ParsedText ?? '')).join('\n'),
      words,
      lines,
    });
  } catch (error) {
    reportUserError();
    return NextResponse.json({ error: 'Erreur pendant l’analyse OCR.' }, { status: 500 });
  }
}
