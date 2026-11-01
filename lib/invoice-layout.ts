/** Layout of an invoice or a quote on A4 pages. */
import { A4, Column, PagedDocument, PT, pdfText, type Measure, type Page, type TextStyle } from '@/lib/document-painter';
import { computeTotals, formatDate, formatMoney, formatNumber, type InvoiceData, type InvoiceLabels } from '@/lib/invoice';

const DARK = '#0f172a';
const BODY = '#334155';
const MUTED = '#64748b';
const ZEBRA = '#f8fafc';
const PANEL = '#f1f5f9';

export function layoutInvoice(data: InvoiceData, labels: InvoiceLabels, locale: string, measure: Measure): Page[] {
  const document = new PagedDocument();
  const left = 16;
  const width = A4.width - 2 * left;
  const right = left + width;
  const column = new Column(document, measure, left, width, 16, A4.height - 16);
  const totals = computeTotals(data, locale);
  const money = (amount: number) => pdfText(formatMoney(amount, data.currency, locale));
  const baseline = (style: TextStyle) => column.y + style.size * PT * 0.8;

  // Seller on the left, title and dates on the right.
  const seller = new Column(document, measure, left, 100, column.top, column.bottom);
  if (data.logo) {
    const height = Math.min(20, 45 / Math.max(data.logoRatio, 0.01));
    seller.add({ kind: 'image', x: left, y: seller.y, width: height * data.logoRatio, height, src: data.logo });
    seller.gap(height + 4);
  }
  seller.text(data.seller.name, { size: 13, bold: true, color: DARK });
  seller.gap(1);
  const small: TextStyle = { size: 9, color: BODY, lineHeight: 1.45 };
  seller.text(data.seller.address, small);
  seller.text([data.seller.email, data.seller.phone].map((item) => item.trim()).filter(Boolean).join('  ·  '), small);
  if (data.seller.taxId.trim()) seller.text(`${labels.taxId} ${data.seller.taxId.trim()}`, small);

  const heading = new Column(document, measure, right - 80, 80, column.top, column.bottom);
  heading.text((data.kind === 'quote' ? labels.quote : labels.invoice).toUpperCase(), { size: 22, bold: true, color: data.accent, align: 'right', lineHeight: 1.2 });
  heading.text(`${labels.number} ${data.number}`, { size: 10.5, bold: true, color: DARK, align: 'right' });
  heading.gap(1);
  // French puts a no-break space before the colon.
  const colon = locale === 'en' ? ':' : '\u00a0:';
  const dateStyle: TextStyle = { size: 9, color: BODY, align: 'right', lineHeight: 1.45 };
  heading.text(`${labels.date}${colon} ${formatDate(data.issueDate, locale)}`, dateStyle);
  if (data.dueDate) heading.text(`${data.kind === 'quote' ? labels.validUntil : labels.due}${colon} ${formatDate(data.dueDate, locale)}`, dateStyle);
  column.y = Math.max(seller.y, heading.y) + 8;

  // Client in a panel on the right.
  const panelX = right - 88;
  const client = new Column(document, measure, panelX + 5, 78, column.y + 4, column.bottom);
  const clientLines: Array<[string, TextStyle]> = [
    [(data.kind === 'quote' ? labels.quoteFor : labels.billedTo).toUpperCase(), { size: 8, bold: true, color: data.accent, lineHeight: 1.6 }],
    [data.client.name, { size: 11, bold: true, color: DARK }],
    [data.client.address, small],
    [[data.client.email, data.client.phone].map((item) => item.trim()).filter(Boolean).join('  ·  '), small],
    [data.client.taxId.trim() ? `${labels.taxId} ${data.client.taxId.trim()}` : '', small],
  ];
  const panelHeight = clientLines.reduce((sum, [text, style]) => sum + client.lines(text, style).length * client.lineHeight(style), 0) + 8;
  column.add({ kind: 'rect', x: panelX, y: column.y, width: 88, height: panelHeight, color: PANEL });
  for (const [text, style] of clientLines) client.text(text, style);
  column.y += panelHeight + 9;

  // Item table, its header repeated on each page.
  const columns = data.vat
    ? { quantity: 16, unitPrice: 30, vat: 16, amount: 30 }
    : { quantity: 16, unitPrice: 30, vat: 0, amount: 34 };
  const descriptionWidth = width - columns.quantity - columns.unitPrice - columns.vat - columns.amount;
  const quantityRight = left + descriptionWidth + columns.quantity;
  const unitPriceRight = quantityRight + columns.unitPrice;
  const vatRight = unitPriceRight + columns.vat;
  const headerStyle: TextStyle = { size: 8.5, bold: true, color: '#ffffff' };
  const tableHeader = () => {
    column.add({ kind: 'rect', x: left, y: column.y, width, height: 8, color: data.accent });
    const y = column.y + 5.4;
    column.add({ kind: 'text', x: left + 3, y, text: pdfText(labels.description), ...headerStyle });
    column.add({ kind: 'text', x: quantityRight - 2, y, text: pdfText(labels.quantity), ...headerStyle, align: 'right' });
    column.add({ kind: 'text', x: unitPriceRight - 2, y, text: pdfText(labels.unitPrice), ...headerStyle, align: 'right' });
    if (data.vat) column.add({ kind: 'text', x: vatRight - 2, y, text: pdfText(labels.vat), ...headerStyle, align: 'right' });
    column.add({ kind: 'text', x: right - 3, y, text: pdfText(labels.amount), ...headerStyle, align: 'right' });
    column.y += 8;
  };
  tableHeader();
  const cell: TextStyle = { size: 9, color: BODY, lineHeight: 1.4 };
  let row = 0;
  data.items.forEach((item, index) => {
    const line = totals.lines[index];
    if (!item.description.trim() && !line.amount) return;
    const descriptionLines = column.lines(item.description, cell, descriptionWidth - 6);
    const height = Math.max(1, descriptionLines.length) * column.lineHeight(cell) + 3;
    const page = column.pageIndex;
    column.ensure(height);
    if (column.pageIndex !== page) tableHeader();
    if (row % 2 === 1) column.add({ kind: 'rect', x: left, y: column.y, width, height, color: ZEBRA });
    const top = column.y;
    column.y += 1.5;
    const y = baseline(cell);
    column.add({ kind: 'text', x: quantityRight - 2, y, text: pdfText(formatNumber(line.quantity, locale)), ...cell, align: 'right' });
    column.add({ kind: 'text', x: unitPriceRight - 2, y, text: money(line.unitPrice), ...cell, align: 'right' });
    if (data.vat) column.add({ kind: 'text', x: vatRight - 2, y, text: pdfText(`${formatNumber(line.rate, locale)}${locale === 'en' ? '%' : '\u00a0%'}`), ...cell, align: 'right' });
    column.add({ kind: 'text', x: right - 3, y, text: money(line.amount), ...cell, align: 'right', bold: true });
    descriptionLines.forEach((text, lineIndex) => {
      column.add({ kind: 'text', x: left + 3, y: y + lineIndex * column.lineHeight(cell), text, ...cell });
    });
    column.y = top + height;
    row += 1;
  });
  column.add({ kind: 'line', x1: left, y1: column.y, x2: right, y2: column.y, color: '#cbd5e1', width: 0.3 });
  column.gap(5);

  // Totals, aligned on the right of the table.
  const totalRows: Array<[string, string]> = data.vat
    ? [[labels.subtotal, money(totals.subtotal)], ...totals.taxes.map((tax): [string, string] => [labels.vatRate(formatNumber(tax.rate, locale)), money(tax.amount)])]
    : [];
  column.ensure(totalRows.length * 6.5 + 14);
  const totalsLeft = right - 82;
  for (const [label, value] of totalRows) {
    const y = baseline(small);
    column.add({ kind: 'text', x: totalsLeft + 3, y, text: pdfText(label), ...small });
    column.add({ kind: 'text', x: right - 3, y, text: value, ...small, align: 'right' });
    column.gap(6.5);
  }
  column.add({ kind: 'rect', x: totalsLeft, y: column.y, width: 82, height: 10, color: data.accent });
  column.add({ kind: 'text', x: totalsLeft + 3, y: column.y + 6.6, text: pdfText(labels.total), size: 10.5, bold: true, color: '#ffffff' });
  column.add({ kind: 'text', x: right - 3, y: column.y + 6.6, text: money(totals.total), size: 10.5, bold: true, color: '#ffffff', align: 'right' });
  column.gap(14);

  for (const [label, text] of [[labels.terms, data.terms], [labels.payment, data.payment]] as const) {
    if (!text.trim()) continue;
    column.ensure(14);
    column.text(label, { size: 9, bold: true, color: DARK, lineHeight: 1.5 });
    column.text(text.trim(), { size: 8.5, color: MUTED, lineHeight: 1.45 });
    column.gap(4);
  }
  return document.pages;
}
