import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function loadEnvironmentFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

const defaultTools = [
  {
    slug: 'generateur-mot-de-passe',
    name: 'Générateur de mot de passe sécurisé',
    description: 'Génère des mots de passe forts et aléatoires personnalisés.',
    category: 'Sécurité',
    icon: '🔐',
    component: 'PasswordGenerator',
    status: 'published',
    seo: {
      title: 'Générateur de mot de passe sécurisé gratuit — JcHub',
      description: 'Crée des mots de passe forts et aléatoires en un clic.',
      keywords: ['générateur mot de passe', 'password generator', 'sécurisé'],
    },
  },
  {
    slug: 'json-formatter',
    name: 'JSON Formatter & Validator',
    description: 'Formate, valide et minifie ton JSON en temps réel.',
    category: 'Développement',
    icon: '📋',
    component: 'JsonFormatter',
    status: 'published',
    seo: {
      title: 'JSON Formatter & Validator gratuit — JcHub',
      description: 'Formate et valide ton code JSON instantanément.',
      keywords: ['json formatter', 'json validator'],
    },
  },
  {
    slug: 'base64-encoder',
    name: 'Base64 Encoder / Decoder',
    description: 'Encode ou décode du texte en Base64.',
    category: 'Encodage',
    icon: '🔄',
    component: 'Base64Tool',
    status: 'published',
    seo: {
      title: 'Base64 Encoder / Decoder en ligne — JcHub',
      description: 'Encode et décode du texte en Base64 gratuitement.',
      keywords: ['base64 encoder', 'base64 decoder'],
    },
  },
  {
    slug: 'uuid-generator',
    name: 'UUID Generator',
    description: 'Génère des UUID v1, v4 et v7 en masse.',
    category: 'Développement',
    icon: '🆔',
    component: 'UuidGenerator',
    status: 'published',
    seo: {
      title: 'UUID Generator gratuit (v1, v4, v7) — JcHub',
      description: 'Génère des UUID v1, v4, v7 en masse.',
      keywords: ['uuid generator', 'générateur uuid'],
    },
  },
  {
    slug: 'regex-tester',
    name: 'Regex Tester visuel',
    description: 'Teste tes expressions régulières avec highlighting en temps réel.',
    category: 'Développement',
    icon: '🎯',
    component: 'RegexTester',
    status: 'published',
    seo: {
      title: 'Regex Tester en ligne gratuit — JcHub',
      description: 'Teste et débugge tes expressions régulières avec highlighting.',
      keywords: ['regex tester', 'tester regex'],
    },
  },
  {
    slug: 'convertisseur-couleurs',
    name: 'Convertisseur de couleurs',
    description: 'Convertis les couleurs entre HEX, RGB, HSL et autres formats.',
    category: 'Design',
    icon: '🎨',
    component: 'ColorConverter',
    status: 'published',
    seo: {
      title: 'Convertisseur de couleurs HEX RGB HSL — JcHub',
      description: 'Convertis facilement tes couleurs entre HEX, RGB et HSL.',
      keywords: ['convertisseur couleur', 'hex rgb', 'hsl'],
    },
  },
  {
    slug: 'generateur-de-hash',
    name: 'Générateur de hash',
    description: 'Génère des empreintes MD5, SHA-1, SHA-256 et SHA-512.',
    category: 'Sécurité',
    icon: '#️⃣',
    component: 'HashGenerator',
    status: 'published',
    seo: {
      title: 'Générateur de hash MD5 et SHA en ligne — JcHub',
      description: 'Génère des hash MD5, SHA-1, SHA-256 et SHA-512 directement dans ton navigateur.',
      keywords: ['générateur hash', 'md5', 'sha256'],
    },
  },
  {
    slug: 'decodeur-jwt',
    name: 'Décodeur JWT',
    description: 'Décode et inspecte le header et le payload de tes tokens JWT.',
    category: 'Développement',
    icon: '🔑',
    component: 'JwtDecoder',
    status: 'published',
    seo: {
      title: 'Décodeur JWT en ligne gratuit — JcHub',
      description: 'Décode et inspecte rapidement tes tokens JSON Web Token.',
      keywords: ['jwt decoder', 'décodeur jwt', 'json web token'],
    },
  },
  {
    slug: 'apercu-markdown',
    name: 'Aperçu Markdown',
    description: 'Prévisualise ton Markdown en temps réel et exporte le HTML.',
    category: 'Développement',
    icon: '📝',
    component: 'MarkdownPreview',
    status: 'published',
    seo: {
      title: 'Aperçu Markdown en ligne — JcHub',
      description: 'Écris et prévisualise ton Markdown en temps réel dans ton navigateur.',
      keywords: ['markdown preview', 'éditeur markdown', 'markdown html'],
    },
  },
  {
    slug: 'convertisseur-de-bases',
    name: 'Convertisseur de bases numériques',
    description: 'Convertis des nombres entre les bases binaire, octale, décimale et hexadécimale.',
    category: 'Développement',
    icon: '🔢',
    component: 'NumberBaseConverter',
    status: 'published',
    seo: {
      title: 'Convertisseur binaire, décimal, hexadécimal — JcHub',
      description: 'Convertis instantanément des nombres entre les bases 2, 8, 10 et 16.',
      keywords: ['convertisseur base', 'binaire décimal', 'hexadécimal'],
    },
  },
  {
    slug: 'generateur-de-qr-code',
    name: 'Générateur de QR code',
    description: 'Crée et télécharge des QR codes à partir de texte ou d’une URL.',
    category: 'Productivité',
    icon: '📱',
    component: 'QrCodeGenerator',
    status: 'published',
    seo: {
      title: 'Générateur de QR code gratuit — JcHub',
      description: 'Crée gratuitement des QR codes personnalisés à télécharger.',
      keywords: ['générateur qr code', 'qrcode gratuit', 'qr url'],
    },
  },
  {
    slug: 'convertisseur-timestamp',
    name: 'Convertisseur Timestamp',
    description: 'Convertis des timestamps Unix en dates et inversement.',
    category: 'Développement',
    icon: '🕒',
    component: 'TimestampConverter',
    status: 'published',
    seo: {
      title: 'Convertisseur Timestamp Unix en ligne — JcHub',
      description: 'Convertis des timestamps Unix en dates lisibles et inversement.',
      keywords: ['timestamp converter', 'unix timestamp', 'convertisseur date'],
    },
  },
  {
    slug: 'encodeur-url',
    name: 'Encodeur / Décodeur URL',
    description: 'Encode ou décode des URL et paramètres en toute simplicité.',
    category: 'Encodage',
    icon: '🔗',
    component: 'UrlEncoder',
    status: 'published',
    seo: {
      title: 'Encodeur et décodeur URL en ligne — JcHub',
      description: 'Encode et décode rapidement des URL et leurs paramètres.',
      keywords: ['url encoder', 'url decoder', 'encodeur url'],
    },
  },
];

