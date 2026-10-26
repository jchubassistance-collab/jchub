/** Layout of a resume on A4 pages, in two templates. */
import { A4, Column, PagedDocument, PT, pdfText, type Measure, type Page, type TextStyle } from '@/lib/document-painter';
import { listItems, period, type CvData, type CvEntry, type CvLabels } from '@/lib/cv';

const DARK = '#0f172a';
const BODY = '#334155';
const MUTED = '#64748b';
const WHITE = '#ffffff';

function heading(column: Column, label: string, color: string, rule: string): void {
  const style: TextStyle = { size: 10.5, bold: true, color };
  // Keep a heading with at least the first lines of its section.
  column.ensure(column.lineHeight(style) + 14);
  column.text(label.toUpperCase(), style);
  column.add({ kind: 'line', x1: column.x, y1: column.y + 0.4, x2: column.x + column.width, y2: column.y + 0.4, color: rule, width: 0.35 });
  column.gap(3.5);
}

function entries(column: Column, items: CvEntry[], accent: string): void {
  let first = true;
  for (const entry of items) {
    if (!entry.role.trim() && !entry.organization.trim()) continue;
    if (!first) column.gap(4);
    first = false;
    const titleStyle: TextStyle = { size: 10.5, bold: true, color: DARK };
    const dates = pdfText(period(entry));
    const datesWidth = dates ? column.measure(dates, 8.5) + 4 : 0;
    const titleLines = column.lines(entry.role || entry.organization, titleStyle, column.width - datesWidth);
    column.ensure(column.lineHeight(titleStyle) * titleLines.length + 10);
    if (dates) column.add({ kind: 'text', x: column.x + column.width, y: column.y + titleStyle.size * PT * 0.8, text: dates, size: 8.5, color: MUTED, align: 'right' });
    for (const line of titleLines) {
      column.add({ kind: 'text', x: column.x, y: column.y + titleStyle.size * PT * 0.8, text: line, size: titleStyle.size, bold: true, color: DARK });
      column.y += column.lineHeight(titleStyle);
    }
    const where = [entry.role ? entry.organization.trim() : '', entry.place.trim()].filter(Boolean).join(' · ');
    if (where) column.text(where, { size: 9.5, color: accent });
    if (entry.details.trim()) {
      column.gap(1);
      column.paragraphs(entry.details.trim(), { size: 9, color: BODY, lineHeight: 1.45 });
    }
  }
}

function hasEntries(items: CvEntry[]): boolean {
  return items.some((entry) => entry.role.trim() || entry.organization.trim());
}

function layoutModern(cv: CvData, labels: CvLabels, measure: Measure): Page[] {
  const sidebarWidth = 68;
  const document = new PagedDocument((page) => page.push({ kind: 'rect', x: 0, y: 0, width: sidebarWidth, height: A4.height, color: cv.accent }));
  const side = new Column(document, measure, 9, sidebarWidth - 18, 14, A4.height - 12);
  const main = new Column(document, measure, sidebarWidth + 10, A4.width - sidebarWidth - 24, 16, A4.height - 14);

  if (cv.photo) {
    side.add({ kind: 'image', x: (sidebarWidth - 38) / 2, y: side.y, width: 38, height: 38, src: cv.photo, circle: true });
    side.gap(46);
  }
  const sideItem: TextStyle = { size: 8.5, color: WHITE, lineHeight: 1.45 };
  const sideSection = (label: string, items: string[]) => {
    if (!items.length) return;
    heading(side, label, WHITE, WHITE);
    for (const item of items) {
      side.text(item, sideItem);
      side.gap(1.2);
    }
    side.gap(5);
  };
  sideSection(labels.contact, [cv.email, cv.phone, cv.location, cv.website].map((item) => item.trim()).filter(Boolean));
  sideSection(labels.skills, listItems(cv.skills));
  sideSection(labels.languages, listItems(cv.languages));
  sideSection(labels.interests, listItems(cv.interests));

  main.text(cv.fullName, { size: 22, bold: true, color: DARK, lineHeight: 1.15 });
  main.text(cv.title, { size: 12, color: cv.accent });
  main.gap(7);
  if (cv.summary.trim()) {
    heading(main, labels.profile, cv.accent, cv.accent);
    main.paragraphs(cv.summary.trim(), { size: 9.5, color: BODY, lineHeight: 1.45 });
    main.gap(6);
  }
  if (hasEntries(cv.experiences)) {
    heading(main, labels.experience, cv.accent, cv.accent);
    entries(main, cv.experiences, cv.accent);
    main.gap(6);
  }
  if (hasEntries(cv.education)) {
    heading(main, labels.education, cv.accent, cv.accent);
    entries(main, cv.education, cv.accent);
  }
  return document.pages;
}

function layoutClassic(cv: CvData, labels: CvLabels, measure: Measure): Page[] {
  const document = new PagedDocument();
  const column = new Column(document, measure, 18, A4.width - 36, 16, A4.height - 14);
  const photoSize = 28;
  // Without a photo the header takes the full width.
  const header = cv.photo ? new Column(document, measure, column.x, column.width - photoSize - 8, column.top, column.bottom) : column;
  if (cv.photo) column.add({ kind: 'image', x: column.x + column.width - photoSize, y: column.top, width: photoSize, height: photoSize, src: cv.photo, circle: true });

  header.text(cv.fullName, { size: 24, bold: true, color: DARK, lineHeight: 1.15 });
  header.text(cv.title, { size: 12, color: cv.accent });
  header.gap(1.5);
  header.text([cv.email, cv.phone, cv.location, cv.website].map((item) => item.trim()).filter(Boolean).join('   ·   '), { size: 9, color: MUTED, lineHeight: 1.45 });
  column.y = Math.max(header.y, cv.photo ? column.top + photoSize : column.top) + 3;
  column.add({ kind: 'line', x1: column.x, y1: column.y, x2: column.x + column.width, y2: column.y, color: cv.accent, width: 0.6 });
  column.gap(7);

  const section = (label: string, write: () => void) => {
    heading(column, label, cv.accent, '#cbd5e1');
    write();
    column.gap(5);
  };
  const body: TextStyle = { size: 9.5, color: BODY, lineHeight: 1.45 };
  if (cv.summary.trim()) section(labels.profile, () => column.paragraphs(cv.summary.trim(), body));
  if (hasEntries(cv.experiences)) section(labels.experience, () => entries(column, cv.experiences, cv.accent));
  if (hasEntries(cv.education)) section(labels.education, () => entries(column, cv.education, cv.accent));
  for (const [label, text] of [[labels.skills, cv.skills], [labels.languages, cv.languages], [labels.interests, cv.interests]] as const) {
    const items = listItems(text);
    if (items.length) section(label, () => column.text(items.join('   ·   '), body));
  }
  return document.pages;
}

export function layoutCv(cv: CvData, labels: CvLabels, measure: Measure): Page[] {
  return cv.template === 'classic' ? layoutClassic(cv, labels, measure) : layoutModern(cv, labels, measure);
}
