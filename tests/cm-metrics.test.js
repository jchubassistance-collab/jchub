import test from 'node:test';
import assert from 'node:assert/strict';
import { comparisonLabel, completedWeeks } from '../lib/cm-metrics.ts';

test('comparison handles missing and zero values without NaN or Infinity', () => {
  assert.equal(comparisonLabel(null, 12), 'Comparaison partielle');
  assert.equal(comparisonLabel(12, null), 'Comparaison partielle');
  assert.equal(comparisonLabel(0, 0), '0 %');
  assert.equal(comparisonLabel(5, 0), 'Nouveau');
});

test('comparison calculates percent change against previous period', () => {
  assert.equal(comparisonLabel(150, 100), '50 %');
  assert.equal(comparisonLabel(75, 100), '-25 %');
});

test('les semaines collectées sont complètes, du lundi au dimanche, de la plus ancienne à la plus récente', () => {
  assert.deepEqual(completedWeeks(new Date('2026-10-19T08:00:00Z')), [{ start: '2026-10-12', end: '2026-10-18' }]);
  assert.deepEqual(completedWeeks(new Date('2026-10-18T23:00:00Z')), [{ start: '2026-10-05', end: '2026-10-11' }]);
  assert.deepEqual(completedWeeks(new Date('2026-10-19T08:00:00Z'), 3), [
    { start: '2026-09-28', end: '2026-10-04' },
    { start: '2026-10-05', end: '2026-10-11' },
    { start: '2026-10-12', end: '2026-10-18' },
  ]);
  assert.equal(completedWeeks(new Date('2026-10-19T08:00:00Z'), 50).length, 12);
  assert.equal(completedWeeks(new Date('2026-10-19T08:00:00Z'), 0).length, 1);
});
