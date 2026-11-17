import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAvailability, checkCronFailure, checkErrorSpike, checkSeoDrop, checkSlowApi, checkTrafficDrop, ALERT_RULES } from '../lib/alerts/rules.ts';
import { monthLabel, monthRange, pdfText, previousMonth, toCsv } from '../lib/insights/report-format.ts';
import { auditPage, auditSummary, seoOpportunities, wordCount } from '../lib/insights/seo-audit.ts';

test('chaque règle d’alerte a un identifiant unique et part par e-mail', () => {
  const ids = ALERT_RULES.map((rule) => rule.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const rule of ALERT_RULES) assert.deepEqual(rule.channels, ['email'], rule.id);
});

test('une rafale d’erreurs déclenche l’alerte à partir du seuil', () => {
  assert.equal(checkErrorSpike(9, 10), null);
  assert.match(checkErrorSpike(10, 10).title, /10 erreurs/);
});

test('la disponibilité ne dit rien sous 20 appels et alerte sous le seuil', () => {
  assert.equal(checkAvailability(10, 5, 99), null, 'trop peu d’appels');
  assert.equal(checkAvailability(1000, 5, 99), null, '99,5 % ≥ 99 %');
  assert.match(checkAvailability(100, 5, 99).title, /95/);
});

test('l’API lente alerte au-dessus du seuil seulement', () => {
  assert.equal(checkSlowApi(null, 100, 3000), null);
  assert.equal(checkSlowApi(2500, 100, 3000), null);
  assert.equal(checkSlowApi(5000, 5, 3000), null, 'trop peu d’appels');
  assert.ok(checkSlowApi(4000, 100, 3000));
});

test('la chute du trafic compare hier à la moyenne des 7 jours d’avant', () => {
  assert.equal(checkTrafficDrop(5, [10, 10, 10], 50), null, 'moins de 20 visiteurs par jour : ignoré');
  assert.equal(checkTrafficDrop(60, [100, 100, 100, 100, 100, 100, 100], 50), null, '40 % de baisse');
  assert.match(checkTrafficDrop(40, [100, 100, 100, 100, 100, 100, 100], 50).title, /60 %/);
  assert.equal(checkTrafficDrop(40, [], 50), null);
});

test('la chute des clics Google est ignorée sous 20 clics', () => {
  assert.equal(checkSeoDrop(0, 10, 40), null);
  assert.equal(checkSeoDrop(70, 100, 40), null);
  assert.ok(checkSeoDrop(50, 100, 40));
});

test('le CSV s’ouvre en français dans Excel', () => {
  const csv = toCsv([{ name: 'Page "A"; test', value: 12.5 }, { name: '=SUM(A1)', value: null }], [
    { label: 'Nom', value: (row) => row.name },
    { label: 'Valeur', value: (row) => row.value },
  ]);
  assert.ok(csv.startsWith('﻿'), 'marque d’ordre des octets');
  const lines = csv.slice(1).trim().split('\r\n');
  assert.equal(lines[0], 'Nom;Valeur');
  assert.equal(lines[1], '"Page ""A""; test";12,5');
  assert.equal(lines[2], "'=SUM(A1);", 'pas de formule exécutée');
});

test('le texte du PDF garde les accents français et retire ce que la police ne dessine pas', () => {
  assert.equal(pdfText('Évolution — déjà « ça » l’été'), 'Évolution — déjà « ça » l’été');
  assert.equal(pdfText('a → b ≥ 2 🚀'), 'a -> b >= 2 ');
  assert.equal(pdfText('1 234'), '1 234');
});

test('les bornes d’un mois sont en heure de Brazzaville', () => {
  const range = monthRange('2026-10');
  assert.equal(new Date(range.from).toISOString(), '2026-09-30T23:00:00.000Z');
  assert.equal(new Date(range.to).toISOString(), '2026-10-31T23:00:00.000Z');
  assert.equal(monthRange('2026-13'), null);
  assert.equal(monthRange('octobre'), null);
  assert.equal(previousMonth(Date.parse('2026-11-01T06:00:00Z')), '2026-10');
  assert.equal(previousMonth(Date.parse('2026-01-01T06:00:00Z')), '2025-12');
  assert.equal(previousMonth(Date.parse('2026-10-31T23:30:00Z')), '2026-10', 'déjà le 1er novembre à Brazzaville');
  assert.equal(monthLabel('2026-10'), 'Octobre 2026');
});

test('l’audit SEO signale titres, descriptions et articles incomplets', () => {
  const good = auditPage({ kind: 'article', locale: 'fr', title: 'Comprendre le modèle OSI en 7 couches simples', description: 'Le modèle OSI expliqué couche par couche, avec des exemples concrets du quotidien pour enfin tout comprendre.', path: '/fr/blog/osi', image: '/blog/osi.svg', words: 900, keywords: 4 });
  assert.deepEqual(good.issues, []);
  const bad = auditPage({ kind: 'article', locale: 'en', title: '', description: 'Court', path: '/en/blog/x', image: '', words: 120, keywords: 0, translated: false });
  const texts = bad.issues.map((issue) => issue.text).join(' | ');
  assert.match(texts, /Titre manquant/);
  assert.match(texts, /Description courte/);
  assert.match(texts, /couverture/);
  assert.match(texts, /Texte court/);
  assert.match(texts, /mot-clé/);
  assert.match(texts, /traduit/);
  const summary = auditSummary([good, bad]);
  assert.equal(summary.checked, 2);
  assert.equal(summary.healthy, 1);
  assert.equal(summary.score, 50);
  assert.equal(summary.errors, 1);
  assert.equal(wordCount('# Titre\n\nUn deux trois.\n\n```js\nconst x = 1;\n```'), 4);
});

