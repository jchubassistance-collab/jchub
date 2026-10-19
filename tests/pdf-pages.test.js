import test from 'node:test';
import assert from 'node:assert/strict';
import { pageGroupLabel, parsePageRanges, safeBaseName, uniqueNames } from '../lib/pdf-pages.ts';

test('les plages de pages donnent un groupe par partie, dans l’ordre saisi', () => {
  assert.deepEqual(parsePageRanges('1-3, 5, 8-', 10), { ok: true, groups: [[1, 2, 3], [5], [8, 9, 10]] });
  assert.deepEqual(parsePageRanges('-2; 4 – 4', 5), { ok: true, groups: [[1, 2], [4]] });
  assert.deepEqual(parsePageRanges(' 3 , 1 ', 3), { ok: true, groups: [[3], [1]] });
});

test('une plage vide, mal écrite ou hors du document est refusée avec la partie en cause', () => {
  assert.deepEqual(parsePageRanges(' , ', 4), { ok: false, reason: 'empty', part: '' });
  assert.deepEqual(parsePageRanges('1-3, deux', 4), { ok: false, reason: 'syntax', part: 'deux' });
  assert.deepEqual(parsePageRanges('-', 4), { ok: false, reason: 'syntax', part: '-' });
  assert.deepEqual(parsePageRanges('2-9', 4), { ok: false, reason: 'range', part: '2-9' });
  assert.deepEqual(parsePageRanges('0', 4), { ok: false, reason: 'range', part: '0' });
  assert.deepEqual(parsePageRanges('4-2', 4), { ok: false, reason: 'range', part: '4-2' });
});

test('les noms des fichiers produits restent valides et uniques', () => {
  assert.equal(pageGroupLabel([1, 2, 3]), '1-3');
  assert.equal(pageGroupLabel([5]), '5');
  assert.equal(safeBaseName('Rapport: final?.PDF'), 'Rapport_ final_');
  assert.equal(safeBaseName('.pdf'), 'document');
  assert.deepEqual(uniqueNames(['a.pdf', 'b.pdf', 'a.pdf', 'a.pdf']), ['a.pdf', 'b.pdf', 'a-2.pdf', 'a-3.pdf']);
});
