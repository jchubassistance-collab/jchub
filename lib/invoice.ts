/** Invoice and quote generator: the data typed in the form, amounts and totals. Layout: invoice-layout.ts. */

export type InvoiceParty = { name: string; address: string; email: string; phone: string; taxId: string };
export type InvoiceItem = { description: string; quantity: string; unitPrice: string; vatRate: string };

export type InvoiceData = {
  kind: 'invoice' | 'quote';
  number: string;
  /** yyyy-mm-dd, as given by a date input. */
  issueDate: string;
  dueDate: string;
  currency: string;
  vat: boolean;
  seller: InvoiceParty;
  client: InvoiceParty;
  items: InvoiceItem[];
  terms: string;
  payment: string;
  accent: string;
  /** Data URL, or '' without a logo; the ratio is its width over its height. */
  logo: string;
  logoRatio: number;
};

export type InvoiceLabels = {
  invoice: string; quote: string; number: string; date: string; due: string; validUntil: string;
  billedTo: string; quoteFor: string; taxId: string; description: string; quantity: string;
  unitPrice: string; vat: string; amount: string; subtotal: string; vatRate: (rate: string) => string;
  total: string; terms: string; payment: string;
};

export const CURRENCIES = ['EUR', 'XAF', 'XOF', 'USD', 'CAD', 'CHF', 'GBP', 'MAD', 'CDF'] as const;
export const INVOICE_ACCENTS = ['#1d4ed8', '#0f766e', '#6d28d9', '#9f1239', '#c2410c', '#1e293b'] as const;

const EMPTY_PARTY: InvoiceParty = { name: '', address: '', email: '', phone: '', taxId: '' };
export const EMPTY_ITEM: InvoiceItem = { description: '', quantity: '1', unitPrice: '', vatRate: '20' };

/** A date input value `days` after `from`. */
export function isoDate(from: Date, days = 0): string {
  const date = new Date(from.getTime() + days * 86_400_000);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function emptyInvoice(today = new Date()): InvoiceData {
  return {
    kind: 'invoice', number: `${today.getFullYear()}-001`, issueDate: isoDate(today), dueDate: isoDate(today, 30),
    currency: 'EUR', vat: true, seller: { ...EMPTY_PARTY }, client: { ...EMPTY_PARTY }, items: [{ ...EMPTY_ITEM }],
    terms: '', payment: '', accent: INVOICE_ACCENTS[0], logo: '', logoRatio: 1,
  };
}

/**
 * A typed amount. In English a comma groups thousands (1,200 is twelve hundred); in French it is
 * the decimal mark (1,5), and when both marks appear the last one is the decimal (1.234,50).
 */
export function parseAmount(text: string, locale = 'fr'): number {
  let value = text.replace(/[\s\u00a0\u202f']/g, '');
  if (locale === 'en') {
    value = value.replace(/,/g, '');
  } else if (value.includes(',') && value.includes('.')) {
    value = value.lastIndexOf(',') > value.lastIndexOf('.') ? value.replace(/\./g, '').replace(',', '.') : value.replace(/,/g, '');
  } else {
    value = value.replace(',', '.');
  }
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

/** Decimals of the currency: none for the CFA francs, two for the euro. */
export function currencyDecimals(currency: string): number {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Each line rounded to the currency, then the tax computed once per rate on the sum of its lines. */
export function computeTotals(data: Pick<InvoiceData, 'items' | 'currency' | 'vat'>, locale = 'fr') {
  const decimals = currencyDecimals(data.currency);
  const lines = data.items.map((item) => {
    const quantity = parseAmount(item.quantity, locale);
    const unitPrice = parseAmount(item.unitPrice, locale);
    return { quantity, unitPrice, rate: data.vat ? parseAmount(item.vatRate, locale) : 0, amount: round(quantity * unitPrice, decimals) };
  });
  const subtotal = round(lines.reduce((sum, line) => sum + line.amount, 0), decimals);
  const bases = new Map<number, number>();
  for (const line of lines) if (line.rate > 0) bases.set(line.rate, (bases.get(line.rate) ?? 0) + line.amount);
  const taxes = Array.from(bases, ([rate, base]) => ({ rate, amount: round((base * rate) / 100, decimals) })).sort((a, b) => a.rate - b.rate);
  const total = round(subtotal + taxes.reduce((sum, tax) => sum + tax.amount, 0), decimals);
  return { decimals, lines, subtotal, taxes, total };
}

const intlLocale = (locale: string) => (locale === 'en' ? 'en-US' : 'fr-FR');

export function formatMoney(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(intlLocale(locale), { style: 'currency', currency }).format(amount);
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 3 }).format(value);
}

export function formatDate(iso: string, locale: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  return new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
}