async function run() {
  loadEnvironmentFile(resolve(process.cwd(), '.env.local'));

  const app = getApps()[0] ?? initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });

  const db = getFirestore(app);

  const legacySlugs = [
    'generateur-de-mot-de-passe-securise',
    'json-formatter-validator',
    'base64-encoder-decoder',
    'regex-tester-visuel',
  ];

  for (const legacySlug of legacySlugs) {
    const legacyRef = db.collection('tools').doc(legacySlug);
    if ((await legacyRef.get()).exists) {
      await legacyRef.delete();
      console.log(`Supprimé ancien slug: ${legacySlug}`);
    }
  }

  for (const tool of defaultTools) {
    const slug = tool.slug || slugify(tool.name);
    const ref = db.collection('tools').doc(slug);
    const existing = await ref.get();
    await ref.set({
      slug,
      ...tool,
      tags: tool.tags || [],
      ...(existing.exists ? {} : { createdAt: new Date() }),
      updatedAt: new Date(),
    }, { merge: true });
    console.log(`${existing.exists ? '↻ Mis à jour' : '✔ Importé'}: ${tool.name} -> ${slug}`);
  }

  console.log('Import Firestore tools terminé.');
}

run().catch((error) => {
  console.error('Erreur import tools:', error);
  process.exit(1);
});
