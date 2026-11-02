import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { requireWriter } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { getGa4ArticleStats } from '@/lib/ga4';
import { reportUserError } from '@/lib/user-error';
import { toWriterSummary, viewsBySlug, writerError } from '@/lib/writer-articles';
import { articlePaths, dayKey, foldShares, fromGaDate, periodDays, PERFORMANCE_RANGES, type ArticlePerformance, type Lang, type PerformanceRange, type WriterPerformance } from '@/lib/writer-performance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Figures of the writer's published articles over 7, 30 or 90 days. Google Analytics gives the
 * views per day, readers, reading time, devices, channels and countries; the site's counters
 * the views since publication; blog_comments the comments. Kept 30 minutes per writer and
 * period, since Google Analytics only changes once a day.
 */

function isoDate(value: unknown): string | null {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') return (value.toDate() as Date).toISOString();
  return typeof value === 'string' && value ? value : null;
}

async function commentsOf(ids: string[]) {
  const db = getAdminDb();
  const chunks = Array.from({ length: Math.ceil(ids.length / 30) }, (_, index) => ids.slice(index * 30, index * 30 + 30));
  const snapshots = await Promise.all(chunks.map((chunk) => db.collection('blog_comments').where('articleId', 'in', chunk).get()));
  return snapshots.flatMap((snapshot) => snapshot.docs.map((document) => ({ articleId: String(document.data().articleId || ''), createdAt: isoDate(document.data().createdAt) })));
}

/** Views per day and language counted by the blog (blog_articles/{slug}/days), from `since`. */
async function siteDailyViews(articles: { id: string; slug: string }[], since: string) {
  const db = getAdminDb();
  const snapshots = await Promise.all(articles.map(({ slug }) => db.collection('blog_articles').doc(slug).collection('days').where('date', '>=', since).get()));
  return snapshots.flatMap((snapshot, index) => snapshot.docs.map((document) => {
    const data = document.data();
    const views = Number(data.views || 0);
    const en = Number(data.en || 0);
    return { id: articles[index].id, date: String(data.date || document.id), en, fr: Math.max(0, views - en) };
  }));
}

