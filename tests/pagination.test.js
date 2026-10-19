import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_PAGE, pageFromParam, pageWindow } from '../lib/pagination.ts';

test('la page lue dans l’adresse est un entier à partir de 1', () => {
  assert.equal(pageFromParam('3'), 3);
  assert.equal(pageFromParam(' 2 '), 2);
  for (const value of [null, undefined, '', '0', '-2', '1.5', 'abc', '2e3']) assert.equal(pageFromParam(value), 1, String(value));
  assert.equal(pageFromParam('9999'), MAX_PAGE);
});

test('jusqu’à 7 pages, toutes les pages sont affichées', () => {
  assert.deepEqual(pageWindow(1, 1), [1]);
  assert.deepEqual(pageWindow(4, 7), [1, 2, 3, 4, 5, 6, 7]);
});

test('au-delà, la première, la dernière et les voisines, avec des « … »', () => {
  assert.deepEqual(pageWindow(1, 15), [1, 2, 3, 4, 'gap', 15]);
  assert.deepEqual(pageWindow(7, 15), [1, 'gap', 6, 7, 8, 'gap', 15]);
  assert.deepEqual(pageWindow(15, 15), [1, 'gap', 12, 13, 14, 15]);
  assert.deepEqual(pageWindow(4, 15), [1, 2, 3, 4, 5, 'gap', 15], 'un « … » ne cache jamais une seule page');
  assert.deepEqual(pageWindow(40, 15), [1, 'gap', 12, 13, 14, 15], 'page hors limites ramenée à la dernière');
});
