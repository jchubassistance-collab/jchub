import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

function loadEnvironmentFile(filePath) {
  if (!existsSync(filePath)) return;

  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes('@')) {
  console.error('Usage : npm run create-admin -- email@exemple.com');
  process.exit(1);
}

loadEnvironmentFile(resolve(process.cwd(), '.env.local'));

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error('Variables Firebase Admin manquantes dans .env.local.');
  process.exit(1);
}

const app = getApps()[0] ?? initializeApp({
  credential: cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const auth = getAuth(app);
const db = getFirestore(app);

try {
  const user = await auth.getUserByEmail(email);

  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email: user.email ?? email,
    displayName: user.displayName ?? email.split('@')[0],
    role: 'admin',
    adminRoleAssignedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // Utile pour les futures routes protégées par des custom claims Firebase.
  await auth.setCustomUserClaims(user.uid, { admin: true });

  console.log(`Administrateur configuré : ${user.email} (uid: ${user.uid})`);
  console.log('Déconnecte-toi puis reconnecte-toi afin de rafraîchir le token Firebase.');
} catch (error) {
  const message = error instanceof Error ? error.message : 'Erreur inconnue';
  console.error(`Impossible de créer l’administrateur : ${message}`);
  process.exit(1);
}
