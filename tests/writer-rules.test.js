import test from 'node:test';
import assert from 'node:assert/strict';
import { isWriterCategory, parseKeywords, publicationChecks, readTime, slugify, wordCount, writingTips, MIN_PUBLISHED_WORDS } from '../lib/writer-rules.ts';

const words = (count) => Array.from({ length: count }, (_, index) => `mot${index}`).join(' ');
const ready = { title: 'Installer Windows 11 sur un ancien PC', description: 'Le pas-à-pas pour installer Windows 11 sur un PC que Microsoft juge trop ancien, sans perdre tes fichiers ni tes logiciels.', content: `## Avant de commencer\n\n${words(MIN_PUBLISHED_WORDS)}`, category: 'Technologie' };

test('une adresse est faite du titre sans accents ni ponctuation', () => {
  assert.equal(slugify('  Sécuriser son réseau Wi-Fi à la maison !  '), 'securiser-son-reseau-wi-fi-a-la-maison');
  assert.equal(slugify('Top 5 : outils -- gratuits'), 'top-5-outils-gratuits');
  assert.equal(slugify('!!!'), '');
  const long = slugify('a'.repeat(80) + ' ' + 'b'.repeat(40));
  assert.ok(long.length <= 90 && !long.endsWith('-'));
});

test('les mots se comptent dans le Markdown, sans la syntaxe', () => {
  assert.equal(wordCount('## Un titre\n\n**Deux** mots, l’apostrophe et le Wi-Fi.'), 8);
  assert.equal(wordCount(''), 0);
  assert.equal(readTime(words(450)), '2 min');
  assert.equal(readTime('court'), '1 min');
});

test('les mots-clés sont nettoyés, dédoublonnés et limités', () => {
  assert.deepEqual(parseKeywords(' windows 11, Windows 11 ,, ancien pc '), ['windows 11', 'ancien pc']);
  assert.equal(parseKeywords(Array.from({ length: 12 }, (_, index) => `mot ${index}`).join(',')).length, 8);
});

test('un article complet peut être publié', () => {
  assert.ok(publicationChecks(ready).every((check) => check.ok));
});

test('il manque ce qui empêche la publication', () => {
  const missing = publicationChecks({ title: 'Court', description: 'Trop court', content: words(120), category: 'Windows' }).filter((check) => !check.ok).map((check) => check.id);
  assert.deepEqual(missing, ['title', 'description', 'content', 'category']);
  assert.match(publicationChecks({ ...ready, content: words(120) }).find((check) => check.id === 'content').label, /120 pour l’instant/);
});

test('seules les catégories traduites sont proposées', () => {
  assert.ok(isWriterCategory('Sécurité'));
  assert.ok(!isWriterCategory('Windows'));
  assert.ok(!isWriterCategory(undefined));
});

test('les conseils signalent un # de trop et l’absence de sous-titres', () => {
  assert.deepEqual(writingTips(ready), []);
  const tips = writingTips({ ...ready, content: `# Mon titre\n\n${words(20)}` });
  assert.ok(tips.some((tip) => tip.includes('##')));
  assert.ok(tips.some((tip) => tip.includes('pas #')));
});
