import 'server-only';

import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { getGa4Dashboard, type DashboardLang } from '@/lib/ga4';
import { getPublishedTools, toolPath } from '@/lib/tools';
import { resources as builtInResources } from '@/lib/resources';
import { readStoredResources } from '@/lib/resource-store';
import { RESOURCE_AGENT_RUNS } from '@/lib/resource-research';
import { listErrors, listRequests } from '@/lib/reports/read';
import { computeHealth, percentChange } from '@/lib/dashboard-health';
import { reportUserError } from '@/lib/user-error';

/**
 * Data of the admin dashboard (app/admin/page.tsx): Firestore, Google Analytics and the site
 * reports, for a period and a language. Each source may fail alone: its blocks then show empty.
 */

const DAY = 86400_000;
export const DASHBOARD_PERIODS = [7, 28, 90, 365] as const;
/** Articles the editorial calendar aims for each month (two a week). */
const MONTHLY_TARGET = 8;

const millis = (value: unknown) => (value as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
const iso = (value: unknown) => { const time = millis(value); return time ? new Date(time).toISOString() : null; };

async function settle<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try { return await promise; } catch (error) { reportUserError(error); return fallback; }
}

export async function buildDashboard(days: number, lang: DashboardLang) {
  const db = getAdminDb();
  const now = Date.now();
  const start = now - days * DAY;
  const previousStart = now - 2 * days * DAY;
  const inPeriod = (time: number) => time >= start && time <= now;
  const inPrevious = (time: number) => time >= previousStart && time < start;
  const reportPeriod = days <= 7 ? '7d' : '30d';

  const [analytics, articles, drafts, agentRuns, resourceRuns, tools, scheduledTools, stored, users, newUsers, previousUsers, subscribers, messages, comments, requests, errors, recentRequests] = await Promise.all([
    settle(getGa4Dashboard(days, lang), { configured: false as const }),
    db.collection('articles').select('slug', 'title', 'status', 'category', 'author', 'publishedAt', 'scheduledFor', 'translations.en.slug').get(),
    db.collection('agent_drafts').select('title', 'status', 'createdAt').get(),
    db.collection('agent_runs').orderBy('createdAt', 'desc').limit(1).get(),
    settle(db.collection(RESOURCE_AGENT_RUNS).orderBy('createdAt', 'desc').limit(1).get(), null),
    getPublishedTools(),
    getPublishedTools({ includeScheduled: true }),
    settle(readStoredResources(), []),
    db.collection('users').count().get(),
    db.collection('users').where('createdAt', '>=', Timestamp.fromMillis(start)).count().get(),
    db.collection('users').where('createdAt', '>=', Timestamp.fromMillis(previousStart)).where('createdAt', '<', Timestamp.fromMillis(start)).count().get(),
    db.collection('newsletter_subscribers').select('status', 'subscribedAt', 'confirmedAt').get(),
    db.collection('contact_messages').orderBy('createdAt', 'desc').limit(200).select('name', 'subject', 'status', 'createdAt').get(),
    db.collection('blog_comments').orderBy('createdAt', 'desc').limit(300).select('name', 'articleSlug', 'createdAt').get(),
    settle(db.collection('resource_requests').select('resource', 'requestedAt', 'downloads').get(), null),
    settle(listErrors({ period: reportPeriod, page: 1, pageSize: 500, filters: {} }), null),
    settle(listRequests({ period: '24h', page: 1, pageSize: 2000, filters: {} }), null),
  ]);

  // Content
  const articleRows = articles.docs.map((document) => {
    const data = document.data();
    return {
      id: document.id,
      slug: String(data.slug || document.id),
      enSlug: String(data.translations?.en?.slug || ''),
      title: String(data.title || document.id),
      status: String(data.status || 'draft'),
      category: String(data.category || 'Développement'),
      author: String(data.author || 'JcHub'),
      publishedAt: millis(data.publishedAt),
      scheduledFor: millis(data.scheduledFor),
    };
  });
  const statusCounts = { published: 0, scheduled: 0, draft: 0, archived: 0 };
  for (const article of articleRows) {
    const key = article.status as keyof typeof statusCounts;
    if (key in statusCounts) statusCounts[key] += 1;
  }
  const categories = new Map<string, { category: string; published: number; scheduled: number; draft: number }>();
  const authors = new Map<string, { author: string; published: number; scheduled: number; draft: number }>();
  for (const article of articleRows) {
    if (!['published', 'scheduled', 'draft'].includes(article.status)) continue;
    const status = article.status as 'published' | 'scheduled' | 'draft';
    const category = categories.get(article.category) ?? { category: article.category, published: 0, scheduled: 0, draft: 0 };
    category[status] += 1;
    categories.set(article.category, category);
    const author = authors.get(article.author) ?? { author: article.author, published: 0, scheduled: 0, draft: 0 };
    author[status] += 1;
    authors.set(article.author, author);
  }
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime();
  const published = articleRows.filter((article) => article.status === 'published');

  // Calendar: two weeks back, ten weeks ahead.
  const calendarFrom = now - 14 * DAY;
  const calendarTo = now + 70 * DAY;
  const nextMonday = (() => { const date = new Date(now); date.setUTCHours(7, 0, 0, 0); date.setUTCDate(date.getUTCDate() + ((8 - date.getUTCDay()) % 7 || 7)); return date.getTime(); })();
  const calendar = [
    ...articleRows.flatMap((article) => {
      const at = article.status === 'scheduled' ? article.scheduledFor : article.status === 'published' ? article.publishedAt : 0;
      return at >= calendarFrom && at <= calendarTo ? [{ at, type: 'article' as const, title: article.title, category: article.category, status: article.status }] : [];
    }),
    ...scheduledTools.flatMap((tool) => {
      const at = tool.publishAt ? Date.parse(tool.publishAt) : 0;
      return at >= calendarFrom && at <= calendarTo ? [{ at, type: 'tool' as const, title: tool.name, category: tool.category, status: at > now ? 'scheduled' : 'published' }] : [];
    }),
    ...Array.from({ length: 10 }, (_, week) => nextMonday + week * 7 * DAY).flatMap((at) => [
      { at, type: 'agent' as const, title: 'Agent éditorial', category: 'Brouillon d’article', status: 'scheduled' },
      { at, type: 'agent' as const, title: 'Agent des ressources', category: '2 ressources', status: 'scheduled' },
    ]),
  ].sort((a, b) => a.at - b.at);

  // Analytics derived lists: articles and tools by views.
  const pageViews = analytics.configured ? analytics.pages : [];
  const viewsOf = (paths: string[]) => pageViews.filter((page) => paths.includes(page.path)).reduce((total, page) => total + page.views, 0);
  const topArticles = published.map((article) => ({
    title: article.title,
    category: article.category,
    views: viewsOf([`/fr/blog/${article.slug}`, `/en/blog/${article.enSlug || article.slug}`, `/blog/${article.slug}`]),
  })).sort((a, b) => b.views - a.views).slice(0, 5);
  const topTools = tools.map((tool) => ({
    name: tool.name,
    category: tool.category,
    views: viewsOf([toolPath(tool, 'fr'), toolPath(tool, 'en')]),
  })).sort((a, b) => b.views - a.views).slice(0, 5);

  // Audience, newsletter, messages, comments
  const subscriberRows = subscribers.docs.map((document) => document.data());
  const newsletterIn = (test: (time: number) => boolean) => subscriberRows.filter((row) => row.status === 'active' && test(millis(row.confirmedAt) || millis(row.subscribedAt))).length;
  const messageRows = messages.docs.map((document) => ({ id: document.id, ...document.data() }));
  const commentRows = comments.docs.map((document) => document.data());

  // Agents and drafts
  const draftRows = drafts.docs.map((document) => ({ status: String(document.data().status || 'draft'), createdAt: millis(document.data().createdAt) }));
  const resourceDrafts = stored.filter((resource) => resource.status === 'draft');
  const lastEditorial = agentRuns.docs[0];
  const lastResource = resourceRuns?.docs[0];
  const runState = (data: Record<string, unknown> | undefined) => {
    if (!data) return 'jamais lancé';
    const status = String(data.status || 'unknown');
    // A run "running" for more than an hour never finished.
    if (['running', 'started', 'writing'].includes(status) && now - millis(data.createdAt) > 3600_000) return 'bloqué';
    return status;
  };
  const agents = [
    { name: 'Agent éditorial', status: runState(lastEditorial?.data()), lastRun: iso(lastEditorial?.data().createdAt), toReview: draftRows.filter((draft) => ['draft', 'approved'].includes(draft.status)).length },
    { name: 'Agent des ressources', status: runState(lastResource?.data()), lastRun: iso(lastResource?.data().createdAt), toReview: resourceDrafts.length },
  ];

  // Errors and server activity
  // Production only: errors raised while developing locally are not the site's.
  const errorItems = (errors?.items ?? []).filter((item) => !item.env);
  // Distinct errors for the health score: one per fingerprint. For the list, the same message
  // raised from several places is shown once.
  const errorGroups = new Set(errorItems.map((error) => error.fingerprint));
  const errorMessages = new Map<string, { message: string; route: string; count: number; last: number }>();
  for (const error of errorItems) {
    const group = errorMessages.get(error.message) ?? { message: error.message, route: error.route || error.path, count: 0, last: 0 };
    group.count += 1;
    group.last = Math.max(group.last, error.at);
    errorMessages.set(error.message, group);
  }
  const errorsInPeriod = errorItems.filter((error) => inPeriod(error.at)).length;
  const pageRequests = (recentRequests?.items ?? []).filter((request) => request.kind === 'page');
  const activity = (recentRequests?.items ?? []).filter((request) => request.kind === 'admin' || request.kind === 'cron').slice(0, 8).map((request) => ({
    at: request.at, kind: request.kind, intent: request.intent || request.path, user: request.user || (request.kind === 'cron' ? 'Tâche planifiée' : ''), status: request.status,
  }));

  const pendingMessages = messageRows.filter((message) => String((message as { status?: unknown }).status || 'new') === 'new');
  const health = computeHealth({
    distinctErrors: errorGroups.size,
    failedAgents: agents.filter((agent) => ['failed', 'bloqué'].includes(agent.status)).map((agent) => agent.name),
    staleDrafts: draftRows.filter((draft) => draft.status === 'draft' && now - draft.createdAt > 7 * DAY).length + resourceDrafts.filter((resource) => resource.createdAt && now - Date.parse(resource.createdAt) > 7 * DAY).length,
    pendingMessages: pendingMessages.length,
    bounceRate: analytics.configured ? analytics.current.bounceRate : null,
    // The reports time the proxy, not the page: not a reliable speed measure, left out.
    averageResponseMs: null,
  });

  const requestRows = requests?.docs.map((document) => document.data()) ?? [];
  const allResources = [...builtInResources.map((resource) => ({ id: resource.id, title: resource.fr.title, published: true })), ...stored.map((resource) => ({ id: resource.id, title: resource.fr.title, published: resource.status === 'published' }))];

  return {
    generatedAt: new Date(now).toISOString(),
    period: { days, lang, from: new Date(start).toISOString(), to: new Date(now).toISOString() },
    analytics: analytics.configured ? { ...analytics, pages: undefined } : { configured: false },
    kpis: {
      visitors: analytics.configured ? { value: analytics.current.visitors, change: percentChange(analytics.current.visitors, analytics.previous.visitors) } : null,
      pageViews: analytics.configured ? { value: analytics.current.pageViews, change: percentChange(analytics.current.pageViews, analytics.previous.pageViews) } : null,
      articles: { value: statusCounts.published, change: percentChange(published.filter((article) => inPeriod(article.publishedAt)).length, published.filter((article) => inPrevious(article.publishedAt)).length), period: published.filter((article) => inPeriod(article.publishedAt)).length },
      tools: { value: tools.length, upcoming: scheduledTools.length - tools.length },
      users: { value: users.data().count, period: newUsers.data().count, change: percentChange(newUsers.data().count, previousUsers.data().count) },
      newsletter: { value: subscriberRows.filter((row) => row.status === 'active').length, pending: subscriberRows.filter((row) => row.status === 'pending').length, period: newsletterIn(inPeriod), change: percentChange(newsletterIn(inPeriod), newsletterIn(inPrevious)) },
      messages: { value: pendingMessages.length },
      drafts: { value: agents.reduce((total, agent) => total + agent.toReview, 0) },
      errors: { value: errorsInPeriod, distinct: errorGroups.size },
    },
    content: {
      statusCounts,
      byCategory: Array.from(categories.values()).sort((a, b) => (b.published + b.scheduled) - (a.published + a.scheduled)),
      byAuthor: Array.from(authors.values()).sort((a, b) => b.published - a.published),
      monthGoal: {
        target: MONTHLY_TARGET,
        published: published.filter((article) => article.publishedAt >= monthStart && article.publishedAt < monthEnd).length,
        scheduled: articleRows.filter((article) => article.status === 'scheduled' && article.scheduledFor >= monthStart && article.scheduledFor < monthEnd).length,
      },
    },
    calendar,
    topArticles,
    topTools,
    resources: {
      total: allResources.filter((resource) => resource.published).length,
      drafts: resourceDrafts.length,
      requests: requestRows.filter((row) => inPeriod(millis(row.requestedAt))).length,
      downloads: requestRows.reduce((total, row) => total + Number(row.downloads || 0), 0),
    },
    agents,
    messages: pendingMessages.slice(0, 5).map((message) => {
      const data = message as { id: string; name?: unknown; subject?: unknown; createdAt?: unknown };
      return { id: data.id, name: String(data.name || 'Anonyme'), subject: String(data.subject || ''), createdAt: iso(data.createdAt) };
    }),
    comments: {
      period: commentRows.filter((row) => inPeriod(millis(row.createdAt))).length,
      previous: commentRows.filter((row) => inPrevious(millis(row.createdAt))).length,
      latest: commentRows.slice(0, 5).map((row) => ({ name: String(row.name || 'Anonyme'), article: String(row.articleSlug || ''), createdAt: iso(row.createdAt) })),
    },
    errors: Array.from(errorMessages.values()).sort((a, b) => b.count - a.count).slice(0, 5).map((group) => ({ ...group, last: new Date(group.last).toISOString() })),
    activity: activity.map((item) => ({ ...item, at: new Date(item.at).toISOString() })),
    // Pages served in the last 24 hours, counted by the site itself (works even when Google Analytics records nothing).
    server: { requests24h: recentRequests?.total ?? null, pages24h: pageRequests.length, humanPages24h: pageRequests.filter((request) => !request.bot).length },
    health,
  };
}

export type DashboardData = Awaited<ReturnType<typeof buildDashboard>>;
