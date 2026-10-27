import test from 'node:test';
import assert from 'node:assert/strict';
import { articleCoverPath, readArticleCover } from '../lib/article-cover.ts';

process.env.CRON_SECRET = 'secret-de-test';

const paramsOf = (path) => new URL(path, 'https://jchub.dev').searchParams;

test('une couverture signée par le site se relit telle quelle', () => {
  const cover = { title: 'Encoder une URL', category: 'Développement', photo: 'https://images.unsplash.com/photo-1', lang: 'en' };
  const path = articleCoverPath(cover);
  assert.match(path, /^\/api\/article-cover\?title=.+&category=.+&photo=.+&lang=en&sig=[\w-]{22}$/);
  assert.deepEqual(readArticleCover(paramsOf(path)), cover);
});

test('un texte modifié ou non signé ne donne que la carte par défaut, dans sa langue', () => {
  const params = paramsOf(articleCoverPath({ title: 'Encoder une URL', category: 'Développement' }));
  params.set('title', 'Offre gratuite : cliquez ici');
  assert.deepEqual(readArticleCover(params), { lang: null });
  assert.deepEqual(readArticleCover(new URLSearchParams({ title: 'Faux', lang: 'en' })), { lang: 'en' });
  assert.deepEqual(readArticleCover(new URLSearchParams({ title: 'Faux', sig: 'x'.repeat(22) })), { lang: null });
});

test('la carte par défaut garde une adresse sans signature', () => {
  assert.equal(articleCoverPath({}), '/api/article-cover');
  assert.equal(articleCoverPath({ lang: 'en' }), '/api/article-cover?lang=en');
});

test('changer de secret invalide les anciennes signatures', () => {
  const path = articleCoverPath({ title: 'Encoder une URL' });
  process.env.ARTICLE_COVER_SECRET = 'autre-secret';
  try {
    assert.deepEqual(readArticleCover(paramsOf(path)), { lang: null });
  } finally {
    delete process.env.ARTICLE_COVER_SECRET;
  }
});
