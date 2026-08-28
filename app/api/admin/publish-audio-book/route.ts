import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

async function uploadCover(buffer: Buffer, publicId: string) {
  return new Promise<{ publicId: string; secureUrl: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', public_id: publicId, overwrite: false, eager: [{ width: 600, height: 800, crop: 'fill', gravity: 'auto', format: 'webp' }] },
      (error, result) => error || !result ? reject(error || new Error('Couverture indisponible.')) : resolve({ publicId: result.public_id, secureUrl: result.eager?.[0]?.secure_url || result.secure_url })
    );
    stream.end(buffer);
  });
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const db = getAdminDb();

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary n’est pas configuré.');
    }
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });

    const formData = await request.formData();
    const metadata = JSON.parse(String(formData.get('metadata') || '{}'));
    const title = String(metadata.title || '').trim();
    const author = String(metadata.author || '').trim();
    const slug = slugify(title);
    const audioPublicId = String(formData.get('audioPublicId') || '').trim();
    if (!title || !author || !slug) throw new Error('Le titre et l’auteur sont obligatoires.');
    if (!audioPublicId || audioPublicId !== `jchub/books/audio/${slug}-full`) throw new Error('Le fichier audio est invalide ou manquant.');
    if (/\bguide\b/i.test(`${title} ${metadata.category || ''}`)) throw new Error('Un guide ne peut pas être publié comme livre audio.');
    if ((await db.collection('books').doc(slug).get()).exists) throw new Error('Un livre avec ce titre existe déjà.');

    const audio = await cloudinary.api.resource(audioPublicId, { resource_type: 'video' });
    const coverValue = formData.get('cover');
    let cover: { publicId: string; secureUrl: string } | null = null;
    if (coverValue instanceof File) {
      if (!coverValue.type.startsWith('image/') || coverValue.size > 5 * 1024 * 1024) throw new Error('La couverture doit être une image de 5 MB maximum.');
      cover = await uploadCover(Buffer.from(await coverValue.arrayBuffer()), `jchub/books/covers/${slug}`);
    }

    const document = {
      slug, title, author, description: String(metadata.description || ''), longDescription: String(metadata.longDescription || ''),
      category: String(metadata.category || 'Autre'), tags: Array.isArray(metadata.tags) ? metadata.tags : [], tags_array: Array.isArray(metadata.tags) ? metadata.tags : [],
      language: String(metadata.language || 'fr'), totalPages: 0, estimatedAudioHours: Number(metadata.estimatedAudioHours || (Number(audio.duration || 0) / 3600).toFixed(1)),
      difficulty: metadata.difficulty || 'intermediate', totalChapters: Number(metadata.totalChapters || 1), rights: metadata.suggestedRights || 'original',
      rightsNote: 'Œuvre originale', pricing: 'freemium', oneTimePriceXAF: 999, pdfPublicId: null, pdfUrl: null,
      coverPublicId: cover?.publicId || null, cover: cover?.secureUrl || null,
      audioStatus: 'available', audioUrl: audio.secure_url, audioPublicId: audio.public_id, audioDurationSeconds: audio.duration || null, audioFileSize: audio.bytes || null, audioFormat: audio.format || null,
      status: 'available', isFeatured: false, uploadedBy: admin.id, uploadedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
      originalFileName: audio.original_filename || `${slug}.${audio.format || 'mp3'}`, originalFileSize: audio.bytes || 0,
    };
    await db.collection('books').doc(slug).set(document);
    await db.collection('admin_logs').add({ action: 'audio_book_publish', adminUid: admin.id, bookSlug: slug, bookTitle: title, timestamp: new Date(), audio: { cloudinaryPublicId: audio.public_id, fileSize: audio.bytes, duration: audio.duration } });
    return NextResponse.json({ success: true, bookId: slug, bookSlug: slug, metadata: document, message: `Livre audio "${title}" publié avec succès !` }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur publication livre audio:', error);
    const status = error?.message === 'UNAUTHORIZED' ? 401 : error?.message === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ success: false, error: error?.message || 'Impossible de publier le livre audio.' }, { status });
  }
}
