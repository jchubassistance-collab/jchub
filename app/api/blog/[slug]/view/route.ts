import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { getPublishedArticles } from '@/lib/blog';
import { reportUserError } from '@/lib/user-error';
import { enforceRateLimit } from '@/lib/rate-limit';
import { withReport } from '@/lib/reports/server';
import { requestLocale } from '@/i18n/request-locale';

export const POST = withReport(async function POST(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const limited = await enforceRateLimit(_request, 'blog-view', 30, 60_000);
  if (limited) return limited;
  const { slug } = await params;
  if (!hasFirebaseAdminConfig()) return NextResponse.json({ views: null }, { status: 503 });
  try {
    // Only a published article's French slug gets a counter: any other value would add a stray
    // document to blog_articles, which the admin pages read in full.
    if (!/^[a-z0-9-]{1,160}$/.test(slug) || !(await getPublishedArticles('fr')).some((article) => article.slugs.fr === slug)) {
      return NextResponse.json({ views: null }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }
    const ref = getAdminDb().collection('blog_articles').doc(slug);
    // The day's count, per language, draws the curves of the writing space (/api/redaction/performance).
    const day = new Date().toISOString().slice(0, 10);
    await Promise.all([
      ref.set({ slug, views: FieldValue.increment(1), updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
      ref.collection('days').doc(day).set({ date: day, views: FieldValue.increment(1), [requestLocale(_request)]: FieldValue.increment(1) }, { merge: true }),
    ]);
    const snapshot = await ref.get();
    return NextResponse.json({ views: Number(snapshot.data()?.views || 0) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    reportUserError(error, { request: _request, details: { article: slug } });
    return NextResponse.json({ views: null }, { status: 503 });
  }
});
