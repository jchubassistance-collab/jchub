import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

function sourceFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const file = path.join(directory, name);
    if (statSync(file).isDirectory()) return name === 'node_modules' || name.startsWith('.') ? [] : sourceFiles(file);
    return /\.(ts|tsx)$/.test(name) ? [file] : [];
  });
}

test('chaque message d’API envoyé aux visiteurs a sa version anglaise', () => {
  const dictionary = readFileSync(path.join(root, 'lib/api-messages.ts'), 'utf8');
  const translated = new Set(Array.from(dictionary.matchAll(/^\s+'((?:\\.|[^'\\])+)': '/gm), (match) => match[1]));
  const missing = [];
  for (const file of [...sourceFiles(path.join(root, 'app')), ...sourceFiles(path.join(root, 'lib'))]) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/apiMessage\(request, '((?:\\.|[^'\\])+)'/g)) {
      if (!translated.has(match[1])) missing.push(`${path.relative(root, file)} : ${match[1]}`);
    }
  }
  // Errors thrown with their own message are returned through apiMessage(request, error.message).
  const blobs = readFileSync(path.join(root, 'lib/temporary-conversion-blobs.ts'), 'utf8');
  for (const match of blobs.matchAll(/new TemporaryBlobError\('((?:\\.|[^'\\])+)'/g)) {
    if (!translated.has(match[1])) missing.push(`lib/temporary-conversion-blobs.ts : ${match[1]}`);
  }
  assert.deepEqual(missing, []);
});

test('chaque adresse traduite correspond à une page de app/[locale]', () => {
  const routing = readFileSync(path.join(root, 'i18n/routing.ts'), 'utf8');
  const block = routing.slice(routing.indexOf('pathnames: {'));
  const internalPaths = Array.from(block.matchAll(/^\s+'(\/[^']*)':/gm), (match) => match[1]);
  assert.ok(internalPaths.length > 10);
  const missing = internalPaths.filter((pathname) => {
    const directory = path.join(root, 'app', '[locale]', ...pathname.split('/').filter(Boolean));
    return !existsSync(path.join(directory, 'page.tsx'));
  });
  assert.deepEqual(missing, []);
});

test('les outils intégrés ont une adresse anglaise unique', () => {
  const source = readFileSync(path.join(root, 'lib/tools.ts'), 'utf8');
  const catalog = source.slice(source.indexOf('export const tools'), source.indexOf('export function isToolVisibleToday'));
  const frenchSlugs = Array.from(catalog.matchAll(/^ {4}slug: '([^']+)'/gm), (match) => match[1]);
  const englishSlugs = Array.from(catalog.matchAll(/^ {8}slug: '([^']+)'/gm), (match) => match[1]);
  assert.equal(englishSlugs.length, frenchSlugs.length, 'un outil intégré n’a pas de version anglaise');
  assert.equal(new Set(englishSlugs).size, englishSlugs.length, 'deux outils partagent la même adresse anglaise');
  // An English slug may equal its own French slug, never another tool's.
  englishSlugs.forEach((slug, index) => {
    const owner = frenchSlugs.indexOf(slug);
    assert.ok(owner === -1 || owner === index, `${slug} est déjà l’adresse française d’un autre outil`);
  });
});

test('chaque catégorie a une adresse propre dans chaque langue, et on la retrouve à partir de cette adresse', async () => {
  const { categoryFromSlug, categorySlug, countByCategory } = await import('../lib/categories.ts');
  const categories = ['Développement', 'Design', 'Document', 'Productivité', 'Sécurité', 'Texte', 'Encodage', 'Autre', 'Informatique', 'Frontend', 'Technologie', 'Base de données', 'Produit', 'Numérique'];
  for (const locale of ['fr', 'en']) {
    const slugs = categories.map((category) => categorySlug(category, locale));
    assert.equal(new Set(slugs).size, categories.length, `deux catégories partagent une adresse en ${locale}`);
    for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    for (const category of categories) assert.equal(categoryFromSlug(categorySlug(category, locale), locale, categories), category);
  }
  assert.equal(categorySlug('Base de données', 'fr'), 'base-de-donnees');
  assert.equal(categorySlug('Sécurité', 'en'), 'security');
  assert.deepEqual(countByCategory(['Design', 'Document', 'Design']), [{ category: 'Design', count: 2 }, { category: 'Document', count: 1 }]);
});
