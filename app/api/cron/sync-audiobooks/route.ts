import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

function titleFromFileName(value: string) {
  return value.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
    const db = getAdminDb();
    const result = await cloudinary.api.resources({ resource_type: 'video', type: 'upload', prefix: 'jchub/books/audio/', max_results: 100 });
    let created = 0;

    for (const audio of result.resources || []) {
      const existing = await db.collection('books').where('audioPublicId', '==', audio.public_id).limit(1).get();
      if (!existing.empty) continue;
      const title = titleFromFileName(String(audio.original_filename || audio.public_id).split('/').pop() || 'Livre audio');
      const slug = slugify(title) || `audio-${Date.now()}`;
      const reference = db.collection('books').doc(slug);
      if ((await reference.get()).exists) continue;

      await reference.set({
        slug, title, author: 'À renseigner', description: '', longDescription: '', category: 'Autre', tags: [], tags_array: [], language: 'fr',
        totalPages: 0, totalChapters: 1, estimatedAudioHours: Math.round((Number(audio.duration || 0) / 3600) * 10) / 10,
        difficulty: 'intermediate', rights: 'original', rightsNote: 'À confirmer', pricing: 'paid', oneTimePriceXAF: 999,
        pdfPublicId: null, pdfUrl: null, coverPublicId: null, cover: null,
        audioStatus: 'available', audioUrl: audio.secure_url, audioPublicId: audio.public_id, audioDurationSeconds: audio.duration || null, audioFileSize: audio.bytes || null, audioFormat: audio.format || null,
        status: 'draft', isFeatured: false, importedByCron: true, createdAt: new Date(), updatedAt: new Date(),
      });
      created += 1;
    }
    return NextResponse.json({ success: true, scanned: result.resources?.length || 0, draftsCreated: created });
  } catch (error) {
    console.error('Erreur cron audio:', error);
    return NextResponse.json({ success: false, error: 'Synchronisation impossible.' }, { status: 500 });
  }
}
