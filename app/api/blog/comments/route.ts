import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { apiMessage } from '@/lib/api-messages';
import { getPublishedArticles } from '@/lib/blog';
import { cleanComment, commentProblem, COMMENT_LIMITS, type BlogComment } from '@/lib/blog-comments';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { enforceRateLimit } from '@/lib/rate-limit';
import { requestLocale } from '@/i18n/request-locale';
import { reportUserError } from '@/lib/user-error';
import { withReport } from '@/lib/reports/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Comments of an article, in the blog_comments collection. They are found by the article id,
 * so its French and English pages share one thread. A comment is published at once; the
 * admin removes unwanted ones from the inbox (/admin/inbox, Commentaires tab).
 */

const MAX_SHOWN = 200;
const articleIdSchema = z.string().trim().min(1).max(160).regex(/^[a-z0-9-]+$/);
const postSchema = z.object({
  articleId: articleIdSchema,
  name: z.string().max(COMMENT_LIMITS.name * 2),
  message: z.string().max(COMMENT_LIMITS.message * 2),
  // Hidden field: people leave it empty, spam robots fill it in.
  website: z.string().max(200).optional(),
}).strict();

const noStore = { 'Cache-Control': 'no-store' };

async function publishedArticle(id: string) {
  return (await getPublishedArticles('fr')).find((article) => article.id === id) || null;
}

export const GET = withReport(async function GET(request: NextRequest) {
  const articleId = articleIdSchema.safeParse(request.nextUrl.searchParams.get('article'));
  if (!articleId.success) return NextResponse.json({ error: apiMessage(request, 'Article introuvable.') }, { status: 400 });
  if (!hasFirebaseAdminConfig()) return NextResponse.json({ comments: [] }, { headers: noStore });
  try {
    const snapshot = await getAdminDb().collection('blog_comments').where('articleId', '==', articleId.data).limit(MAX_SHOWN).get();
    const comments: BlogComment[] = snapshot.docs
      .map((document) => {
        const data = document.data();
        return { id: document.id, name: String(data.name || ''), message: String(data.message || ''), createdAt: data.createdAt?.toDate?.()?.toISOString() || null };
      })
      .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    return NextResponse.json({ comments }, { headers: noStore });
  } catch (error) {
    reportUserError(error, { request, details: { article: articleId.data } });
    return NextResponse.json({ error: apiMessage(request, 'Impossible de charger les commentaires.') }, { status: 503 });
  }
});

export const POST = withReport(async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'blog-comment', 3, 10 * 60_000);
  if (limited) return limited;
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: apiMessage(request, 'Vérifie les champs du formulaire.') }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 201 });

  const problem = commentProblem(parsed.data);
  if (problem) {
    const message = problem === 'name' ? 'Indique un nom de 2 à 60 caractères.'
      : problem === 'links' ? 'Ton commentaire contient trop de liens (2 au maximum).'
        : 'Ton commentaire doit faire entre 3 et 2000 caractères.';
    return NextResponse.json({ error: apiMessage(request, message) }, { status: 400 });
  }
  if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: apiMessage(request, 'Les commentaires sont momentanément indisponibles.') }, { status: 503 });

  try {
    const article = await publishedArticle(parsed.data.articleId);
    if (!article) return NextResponse.json({ error: apiMessage(request, 'Article introuvable.') }, { status: 404 });
    const { name, message } = cleanComment(parsed.data);
    const reference = await getAdminDb().collection('blog_comments').add({
      articleId: article.id,
      articleSlug: article.slug,
      name,
      message,
      locale: requestLocale(request),
      createdAt: FieldValue.serverTimestamp(),
    });
    const comment: BlogComment = { id: reference.id, name, message, createdAt: new Date().toISOString() };
    return NextResponse.json({ comment }, { status: 201, headers: noStore });
  } catch (error) {
    reportUserError(error, { request, details: { article: parsed.data.articleId } });
    return NextResponse.json({ error: apiMessage(request, 'Impossible de publier ton commentaire pour le moment.') }, { status: 503 });
  }
});
