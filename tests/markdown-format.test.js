import test from 'node:test';
import assert from 'node:assert/strict';
import { formatEdit } from '../lib/markdown-format.ts';

const apply = (value, start, end, kind) => {
  const edit = formatEdit(value, start, end, kind);
  const next = value.slice(0, edit.from) + edit.text + value.slice(edit.to);
  return { next, selected: next.slice(edit.selectStart, edit.selectEnd) };
};

test('gras et italique entourent la sélection, ou un texte à remplacer', () => {
  assert.deepEqual(apply('un mot ici', 3, 6, 'bold'), { next: 'un **mot** ici', selected: 'mot' });
  assert.deepEqual(apply('abc', 3, 3, 'italic'), { next: 'abc*texte en italique*', selected: 'texte en italique' });
});

test('un sous-titre se met en tête de ligne, et un second clic le retire', () => {
  const once = apply('Intro\nMa partie\nSuite', 8, 8, 'h2');
  assert.equal(once.next, 'Intro\n## Ma partie\nSuite');
  assert.equal(apply(once.next, 8, 8, 'h2').next, 'Intro\nMa partie\nSuite');
  assert.equal(apply('### Partie', 0, 0, 'h4').next, '#### Partie');
});

test('les listes numérotent chaque ligne sélectionnée', () => {
  assert.equal(apply('a\nb\nc', 0, 5, 'ordered').next, '1. a\n2. b\n3. c');
});

test('image et lien sélectionnent l’adresse à remplacer', () => {
  assert.deepEqual(apply('voir', 0, 4, 'link'), { next: '[voir](https://)', selected: 'https://' });
  assert.deepEqual(apply('', 0, 0, 'image'), { next: '![description de l’image](https://)', selected: 'https://' });
});

test('bloc de code et séparateur sont isolés par des lignes vides', () => {
  assert.equal(apply('Avant', 5, 5, 'rule').next, 'Avant\n\n---\n\n');
  assert.deepEqual(apply('x = 1', 0, 5, 'codeblock'), { next: '```\nx = 1\n```\n\n', selected: 'x = 1' });
});
