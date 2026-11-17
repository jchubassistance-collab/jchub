import 'server-only';

import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { audienceBreakdown, audienceTotals, collectionInfo, dailyAudience, heatmap, hourlyCandles, ranges, sources, toolStats, type Range } from '@/lib/insights/queries';
import { percentChange } from '@/lib/dashboard-health';
import { listErrors } from '@/lib/reports/read';
import { tools } from '@/lib/tools';
import { getPublishedArticlesByLocale } from '@/lib/blog';
import { apiHealth, articleStats, conversionStats, liveStats, webVitals } from '@/lib/insights/queries-batch2';

/** Data of each Control Center page (app/admin/insights), built from lib/insights/queries.ts. */

const DAY = 86400_000;
export const INSIGHT_PERIODS = [7, 28, 90, 365];

/** Every day of the period, Brazzaville time (UTC+1), so the curves have no gaps. */
function periodDays(days: number, now = Date.now()): string[] {
  return Array.from({ length: days }, (_, index) => new Date(now - (days - 1 - index) * DAY + 3600_000).toISOString().slice(0, 10));
}
const localDay = (time: number) => new Date(time + 3600_000).toISOString().slice(0, 10);

function series(days: string[], values: Map<string, number>) {
  return days.map((day) => ({ day, value: values.get(day) ?? 0 }));
}

async function firestoreDaily(collection: 'newsletter_subscribers' | 'contact_messages', from: number) {
  if (!hasFirebaseAdminConfig()) return new Map<string, number>();
  const field = collection === 'newsletter_subscribers' ? 'confirmedAt' : 'createdAt';
  const snapshot = await getAdminDb().collection(collection).where(field, '>=', Timestamp.fromMillis(from)).select(field).get();
  const counts = new Map<string, number>();
  for (const document of snapshot.docs) {
    const time = (document.get(field) as { toMillis?: () => number } | undefined)?.toMillis?.();
    if (time) counts.set(localDay(time), (counts.get(localDay(time)) ?? 0) + 1);
  }
  return counts;
}

export async function overview(days: number) {
  const { current, previous } = ranges(days);
  const dayList = periodDays(days);
  const [daily, now, before, newsletter, messages, errorList, info] = await Promise.all([
    dailyAudience(current),
    audienceTotals(current),
    audienceTotals(previous),
    firestoreDaily('newsletter_subscribers', previous.from).catch(() => new Map<string, number>()),
    firestoreDaily('contact_messages', previous.from).catch(() => new Map<string, number>()),
    listErrors({ period: days <= 7 ? '7d' : '30d', page: 1, pageSize: 1000, filters: {} }).catch(() => null),
    collectionInfo(),
  ]);
  const pick = (key: 'visitors' | 'pageviews' | 'uses') => new Map(daily.map((row) => [row.day, row[key]]));
  const duration = new Map(daily.map((row) => [row.day, Math.round(row.duration)]));
  const bounce = new Map(daily.map((row) => [row.day, row.visits ? Number(((row.bounces / row.visits) * 100).toFixed(1)) : 0]));
  const errors = new Map<string, number>();
  // Production only: errors raised while developing locally are not the site's.
  for (const error of (errorList?.items ?? []).filter((item) => !item.env)) errors.set(localDay(error.at), (errors.get(localDay(error.at)) ?? 0) + 1);
  const sumIn = (values: Map<string, number>, range: { from: number; to: number }) => Array.from(values.entries()).filter(([day]) => day >= localDay(range.from) && day <= localDay(range.to)).reduce((total, [, value]) => total + value, 0);
  const today = localDay(Date.now());
  const yesterday = localDay(Date.now() - DAY);
  return {
    info,
    cards: [
      { key: 'visitors', label: 'Visiteurs', value: now.visitors, change: percentChange(now.visitors, before.visitors), series: series(dayList, pick('visitors')) },
      { key: 'pageviews', label: 'Pages vues', value: now.pageviews, change: percentChange(now.pageviews, before.pageviews), series: series(dayList, pick('pageviews')) },
      { key: 'duration', label: 'Durée moyenne', unit: 's', value: now.duration, change: percentChange(now.duration, before.duration), series: series(dayList, duration) },
      { key: 'bounce', label: 'Taux de rebond', unit: '%', inverse: true, value: now.bounceRate, change: percentChange(now.bounceRate, before.bounceRate), series: series(dayList, bounce) },
      { key: 'tools', label: 'Utilisations d’outils', value: now.toolUses, change: percentChange(now.toolUses, before.toolUses), series: series(dayList, pick('uses')) },
      { key: 'newsletter', label: 'Inscrits newsletter', value: sumIn(newsletter, current), change: percentChange(sumIn(newsletter, current), sumIn(newsletter, previous)), series: series(dayList, newsletter) },
      { key: 'messages', label: 'Messages de contact', value: sumIn(messages, current), change: percentChange(sumIn(messages, current), sumIn(messages, previous)), series: series(dayList, messages) },
      { key: 'errors', label: 'Erreurs du jour', inverse: true, value: errors.get(today) ?? 0, change: percentChange(errors.get(today) ?? 0, errors.get(yesterday) ?? 0), changeLabel: 'vs hier', series: series(dayList.slice(-Math.min(days, 30)), errors) },
    ],
  };
}

