import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { requireCm } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { cmError, requireSameOrigin, writeCmActivity } from '@/lib/cm-server';

const schema = z.object({
  title: z.string().trim().min(1).max(160), description: z.string().max(3000).default(''),
  url: z.string().max(2000).refine((value) => !value || value.startsWith('/') && !value.startsWith('//') || /^https:\/\//i.test(value), 'URL invalide').default(''), objective: z.string().max(500).default(''),
  copy: z.string().max(5000).default(''), platforms: z.array(z.enum(['instagram', 'snapchat'])).min(1).max(2),
  format: z.enum(['publication', 'story', 'video', 'carousel', 'other']), scheduledAt: z.string().datetime().nullable().default(null),
  status: z.enum(['idea', 'to_prepare', 'to_review', 'scheduled', 'published', 'cancelled']).default('idea'),
  publishedUrl: z.string().url().max(2000).or(z.literal('')).default(''), notes: z.string().max(3000).default(''),
}).strict();

export async function GET(request: NextRequest) {
  try {
    await requireCm(request);
    const snap = await getAdminDb().collection('cmEditorial').orderBy('updatedAt', 'desc').limit(200).get();
    return NextResponse.json({ items: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return cmError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireCm(request); requireSameOrigin(request);
    const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: 'Vérifie les champs du contenu.' }, { status: 400 });
    const ref = getAdminDb().collection('cmEditorial').doc();
    await ref.set({ ...parsed.data, createdBy: actor.uid, updatedBy: actor.uid, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    await writeCmActivity(actor.uid, 'editorial.created', ref.id);
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (error) { return cmError(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireCm(request); requireSameOrigin(request);
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id : '';
    const parsed = schema.safeParse(body.data);
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id) || !parsed.success) return NextResponse.json({ error: 'Contenu invalide.' }, { status: 400 });
    const ref = getAdminDb().collection('cmEditorial').doc(id);
    if (!(await ref.get()).exists) return NextResponse.json({ error: 'Contenu introuvable.' }, { status: 404 });
    await ref.update({ ...parsed.data, updatedBy: actor.uid, updatedAt: FieldValue.serverTimestamp() });
    await writeCmActivity(actor.uid, 'editorial.updated', id);
    return NextResponse.json({ saved: true });
  } catch (error) { return cmError(error); }
}
