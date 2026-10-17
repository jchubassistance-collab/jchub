import test from 'node:test';
import assert from 'node:assert/strict';

import { parseDelimitedText, stringifyCsvRows, toCsvCellValue } from '../lib/csv.ts';

test('parse les séparateurs, guillemets doublés, BOM et retours CRLF', () => {
  assert.deepEqual(
    parseDelimitedText('\uFEFFnom,description\r\nAlice,"bonjour, ""monde"""\r\nBob,"ligne 1\nligne 2"\r\n', ','),
    [['nom', 'description'], ['Alice', 'bonjour, "monde"'], ['Bob', 'ligne 1\nligne 2']],
  );
});

test('parse les fichiers tabulés et signale les guillemets incomplets', () => {
  assert.deepEqual(parseDelimitedText('a\tb\n1\t2\n', '\t'), [['a', 'b'], ['1', '2']]);
  assert.throws(() => parseDelimitedText('a,"incomplet', ','), /guillemets incomplet/);
});

test('échappe les cellules CSV et neutralise les formules exportées', () => {
  const values = [[toCsvCellValue('=1+1'), toCsvCellValue('texte, avec virgule'), toCsvCellValue('il dit "oui"')]];
  assert.equal(stringifyCsvRows(values), `'=1+1,"texte, avec virgule","il dit ""oui"""`);
  assert.equal(toCsvCellValue(-42), '-42');
  assert.equal(toCsvCellValue('  =1+1'), "'  =1+1");
});
