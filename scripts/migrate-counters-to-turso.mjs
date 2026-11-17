// Copies the counters kept in Firestore to Turso (November 2026), where the site now writes them:
//   blog_articles/{slug} + days/{day}  →  article_views (slug, day, lang, views)
//   stats/pdf_to_word, stats/word_to_pdf  →  counters (tool_uses:…)
//   nav_search_terms  →  search_terms (day, term, count)
// Firestore is only read: nothing is changed or deleted there. Turso values are SET, not added,
// so running the script again gives the same result (no duplicates).
// Usage: node --env-file=.env scripts/migrate-counters-to-turso.mjs          (dry run: shows what it would write)
//        node --env-file=.env scripts/migrate-counters-to-turso.mjs --write  (writes, then checks every total)
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createClient } from '@libsql/client';

const write = process.argv.includes('--write');
/** Day of the views counted before the per-day detail existed: kept so every total matches. */
const HISTORY_DAY = '0000-00-00';

function privateKey(raw = '') {
  const body = raw.replace(/\\n/g, '').replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/[^A-Za-z0-9+/=]/g, '');
  return `-----BEGIN PRIVATE KEY-----\n${(body.match(/.{1,64}/g) ?? []).join('\n')}\n-----END PRIVATE KEY-----\n`;
}
const clean = (value = '') => value.trim().replace(/^["']|["']$/g, '');

for (const name of ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN']) {
  if (!process.env[name]) throw new Error(`Variable ${name} manquante dans .env`);
}
initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: privateKey(process.env.FIREBASE_PRIVATE_KEY) }) });
const firestore = getFirestore();
const turso = createClient({ url: clean(process.env.TURSO_DATABASE_URL), authToken: clean(process.env.TURSO_AUTH_TOKEN) });

// Tables, as lib/insights/db.ts creates them (in case no page created them yet).
await turso.batch([
  'CREATE TABLE IF NOT EXISTS article_views (slug TEXT NOT NULL, day TEXT NOT NULL, lang TEXT NOT NULL, views INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (slug, day, lang))',
  'CREATE TABLE IF NOT EXISTS search_terms (day TEXT NOT NULL, term TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, term))',
  'CREATE TABLE IF NOT EXISTS counters (name TEXT PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0, updated INTEGER NOT NULL)',
], 'write');

// 1. Article views
const viewRows = [];
const expectedTotals = new Map();
const articles = await firestore.collection('blog_articles').get();
for (const article of articles.docs) {
  const slug = article.id;
  const total = Number(article.data().views || 0);
  expectedTotals.set(slug, total);
  const days = await article.ref.collection('days').get();
  let counted = 0;
  for (const day of days.docs) {
    const data = day.data();
    const views = Number(data.views || 0);
    const en = Math.min(views, Number(data.en || 0));
    const date = String(data.date || day.id);
    if (views - en > 0) viewRows.push([slug, date, 'fr', views - en]);
    if (en > 0) viewRows.push([slug, date, 'en', en]);
    counted += views;
  }
  if (total > counted) viewRows.push([slug, HISTORY_DAY, 'all', total - counted]);
}

// 2. Tool counters
const counterRows = [];
for (const [document, name] of [['pdf_to_word', 'tool_uses:pdf_to_word'], ['word_to_pdf', 'tool_uses:word_to_pdf']]) {
  const snapshot = await firestore.collection('stats').doc(document).get();
  if (snapshot.exists) counterRows.push([name, Number(snapshot.data().totalUses || 0)]);
}

// 3. Search terms
const termRows = (await firestore.collection('nav_search_terms').get()).docs
  .map((document) => document.data())
  .filter((data) => data.term && data.date)
  .map((data) => [String(data.date), String(data.term), Number(data.count || 0)]);

console.log(`Vues d'articles : ${articles.size} article(s), ${viewRows.length} ligne(s), ${[...expectedTotals.values()].reduce((a, b) => a + b, 0)} vue(s) au total`);
console.log(`Compteurs d'outils : ${counterRows.map(([name, value]) => `${name} = ${value}`).join(', ') || 'aucun'}`);
console.log(`Termes de recherche : ${termRows.length} ligne(s)`);
if (!write) {
  console.log('\nVérification à blanc : rien n’a été écrit. Ajoute --write pour copier.');
  process.exit(0);
}

const statements = [
  ...viewRows.map(([slug, day, lang, views]) => ({ sql: 'INSERT INTO article_views (slug, day, lang, views) VALUES (?, ?, ?, ?) ON CONFLICT(slug, day, lang) DO UPDATE SET views = excluded.views', args: [slug, day, lang, views] })),
  ...counterRows.map(([name, value]) => ({ sql: 'INSERT INTO counters (name, value, updated) VALUES (?, ?, ?) ON CONFLICT(name) DO UPDATE SET value = MAX(counters.value, excluded.value), updated = excluded.updated', args: [name, value, Date.now()] })),
  ...termRows.map(([day, term, count]) => ({ sql: 'INSERT INTO search_terms (day, term, count) VALUES (?, ?, ?) ON CONFLICT(day, term) DO UPDATE SET count = excluded.count', args: [day, term, count] })),
];
for (let start = 0; start < statements.length; start += 200) await turso.batch(statements.slice(start, start + 200), 'write');

// Check: every article total, every counter and the sum of searches must match Firestore.
const problems = [];
const totals = await turso.execute('SELECT slug, SUM(views) AS views FROM article_views GROUP BY slug');
const turso_totals = new Map(totals.rows.map((row) => [String(row.slug), Number(row.views)]));
for (const [slug, expected] of expectedTotals) {
  if ((turso_totals.get(slug) ?? 0) < expected) problems.push(`${slug} : Firestore ${expected}, Turso ${turso_totals.get(slug) ?? 0}`);
}
for (const [name, value] of counterRows) {
  const row = (await turso.execute({ sql: 'SELECT value FROM counters WHERE name = ?', args: [name] })).rows[0];
  if (Number(row?.value ?? -1) < value) problems.push(`${name} : Firestore ${value}, Turso ${row?.value}`);
}
const searches = Number((await turso.execute('SELECT SUM(count) AS n FROM search_terms')).rows[0]?.n ?? 0);
const expectedSearches = termRows.reduce((sum, row) => sum + row[2], 0);
if (searches < expectedSearches) problems.push(`recherches : Firestore ${expectedSearches}, Turso ${searches}`);

console.log(problems.length ? `\n${problems.length} écart(s) :\n- ${problems.join('\n- ')}` : `\nCopie vérifiée : ${expectedTotals.size} total(aux) d’articles, ${counterRows.length} compteur(s) et ${expectedSearches} recherche(s) identiques à Firestore.`);
process.exit(problems.length ? 1 : 0);