export async function traffic(days: number) {
  const { current } = ranges(days);
  const [daily, origin, breakdown, heat, candles, info] = await Promise.all([
    dailyAudience(current), sources(current), audienceBreakdown(current), heatmap(current), hourlyCandles(current), collectionInfo(),
  ]);
  const byDay = new Map(daily.map((row) => [row.day, row]));
  return {
    info,
    daily: periodDays(days).map((day) => ({ day, visitors: byDay.get(day)?.visitors ?? 0, pageviews: byDay.get(day)?.pageviews ?? 0 })),
    sources: origin,
    ...breakdown,
    heatmap: heat,
    candles,
  };
}

export async function toolsSection(days: number) {
  const { current } = ranges(days);
  const [stats, info] = await Promise.all([toolStats(current), collectionInfo()]);
  const names = Object.fromEntries(tools.map((tool) => [tool.slug, { name: tool.name, icon: tool.icon, category: tool.category }]));
  return { info, ...stats, names };
}


// ---------------------------------------------------------------------------------------------
// Batch 2

export async function blogSection(days: number) {
  const [blog, info] = await Promise.all([blogStats(ranges(days).current), collectionInfo()]);
  return { info, ...blog };
}

/** Views, readers and reading of each article over a period, French and English merged. */
export async function blogStats(current: Range) {
  const [stats, byLocale] = await Promise.all([articleStats(current), getPublishedArticlesByLocale()]);
  // The same article read in French or English counts once, under its French title.
  const articles = new Map<string, { id: string; title: string; category: string }>();
  for (const article of byLocale.fr) articles.set(`fr:${article.slug}`, { id: article.id, title: article.title, category: article.categoryKey });
  const french = new Map(byLocale.fr.map((article) => [article.id, article]));
  for (const article of byLocale.en) {
    const source = french.get(article.id);
    articles.set(`en:${article.slug}`, { id: article.id, title: source?.title ?? article.title, category: article.categoryKey });
  }
  const merged = new Map<string, { id: string; title: string; category: string; views: number; readers: number; readTotal: number; readSamples: number; depth: Record<number, number>; toTools: number; en: number }>();
  for (const row of stats) {
    const article = articles.get(row.key);
    if (!article) continue;
    const entry = merged.get(article.id) ?? { ...article, views: 0, readers: 0, readTotal: 0, readSamples: 0, depth: { 25: 0, 50: 0, 75: 0, 100: 0 }, toTools: 0, en: 0 };
    entry.views += row.views;
    entry.readers += row.readers;
    if (row.readSeconds !== null) { entry.readTotal += row.readSeconds * row.readSamples; entry.readSamples += row.readSamples; }
    for (const step of [25, 50, 75, 100] as const) entry.depth[step] += row.depth[step];
    entry.toTools += row.toTools;
    if (row.key.startsWith('en:')) entry.en += row.views;
    merged.set(article.id, entry);
  }
  const list = Array.from(merged.values()).map((entry) => ({
    id: entry.id, title: entry.title, category: entry.category, views: entry.views, readers: entry.readers, englishViews: entry.en,
    readSeconds: entry.readSamples ? Math.round(entry.readTotal / entry.readSamples) : null,
    depth: entry.depth, toTools: entry.toTools,
  })).sort((a, b) => b.views - a.views);
  const categories = new Map<string, { category: string; views: number; readers: number; articles: number; toTools: number }>();
  for (const entry of list) {
    const category = categories.get(entry.category) ?? { category: entry.category, views: 0, readers: 0, articles: 0, toTools: 0 };
    category.views += entry.views; category.readers += entry.readers; category.articles += 1; category.toTools += entry.toTools;
    categories.set(entry.category, category);
  }
  return { articles: list, categories: Array.from(categories.values()).sort((a, b) => b.views - a.views) };
}

export async function conversionsSection(days: number) {
  const { current } = ranges(days);
  const [stats, info] = await Promise.all([conversionStats(current), collectionInfo()]);
  const byDay = new Map(stats.daily.map((row) => [row.day, row.count]));
  return { info, ...stats, daily: periodDays(days).map((day) => ({ day, count: byDay.get(day) ?? 0 })) };
}

export async function liveSection() {
  const [live, info] = await Promise.all([liveStats(), collectionInfo()]);
  return { info, ...live, names: Object.fromEntries(tools.map((tool) => [tool.slug, tool.name])), now: Date.now() };
}

export async function performanceSection(days: number) {
  const { current } = ranges(days);
  const [vitals, health, errorList, info] = await Promise.all([
    webVitals(current), apiHealth(current),
    listErrors({ period: days <= 7 ? '7d' : '30d', page: 1, pageSize: 1000, filters: {} }).catch(() => null),
    collectionInfo(),
  ]);
  const errors = new Map<string, number>();
  for (const error of (errorList?.items ?? []).filter((item) => !item.env)) errors.set(localDay(error.at), (errors.get(localDay(error.at)) ?? 0) + 1);
  const status = new Map(health.daily.map((row) => [row.day, row]));
  return {
    info, vitals, ...health,
    daily: periodDays(days).map((day) => ({ day, client: status.get(day)?.client ?? 0, server: status.get(day)?.server ?? 0, errors: errors.get(day) ?? 0 })),
  };
}
