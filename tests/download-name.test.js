import test from 'node:test';
import assert from 'node:assert/strict';
import { downloadBaseName, downloadName } from '../lib/download-name.ts';

test('un fichier téléchargé garde le nom de son original, suivi de -jchub', () => {
  assert.equal(downloadName('Rapport annuel.pdf', 'pdf'), 'Rapport annuel-jchub.pdf');
  assert.equal(downloadName('photo.JPG', 'webp'), 'photo-jchub.webp');
  assert.equal(downloadName('ventes.xlsx', 'csv'), 'ventes-jchub.csv');
  assert.equal(downloadName('contrat.docx', 'pdf'), 'contrat-jchub.pdf');
  assert.equal(downloadName('Mon logo.final.png', 'jpg'), 'Mon logo.final-jchub.jpg', 'seule la dernière extension tombe');
});

test('le détail se place avant -jchub, qui n’est jamais ajouté deux fois', () => {
  assert.equal(downloadName('rapport.pdf', 'pdf', 'pages-1-3'), 'rapport-pages-1-3-jchub.pdf');
  assert.equal(downloadName('rapport-jchub.pdf', 'pdf'), 'rapport-jchub.pdf');
  assert.equal(downloadName('logo-JCHUB.png', 'svg', '256'), 'logo-256-jchub.svg');
  assert.equal(downloadBaseName('accueil'), 'accueil-jchub');
});

test('un nom vide ou interdit reste un nom de fichier valide', () => {
  assert.equal(downloadName('.pdf', 'pdf', '', 'document'), 'document-jchub.pdf');
  assert.equal(downloadName('a:b?.docx', 'pdf'), 'a_b_-jchub.pdf');
  assert.equal(downloadName('nom. .pdf', 'pdf'), 'nom-jchub.pdf');
  assert.ok(downloadName(`${'x'.repeat(200)}.pdf`, 'pdf').length <= 80 + '-jchub.pdf'.length);
});
