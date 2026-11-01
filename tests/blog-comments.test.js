import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanComment, commentProblem, COMMENT_LIMITS } from '../lib/blog-comments.ts';

test('un commentaire avec un nom et un message passe', () => {
  assert.equal(commentProblem({ name: 'Marie', message: 'Merci pour cet article !' }), null);
});

test('le nom et le message sont nettoyés', () => {
  assert.deepEqual(cleanComment({ name: '  Jean   Paul ', message: 'Bonjour  \r\n\r\n\r\n\r\nSuite ' }), { name: 'Jean Paul', message: 'Bonjour\n\nSuite' });
});

test('un nom ou un message trop court ou trop long est refusé', () => {
  assert.equal(commentProblem({ name: 'A', message: 'Bonjour' }), 'name');
  assert.equal(commentProblem({ name: 'x'.repeat(COMMENT_LIMITS.name + 1), message: 'Bonjour' }), 'name');
  assert.equal(commentProblem({ name: 'Marie', message: '  ok ' }), 'message');
  assert.equal(commentProblem({ name: 'Marie', message: 'x'.repeat(COMMENT_LIMITS.message + 1) }), 'message');
});

test('plus de deux liens sont refusés', () => {
  assert.equal(commentProblem({ name: 'Marie', message: 'Voir https://a.fr et www.b.fr' }), null);
  assert.equal(commentProblem({ name: 'Bot', message: 'https://a.fr http://b.fr www.c.fr' }), 'links');
});
