import test from 'node:test';
import assert from 'node:assert/strict';
import { amountInWords, englishNumber, frenchNumber } from '../lib/amount-words.ts';
import { computeVat, VAT_COUNTRIES, vatCountry } from '../lib/vat-rates.ts';

test('French numbers follow the traditional spelling', () => {
  const cases = {
    0: 'zéro', 1: 'un', 16: 'seize', 17: 'dix-sept', 21: 'vingt et un', 22: 'vingt-deux',
    70: 'soixante-dix', 71: 'soixante et onze', 72: 'soixante-douze', 80: 'quatre-vingts',
    81: 'quatre-vingt-un', 90: 'quatre-vingt-dix', 91: 'quatre-vingt-onze', 99: 'quatre-vingt-dix-neuf',
    100: 'cent', 101: 'cent un', 200: 'deux cents', 201: 'deux cent un', 280: 'deux cent quatre-vingts',
    1000: 'mille', 1001: 'mille un', 2000: 'deux mille', 80000: 'quatre-vingt mille', 200000: 'deux cent mille',
    531000: 'cinq cent trente et un mille', 1000000: 'un million', 2500000: 'deux millions cinq cent mille',
    200000000: 'deux cents millions', 1000000000: 'un milliard',
  };
  for (const [value, words] of Object.entries(cases)) assert.equal(frenchNumber(Number(value)), words, value);
});

test('English numbers', () => {
  assert.equal(englishNumber(0), 'zero');
  assert.equal(englishNumber(42), 'forty-two');
  assert.equal(englishNumber(1205), 'one thousand two hundred five');
  assert.equal(englishNumber(3000000), 'three million');
});

test('amounts in words name the currency', () => {
  assert.equal(amountInWords(531000, 'XAF', 'fr'), 'cinq cent trente et un mille francs CFA');
  assert.equal(amountInWords(1, 'XOF', 'fr'), 'un franc CFA');
  assert.equal(amountInWords(1000000, 'XAF', 'fr'), 'un million de francs CFA');
  assert.equal(amountInWords(1200000, 'XAF', 'fr'), 'un million deux cent mille francs CFA');
  assert.equal(amountInWords(12.5, 'EUR', 'fr'), 'douze euros et cinquante centimes');
  assert.equal(amountInWords(1.01, 'EUR', 'fr'), 'un euro et un centime');
  assert.equal(amountInWords(12.5, 'USD', 'en'), 'twelve dollars and fifty cents');
  // The CFA franc has no cents in use: rounded to the franc.
  assert.equal(amountInWords(999.6, 'XAF', 'fr'), 'mille francs CFA');
});

test('VAT from net or gross, rounded to the currency', () => {
  assert.deepEqual(computeVat(100000, 18, 'net', 0), { net: 100000, vat: 18000, gross: 118000 });
  assert.deepEqual(computeVat(118000, 18, 'gross', 0), { net: 100000, vat: 18000, gross: 118000 });
  assert.deepEqual(computeVat(100, 20, 'net', 2), { net: 100, vat: 20, gross: 120 });
  // The VAT is the difference: net + VAT is the gross to the unit.
  const { net, vat, gross } = computeVat(99999, 19.25, 'gross', 0);
  assert.equal(net + vat, gross);
});

test('VAT countries are unique and plausible', () => {
  const codes = VAT_COUNTRIES.map((country) => country.code);
  assert.equal(new Set(codes).size, codes.length);
  for (const country of VAT_COUNTRIES) assert.ok(country.rate > 0 && country.rate < 30, country.code);
  assert.equal(vatCountry('GA')?.rate, 18);
  assert.equal(vatCountry('CM')?.rate, 19.25);
});

import { completeInvoice, emptyInvoice } from '../lib/invoice.ts';

test('a draft saved before the RCCM field still opens', () => {
  const old = { ...emptyInvoice(), seller: { name: 'A', address: '', email: '', phone: '', taxId: '' } };
  delete old.country;
  delete old.inWords;
  const invoice = completeInvoice(old);
  assert.equal(invoice.seller.name, 'A');
  assert.equal(invoice.seller.registry, '');
  assert.equal(invoice.client.registry, '');
  assert.equal(invoice.country, '');
  assert.equal(invoice.inWords, false);
});
