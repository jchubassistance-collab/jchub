/**
 * Formatting of the Control Center exports (Rapports): CSV for Excel in French, and the text
 * the standard PDF fonts can draw. Pure functions, checked by tests/insights-batch3.test.js.
 */

export type CsvColumn<T> = { label: string; value: (row: T) => string | number | null | undefined };

/**
 * CSV that Excel opens correctly in French: semicolons (the comma is the decimal separator),
 * decimal commas, a byte order mark so accents survive, and quotes around every text that needs it.
 */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const cell = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return Number.isFinite(value) ? String(value).replace('.', ',') : '';
    // A leading = + - @ would be run as a formula by Excel: kept as text.
    const text = /^[=+\-@]/.test(value) ? `'${value}` : value;
    return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [columns.map((column) => cell(column.label)).join(';'), ...rows.map((row) => columns.map((column) => cell(column.value(row))).join(';'))];
  return `﻿${lines.join('\r\n')}\r\n`;
}

/** Characters the standard PDF fonts (WinAnsi) cannot draw, replaced by their closest form. */
const REPLACEMENTS: Record<string, string> = {
  '→': '->', '←': '<-', '↑': '^', '↓': 'v', '≤': '<=', '≥': '>=', '≈': '~',
  ' ': ' ', ' ': ' ', ' ': ' ', '−': '-', '‐': '-', '‑': '-', 'ᵉ': 'e', '✓': 'v', '✗': 'x',
};
const WIN_ANSI_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');

export function pdfText(value: string): string {
  return Array.from(value.normalize('NFC')).map((character) => {
    if (REPLACEMENTS[character] !== undefined) return REPLACEMENTS[character];
    const code = character.codePointAt(0) ?? 0;
    if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRA.has(character)) return character;
    // Accented letters outside Latin-1 lose their accent; anything else (emoji…) is dropped.
    const plain = character.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return plain !== character && /^[\x20-\x7e]$/.test(plain) ? plain : '';
  }).join('');
}

/** First and last millisecond of a month (YYYY-MM) in Brazzaville time (UTC+1). */
export function monthRange(month: string): { from: number; to: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const index = Number(match[2]) - 1;
  if (index < 0 || index > 11) return null;
  return { from: Date.UTC(year, index, 1) - 3600_000, to: Date.UTC(year, index + 1, 1) - 3600_000 };
}

/** The month before the one of `now`, as YYYY-MM (Brazzaville time). */
export function previousMonth(now = Date.now()): string {
  const local = new Date(now + 3600_000);
  const date = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() - 1, 1));
  return date.toISOString().slice(0, 7);
}

export function monthLabel(month: string): string {
  const range = monthRange(month);
  if (!range) return month;
  const label = new Date(range.from + 3600_000 + 86400_000).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Monday to Sunday from `monday` (YYYY-MM-DD), Brazzaville time; null when it is not a Monday. */
export function weekRange(monday: string): { from: number; to: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(monday)) return null;
  const start = Date.parse(`${monday}T00:00:00Z`);
  if (Number.isNaN(start) || new Date(start).getUTCDay() !== 1) return null;
  return { from: start - 3600_000, to: start + 7 * 86400_000 - 3600_000 };
}

/** Monday of the week before the one of `now` (Brazzaville time), as YYYY-MM-DD. */
export function previousWeekStart(now = Date.now()): string {
  const local = new Date(now + 3600_000);
  const day = local.getUTCDay() || 7;
  const monday = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - (day - 1) - 7);
  return new Date(monday).toISOString().slice(0, 10);
}

export function weekLabel(monday: string): string {
  const range = weekRange(monday);
  if (!range) return monday;
  const format = (time: number) => new Date(time + 3600_000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  return `Semaine du ${format(range.from)} au ${format(range.to - 1)}`;
}
