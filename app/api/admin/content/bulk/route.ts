import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const body = await request.json().catch(() => null) as { ids?: unknown; action?: string } | null;
    const ids = Array.isArray(body?.ids) ? body.ids.filter((id): id is string => typeof id === 'string' && id.length > 0).filter((id, index, all) => all.indexOf(id) === index) : [];
    const action = body?.action;
    if (!ids.length || ids.length > 450 || !['publish', 'draft', 'archive'].includes(String(action))) return NextResponse.json({ error: 'Sélection ou action invalide.' }, { status: 400 });
    const db = getAdminDb();
    const refs = ids.map((id) => db.collection('articles').doc(id));
    const snapshots = await db.getAll(...refs);
    if (snapshots.some((snapshot) => !snapshot.exists)) return NextResponse.json({ error: 'Un ou plusieurs articles sont introuvables.' }, { status: 404 });
    if (action === 'publish' && snapshots.some((snapshot) => !String(snapshot.data()?.content || '').trim())) return NextResponse.json({ error: 'Tous les articles sélectionnés doivent avoir un contenu avant publication.' }, { status: 400 });
    const batch = db.batch();
    const status = action === 'publish' ? 'published' : action === 'draft' ? 'draft' : 'archived';
    for (const snapshot of snapshots) {
      const update: Record<string, unknown> = { status, updatedAt: FieldValue.serverTimestamp() };
      if (action === 'publish' && !snapshot.data()?.publishedAt) update.publishedAt = FieldValue.serverTimestamp();
      batch.update(snapshot.ref, update);
    }
    await batch.commit();
    return NextResponse.json({ updated: ids.length, status });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    const status = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN' ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Accès administrateur requis.' : 'Action groupée impossible.' }, { status });
  }
}
