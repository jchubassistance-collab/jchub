import { createCanvas, DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas';
import { Packer, Document, ImageRun, Paragraph, TextRun } from 'docx';
import { access } from 'node:fs/promises';
import { join, sep } from 'node:path';

export type PdfTextRun = {
  text: string;
  x: number;
  width: number;
  fontSize: number;
  bold: boolean;
  italics: boolean;
  font: string;
};

export type PdfTextLine = {
  runs: PdfTextRun[];
  x: number;
  y: number;
  width: number;
};

export type PdfTextPage = {
  lines: PdfTextLine[];
  width: number;
  height: number;
};

export function joinPdfRuns(runs: PdfTextRun[]): string {
  return runs.reduce((text, run, index) => {
    if (index === 0) return run.text.trimStart();
    const previous = runs[index - 1];
    const gap = run.x - (previous.x + previous.width);
    const startsWithPunctuation = /^[,.;:!?%)\]}]/.test(run.text);
    const left = text.trimEnd();
    const right = run.text.trimStart();
    const hasExplicitSpace = left.length < text.length || right.length < run.text.length;
    const needsSpace = !startsWithPunctuation && (hasExplicitSpace || gap > Math.max(0.35, run.fontSize * 0.03));
    return `${left}${needsSpace ? ' ' : ''}${right}`;
  }, '');
}

function installCanvasGlobals() {
  const runtime = globalThis as Record<string, unknown>;

  runtime.DOMMatrix ??= DOMMatrix;
  runtime.ImageData ??= ImageData;
  runtime.Path2D ??= Path2D;
}

async function getStandardFontDataUrl(): Promise<string | undefined> {
  const candidates = [
    join(process.cwd(), 'node_modules', 'pdfjs-dist', 'standard_fonts'),
    '/var/task/node_modules/pdfjs-dist/standard_fonts',
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return `${candidate.split(sep).join('/')}/`;
    } catch {
      continue;
    }
  }

  return undefined;
}

export async function extractPdfLayout(buffer: Buffer): Promise<PdfTextPage[]> {
  installCanvasGlobals();
  const [{ getDocument }, { WorkerMessageHandler }] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.mjs'),
  ]);

  if (!(globalThis as typeof globalThis & { pdfjsWorker?: unknown }).pdfjsWorker) {
    (globalThis as typeof globalThis & { pdfjsWorker?: unknown }).pdfjsWorker = {
      WorkerMessageHandler,
    };
  }

  const standardFontDataUrl = await getStandardFontDataUrl();
  const pdf = await getDocument({
    data: new Uint8Array(buffer),
    ...(standardFontDataUrl ? { standardFontDataUrl } : {}),
    useWorkerFetch: false,
  }).promise;
  const pages: PdfTextPage[] = [];

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    const lines = new Map<number, Array<{ x: number; width: number; run: PdfTextRun }>>();

    for (const item of content.items as any[]) {
      if (!('str' in item) || !item.str.trim()) {
        continue;
      }

      const x = Number(item.transform?.[4] || 0);
      const y = Number(item.transform?.[5] || 0);
      const lineKey = Math.round(y / 3) * 3;
      const line = lines.get(lineKey) || [];
      const fontName = String(item.fontName || '').toLowerCase();
      const transformScale = Math.sqrt(
        Number(item.transform?.[0] || 0) ** 2 + Number(item.transform?.[1] || 0) ** 2,
      );
      const font = fontName.includes('times')
        ? 'Times New Roman'
        : fontName.includes('arial') || fontName.includes('helvetica')
          ? 'Arial'
          : fontName.includes('courier')
            ? 'Courier New'
            : 'Calibri';

      line.push({
        x,
        width: Number(item.width || 0),
        run: {
          text: item.str.replace(/\s+/g, ' '),
          x,
          width: Number(item.width || 0),
          fontSize: Math.min(72, Math.max(6, Math.round(transformScale))),
          bold: fontName.includes('bold') || fontName.includes('black'),
          italics: fontName.includes('italic') || fontName.includes('oblique'),
          font,
        },
      });
      lines.set(lineKey, line);
    }

    pages.push({
      lines: Array.from(lines.entries())
      .sort(([firstY], [secondY]) => secondY - firstY)
      .map(([lineY, line]) => {
        const sortedLine = line.sort((first, second) => first.x - second.x);
        const firstItem = sortedLine[0];
        const lastItem = sortedLine[sortedLine.length - 1];

        return {
          runs: sortedLine.map((item) => item.run),
          x: firstItem.x,
          y: lineY,
          width: lastItem.x + lastItem.width - firstItem.x,
        };
      })
      .filter((line) => line.runs.length > 0),
      width: viewport.width,
      height: viewport.height,
    });
  }

  return pages;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pages = await extractPdfLayout(buffer);

  return pages
    .map((page) => page.lines.map((line) => joinPdfRuns(line.runs)).join('\n'))
    .join('\f');
}

