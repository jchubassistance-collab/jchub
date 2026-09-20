import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function titleFromFileName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\bv\d+\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function categoryFromFileName(fileName: string) {
  const name = fileName.toLowerCase();
  if (/windows|win|cmd|powershell/.test(name)) return 'Windows / CMD';
  if (/linux|ubuntu|debian|bash|shell/.test(name)) return 'Linux';
  if (/reseau|réseau|network|wifi|tcp|ip/.test(name)) return 'Réseaux';
  if (/database|base[- ]de[- ]donnees|sql|firebase|supabase/.test(name)) return 'Bases de données';
  if (/javascript|typescript|react|next|node|python|code|dev/.test(name)) return 'Développement';
  return 'Guides pratiques';
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });

    const formData = await request.formData();
    const description = String(formData.get('description') || '').trim();
    const level = String(formData.get('level') || 'Débutant').trim();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Un fichier PDF est obligatoire.' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Le fichier doit être un PDF.' }, { status: 400 });
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'Le PDF ne doit pas dépasser 20 Mo.' }, { status: 400 });
    const fileHeader = Buffer.from(await file.slice(0, 5).arrayBuffer()).toString('ascii');
    if (fileHeader !== '%PDF-') return NextResponse.json({ error: 'Le fichier reçu n’est pas un PDF valide.' }, { status: 400 });

    const title = titleFromFileName(file.name);
    const category = categoryFromFileName(file.name);
    const slug = slugify(title);
    if (!slug) return NextResponse.json({ error: 'Le titre ne permet pas de créer un identifiant.' }, { status: 400 });

    const documentRef = getAdminDb().collection('guides').doc(slug);
    if ((await documentRef.get()).exists) return NextResponse.json({ error: 'Un guide avec ce titre existe déjà.' }, { status: 409 });

    const resource = await uploadToCloudinary(file, {
      folder: 'jchub/guides',
      publicId: slug,
      resourceType: 'raw',
    });

    await documentRef.set({
      title,
      description: description || `Guide pratique ${category.toLowerCase()} à télécharger gratuitement.`,
      category,
      level,
      format: 'PDF',
      size: `${Math.ceil(file.size / 1024)} Ko`,
      fileName: file.name,
      downloadUrl: resource.secure_url,
      cloudinaryPublicId: resource.public_id,
      status: 'published',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    reportUserError();
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Impossible d’ajouter le guide.' }, { status: 500 });
  }
}
