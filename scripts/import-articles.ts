import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import matter from 'gray-matter';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

type Frontmatter = {
  title?: string;
  description?: string;
  slug?: string;
  keywords?: unknown;
  author?: string;
  date?: string;
  category?: string;
  readingTime?: string;
};

function loadEnvironmentFile(filePath: string) {
  if (!existsSync(filePath)) return;
  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`[BLOG] Variable ${name} manquante`);
  return value;
}

function excerpt(content: string) {
  const plainText = content.replace(/```[\s\S]*?```/g, '').replace(/[#>*_`\[\]()!-]/g, '').replace(/\s+/g, ' ').trim();
  return plainText.length > 150 ? `${plainText.slice(0, 147)}...` : plainText;
}

function readTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

async function run() {
  loadEnvironmentFile(resolve(process.cwd(), '.env.local'));
  const app = getApps()[0] ?? initializeApp({ credential: cert({
    projectId: required('FIREBASE_PROJECT_ID'),
    clientEmail: required('FIREBASE_CLIENT_EMAIL'),
    privateKey: required('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
  }) });
  const db = getFirestore(app);
  const files = readdirSync(resolve(process.cwd(), 'content/blog')).filter((file) => /^\d{2}-.+\.md$/.test(file)).sort();
  const now = new Date();

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const source = readFileSync(resolve(process.cwd(), 'content/blog', file), 'utf8');
    const parsed = matter(source);
    const data = parsed.data as Frontmatter;
    const slug = String(data.slug || file.replace(/\.md$/, ''));
    const ref = db.collection('articles').doc(slug);
    if ((await ref.get()).exists) {
      console.log(`[BLOG] Déjà présent: ${slug}`);
      continue;
    }

    const published = index < 5;
    const scheduledFor = new Date(now);
    scheduledFor.setDate(now.getDate() + Math.ceil((index - 4) * 7));
    const keywords = Array.isArray(data.keywords) ? data.keywords.map(String) : [];
    await ref.set({
      slug,
      title: String(data.title || slug),
      description: String(data.description || ''),
      content: parsed.content.trim(),
      excerpt: excerpt(parsed.content),
      keywords,
      category: String(data.category || 'Développement'),
      author: String(data.author || 'JcHub'),
      image: `/blog/${file.replace(/\.md$/, '.svg')}`,
      status: published ? 'published' : 'scheduled',
      ...(published ? { publishedAt: now } : { scheduledFor }),
      readTime: String(data.readingTime || readTime(parsed.content)),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`[BLOG] Importé: ${slug} (${published ? 'published' : 'scheduled'})`);
  }
}

run().catch((error: unknown) => {
  console.error('Une erreur est survenue. Veuillez réessayer.');
  process.exitCode = 1;
});
