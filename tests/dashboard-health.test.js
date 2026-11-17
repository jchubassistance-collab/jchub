import test from 'node:test';
import assert from 'node:assert/strict';
import { computeHealth, percentChange } from '../lib/dashboard-health.ts';

const calm = { distinctErrors: 0, failedAgents: [], staleDrafts: 0, pendingMessages: 0, bounceRate: 40, averageResponseMs: null };

test('un site sans problème a 100 sur 100, sans point retiré', () => {
  assert.deepEqual(computeHealth(calm), { score: 100, items: [] });
});

test('chaque point retiré est plafonné et expliqué', () => {
  const health = computeHealth({ ...calm, distinctErrors: 16, failedAgents: ['Agent éditorial'], pendingMessages: 20, bounceRate: 75 });
  assert.deepEqual(health.items.map((item) => [item.label, item.penalty]), [['Erreurs du site', 30], ['Agents IA', 15], ['Messages non traités', 10], ['Taux de rebond', 10]]);
  assert.equal(health.score, 35);
  assert.ok(health.items.every((item) => item.detail.length > 10));
});

test('le score ne descend jamais sous zéro', () => {
  assert.equal(computeHealth({ ...calm, distinctErrors: 50, failedAgents: ['a', 'b', 'c', 'd', 'e'], staleDrafts: 9, pendingMessages: 50, bounceRate: 90, averageResponseMs: 3000 }).score, 0);
});

test('l’évolution entre deux périodes', () => {
  assert.equal(percentChange(35, 154), -77.3);
  assert.equal(percentChange(10, 0), null, 'rien à comparer');
  assert.equal(percentChange(0, 0), 0);
});
