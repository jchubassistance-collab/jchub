import test from 'node:test';
import assert from 'node:assert/strict';
import { articlePageOf, classifySource, deviceOf, pageLang, toolPageOf } from '../lib/insights/paths.ts';
import { trackBatchSchema } from '../lib/insights/events.ts';

test('la provenance d’une visite est lue dans utm_source puis dans le site d’origine', () => {
  assert.equal(classifySource('https://www.google.com/', undefined, 'jchub.dev'), 'google');
  assert.equal(classifySource('https://www.google.cg/search?q=x', undefined, 'jchub.dev'), 'google');
  assert.equal(classifySource('https://l.facebook.com/l.php?u=x', undefined, 'jchub.dev'), 'facebook');
  assert.equal(classifySource('https://lm.facebook.com/', undefined, 'jchub.dev'), 'facebook');
  assert.equal(classifySource('https://l.instagram.com/', undefined, 'jchub.dev'), 'instagram');
  assert.equal(classifySource('https://lnkd.in/abc', undefined, 'jchub.dev'), 'linkedin');
  assert.equal(classifySource('', undefined, 'jchub.dev'), 'direct');
  assert.equal(classifySource(undefined, 'whatsapp', 'jchub.dev'), 'whatsapp', 'utm_source prime');
  assert.equal(classifySource('https://www.google.com/', 'fb', 'jchub.dev'), 'facebook');
  assert.equal(classifySource('https://jchub.dev/fr/blog', undefined, 'jchub.dev'), 'interne');
  assert.equal(classifySource('https://njdwebs.com/', undefined, 'jchub.dev'), 'site-referent');
  assert.equal(classifySource('pas une adresse', undefined, 'jchub.dev'), 'direct');
});

test('les pages d’outils et d’articles sont reconnues dans les deux langues', () => {
  assert.deepEqual(toolPageOf('/fr/outils/images-en-pdf'), { locale: 'fr', slug: 'images-en-pdf' });
  assert.deepEqual(toolPageOf('/en/tools/images-to-pdf'), { locale: 'en', slug: 'images-to-pdf' });
  assert.deepEqual(toolPageOf('/fr/tools/api-cost-calculator'), { locale: 'fr', slug: 'api-cost-calculator' });
  assert.equal(toolPageOf('/fr/outils/categorie'), null);
  assert.equal(toolPageOf('/fr/outils'), null);
  assert.deepEqual(articlePageOf('/en/blog/how-a-mobile-network-works'), { locale: 'en', slug: 'how-a-mobile-network-works' });
  assert.equal(articlePageOf('/fr/blog'), null);
  assert.equal(pageLang('/en/tools'), 'en');
  assert.equal(pageLang('/'), '');
});

test('l’appareil est déduit du navigateur', () => {
  assert.equal(deviceOf('Mozilla/5.0 (Linux; Android 14) Mobile Safari'), 'mobile');
  assert.equal(deviceOf('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)'), 'mobile');
  assert.equal(deviceOf('Mozilla/5.0 (iPad; CPU OS 17_0)'), 'tablette');
  assert.equal(deviceOf('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), 'ordinateur');
});

test('la collecte refuse les envois mal formés', () => {
  assert.equal(trackBatchSchema.safeParse({ events: [{ type: 'pageview', path: '/fr' }] }).success, true);
  assert.equal(trackBatchSchema.safeParse({ events: [{ type: 'inconnu', path: '/fr' }] }).success, false);
  assert.equal(trackBatchSchema.safeParse({ events: [{ type: 'pageview', path: 'https://ailleurs.com' }] }).success, false);
  assert.equal(trackBatchSchema.safeParse({ events: Array.from({ length: 26 }, () => ({ type: 'pageview', path: '/fr' })) }).success, false);
  assert.equal(trackBatchSchema.safeParse({ events: [{ type: 'tool_upload', path: '/fr', value: -1 }] }).success, false);
});
