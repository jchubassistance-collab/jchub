import test from 'node:test';
import assert from 'node:assert/strict';
import { comparisonLabel } from '../lib/cm-metrics.ts';

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