test('le titre d’un article compte le « | JcHub » que le modèle de page ajoute', () => {
  const page = { kind: 'article', locale: 'fr', description: 'Le modèle OSI expliqué couche par couche, avec des exemples concrets du quotidien pour enfin tout comprendre.', path: '/fr/blog/osi', image: '/blog/osi.svg', words: 900, keywords: 4 };
  const title = 'Comprendre le modèle OSI : rôle et fonctionnement des 7 couches'; // 63 caractères
  assert.deepEqual(auditPage({ ...page, title }).issues, []);
  const withSuffix = auditPage({ ...page, title, titleSuffix: ' | JcHub' });
  assert.match(withSuffix.issues[0].text, /Titre trop long \(71 caractères, avec « \| JcHub »/);
  assert.equal(withSuffix.title, title);
});

test('les opportunités SEO sont les requêtes vues souvent mais peu cliquées', () => {
  const rows = [
    { key: 'déjà bien', clicks: 50, impressions: 400, ctr: 12.5, position: 2 },
    { key: 'opportunité', clicks: 2, impressions: 300, ctr: 0.7, position: 7 },
    { key: 'trop rare', clicks: 0, impressions: 10, ctr: 0, position: 8 },
    { key: 'trop loin', clicks: 0, impressions: 500, ctr: 0, position: 35 },
  ];
  assert.deepEqual(seoOpportunities(rows).map((row) => row.key), ['opportunité']);
});

test('les semaines vont du lundi au dimanche, heure de Brazzaville', async () => {
  const { weekRange, previousWeekStart, weekLabel } = await import('../lib/insights/report-format.ts');
  const range = weekRange('2026-10-26');
  assert.equal(new Date(range.from).toISOString(), '2026-10-25T23:00:00.000Z');
  assert.equal(new Date(range.to).toISOString(), '2026-11-01T23:00:00.000Z');
  assert.equal(weekRange('2026-10-27'), null, 'pas un lundi');
  assert.equal(previousWeekStart(Date.parse('2026-11-02T06:00:00Z')), '2026-10-26', 'lundi matin : la semaine d’avant');
  assert.equal(previousWeekStart(Date.parse('2026-11-08T12:00:00Z')), '2026-10-26', 'dimanche : la semaine d’avant aussi');
  assert.equal(previousWeekStart(Date.parse('2026-11-01T23:30:00Z')), '2026-10-26', 'déjà lundi à Brazzaville');
  assert.equal(weekLabel('2026-10-26'), 'Semaine du 26 octobre au 1 novembre');
});

test('les graphiques Excel sont ajoutés au classeur avec leurs références', async () => {
  const { addChartsToWorkbook, cellRef, chartXml } = await import('../lib/insights/xlsx-charts.ts');
  const { strFromU8, strToU8, unzipSync, zipSync } = await import('fflate');
  assert.equal(cellRef('Évolution', 3, 5, 3, 11), "'Évolution'!$C$5:$C$11");
  assert.equal(cellRef("L'onglet", 28, 1), "'L''onglet'!$AB$1");
  const spec = {
    kind: 'line', title: 'Visiteurs & pages', from: { col: 1, row: 10 }, to: { col: 7, row: 26 },
    series: [{ name: 'Visiteurs', nameRef: cellRef('Évolution', 3, 4), categoriesRef: cellRef('Évolution', 1, 5, 1, 6), valuesRef: cellRef('Évolution', 3, 5, 3, 6), categories: ['lun.', 'mar.'], values: [3, null], color: '2563EB' }],
  };
  const xml = chartXml(spec);
  assert.match(xml, /<c:lineChart>/);
  assert.match(xml, /Visiteurs &amp; pages/, 'texte échappé');
  assert.match(xml, /<c:pt idx="0"><c:v>3<\/c:v><\/c:pt><\/c:numCache>/, 'valeur vide omise');
  const workbook = zipSync({
    '[Content_Types].xml': strToU8('<Types></Types>'),
    'xl/worksheets/sheet1.xml': strToU8('<worksheet xmlns="x"><sheetData/><pageMargins/></worksheet>'),
  });
  const files = unzipSync(addChartsToWorkbook(workbook, 1, [spec, { ...spec, kind: 'bar' }]));
  const sheet = strFromU8(files['xl/worksheets/sheet1.xml']);
  assert.match(sheet, /xmlns:r=/);
  assert.match(sheet, /<pageMargins\/><drawing r:id="rIdJcHubDrawing"\/><\/worksheet>/);
  assert.ok(files['xl/charts/chart1.xml'] && files['xl/charts/chart2.xml']);
  assert.match(strFromU8(files['xl/drawings/_rels/drawing1.xml.rels']), /chart2\.xml/);
  assert.match(strFromU8(files['[Content_Types].xml']), /drawingml\.chart\+xml/);
});

test('a failed cron raises an alert named after the cron', () => {
  assert.equal(checkCronFailure('/api/cron/backup', 200), null);
  assert.equal(checkCronFailure('/api/admin/tools', 500), null);
  const alert = checkCronFailure('/api/cron/publish-social', 503, 'Planificateur social indisponible.');
  assert.match(alert.title, /publish-social/);
  assert.match(alert.message, /503 : Planificateur social indisponible/);
});
