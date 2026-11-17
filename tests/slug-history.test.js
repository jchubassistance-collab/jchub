import test from 'node:test';
import assert from 'node:assert/strict';
import { nextPreviousSlugs } from '../lib/slug-history.ts';

test('un changement de slug garde l’ancien en tête de liste', () => {
  assert.deepEqual(nextPreviousSlugs(undefined, 'ancien', 'nouveau'), ['ancien']);
  assert.deepEqual(nextPreviousSlugs(['plus-ancien'], 'ancien', 'nouveau'), ['ancien', 'plus-ancien']);
});

test('sans changement, rien n’est écrit', () => {
  assert.equal(nextPreviousSlugs(['a'], 'meme', 'meme'), null);
  assert.equal(nextPreviousSlugs(['a'], '', 'nouveau'), null);
});

test('revenir à une ancienne adresse la retire de la liste, sans doublon', () => {
  assert.deepEqual(nextPreviousSlugs(['b', 'a'], 'c', 'a'), ['c', 'b']);
  assert.deepEqual(nextPreviousSlugs(['a', 'a', 'b'], 'a', 'c'), ['a', 'b']);
});

test('la liste est bornée', () => {
  const many = Array.from({ length: 40 }, (_, index) => `s${index}`);
  assert.equal(nextPreviousSlugs(many, 'nouveau-ancien', 'x').length, 30);
});