async function computePerformance(uid: string, days: PerformanceRange): Promise<WriterPerformance> {
  const snapshot = await getAdminDb().collection('articles').where('authorUid', '==', uid).get();
  const docs = snapshot.docs.filter((document) => document.data().publishedAt);
  const allDays = periodDays(days);
  const previousStart = periodDays(days * 2)[0];

  // Every page of every article, to read Google Analytics rows back to their article and language.
  const pageOwner = new Map<string, { id: string; lang: Lang }>();
  for (const document of docs) {
    const data = document.data();
    const english = (data.translations as { en?: { slug?: string } } | undefined)?.en?.slug;
    for (const { path, lang } of articlePaths(String(data.slug || document.id), english)) pageOwner.set(path, { id: document.id, lang });
  }

  const [allTime, comments, analytics] = await Promise.all([
    viewsBySlug(docs.map((document) => String(document.data().slug || document.id))),
    docs.length ? commentsOf(docs.map((document) => document.id)) : Promise.resolve([]),
    getGa4ArticleStats(Array.from(pageOwner.keys()), days).catch((error) => {
      reportUserError(error, { action: 'Statistiques Google Analytics de l’espace rédaction' });
      return null;
    }),
  ]);

  const dayIndex = new Map(allDays.map((day, index) => [day, index]));
  const daily = allDays.map((date) => ({ date, fr: 0, en: 0, comments: 0 }));
  const articles = new Map<string, ArticlePerformance>(docs.map((document) => {
    const summary = toWriterSummary(document.id, document.data());
    return [document.id, {
      id: document.id, title: summary.title, slug: summary.slug, image: summary.image, status: summary.status, publishedAt: summary.publishedAt,
      words: summary.words, readTime: String(document.data().readTime || ''), allTimeViews: allTime.get(summary.slug) || 0,
      views: 0, previousViews: 0, fr: 0, en: 0, readers: 0, readSeconds: 0, comments: 0, trend: allDays.map(() => 0),
    }];
  }));

  for (const row of analytics?.daily || []) {
    const owner = pageOwner.get(row.path);
    const index = dayIndex.get(fromGaDate(row.date));
    if (!owner || index === undefined) continue;
    daily[index][owner.lang] += row.views;
    articles.get(owner.id)!.trend[index] += row.views;
  }
  const engagement = new Map<string, number>();
  for (const row of analytics?.pages || []) {
    const owner = pageOwner.get(row.path);
    if (!owner) continue;
    const article = articles.get(owner.id)!;
    article.views += row.views;
    article[owner.lang] += row.views;
    article.readers += row.readers;
    engagement.set(owner.id, (engagement.get(owner.id) || 0) + row.engagementSeconds);
  }
  for (const row of analytics?.previousPages || []) {
    const owner = pageOwner.get(row.path);
    if (owner) articles.get(owner.id)!.previousViews += row.views;
  }
  for (const article of Array.from(articles.values())) article.readSeconds = article.views ? (engagement.get(article.id) || 0) / article.views : 0;

  // Without Google Analytics, the site's own daily counters draw the curves (from November 2026).
  const useAnalytics = Boolean(analytics?.configured);
  if (!useAnalytics) {
    const counters = await siteDailyViews(docs.map((document) => ({ id: document.id, slug: String(document.data().slug || document.id) })), previousStart);
    for (const { id, date, fr, en } of counters) {
      const article = articles.get(id);
      if (!article) continue;
      const index = dayIndex.get(date);
      if (index !== undefined) {
        daily[index].fr += fr; daily[index].en += en;
        article.trend[index] += fr + en; article.views += fr + en; article.fr += fr; article.en += en;
      } else if (date < allDays[0]) article.previousViews += fr + en;
    }
  }

  let previousComments = 0;
  for (const comment of comments) {
    const day = comment.createdAt ? dayKey(new Date(comment.createdAt)) : '';
    const index = dayIndex.get(day);
    if (index !== undefined) {
      daily[index].comments += 1;
      const article = articles.get(comment.articleId);
      if (article) article.comments += 1;
    } else if (day >= previousStart && day < allDays[0]) previousComments += 1;
  }

  const list = Array.from(articles.values()).sort((a, b) => b.views - a.views || b.allTimeViews - a.allTimeViews);
  const now = new Date();
  const monthly = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    return { month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, count: 0 };
  });
  for (const article of list) {
    const month = article.publishedAt?.slice(0, 7);
    const slot = monthly.find((item) => item.month === month);
    if (slot) slot.count += 1;
  }

  const totals = analytics?.totals;
  return {
    analytics: useAnalytics,
    days,
    start: allDays[0],
    end: allDays[allDays.length - 1],
    totals: {
      views: useAnalytics ? totals?.views || 0 : list.reduce((sum, article) => sum + article.views, 0),
      previousViews: list.reduce((sum, article) => sum + article.previousViews, 0),
      readers: totals?.readers || 0,
      readSeconds: totals?.views ? totals.engagementSeconds / totals.views : 0,
      comments: daily.reduce((sum, day) => sum + day.comments, 0),
      previousComments,
      allTimeViews: list.reduce((sum, article) => sum + article.allTimeViews, 0),
      published: list.filter((article) => article.status === 'published').length,
    },
    daily,
    articles: list,
    devices: foldShares(analytics?.devices || [], 3),
    channels: foldShares(analytics?.channels || [], 5),
    countries: foldShares(analytics?.countries || [], 6),
    monthly,
    computedAt: now.toISOString(),
  };
}

const cachedPerformance = unstable_cache(computePerformance, ['writer-performance'], { revalidate: 1800 });

export async function GET(request: NextRequest) {
  try {
    const writer = await requireWriter(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const asked = Number(request.nextUrl.searchParams.get('jours'));
    const days = (PERFORMANCE_RANGES as readonly number[]).includes(asked) ? asked as PerformanceRange : 30;
    return NextResponse.json(await cachedPerformance(writer.uid, days), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return writerError(error, request); }
}
