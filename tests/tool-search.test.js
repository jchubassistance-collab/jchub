import test from 'node:test';
import assert from 'node:assert/strict';
import { findToolsByKeywords } from '../lib/tool-search.ts';

const tool = (slug, name, tags, description = '') => ({ slug, name, description, category: 'Développement', icon: '🛠️', tags, component: 'X', seo: { title: name, description, keywords: [] } });
const catalog = [
  tool('generateur-mot-de-passe', 'Générateur de mot de passe', ['mot de passe', 'sécurité', 'password'], 'Crée des mots de passe robustes.'),
  tool('compresser-pdf', 'Compresser un PDF', ['pdf', 'réduire la taille de pdf'], 'Réduit le poids de tes PDF.'),
  tool('decodeur-jwt', 'Décodeur JWT', ['jwt', 'token', 'authentification'], 'Décode un JSON Web Token.'),
  tool('api-cost-calculator', 'API Cost Calculator', ['api', 'coût api'], 'Estime le coût de tes appels API.'),
  tool('generateur-qr', 'Générateur de QR code', ['qr code', 'code qr de wifi'], 'Crée un QR code.'),
  tool('pdf-to-word', 'PDF vers Word', ['pdf', 'word', 'docx'], 'Convertis un PDF en Word.'),
];
const slugs = (result) => result.tools.map((item) => item.slug);

test('les mots vides comme « de » ne font plus remonter d’outils hors sujet', () => {
  const result = findToolsByKeywords('je veux savoir à quel moment précis expire ma session de connexion', catalog);
  assert.deepEqual(slugs(result), []);
  assert.equal(result.confident, false);
});

test('une demande précise est servie directement par le catalogue', () => {
  assert.deepEqual(findToolsByKeywords('jwt', catalog), { tools: [catalog[2]], confident: true });
  const password = findToolsByKeywords('générer un mot de passe', catalog);
  assert.equal(slugs(password)[0], 'generateur-mot-de-passe');
  assert.equal(password.confident, true);
  assert.deepEqual(slugs(findToolsByKeywords('qr code wifi', catalog)), ['generateur-qr']);
  assert.equal(slugs(findToolsByKeywords('convertir un pdf en word', catalog))[0], 'pdf-to-word');
});

test('une longue phrase avec un seul mot reconnu est laissée à l’IA', () => {
  const result = findToolsByKeywords('comment rendre lisible un jeton d’authentification reçu par une API', catalog);
  assert.equal(result.confident, false);
  assert.ok(result.tools.length > 0, 'les correspondances restent disponibles en secours');
});

test('ne garde que les outils proches du meilleur résultat', () => {
  const result = findToolsByKeywords('compresser pdf', catalog);
  assert.equal(slugs(result)[0], 'compresser-pdf');
  assert.ok(!slugs(result).includes('generateur-mot-de-passe'));
});

test('le sens de conversion de la demande passe en premier', () => {
  const converters = [
    tool('excel-vers-csv', 'Excel vers CSV', ['excel', 'csv']),
    tool('csv-vers-excel', 'CSV vers Excel', ['csv', 'excel']),
  ];
  assert.deepEqual(slugs(findToolsByKeywords('transformer mon fichier csv pour excel', converters)), ['csv-vers-excel', 'excel-vers-csv']);
  assert.deepEqual(slugs(findToolsByKeywords('exporter un excel en csv', converters)), ['excel-vers-csv', 'csv-vers-excel']);
});

test('une salutation ou des mots vides seuls ne déclenchent rien', () => {
  assert.deepEqual(findToolsByKeywords('bonjour, tu peux m’aider ?', catalog), { tools: [], confident: false });
  assert.deepEqual(findToolsByKeywords('de la', catalog), { tools: [], confident: false });
});
