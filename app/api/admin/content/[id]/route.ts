import { after, NextRequest, NextResponse } from 'next/server';
import { articleCoverPath } from '@/lib/article-cover';
import { isPublicArticleStatus } from '@/lib/article-files';
import { addCoverPhoto } from '@/lib/article-photo';
import { refreshArticle } from '@/lib/article-repository';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { revalidateBlog } from '@/lib/live-articles';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const { id } = await params;
    const snapshot = await getAdminDb().collection('articles').doc(id).get();
    if (!snapshot.exists) return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 });
    const data = snapshot.data() || {};
    return NextResponse.json({ id, content: String(data.content || '') });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    const status = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN' ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Accès administrateur requis.' : 'Impossible de charger cet article.' }, { status });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const { id } = await params;
    const body = await request.json() as { title?: string; slug?: string; description?: string; category?: string; content?: string; status?: string };
    const reference = getAdminDb().collection('articles').doc(id);
    const snapshot = await reference.get();
    if (!snapshot.exists) return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 });
    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (body.title !== undefined) update.title = String(body.title).trim().slice(0, 180);
    if (body.description !== undefined) { update.description = String(body.description).trim().slice(0, 500); update.excerpt = String(body.description).trim().slice(0, 500); }
    if (body.category !== undefined) update.category = String(body.category).trim().slice(0, 80);
    if (body.content !== undefined) update.content = String(body.content);
    if (body.slug !== undefined) {
      const slug = String(body.slug).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
      if (!slug) return NextResponse.json({ error: 'Le slug est invalide.' }, { status: 400 });
      const existing = await getAdminDb().collection('articles').where('slug', '==', slug).get();
      if (existing.docs.some((doc) => doc.id !== id)) return NextResponse.json({ error: 'Ce slug est déjà utilisé.' }, { status: 409 });
      update.slug = slug;
    }
    const publishing = body.status === 'published' && snapshot.data()?.status !== 'published';
    if (body.status !== undefined) {
      if (!['draft', 'published', 'archived'].includes(body.status)) return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 });
      if (body.status === 'published' && !(String(body.content ?? snapshot.data()?.content ?? '').trim())) return NextResponse.json({ error: 'Ajoute le contenu avant de publier.' }, { status: 400 });
      update.status = body.status;
      if (body.status === 'published' && !snapshot.data()?.publishedAt) update.publishedAt = FieldValue.serverTimestamp();
      // Without an image of its own, the article shows the card drawn with its title, as from the writing space.
      if (publishing && !snapshot.data()?.image) {
        const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').replace(/\/$/, '');
        update.image = `${siteUrl}${articleCoverPath({ title: String(update.title ?? snapshot.data()?.title ?? ''), category: String(update.category ?? snapshot.data()?.category ?? '') })}`;
      }
    }
    await reference.update(update);
    // Edited or newly published text gets its English version refreshed. A draft saved again
    // has no file to update; an article published, edited or withdrawn has its files rewritten.
    const translate = body.title !== undefined || body.description !== undefined || body.content !== undefined || body.status === 'published';
    const sync = isPublicArticleStatus(snapshot.data()?.status) || isPublicArticleStatus(body.status ?? snapshot.data()?.status);
    if (sync) revalidateBlog();
    if (translate || sync) after(async () => {
      if (publishing) await addCoverPhoto(reference);
      await refreshArticle(id, { translate, sync });
    });
    return NextResponse.json({ id, ok: true });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    const status = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN' ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Accès administrateur requis.' : 'Impossible de modifier cet article.' }, { status });
  }
}
