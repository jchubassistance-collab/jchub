import type { jsPDF } from 'jspdf';
import type { Locale } from '../i18n/routing';
import type { Resource } from './resources';

/**
 * PDF of a free resource, drawn in the visitor's browser from the content shown on its page:
 * no file to keep in sync and no server time. jsPDF's built-in fonts only know the Windows-1252
 * characters, so the few others are swapped for an equivalent.
 */

const REPLACEMENTS: [RegExp, string][] = [[/[  ]/g, ' '], [/→/g, '->'], [/≥/g, '>='], [/≤/g, '<=']];

// Windows-1252 characters beyond Latin-1.
const CP1252_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');

export function isPdfDrawable(character: string): boolean {
  const code = character.codePointAt(0) ?? 0;
  return (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || CP1252_EXTRA.has(character);
}

/** The text with only drawable characters: known swaps, then the letter without its accent, then "?". */
export function pdfText(text: string): string {
  const swapped = REPLACEMENTS.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text);
  return Array.from(swapped, (character) => {
    if (isPdfDrawable(character)) return character;
    const base = character.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return base && Array.from(base).every(isPdfDrawable) ? base : '?';
  }).join('');
}

const PAGE = { width: 210, height: 297, margin: 16 };
const BLUE: [number, number, number] = [29, 78, 216];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [71, 85, 105];
const LIGHT: [number, number, number] = [239, 246, 255];
const PT = 0.3528;

function lineHeight(size: number) {
  return size * PT * 1.3;
}

export function paintResourcePdf(JsPdf: typeof jsPDF, resource: Resource, locale: Locale): jsPDF {
  const text = resource[locale];
  const doc = new JsPdf({ unit: 'mm', format: 'a4' });
  doc.setProperties({ title: text.title, author: 'JcHub', creator: 'JcHub' });
  const contentWidth = PAGE.width - PAGE.margin * 2;
  const checklist = resource.kind === 'checklist';
  const termWidth = resource.code ? 82 : 58;
  const gap = 5;
  const textX = PAGE.margin + termWidth + gap;
  const textWidth = contentWidth - termWidth - gap;
  const bottom = PAGE.height - PAGE.margin - 6;
  let y = PAGE.margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BLUE);
  doc.text('JcHub', PAGE.margin, y + 3);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(`jchub.dev/${locale}`, PAGE.width - PAGE.margin, y + 3, { align: 'right' });
  y += 13;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...INK);
  doc.text(pdfText(text.title), PAGE.margin, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const summary = doc.splitTextToSize(pdfText(text.summary), contentWidth) as string[];
  doc.text(summary, PAGE.margin, y);
  y += summary.length * lineHeight(10) + 5;

  const newPage = () => {
    doc.addPage();
    y = PAGE.margin;
  };

  for (const section of text.sections ?? []) {
    if (y + 20 > bottom) newPage();
    doc.setFillColor(...LIGHT);
    doc.roundedRect(PAGE.margin, y, contentWidth, 8, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...BLUE);
    doc.text(pdfText(section.title), PAGE.margin + 3, y + 5.4);
    y += 12.5;

    for (const row of section.rows) {
      const termX = PAGE.margin + (checklist ? 6 : 0);
      const termSize = resource.code ? 8.5 : 9;
      doc.setFont(resource.code ? 'courier' : 'helvetica', 'bold');
      doc.setFontSize(termSize);
      const termLines = doc.splitTextToSize(pdfText(row.term), termWidth - (checklist ? 6 : 0)) as string[];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const textLines = doc.splitTextToSize(pdfText(row.text), textWidth) as string[];
      const height = Math.max(termLines.length * lineHeight(termSize), textLines.length * lineHeight(9)) + 2.6;
      if (y + height > bottom) newPage();

      if (checklist) {
        doc.setDrawColor(...BLUE);
        doc.setLineWidth(0.35);
        doc.rect(PAGE.margin, y - 2.6, 3.4, 3.4);
      }
      doc.setFont(resource.code ? 'courier' : 'helvetica', 'bold');
      doc.setFontSize(termSize);
      doc.setTextColor(...INK);
      doc.text(termLines, termX, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text(textLines, textX, y);
      y += height;
      doc.setDrawColor(219, 234, 254);
      doc.setLineWidth(0.2);
      doc.line(PAGE.margin, y - 2, PAGE.width - PAGE.margin, y - 2);
      y += 1.2;
    }
    y += 3;
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`${pdfText(text.title)} · JcHub`, PAGE.margin, PAGE.height - 9);
    doc.text(`${page} / ${pages}`, PAGE.width - PAGE.margin, PAGE.height - 9, { align: 'right' });
  }
  return doc;
}
