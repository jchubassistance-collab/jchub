import test from 'node:test';
import assert from 'node:assert/strict';
import { articlePaths, change, foldShares, formatDuration, fromGaDate, periodDays } from '../lib/writer-performance.ts';

test('la période finit hier et compte le bon nombre de jours', () => {
  const days = periodDays(7, new Date(2026, 10, 2));
  assert.deepEqual([days[0], days[6], days.length], ['2026-10-26', '2026-11-01', 7]);
});

test('les pages d’un article couvrent ses deux langues et l’ancienne adresse', () => {
  assert.deepEqual(articlePaths('osi', 'osi-model').map((page) => page.path), ['/fr/blog/osi', '/blog/osi', '/en/blog/osi-model']);
  assert.equal(articlePaths('osi', null).length, 2);
});

test('les chiffres sont mis en forme pour le rédacteur', () => {
  assert.equal(fromGaDate('20261101'), '2026-11-01');
  assert.equal(change(150, 100), 50);
  assert.equal(change(5, 0), null);
  assert.equal(formatDuration(45), '45 s');
  assert.equal(formatDuration(125), '2 min 05 s');
});

test('les petites parts sont regroupées dans « Autres », avec des noms en français', () => {
  const shares = foldShares([{ name: 'mobile', views: 50 }, { name: 'desktop', views: 30 }, { name: 'tablet', views: 5 }, { name: 'smarttv', views: 1 }, { name: 'x', views: 0 }], 2);
  assert.deepEqual(shares, [{ name: 'Téléphone', views: 50 }, { name: 'Ordinateur', views: 30 }, { name: 'Autres', views: 6 }]);
});
