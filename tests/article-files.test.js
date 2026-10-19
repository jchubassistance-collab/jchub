import test from 'node:test';
import assert from 'node:assert/strict';
import { buildArticleFiles, gitBlobSha, parseArticleFiles } from '../lib/article-files.ts';

const content = '# Décoder un JWT\n\nUn titre : avec deux-points.\n\n```js\nconst token = "a.b.c";\n```\n\n- fin de liste\n';
const document = {
  slug: 'decoder-jwt',
  title: 'Décoder un JWT : le guide',
  description: 'Un guide « pratique » de 2026.',
  excerpt: 'Résumé',
  category: 'Développement',
  keywords: ['jwt', 'sécurité'],
  tags: ['Développement', 'jwt'],
  author: 'JcHub',
  image: '/blog/01-decoder-jwt-sans-postman.svg',
  readTime: '5 min',
  status: 'published',
  publishedAt: { toDate: () => new Date('2026-03-04T05:06:07.000Z') },
  content,
  sourceDraftId: 'jamais-dans-le-fichier',
  translations: {
    en: { slug: 'decode-jwt', title: 'Decode a JWT: the guide', description: 'A practical guide.', excerpt: 'Summary', content: 'English text\n\nsecond paragraph', keywords: ['jwt'], sourceHash: 'abc123', translatedAt: new Date('2026-03-05T00:00:00.000Z') },
  },
};

test('un article publié redonne exactement son texte et ses champs après un passage par les fichiers', () => {
  const files = buildArticleFiles('decoder-jwt', document);
  assert.deepEqual(Object.keys(files).sort(), ['content/articles/decoder-jwt.md', 'content/articles/en/decoder-jwt.md']);
  const record = parseArticleFiles('decoder-jwt', files['content/articles/decoder-jwt.md'], files['content/articles/en/decoder-jwt.md']);
  assert.equal(record.content, content);
  assert.equal(record.title, document.title);
  assert.equal(record.description, document.description);
  assert.deepEqual(record.keywords, document.keywords);
  assert.equal(record.publishedAt, '2026-03-04T05:06:07.000Z');
  assert.equal(record.status, 'published');
  assert.equal(record.sourceDraftId, undefined);
  assert.equal(record.translations.en.content, 'English text\n\nsecond paragraph');
  assert.equal(record.translations.en.slug, 'decode-jwt');
  assert.equal(record.translations.en.translatedAt, '2026-03-05T00:00:00.000Z');
});

test('un fichier enregistré avec des fins de ligne Windows se relit à l’identique', () => {
  const files = buildArticleFiles('decoder-jwt', document);
  const windows = files['content/articles/decoder-jwt.md'].replace(/\n/g, '\r\n');
  assert.equal(parseArticleFiles('decoder-jwt', windows).content, content);
});

test('seuls les articles publiés ou programmés ont des fichiers', () => {
  assert.deepEqual(buildArticleFiles('brouillon', { ...document, status: 'draft' }), {});
  assert.deepEqual(buildArticleFiles('archive', { ...document, status: 'archived' }), {});
  assert.deepEqual(buildArticleFiles('vide', { ...document, content: '  ' }), {});
  assert.equal(Object.keys(buildArticleFiles('programme', { ...document, status: 'scheduled' })).length, 2);
});

test('un identifiant qui sortirait du dossier des articles est refusé', () => {
  assert.deepEqual(buildArticleFiles('../secret', document), {});
  assert.deepEqual(buildArticleFiles('a/b', document), {});
});

test('sans traduction complète, seul le fichier français est écrit', () => {
  const files = buildArticleFiles('decoder-jwt', { ...document, translations: { en: { slug: 'decode-jwt', title: 'Decode' } } });
  assert.deepEqual(Object.keys(files), ['content/articles/decoder-jwt.md']);
});

test('l’empreinte Git d’un fichier est celle que calcule git hash-object', () => {
  assert.equal(gitBlobSha('hello\n'), 'ce013625030ba8dba906f756967f9e9ca394464a');
});
