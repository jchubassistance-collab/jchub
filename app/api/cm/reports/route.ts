import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { requireCm } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { cmError, requireSameOrigin, writeCmActivity } from '@/lib/cm-server';

const number = z.number().finite().min(0).max(1_000_000_000);
const schema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  platform: z.enum(['instagram', 'facebook']), followersStart: number.nullable(), followersEnd: number.nullable(),
  planned: number, published: number, views: number.nullable(), reach: number.nullable(), reactions: number.nullable(),
  comments: number.nullable(), shares: number.nullable(), saves: number.nullable(), clicks: number.nullable(),
  bestPost: z.string().max(1000), bestPostUrl: z.string().url().max(2000).or(z.literal('')), observations: z.string().max(5000),
}).strict().refine((value) => value.weekStart <= value.weekEnd, 'Dates invalides');

export async function GET(request: NextRequest) {
  try {
    await requireCm(request);
    const snap = await getAdminDb().collection('cmReports').orderBy('weekStart', 'desc').limit(160).get();
    return NextResponse.json({ reports: snap.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, ...data, platform: data.platform === 'snapchat' ? 'facebook' : data.platform };
    }) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return cmError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireCm(request); requireSameOrigin(request);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Valeurs de rapport invalides.' }, { status: 400 });
    const value = parsed.data;
    const id = `${value.platform}_${value.weekStart}`;
    const ref = getAdminDb().collection('cmReports').doc(id);
    const exists = (await ref.get()).exists;
    await ref.set({ ...value, submittedBy: actor.uid, ...(exists ? {} : { createdAt: FieldValue.serverTimestamp() }), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await writeCmActivity(actor.uid, exists ? 'report.updated' : 'report.created', id);
    return NextResponse.json({ id, updated: exists }, { status: exists ? 200 : 201 });
  } catch (error) { return cmError(error); }
}
