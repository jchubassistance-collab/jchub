import { existsSync, readFileSync, readdirSync, rmSync, mkdtempSync, statSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { v2 as cloudinary } from 'cloudinary';

const CLOUDINARY_FILE_LIMIT = 95 * 1024 * 1024;
const CHAPTER_SECONDS = 30 * 60;

function loadEnvironmentFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

function slugify(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

function uploadLarge(source, options) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(source, {
      ...options,
      chunk_size: 20 * 1024 * 1024
    }, (error, result) => error || !result ? reject(error || new Error('Cloudinary error.')) : resolve(result));
  });
}

function splitLargeAudio(source, slug) {
  const stats = statSync(source);
  if (stats.size <= CLOUDINARY_FILE_LIMIT) return { files: [source], temporaryDirectory: null };

  const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
  const temporaryDirectory = mkdtempSync(join(tmpdir(), `jchub-${slug}-`));
  if (!existsSync(temporaryDirectory)) mkdirSync(temporaryDirectory, { recursive: true });

  const output = join(temporaryDirectory, 'chapitre-%03d.mp3');
  
  console.log(`Traitement de : ${slug} (${Math.round(stats.size / 1024 / 1024)} Mo)...`);
  
  // Suppression de shell: true pour éviter les problèmes d'échappement des espaces
  const conversion = spawnSync(ffmpeg, [
    '-y',
    '-i', source,
    '-vn',
    '-acodec', 'libmp3lame',
    '-b:a', '96k',
    '-map', '0:a',
    '-f', 'segment',
    '-segment_time', String(CHAPTER_SECONDS),
    '-reset_timestamps', '1',
    output
  ], { stdio: 'inherit' });

  if (conversion.error || conversion.status !== 0) {
     console.error('Erreur FFmpeg ou fichier introuvable.');
     throw new Error('Erreur FFmpeg lors du traitement.');
  }

  const files = readdirSync(temporaryDirectory)
    .filter((file) => file.endsWith('.mp3'))
    .sort()
    .map((file) => join(temporaryDirectory, file));

  return { files, temporaryDirectory };
}

async function run() {
  loadEnvironmentFile(resolve(process.cwd(), '.env.local'));
  const manifestPath = resolve(process.cwd(), process.argv[2] || 'data/audiobooks.json');
  
  const app = getApps()[0] ?? initializeApp({ 
    credential: cert({ 
      projectId: process.env.FIREBASE_PROJECT_ID, 
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL, 
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    }) 
  });
  const db = getFirestore(app);
  cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });

  const entries = JSON.parse(readFileSync(manifestPath, 'utf8'));
  for (const entry of entries) {
    const title = entry.title || 'Sans titre';
    const slug = slugify(title);
    const source = resolve(process.cwd(), entry.source);
    
    const reference = db.collection('books').doc(slug);
    const doc = await reference.get();
    if (doc.exists) continue;

    let temporaryDirectory = null;
    try {
      const prepared = splitLargeAudio(source, slug);
      temporaryDirectory = prepared.temporaryDirectory;
      const chapters = [];
      let coverUrl = null;

      for (let index = 0; index < prepared.files.length; index++) {
        console.log(`Upload segment ${index + 1}/${prepared.files.length} : ${title}`);
        const result = await uploadLarge(prepared.files[index], {
          resource_type: 'video', 
          folder: 'jchub/books/audio', 
          public_id: `${slug}-chapter-${index + 1}`,
          eager: index === 0 ? [{ width: 600, height: 800, crop: 'fill', format: 'webp' }] : undefined
        });
        
        if (index === 0) coverUrl = result.eager?.[0]?.secure_url || null;
        chapters.push({
          index: index + 1,
          url: result.secure_url,
          publicId: result.public_id,
          durationSeconds: result.duration,
          fileSize: result.bytes
        });
      }

      await reference.set({
        ...entry,
        slug,
        pricing: Number(entry.priceXAF || 0) > 0 ? 'paid' : 'free',
        oneTimePriceXAF: Number(entry.priceXAF || 0),
        audioStatus: 'available',
        audioChapters: chapters,
        cover: coverUrl,
        totalChapters: chapters.length,
        status: 'available',
        importedAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Importé : ${title}`);
    } catch (err) {
      console.error(`Echec : ${title}`, err.message);
    } finally {
      if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  }
}

run().catch(console.error);