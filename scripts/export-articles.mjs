// Copies the published and scheduled articles of Firestore into content/articles, the files the
// site reads. Firestore is only read; files of articles that are no longer public are removed.
// Usage: npm run articles:export
import fs from 'node:fs';
import path from 'node:path';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ARTICLES_DIRECTORY, buildArticleFiles } from '../lib/article-files.ts';

/** Rebuilds the PEM key whatever the way its line breaks were saved in .env. */
function privateKey(raw = '') {
  const body = raw.replace(/\\n/g, '').replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/[^A-Za-z0-9+/=]/g, '');
  return `-----BEGIN PRIVATE KEY-----\n${(body.match(/.{1,64}/g) ?? []).join('\n')}\n-----END PRIVATE KEY-----\n`;
}

for (const name of ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY']) {
  if (!process.env[name]) throw new Error(`Variable ${name} manquante dans .env`);
}
initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: privateKey(process.env.FIREBASE_PRIVATE_KEY) }) });

const snapshot = await getFirestore().collection('articles').where('status', 'in', ['published', 'scheduled']).get();
const wanted = {};
for (const document of snapshot.docs) {
  const files = buildArticleFiles(document.id, document.data());
  if (!Object.keys(files).length) console.log(`! ${document.id} : ignoré (sans contenu ou identifiant non valide)`);
  Object.assign(wanted, files);
}

let written = 0;
let removed = 0;
for (const directory of [ARTICLES_DIRECTORY, `${ARTICLES_DIRECTORY}/en`]) {
  fs.mkdirSync(directory, { recursive: true });
  for (const name of fs.readdirSync(directory).filter((file) => file.endsWith('.md'))) {
    const file = `${directory}/${name}`;
    if (!(file in wanted)) { fs.rmSync(file); removed += 1; console.log(`- ${file}`); }
  }
}
for (const [file, text] of Object.entries(wanted)) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : null;
  if (current === text) continue;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
  written += 1;
  console.log(`${current === null ? '+' : '~'} ${file}`);
}

const english = Object.keys(wanted).filter((file) => file.startsWith(`${ARTICLES_DIRECTORY}/en/`)).length;
console.log(`\n${snapshot.size} article(s) dans Firestore, ${english} avec leur version anglaise. ${written} fichier(s) écrit(s), ${removed} supprimé(s).`);
process.exit(0);
