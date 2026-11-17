/**
 * Payment receipt (Mobile Money, cash, transfer): the data typed in the form and its layout on
 * an A4 page. The amount is repeated in words, as is customary on receipts in French-speaking Africa.
 */
import { A4, Column, PagedDocument, pdfText, type Measure, type Page, type TextStyle } from '@/lib/document-painter';
import { amountInWords } from '@/lib/amount-words';
import { formatDate, formatMoney, isoDate } from '@/lib/invoice';

export const PAYMENT_METHODS = ['MTN MoMo', 'Airtel Money', 'Orange Money', 'Moov Money', 'Wave', 'M-Pesa', 'cash', 'transfer', 'check', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type ReceiptData = {
  number: string;
  /** yyyy-mm-dd */
  date: string;
  place: string;
  business: { name: string; address: string; phone: string; registry: string };
  payer: { name: string; phone: string };
  amount: string;
  currency: string;
  reason: string;
  method: PaymentMethod;
  /** Transaction ID of the Mobile Money operator or of the bank. */
  reference: string;
  /** Amount still due after this payment, or '' when settled or not tracked. */
  balance: string;
  accent: string;
  logo: string;
  logoRatio: number;
};

export type ReceiptLabels = {
  title: string; number: string; date: string; place: string; received: string; payer: string; phone: string;
  sum: string; amountBox: string; reason: string; method: string; methodName: (method: PaymentMethod) => string; reference: string;
  balance: string; settled: string; signature: string; registry: string;
};

export function emptyReceipt(today = new Date()): ReceiptData {
  return {
    number: `R-${today.getFullYear()}-001`, date: isoDate(today), place: '',
    business: { name: '', address: '', phone: '', registry: '' },
    payer: { name: '', phone: '' },
    amount: '', currency: 'XAF', reason: '', method: 'MTN MoMo', reference: '', balance: '',
    accent: '#0f766e', logo: '', logoRatio: 1,
  };
}

/** A saved draft completed with any field added since it was saved. */
export function completeReceipt(draft: Partial<ReceiptData>, today = new Date()): ReceiptData {
  const base = emptyReceipt(today);
  return {
    ...base, ...draft,
    business: { ...base.business, ...draft.business },
    payer: { ...base.payer, ...draft.payer },
    method: PAYMENT_METHODS.includes(draft.method as PaymentMethod) ? draft.method as PaymentMethod : base.method,
  };
}

const DARK = '#0f172a';
const BODY = '#334155';
const MUTED = '#64748b';

/** One receipt at the top of an A4 page, framed, to print or send as PDF. */
export function layoutReceipt(data: ReceiptData, labels: ReceiptLabels, locale: string, amount: number, balance: number | null, measure: Measure): Page[] {
  const document = new PagedDocument();
  const left = 18;
  const width = A4.width - 2 * left;
  const right = left + width;
  const top = 18;
  const column = new Column(document, measure, left + 6, width - 12, top + 6, A4.height - 18);
  const colon = locale === 'en' ? ':' : ' :';
  const small: TextStyle = { size: 9, color: BODY, lineHeight: 1.45 };
  const money = (value: number) => formatMoney(value, data.currency, locale);

  // Business on the left, title and number on the right.
  const business = new Column(document, measure, column.x, 95, column.y, column.bottom);
  if (data.logo) {
    const height = Math.min(16, 40 / Math.max(data.logoRatio, 0.01));
    business.add({ kind: 'image', x: business.x, y: business.y, width: height * data.logoRatio, height, src: data.logo });
    business.gap(height + 3);
  }
  business.text(data.business.name, { size: 12, bold: true, color: DARK });
  business.text(data.business.address, small);
  business.text(data.business.phone, small);
  if (data.business.registry.trim()) business.text(`${labels.registry} ${data.business.registry.trim()}`, small);

  const heading = new Column(document, measure, right - 6 - 70, 70, column.y, column.bottom);
  heading.text(labels.title.toUpperCase(), { size: 18, bold: true, color: data.accent, align: 'right', lineHeight: 1.2 });
  heading.text(`${labels.number} ${data.number}`, { size: 10, bold: true, color: DARK, align: 'right' });
  const dateLine = [data.place.trim(), formatDate(data.date, locale)].filter(Boolean).join(locale === 'en' ? ', ' : ', le ');
  heading.text(`${labels.date}${colon} ${dateLine}`, { ...small, align: 'right' });
  column.y = Math.max(business.y, heading.y) + 7;

  // The amount, framed, then the sentence of the receipt.
  const boxHeight = 13;
  column.add({ kind: 'rect', x: column.x, y: column.y, width: column.width, height: boxHeight, color: '#f1f5f9' });
  column.add({ kind: 'rect', x: column.x, y: column.y, width: 1.6, height: boxHeight, color: data.accent });
  column.add({ kind: 'text', x: column.x + 6, y: column.y + 8.3, text: pdfText(labels.amountBox), size: 10, bold: true, color: MUTED });
  column.add({ kind: 'text', x: column.x + column.width - 5, y: column.y + 8.6, text: pdfText(money(amount)), size: 15, bold: true, color: DARK, align: 'right' });
  column.y += boxHeight + 6;

  const label: TextStyle = { size: 8, bold: true, color: MUTED, lineHeight: 1.5 };
  const value: TextStyle = { size: 10.5, color: DARK, lineHeight: 1.45 };
  const row = (title: string, text: string) => {
    if (!text.trim()) return;
    column.text(title.toUpperCase(), label);
    column.text(text, value);
    column.gap(2.5);
  };
  row(labels.received, [data.payer.name.trim(), data.payer.phone.trim() ? `(${labels.phone} ${data.payer.phone.trim()})` : ''].filter(Boolean).join(' '));
  row(labels.sum, amount > 0 ? `${amountInWords(amount, data.currency, locale)} (${money(amount)})` : '');
  row(labels.reason, data.reason);
  row(labels.method, [labels.methodName(data.method), data.reference.trim() ? `${labels.reference} ${data.reference.trim()}` : ''].filter(Boolean).join(' · '));
  if (balance !== null) row(labels.balance, balance > 0 ? money(balance) : labels.settled);

  // Signature box on the right, then the frame around the whole receipt.
  column.gap(4);
  const signatureX = column.x + column.width - 70;
  column.add({ kind: 'text', x: signatureX, y: column.y + 3, text: pdfText(labels.signature), size: 8.5, bold: true, color: MUTED });
  column.add({ kind: 'line', x1: signatureX, y1: column.y + 24, x2: column.x + column.width, y2: column.y + 24, color: '#cbd5e1', width: 0.3 });
  column.y += 30;
  const frame = { x1: left, y1: top, x2: right, y2: column.y };
  for (const [x1, y1, x2, y2] of [[frame.x1, frame.y1, frame.x2, frame.y1], [frame.x2, frame.y1, frame.x2, frame.y2], [frame.x2, frame.y2, frame.x1, frame.y2], [frame.x1, frame.y2, frame.x1, frame.y1]]) {
    column.add({ kind: 'line', x1, y1, x2, y2, color: data.accent, width: 0.5 });
  }
  // A dashed cut line under the receipt, to keep a stub on the same sheet if needed.
  const cutY = column.y + 8;
  for (let x = left; x < right; x += 4) column.add({ kind: 'line', x1: x, y1: cutY, x2: Math.min(x + 2, right), y2: cutY, color: '#cbd5e1', width: 0.2 });
  return document.pages;
}
