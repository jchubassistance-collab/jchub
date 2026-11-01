/**
 * Layout of the generated documents (resume, invoice): shapes on A4 pages, in millimetres. The
 * layout is computed once with jsPDF's Helvetica metrics, then drawn either into the PDF or onto
 * the preview canvas, so the preview wraps and breaks pages exactly like the downloaded file.
 */
import type { jsPDF } from 'jspdf';

export const A4 = { width: 210, height: 297 } as const;
/** One typographic point in millimetres. */
export const PT = 25.4 / 72;

export type Shape =
  | { kind: 'text'; x: number; y: number; text: string; size: number; bold?: boolean; color: string; align?: 'left' | 'right' | 'center' }
  | { kind: 'rect'; x: number; y: number; width: number; height: number; color: string }
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; color: string; width: number }
  | { kind: 'image'; x: number; y: number; width: number; height: number; src: string; circle?: boolean };

export type Page = Shape[];
/** Width in millimetres of a line of text at `size` points. */
export type Measure = (text: string, size: number, bold?: boolean) => number;

/** jsPDF's built-in fonts only know Windows-1252: the 27 characters it adds to Latin-1. */
const WIN_ANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
const LOOKALIKES: Record<string, string> = { Ł: 'L', ł: 'l', Đ: 'D', đ: 'd', ı: 'i', Ħ: 'H', ħ: 'h', '′': '\'', '″': '"', '−': '-', '‐': '-', '‑': '-' };

function isWinAnsi(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRA.includes(char);
}

/**
 * Text the PDF can show. The thin spaces Intl puts in French amounts become no-break spaces,
 * letters outside Windows-1252 lose their accent (ğ → g) or take a look-alike (ł → l).
 */
export function pdfText(text: string): string {
  return Array.from(text.replace(/[\u202f\u2007]/g, '\u00a0').replace(/[\t\u2009\u200a]/g, ' '), (char) => {
    if (isWinAnsi(char) || char === '\n') return char;
    if (LOOKALIKES[char]) return LOOKALIKES[char];
    const base = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return base && Array.from(base).every(isWinAnsi) ? base : '';
  }).join('');
}

/** Lines of `text` no wider than `width`; line breaks are kept and a word too long is cut. */
export function wrap(text: string, width: number, measure: (line: string) => number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let line = '';
    for (const word of paragraph.split(/ +/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) <= width) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      let rest = word;
      while (rest.length > 1 && measure(rest) > width) {
        let cut = rest.length - 1;
        while (cut > 1 && measure(rest.slice(0, cut)) > width) cut -= 1;
        lines.push(rest.slice(0, cut));
        rest = rest.slice(cut);
      }
      line = rest;
    }
    lines.push(line);
  }
  return lines;
}

/** Pages created on demand, each one decorated first (a sidebar background, for instance). */
export class PagedDocument {
  readonly pages: Page[] = [];
  private readonly decorate: (page: Page, index: number) => void;

  constructor(decorate: (page: Page, index: number) => void = () => undefined) {
    this.decorate = decorate;
  }

  page(index: number): Page {
    while (this.pages.length <= index) {
      const page: Page = [];
      this.decorate(page, this.pages.length);
      this.pages.push(page);
    }
    return this.pages[index];
  }
}

export type TextStyle = { size: number; bold?: boolean; color: string; lineHeight?: number; align?: 'left' | 'right' | 'center' };

/** A column of the page that fills from top to bottom and continues on the next page. */
export class Column {
  pageIndex = 0;
  y: number;
  readonly document: PagedDocument;
  readonly measure: Measure;
  readonly x: number;
  readonly width: number;
  readonly top: number;
  readonly bottom: number;

  constructor(document: PagedDocument, measure: Measure, x: number, width: number, top: number, bottom: number) {
    this.document = document;
    this.measure = measure;
    this.x = x;
    this.width = width;
    this.top = top;
    this.bottom = bottom;
    this.y = top;
    document.page(0);
  }

  add(shape: Shape): void {
    this.document.page(this.pageIndex).push(shape);
  }

  /** Moves to the next page when `height` millimetres no longer fit on this one. */
  ensure(height: number): void {
    if (this.y + height > this.bottom && this.y > this.top + 0.01) {
      this.pageIndex += 1;
      this.y = this.top;
      this.document.page(this.pageIndex);
    }
  }

  lineHeight(style: TextStyle): number {
    return style.size * PT * (style.lineHeight ?? 1.35);
  }

  lines(text: string, style: TextStyle, width = this.width): string[] {
    const clean = pdfText(text);
    return clean.trim() ? wrap(clean, width, (line) => this.measure(line, style.size, style.bold)) : [];
  }

