import test from 'node:test';
import assert from 'node:assert/strict';
import { Column, PagedDocument, pdfText, wrap } from '../lib/document-painter.ts';
import { computeTotals, currencyDecimals, formatMoney, parseAmount } from '../lib/invoice.ts';
import { listItems, period } from '../lib/cv.ts';

test('le texte du PDF garde le français et remplace ce que la police ne connaît pas', () => {
  assert.equal(pdfText('Été « déjà » l’œuvre — 5 € …'), 'Été « déjà » l’œuvre — 5 € …');
  // Intl sépare les milliers français par une espace fine, absente de la police : elle devient insécable.
  assert.equal(pdfText(formatMoney(1234.5, 'EUR', 'fr')), '1\u00a0234,50\u00a0€');
  assert.equal(pdfText('Łódź, Ğ, ț'), 'Lódz, G, t');
  assert.equal(pdfText('Ligne 1\nLigne 2 ✨'), 'Ligne 1\nLigne 2 ');
});

test('le texte passe à la ligne entre les mots, garde les retours et coupe un mot trop long', () => {
  const measure = (line) => line.length;
  assert.deepEqual(wrap('un deux trois quatre', 9, measure), ['un deux', 'trois', 'quatre']);
  assert.deepEqual(wrap('a\n\nb', 9, measure), ['a', '', 'b']);
  assert.deepEqual(wrap('anticonstitutionnel', 8, measure), ['anticons', 'titution', 'nel']);
});

test('une colonne pleine continue sur une nouvelle page, décorée comme la première', () => {
  const document = new PagedDocument((page) => page.push({ kind: 'rect', x: 0, y: 0, width: 10, height: 10, color: '#000' }));
  const column = new Column(document, () => 1, 10, 100, 20, 60);
  for (let index = 0; index < 12; index += 1) column.text(`ligne ${index}`, { size: 10, color: '#000' });
  assert.equal(document.pages.length, 2);
  assert.ok(document.pages.every((page) => page[0].kind === 'rect'));
  const texts = document.pages.map((page) => page.filter((shape) => shape.kind === 'text').length);
  assert.equal(texts[0] + texts[1], 12);
  assert.ok(document.pages[1].filter((shape) => shape.kind === 'text').every((shape) => shape.y > 20 && shape.y < 60));
});

test('les montants se lisent selon la langue : virgule décimale en français, séparateur de milliers en anglais', () => {
  assert.equal(parseAmount('1,200', 'en'), 1200);
  assert.equal(parseAmount('1,234.50', 'en'), 1234.5);
  assert.equal(parseAmount('1,5'), 1.5);
  assert.equal(computeTotals({ currency: 'USD', vat: false, items: [{ description: 'Site', quantity: '1', unitPrice: '1,200', vatRate: '' }] }, 'en').total, 1200);
  assert.equal(parseAmount('1 234,50'), 1234.5);
  assert.equal(parseAmount('1,234.50'), 1234.5);
  assert.equal(parseAmount('1.234,50'), 1234.5);
  assert.equal(parseAmount('450\u202f000'), 450000);
  assert.equal(parseAmount('12'), 12);
  assert.equal(parseAmount('douze'), 0);
  assert.equal(parseAmount(''), 0);
});

test('les francs CFA n’ont pas de centimes, l’euro en a deux', () => {
  assert.equal(currencyDecimals('XAF'), 0);
  assert.equal(currencyDecimals('XOF'), 0);
  assert.equal(currencyDecimals('EUR'), 2);
});

test('la TVA est calculée par taux sur la somme des lignes arrondies', () => {
  const totals = computeTotals({
    currency: 'EUR',
    vat: true,
    items: [
      { description: 'A', quantity: '3', unitPrice: '19,99', vatRate: '20' },
      { description: 'B', quantity: '1', unitPrice: '10', vatRate: '5,5' },
      { description: 'C', quantity: '2', unitPrice: '0,333', vatRate: '20' },
    ],
  });
  assert.deepEqual(totals.lines.map((line) => line.amount), [59.97, 10, 0.67]);
  assert.equal(totals.subtotal, 70.64);
  assert.deepEqual(totals.taxes, [{ rate: 5.5, amount: 0.55 }, { rate: 20, amount: 12.13 }]);
  assert.equal(totals.total, 83.32);
});

test('sans TVA, le total est la somme des lignes, arrondie à la devise', () => {
  const totals = computeTotals({ currency: 'XAF', vat: false, items: [{ description: 'Site', quantity: '1,5', unitPrice: '100 001', vatRate: '18' }] });
  assert.deepEqual(totals.taxes, []);
  assert.equal(totals.total, 150002);
});

test('les listes du CV se saisissent une par ligne ou séparées par des virgules', () => {
  assert.deepEqual(listItems('Canva, Figma\nSEO\n\n'), ['Canva, Figma', 'SEO']);
  assert.deepEqual(listItems('Photo, course à pied ,lecture'), ['Photo', 'course à pied', 'lecture']);
  assert.equal(period({ start: '2020', end: '' }), '2020');
  assert.equal(period({ start: '2020', end: 'Aujourd’hui' }), '2020 – Aujourd’hui');
});