export async function buildWordDocumentFromText(text: string): Promise<Buffer> {
  const pageTexts = (text || 'Aucun texte détecté dans le PDF.').split('\f');
  const children = pageTexts.flatMap((pageText, pageIndex) => {
    const paragraphs = pageText.split('\n');

    return paragraphs.map((paragraphText, paragraphIndex) => new Paragraph({
      pageBreakBefore: pageIndex > 0 && paragraphIndex === 0,
      children: [new TextRun({
        text: paragraphText || ' ',
        size: 24,
        font: 'Calibri',
      })],
    }));
  });

  const document = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  const buffer = Buffer.from(await Packer.toBuffer(document));
  return buffer;
}

export async function buildWordDocumentFromPdf(buffer: Buffer): Promise<Buffer> {
  const pages = await extractPdfLayout(buffer);
  const children = pages.flatMap((page, pageIndex) => page.lines.map((line, lineIndex) => {
    const previousLine = page.lines[lineIndex - 1];
    const verticalGap = previousLine ? Math.max(0, previousLine.y - line.y - line.runs[0].fontSize) : 0;
    const lineCenter = line.x + line.width / 2;
    const pageCenter = page.width / 2;
    const alignment = Math.abs(lineCenter - pageCenter) < page.width * 0.08 ? 'center' : undefined;
    const largestFontSize = Math.max(...line.runs.map((run) => run.fontSize));
    const isHeading = largestFontSize >= 18 || line.runs.some((run) => run.bold && run.fontSize >= 14);

    return new Paragraph({
      pageBreakBefore: pageIndex > 0 && lineIndex === 0,
      keepNext: isHeading,
      alignment,
      indent: alignment ? undefined : { left: Math.round(line.x * 20) },
      spacing: {
        before: Math.round(verticalGap * 20),
        after: isHeading ? 80 : 0,
        line: 240,
      },
      children: line.runs.map((run) => new TextRun({
        text: `${run.text} `,
        size: Math.round(run.fontSize * 2),
        bold: run.bold,
        italics: run.italics,
        font: run.font,
      })),
    });
  }));

  const document = new Document({
    sections: [{
      properties: {
        page: {
          size: pages[0]
            ? { width: Math.round(pages[0].width * 20), height: Math.round(pages[0].height * 20) }
            : undefined,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      },
      children: children.length > 0 ? children : [new Paragraph('Aucun texte détecté dans le PDF.')],
    }],
  });

  return Buffer.from(await Packer.toBuffer(document));
}

export async function buildVisuallyFaithfulWordDocument(buffer: Buffer): Promise<Buffer> {
  installCanvasGlobals();
  const [{ getDocument }, { WorkerMessageHandler }] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.mjs'),
  ]);

  if (!(globalThis as typeof globalThis & { pdfjsWorker?: unknown }).pdfjsWorker) {
    (globalThis as typeof globalThis & { pdfjsWorker?: unknown }).pdfjsWorker = {
      WorkerMessageHandler,
    };
  }

  const standardFontDataUrl = await getStandardFontDataUrl();
  const pdf = await getDocument({
    data: new Uint8Array(buffer),
    ...(standardFontDataUrl ? { standardFontDataUrl } : {}),
    useWorkerFetch: false,
  }).promise;
  const scale = 1.5;
  const sections = [];

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext('2d');

    await page.render({
      canvasContext: context as any,
      canvas: canvas as any,
      viewport,
    }).promise;

    const image = canvas.toBuffer('image/png');
    const pageWidth = Math.round((viewport.width / scale) * 20);
    const pageHeight = Math.round((viewport.height / scale) * 20);

    sections.push({
      properties: {
        page: {
          size: { width: pageWidth, height: pageHeight },
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      },
      children: [new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [new ImageRun({
          data: image,
          transformation: {
            width: Math.ceil(viewport.width),
            height: Math.ceil(viewport.height),
          },
          type: 'png',
        })],
      })],
    });
  }

  const document = new Document({
    sections: sections.length > 0 ? sections : [{
      children: [new Paragraph('Aucune page détectée dans le PDF.')],
    }],
  });

  return Buffer.from(await Packer.toBuffer(document));
}