  /** Writes wrapped text, line by line, from the current height; `indent` shifts it right. */
  text(text: string, style: TextStyle, indent = 0): void {
    const height = this.lineHeight(style);
    const x = style.align === 'right' ? this.x + this.width : style.align === 'center' ? this.x + this.width / 2 : this.x + indent;
    for (const line of this.lines(text, style, this.width - indent)) {
      this.ensure(height);
      this.add({ kind: 'text', x, y: this.y + style.size * PT * 0.8, text: line, size: style.size, bold: style.bold, color: style.color, align: style.align });
      this.y += height;
    }
  }

  /** Lines starting with "-", "*" or "•" become bullets with a hanging indent. */
  paragraphs(text: string, style: TextStyle): void {
    for (const raw of text.split(/\r?\n/)) {
      const bullet = raw.match(/^\s*[-*•]\s+(.*)$/);
      if (!bullet) {
        this.text(raw, style);
        continue;
      }
      const height = this.lineHeight(style);
      this.ensure(height);
      this.add({ kind: 'text', x: this.x + 1, y: this.y + style.size * PT * 0.8, text: '•', size: style.size, color: style.color });
      this.text(bullet[1], style, 4);
    }
  }

  gap(height: number): void {
    this.y += height;
  }
}

function imageFormat(src: string): 'PNG' | 'JPEG' {
  return src.startsWith('data:image/png') ? 'PNG' : 'JPEG';
}

/** Draws the pages into a new A4 jsPDF document. */
export function drawPdf(JsPdf: typeof jsPDF, pages: Page[]): jsPDF {
  const doc = new JsPdf({ unit: 'mm', format: 'a4', compress: true });
  pages.forEach((page, index) => {
    if (index > 0) doc.addPage('a4', 'portrait');
    for (const shape of page) {
      if (shape.kind === 'text') {
        doc.setFont('helvetica', shape.bold ? 'bold' : 'normal');
        doc.setFontSize(shape.size);
        doc.setTextColor(shape.color);
        doc.text(shape.text, shape.x, shape.y, { align: shape.align ?? 'left' });
      } else if (shape.kind === 'rect') {
        doc.setFillColor(shape.color);
        doc.rect(shape.x, shape.y, shape.width, shape.height, 'F');
      } else if (shape.kind === 'line') {
        doc.setDrawColor(shape.color);
        doc.setLineWidth(shape.width);
        doc.line(shape.x1, shape.y1, shape.x2, shape.y2);
      } else {
        doc.saveGraphicsState();
        if (shape.circle) {
          doc.circle(shape.x + shape.width / 2, shape.y + shape.height / 2, Math.min(shape.width, shape.height) / 2, null);
          doc.clip();
          doc.discardPath();
        }
        doc.addImage(shape.src, imageFormat(shape.src), shape.x, shape.y, shape.width, shape.height, undefined, 'FAST');
        doc.restoreGraphicsState();
      }
    }
  });
  return doc;
}

/** Draws one page on a canvas, `scale` pixels per millimetre; images not loaded yet are skipped. */
export function drawCanvas(context: CanvasRenderingContext2D, page: Page, scale: number, images: Map<string, HTMLImageElement>): void {
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, A4.width * scale, A4.height * scale);
  for (const shape of page) {
    if (shape.kind === 'text') {
      // Arial shares Helvetica's metrics, which the layout was measured with.
      context.font = `${shape.bold ? 700 : 400} ${shape.size * PT * scale}px Helvetica, Arial, sans-serif`;
      context.fillStyle = shape.color;
      context.textAlign = shape.align ?? 'left';
      context.textBaseline = 'alphabetic';
      context.fillText(shape.text, shape.x * scale, shape.y * scale);
    } else if (shape.kind === 'rect') {
      context.fillStyle = shape.color;
      context.fillRect(shape.x * scale, shape.y * scale, shape.width * scale, shape.height * scale);
    } else if (shape.kind === 'line') {
      context.strokeStyle = shape.color;
      context.lineWidth = Math.max(1, shape.width * scale);
      context.beginPath();
      context.moveTo(shape.x1 * scale, shape.y1 * scale);
      context.lineTo(shape.x2 * scale, shape.y2 * scale);
      context.stroke();
    } else {
      const image = images.get(shape.src);
      if (!image?.complete || !image.naturalWidth) continue;
      context.save();
      if (shape.circle) {
        context.beginPath();
        context.arc((shape.x + shape.width / 2) * scale, (shape.y + shape.height / 2) * scale, (Math.min(shape.width, shape.height) / 2) * scale, 0, Math.PI * 2);
        context.clip();
      }
      context.drawImage(image, shape.x * scale, shape.y * scale, shape.width * scale, shape.height * scale);
      context.restore();
    }
  }
}

/** Measures with jsPDF's Helvetica, the font the PDF is written in. */
export function jsPdfMeasure(doc: jsPDF): Measure {
  return (text, size, bold) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    return doc.getTextWidth(text);
  };
}
