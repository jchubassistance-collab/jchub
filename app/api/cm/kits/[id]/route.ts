import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { requireCm } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { cmError, requireSameOrigin, writeCmActivity } from '@/lib/cm-server';
import { readPhoto, trackPhotoDownload } from '@/lib/photos';

const text = z.string().trim();
const hashtags = z.array(z.string().trim().min(2).max(40)).min(1).max(8);
const saveSchema = z.object({ action: z.literal('save'), imageTitle: text.min(3).max(64), imageSubtitle: text.min(3).max(150), instagramCaption: text.min(30).max(2200), instagramHashtags: hashtags, facebookCaption: text.min(20).max(1000), facebookHashtags: hashtags }).strict();
const statusSchema = z.object({ action: z.literal('status'), status: z.enum(['ready', 'published']) }).strict();
const photoSchema = z.object({ action: z.literal('photo'), photo: z.unknown() }).strict();

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireCm(request); requireSameOrigin(request);
    const { id } = await context.params;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return NextResponse.json({ error: 'Kit invalide.' }, { status: 400 });
    const body = await request.json();
    const save = saveSchema.safeParse(body);
    const status = statusSchema.safeParse(body);
    const photoChange = photoSchema.safeParse(body);
    const photo = photoChange.success ? readPhoto(photoChange.data.photo) : null;
    if (!save.success && !status.success && !photo) return NextResponse.json({ error: 'Vérifie les champs du kit.' }, { status: 400 });
    const ref = getAdminDb().collection('cmKits').doc(id);
    if (!(await ref.get()).exists) return NextResponse.json({ error: 'Kit introuvable.' }, { status: 404 });
    if (photo) {
      await trackPhotoDownload(photo);
      await ref.update({ photo, updatedBy: actor.uid, updatedAt: FieldValue.serverTimestamp() });
      await writeCmActivity(actor.uid, 'kit.photo', id);
    } else if (save.success) {
      await ref.update({ ...save.data, updatedBy: actor.uid, updatedAt: FieldValue.serverTimestamp() });
      await writeCmActivity(actor.uid, 'kit.updated', id);
    } else if (status.success) {
      await ref.update({ status: status.data.status, updatedBy: actor.uid, updatedAt: FieldValue.serverTimestamp() });
      await writeCmActivity(actor.uid, `kit.${status.data.status}`, id);
    }
    return NextResponse.json({ saved: true });
  } catch (error) { return cmError(error); }
}
