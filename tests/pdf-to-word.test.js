import test from 'node:test';
import assert from 'node:assert';

import { buildWordDocumentFromText } from '../lib/pdf-to-word.ts';

test('crée un document DOCX à partir du texte extrait', async () => {
  const buffer = await buildWordDocumentFromText('Bonjour JcHub\nCe fichier a été converti depuis PDF.');

  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.length > 1000);
  assert.match(buffer.toString('ascii', 0, 8), /PK/);
});
