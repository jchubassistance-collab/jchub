import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { jsPDF } from 'jspdf';
import { resources, findResource, findResourceInAnyLanguage } from '../lib/resources.ts';
import { buildTemplateDocx, hasTemplate, templateSectionTitles } from '../lib/resource-templates.ts';
import { paintResourcePdf, pdfText } from '../lib/resource-pdf.ts';

const root = path.resolve(import.meta.dirname, '..');
const LOCALES = ['fr', 'en'];

test('chaque ressource existe en français et en anglais, avec des adresses uniques', () => {
  const slugs = resources.flatMap((resource) => LOCALES.map((locale) => resource[locale].slug));
  assert.equal(new Set(slugs).size, slugs.length);
  assert.equal(new Set(resources.map((resource) => resource.id)).size, resources.length);
  for (const resource of resources) {
    for (const locale of LOCALES) {
      const text = resource[locale];
      assert.match(text.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${resource.id} ${locale}`);
      for (const field of ['title', 'summary', 'seoTitle', 'seoDescription']) assert.ok(text[field].trim(), `${resource.id} ${locale} ${field}`);
      assert.equal(findResource(text.slug, locale), resource);
      assert.equal(findResourceInAnyLanguage(text.slug), resource);
    }
    assert.match(resource.updated, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('le contenu des ressources gratuites a la même forme dans les deux langues', () => {
  for (const resource of resources.filter((candidate) => !candidate.gated)) {
    const [fr, en] = LOCALES.map((locale) => resource[locale].sections ?? []);
    assert.ok(fr.length > 0, resource.id);
    assert.deepEqual(fr.map((section) => section.rows.length), en.map((section) => section.rows.length), resource.id);
  }
});

test('chaque modèle a son texte complet, dont le plan affiché sur sa page suit les parties', () => {
  for (const resource of resources.filter((candidate) => candidate.gated)) {
    assert.equal(resource.format, 'docx');
    assert.ok(hasTemplate(resource.id), resource.id);
    for (const locale of LOCALES) {
      assert.equal(resource[locale].sections, undefined, `${resource.id} : le texte d’un modèle ne doit pas être public`);
      assert.equal(resource[locale].outline?.length, templateSectionTitles(resource.id, locale).length, `${resource.id} ${locale}`);
    }
  }
});

test('les modèles deviennent un fichier Word valide', async () => {
  for (const resource of resources.filter((candidate) => candidate.gated)) {
    for (const locale of LOCALES) {
      const file = await buildTemplateDocx(resource.id, locale);
      assert.equal(file.subarray(0, 2).toString(), 'PK', `${resource.id} ${locale}`);
      assert.ok(file.length > 5000);
    }
  }
});

// Windows-1252: the only characters jsPDF's built-in fonts can draw.
const CP1252_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');
const drawable = (character) => {
  const code = character.codePointAt(0);
  return (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || CP1252_EXTRA.has(character);
};

test('les PDF des ressources gratuites n’utilisent que des caractères que jsPDF sait dessiner', () => {
  for (const resource of resources.filter((candidate) => !candidate.gated)) {
    for (const locale of LOCALES) {
      const text = resource[locale];
      const strings = [text.title, text.summary, ...(text.sections ?? []).flatMap((section) => [section.title, ...section.rows.flatMap((row) => [row.term, row.text])])];
      const missing = strings.flatMap((value) => [...pdfText(value)].filter((character) => !drawable(character)));
      assert.deepEqual(missing, [], `${resource.id} ${locale}`);
      const pdf = paintResourcePdf(jsPDF, resource, locale).output('arraybuffer');
      assert.equal(Buffer.from(pdf).subarray(0, 4).toString(), '%PDF');
    }
  }
});

function sourceFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const file = path.join(directory, name);
    if (statSync(file).isDirectory()) return name === 'node_modules' || name.startsWith('.') ? [] : sourceFiles(file);
    return /\.(ts|tsx)$/.test(name) ? [file] : [];
  });
}

test('le texte des modèles n’est importé que par les routes d’API', () => {
  const files = [...sourceFiles(path.join(root, 'app')), ...sourceFiles(path.join(root, 'components')), ...sourceFiles(path.join(root, 'lib'))];
  const importers = files
    .filter((file) => /from ['"][^'"]*resource-templates['"]/.test(readFileSync(file, 'utf8')))
    .map((file) => path.relative(root, file).split(path.sep).join('/'))
    .filter((file) => file !== 'lib/resource-templates.ts');
  assert.ok(importers.length > 0);
  assert.deepEqual(importers.filter((file) => !file.startsWith('app/api/')), []);
});

test('le contenu d’une ressource passe de l’éditeur de l’admin au site sans rien perdre', async () => {
  const { sectionsToText, textToSections } = await import('../lib/resource-schema.ts');
  for (const resource of resources.filter((candidate) => !candidate.gated)) {
    for (const locale of LOCALES) {
      const sections = resource[locale].sections;
      const { sections: back, errors } = textToSections(sectionsToText(sections));
      assert.deepEqual(errors, []);
      assert.deepEqual(back, sections, `${resource.id} ${locale}`);
    }
  }
  const broken = textToSections('ligne sans partie\n## Partie\nsans séparateur\n## Vide');
  assert.equal(broken.errors.length, 4, 'ligne hors partie, séparateur manquant, et deux parties restées vides');
});

test('une ressource de l’admin doit avoir la même forme dans les deux langues', async () => {
  const { editableResourceSchema } = await import('../lib/resource-schema.ts');
  const sql = resources.find((resource) => resource.id === 'sql');
  const valid = { kind: 'cheatsheet', code: true, fr: sql.fr, en: sql.en };
  assert.equal(editableResourceSchema.safeParse(valid).success, true);
  const shorter = { ...valid, en: { ...sql.en, sections: sql.en.sections.slice(1) } };
  assert.equal(editableResourceSchema.safeParse(shorter).success, false);
  assert.equal(editableResourceSchema.safeParse({ ...valid, fr: { ...sql.fr, slug: 'Aide Mémoire' } }).success, false);
});

test('les adresses proposées par l’IA sont nettoyées et jamais en double', async () => {
  const { uniqueSlug, slugify } = await import('../lib/resource-schema.ts');
  assert.equal(slugify('Aide-mémoire Git : les bases !'), 'aide-memoire-git-les-bases');
  const taken = new Set(['aide-memoire-sql']);
  assert.equal(uniqueSlug('aide-memoire-sql', '', taken), 'aide-memoire-sql-2');
  assert.equal(uniqueSlug('aide-memoire-sql', '', taken), 'aide-memoire-sql-3');
  assert.equal(uniqueSlug('', 'Checklist RGPD', taken), 'checklist-rgpd');
});

test('un caractère que le PDF ne sait pas dessiner est remplacé, pas perdu en silence', () => {
  assert.equal(pdfText('Étape → fin ≥ 2'), 'Étape -> fin >= 2');
  assert.equal(pdfText('ȩ 🚀'), 'e ?');
  assert.ok([...pdfText('Ça coûte 5 € – « ok »')].every(drawable));
});

test('l’agent des ressources tourne une seule fois par semaine ISO', async () => {
  const { isoWeekKey } = await import('../lib/resource-schema.ts');
  assert.equal(isoWeekKey(new Date('2026-11-02T07:00:00Z')), '2026-W45');
  assert.equal(isoWeekKey(new Date('2026-11-08T23:00:00Z')), '2026-W45', 'le dimanche finit la semaine');
  assert.equal(isoWeekKey(new Date('2027-01-01T07:00:00Z')), '2026-W53', 'les premiers jours de janvier peuvent appartenir à l’année d’avant');
  assert.equal(isoWeekKey(new Date('2026-01-01T07:00:00Z')), '2026-W01');
});
