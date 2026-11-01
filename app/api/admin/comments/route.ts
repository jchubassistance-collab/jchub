import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { getPublishedArticles } from '@/lib/blog';
import type { AdminBlogComment } from '@/lib/blog-comments';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Comments of the blog articles, newest first, for the Commentaires tab of /admin/inbox. */

const deleteSchema = z.object({ commentId: z.string().min(1).max(160) }).strict();

function errorResponse(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  const status = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' ? 401 : 500;
  return NextResponse.json({ error: status === 403 ? 'Accès refusé.' : status === 401 ? 'Authentification administrateur requise.' : 'Les commentaires sont indisponibles.' }, { status });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const [snapshot, articles] = await Promise.all([
      getAdminDb().collection('blog_comments').orderBy('createdAt', 'desc').limit(500).get(),
      getPublishedArticles('fr'),
    ]);
    const titles = new Map(articles.map((article) => [article.id, article.title]));
    const comments: AdminBlogComment[] = snapshot.docs.map((document) => {
      const data = document.data();
      const articleId = String(data.articleId || '');
      return {
        id: document.id,
        name: String(data.name || ''),
        message: String(data.message || ''),
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        articleId,
        articleSlug: String(data.articleSlug || articleId),
        articleTitle: titles.get(articleId) || 'Article retiré du blog',
        locale: String(data.locale || 'fr'),
      };
    });
    return NextResponse.json({ comments }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Commentaire invalide.' }, { status: 400 });
    await getAdminDb().collection('blog_comments').doc(parsed.data.commentId).delete();
    return NextResponse.json({ success: true });
  } catch (error) { return errorResponse(error); }
}
