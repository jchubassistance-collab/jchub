import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/admin-auth';
import { getPublishedTools } from '@/lib/tools';
import { getGa4Overview } from '@/lib/ga4';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

   const adminDb = getAdminDb();

    const [users, articles, drafts, runs, publishedTools, articleViews, pendingMessages, analytics] = await Promise.all([
      adminDb.collection('users').get(),
      adminDb.collection('articles').get(),
      adminDb.collection('agent_drafts').get(),
      adminDb.collection('agent_runs').get(),
      getPublishedTools(),
      adminDb.collection('blog_articles').get(),
      adminDb.collection('contact_messages').where('status', '==', 'new').get(),
      getGa4Overview().catch(() => ({ configured: false as const })),
    ]);

    const viewsBySlug = new Map(articleViews.docs.map((document) => [document.id, Number(document.data().views || 0)]));
    const articleViewRows = articles.docs
      .filter((article) => article.data().status === 'published')
      .map((article) => ({
        slug: String(article.data().slug || article.id),
        title: String(article.data().title || article.id),
        views: viewsBySlug.get(String(article.data().slug || article.id)) || 0,
      }))
      .sort((first, second) => second.views - first.views);

    const recentUsers = users.docs
      .map((user) => {
        const data = user.data();
        return {
          uid: user.id,
          email: data.email || '',
          createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
          createdAtMillis: data.createdAt?.toMillis?.() ?? 0,
        };
      })
      .filter((user) => user.email)
      .sort((a, b) => b.createdAtMillis - a.createdAtMillis)
      .slice(0, 5)
      .map(({ createdAtMillis: _createdAtMillis, ...user }) => user);

    const recentArticles = articles.docs
      .map((article) => {
        const data = article.data();
        return {
          id: article.id,
          title: String(data.title || article.id),
          status: String(data.status || 'draft'),
          publishedAt: data.publishedAt?.toDate?.().toISOString() || null,
          publishedAtMillis: data.publishedAt?.toMillis?.() || 0,
        };
      })
      .filter((article) => article.status === 'published')
      .sort((first, second) => second.publishedAtMillis - first.publishedAtMillis)
      .slice(0, 5)
      .map(({ publishedAtMillis: _publishedAtMillis, ...article }) => article);

    const recentRun = runs.docs
      .map((run) => {
        const data = run.data();
        return {
          date: String(data.date || run.id),
          status: String(data.status || 'unknown'),
          createdAt: data.createdAt?.toDate?.().toISOString() || null,
          createdAtMillis: data.createdAt?.toMillis?.() || 0,
        };
      })
      .sort((first, second) => second.createdAtMillis - first.createdAtMillis)[0] || null;

    const publishedDates = articles.docs.filter((article) => article.data().status === 'published').map((article) => article.data().publishedAt?.toDate?.()).filter((date): date is Date => date instanceof Date);
    const publishedByDay = new Map<string, number>();
    const publishedByMonth = new Map<string, number>();
    const publishedByYear = new Map<string, number>();
    const now = Date.now();
    const currentWindowStart = now - 28 * 24 * 60 * 60 * 1000;
    const previousWindowStart = now - 56 * 24 * 60 * 60 * 1000;
    const currentPeriodPublications = publishedDates.filter((date) => date.getTime() >= currentWindowStart && date.getTime() <= now).length;
    const previousPeriodPublications = publishedDates.filter((date) => date.getTime() >= previousWindowStart && date.getTime() < currentWindowStart).length;
    for (const date of publishedDates) {
      const day = date.toISOString().slice(0, 10);
      const month = day.slice(0, 7);
      const year = day.slice(0, 4);
      publishedByDay.set(day, (publishedByDay.get(day) || 0) + 1);
      publishedByMonth.set(month, (publishedByMonth.get(month) || 0) + 1);
      publishedByYear.set(year, (publishedByYear.get(year) || 0) + 1);
    }

    return NextResponse.json({
      totalUsers: users.size,
      totalArticles: articles.docs.filter((article) => article.data().status === 'published').length,
      totalDrafts: drafts.docs.filter((draft) => ['draft', 'approved'].includes(String(draft.data().status || 'draft'))).length,
      approvedDrafts: drafts.docs.filter((draft) => draft.data().status === 'approved').length,
      pendingMessages: pendingMessages.size,
      totalTools: publishedTools.length,
      totalArticleViews: articleViewRows.reduce((total, article) => total + article.views, 0),
      articleViews: articleViewRows.slice(0, 10),
      recentArticles,
      recentRun: recentRun ? { date: recentRun.date, status: recentRun.status, createdAt: recentRun.createdAt } : null,
      recentUsers,
      recentDrafts: drafts.docs.map((draft) => ({ id: draft.id, title: String(draft.data().title || 'Brouillon IA'), status: String(draft.data().status || 'draft'), createdAt: draft.data().createdAt?.toDate?.().toISOString() || null })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5),
      contentTrends: {
        configured: analytics.configured,
        dailyViews: analytics.configured ? analytics.dailyViews : [],
        monthlyViews: analytics.configured ? analytics.monthlyViews : [],
        yearlyViews: analytics.configured ? analytics.yearlyViews : [],
        publishedByDay: Object.fromEntries(publishedByDay),
        publishedByMonth: Object.fromEntries(publishedByMonth),
        publishedByYear: Object.fromEntries(publishedByYear),
        currentPeriodPublications,
        previousPeriodPublications,
        currentPeriodViews: analytics.configured ? analytics.currentPeriodViews : null,
        previousPeriodViews: analytics.configured ? analytics.previousPeriodViews : null,
      },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    const status = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN' ? 401 : 500;
    return NextResponse.json({ error: 'Accès administrateur requis.' }, { status });
  }
}
