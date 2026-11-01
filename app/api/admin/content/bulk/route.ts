import { after, NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { revalidateBlog } from '@/lib/live-articles';
import { logSyncError, syncArticleFiles } from '@/lib/article-repository';
import { articleCoverPath } from '@/lib/article-cover';
import { addCoverPhoto } from '@/lib/article-photo';

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
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').replace(/\/$/, '');
    const newlyPublished = action === 'publish' ? snapshots.filter((snapshot) => snapshot.data()?.status !== 'published') : [];
    for (const snapshot of snapshots) {
      const update: Record<string, unknown> = { status, updatedAt: FieldValue.serverTimestamp() };
      if (action === 'publish' && !snapshot.data()?.publishedAt) update.publishedAt = FieldValue.serverTimestamp();
      // Without an image of its own, a newly published article shows the card drawn with its title.
      if (newlyPublished.includes(snapshot) && !snapshot.data()?.image) update.image = `${siteUrl}${articleCoverPath({ title: String(snapshot.data()?.title || ''), category: String(snapshot.data()?.category || '') })}`;
      batch.update(snapshot.ref, update);
    }
    await batch.commit();
    revalidateBlog();
    // Published articles get their cover photo, then their files (withdrawn ones lose them), in a
    // single commit. Photos are looked for one at a time and for 10 articles at most: the Unsplash
    // key allows 50 requests an hour; the others keep the card drawn with their title.
    after(async () => {
      for (const snapshot of newlyPublished.slice(0, 10)) await addCoverPhoto(snapshot.ref);
      await syncArticleFiles(ids).then(() => undefined, logSyncError);
    });
    return NextResponse.json({ updated: ids.length, status });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    const status = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN' ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Accès administrateur requis.' : 'Action groupée impossible.' }, { status });
  }
}
