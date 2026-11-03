import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { viewsBySlug } from '@/lib/writer-articles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const db = getAdminDb();
    const [articlesSnapshot, draftsSnapshot] = await Promise.all([
      db.collection('articles').get(),
      db.collection('agent_drafts').orderBy('createdAt', 'desc').get(),
    ]);
    // Only the counters of these articles, not the whole blog_articles collection.
    const views = await viewsBySlug(articlesSnapshot.docs.map((document) => String(document.data().slug || document.id)));
    const articles = articlesSnapshot.docs.map((document) => {
      const data = document.data();
      const slug = String(data.slug || document.id);
      return {
        id: document.id,
        slug,
        title: String(data.title || 'Article sans titre'),
        description: String(data.description || data.excerpt || ''),
        category: String(data.category || 'Développement'),
        status: String(data.status || 'draft'),
        author: String(data.author || 'JcHub'),
        image: typeof data.image === 'string' ? data.image : '',
        views: views.get(slug) || 0,
        publishedAt: data.publishedAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    }).sort((a, b) => (b.publishedAt || b.updatedAt || '').localeCompare(a.publishedAt || a.updatedAt || ''));
    const drafts = draftsSnapshot.docs.map((document) => {
      const data = document.data();
      return { id: document.id, title: String(data.title || 'Brouillon IA'), status: String(data.status || 'draft'), createdAt: data.createdAt?.toDate?.()?.toISOString() || null };
    });
    return NextResponse.json({ articles, drafts });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    const status = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN' ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Accès administrateur requis.' : 'Impossible de charger le contenu.' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const id = `article-${Date.now()}`;
    await getAdminDb().collection('articles').doc(id).set({ slug: id, title: 'Nouvel article', description: '', excerpt: '', content: '', category: 'Développement', author: 'JcHub', status: 'draft', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    const status = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN' ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Accès administrateur requis.' : 'Impossible de créer l’article.' }, { status });
  }
}
