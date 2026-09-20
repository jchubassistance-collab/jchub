import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });

    const [articlesSnapshot, draftsSnapshot] = await Promise.all([
      getAdminDb().collection('articles').where('status', '==', 'published').get(),
      getAdminDb().collection('agent_drafts').orderBy('createdAt', 'desc').limit(10).get(),
    ]);

    const articles = articlesSnapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        slug: String(data.slug || document.id),
        title: String(data.title || 'Article sans titre'),
        description: String(data.description || data.excerpt || ''),
        category: String(data.category || 'Développement'),
        publishedAt: data.publishedAt?.toDate?.()?.toISOString() || null,
      };
    }).sort((first, second) => (second.publishedAt || '').localeCompare(first.publishedAt || ''));

    const drafts = draftsSnapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        title: String(data.title || 'Brouillon sans titre'),
        status: String(data.status || 'draft'),
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({ articles, drafts });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    const status = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN' ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Accès administrateur requis.' : 'Impossible de charger le contenu.' }, { status });
  }
}
