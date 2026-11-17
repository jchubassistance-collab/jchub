// Désactive la double authentification d'un administrateur (téléphone perdu et plus de code de secours).
// À la prochaine connexion, le compte devra scanner un nouveau QR code.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function loadEnvironmentFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes('@')) {
  console.error('Usage : npm run reset-admin-2fa -- email@exemple.com');
  process.exit(1);
}

loadEnvironmentFile(resolve(process.cwd(), '.env.local'));
loadEnvironmentFile(resolve(process.cwd(), '.env'));

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error('Variables Firebase Admin manquantes dans .env.local et .env.');
  process.exit(1);
}

const app = getApps()[0] ?? initializeApp({
  credential: cert({ projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }),
});

try {
  const user = await getAuth(app).getUserByEmail(email);
  await getFirestore(app).collection('adminSecurity').doc(user.uid).delete();
  // Les sessions ouvertes sont fermées : celui qui aurait le téléphone ne garde pas l'accès.
  await getAuth(app).revokeRefreshTokens(user.uid);
  console.log(`Double authentification réinitialisée pour ${user.email}. Reconnecte-toi pour scanner un nouveau QR code.`);
} catch (error) {
  console.error(`Réinitialisation impossible : ${error instanceof Error ? error.message : 'erreur inconnue'}`);
  process.exit(1);
}
