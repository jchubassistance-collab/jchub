import { createHmac } from 'node:crypto';

export type FacebookInsightPoint = { date: string; value: number };
// views : affichages du contenu de la Page (page_media_view, qui remplace page_impressions supprimée par Meta).
// reach : personnes uniques touchées sur la période (7 jours glissants jusqu'à 7 jours demandés, sinon 28).
// followersAtStart / followersAtEnd : abonnés au premier et au dernier jour de la période (historique page_follows).
export type FacebookInsightsReport = {
  followers: number | null;
  followersAtStart: number | null;
  followersAtEnd: number | null;
  views: number;
  reach: number | null;
  engagements: number;
  pageViews: number;
  timeline: Array<{ date: string; views: number; engagements: number }>;
  warnings: string[];
  fetchedAt: string;
};

type InsightValue = { value?: number | string; end_time?: string };
type InsightRow = { name?: string; values?: InsightValue[] };
type GraphResponse = { data?: InsightRow[]; error?: { code?: number; message?: string } };
type PageResponse = { followers_count?: number; error?: { code?: number; message?: string } };
type Dependencies = { fetcher?: typeof fetch; now?: Date };

export class FacebookInsightsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FacebookInsightsError';
  }
}

function safeErrorMessage(code: number | undefined, status: number): string {
  if (code === 190) return 'Le token Facebook est invalide ou expiré. Génère un nouveau Page Access Token.';
  if (code === 200) return 'Meta refuse l’accès aux statistiques. Accorde pages_read_engagement et read_insights au token, puis renouvelle-le.';
  if (code === 100 || status === 400) return 'Meta refuse une métrique ou l’ID de Page. Vérifie la version Graph API et les accès de cette Page.';
  if (code === 80001 || status === 429) return 'Meta limite temporairement les requêtes. Réessaie dans quelques minutes.';
  return `Impossible de récupérer les statistiques Meta (HTTP ${status}). Vérifie le Page Access Token et les permissions de l’application.`;
}

function valuesFor(row: InsightRow | undefined): FacebookInsightPoint[] {
  return (row?.values || []).flatMap((point) => {
    const value = Number(point.value);
    if (!Number.isFinite(value) || !point.end_time) return [];
    return [{ date: point.end_time.slice(0, 10), value }];
  }).sort((left, right) => left.date.localeCompare(right.date));
}

export async function getFacebookInsights(
  env: NodeJS.ProcessEnv = process.env,
  dependencies: Dependencies = {},
  days = 28,
): Promise<FacebookInsightsReport> {
  const token = env.FACEBOOK_ACCESS_TOKEN?.trim();
  const pageId = env.FACEBOOK_PAGE_ID?.trim();
  if (!token || !pageId || !/^[0-9]+$/.test(pageId)) {
    throw new FacebookInsightsError('Configure FACEBOOK_ACCESS_TOKEN et un FACEBOOK_PAGE_ID numérique côté serveur.');
  }

  const version = env.FACEBOOK_GRAPH_API_VERSION?.trim() || 'v26.0';
  if (!/^v\d+\.\d+$/.test(version)) throw new FacebookInsightsError('FACEBOOK_GRAPH_API_VERSION doit avoir le format v26.0.');

  const now = dependencies.now || new Date();
  const until = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const period = Math.max(1, Math.min(90, days));
  const since = new Date(until.getTime() - period * 24 * 60 * 60 * 1000);
  const appSecret = env.FACEBOOK_APP_SECRET?.trim() || env.META_APP_SECRET?.trim();
  const appSecretProof = appSecret ? createHmac('sha256', appSecret).update(token).digest('hex') : undefined;
  const metrics = ['page_media_view', 'page_post_engagements', 'page_views_total', 'page_follows'];
  const fetcher = dependencies.fetcher || fetch;
  const makeInsightsUrl = (selectedMetrics: string[], metricPeriod = 'day') => {
    const endpoint = new URL(`https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}/insights`);
    endpoint.searchParams.set('metric', selectedMetrics.join(','));
    endpoint.searchParams.set('period', metricPeriod);
    endpoint.searchParams.set('since', String(Math.floor(since.getTime() / 1000)));
    endpoint.searchParams.set('until', String(Math.floor(until.getTime() / 1000)));
    if (appSecretProof) endpoint.searchParams.set('appsecret_proof', appSecretProof);
    return endpoint;
  };
  const request = async (url: URL) => {
    let response: Response;
    try {
      response = await fetcher(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(12_000),
      });
    } catch {
      throw new FacebookInsightsError('Connexion à Meta impossible. Réessaie dans quelques instants.');
    }
    let body: GraphResponse;
    try { body = await response.json() as GraphResponse; }
    catch { body = {}; }
    return { response, body };
  };

  const combined = await request(makeInsightsUrl(metrics));
  let rows = combined.body.data || [];
  const combinedFailed = !combined.response.ok || Boolean(combined.body.error);
  const unavailableMetrics: string[] = [];
  if (combinedFailed && (combined.response.status === 400 || combined.body.error?.code === 100)) {
    const individual = await Promise.all(metrics.map(async (metric) => {
      try {
        const result = await request(makeInsightsUrl([metric]));
        if (!result.response.ok || result.body.error) {
          unavailableMetrics.push(metric);
          return { rows: [], failure: { code: result.body.error?.code, status: result.response.status } };
        }
        return { rows: result.body.data || [] };
      } catch {
        unavailableMetrics.push(metric);
        return { rows: [], failure: { status: 502 } };
      }
    }));
    rows = individual.flatMap((result) => result.rows);
    if (!rows.length) {
      const fallbackFailure = individual.find((result) => result.failure)?.failure;
      throw new FacebookInsightsError(safeErrorMessage(
        fallbackFailure?.code ?? combined.body.error?.code,
        fallbackFailure?.status ?? combined.response.status,
      ));
    }
  } else if (combinedFailed) {
    throw new FacebookInsightsError(safeErrorMessage(combined.body.error?.code, combined.response.status));
  }

  let followers: number | null = null;
  try {
    const pageUrl = new URL(`https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}`);
    pageUrl.searchParams.set('fields', 'followers_count');
    if (appSecretProof) pageUrl.searchParams.set('appsecret_proof', appSecretProof);
    const pageResponse = await fetcher(pageUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(12_000),
    });
    const page = await pageResponse.json() as PageResponse;
    if (pageResponse.ok && typeof page.followers_count === 'number' && Number.isFinite(page.followers_count)) {
      followers = page.followers_count;
    }
  } catch {
    // Other Page metrics remain useful when Meta does not return the follower total.
  }

  // Portée unique : la somme de portées quotidiennes compterait plusieurs fois les mêmes personnes.
  let reach: number | null = null;
  try {
    const reachResult = await request(makeInsightsUrl(['page_total_media_view_unique'], period <= 7 ? 'week' : 'days_28'));
    if (reachResult.response.ok && !reachResult.body.error) reach = valuesFor(reachResult.body.data?.[0]).at(-1)?.value ?? null;
  } catch {
    // Les autres statistiques restent utiles sans la portée.
  }

  const byName = new Map(rows.map((row) => [String(row.name || ''), row]));
  const views = valuesFor(byName.get('page_media_view'));
  const engagements = valuesFor(byName.get('page_post_engagements'));
  const pageViews = valuesFor(byName.get('page_views_total'));
  const follows = valuesFor(byName.get('page_follows'));
  const timelineByDate = new Map<string, { date: string; views: number; engagements: number }>();
  for (const point of views) timelineByDate.set(point.date, { date: point.date, views: point.value, engagements: 0 });
  for (const point of engagements) {
    const day = timelineByDate.get(point.date) || { date: point.date, views: 0, engagements: 0 };
    day.engagements = point.value;
    timelineByDate.set(point.date, day);
  }

  const warnings = [
    ...(!views.length ? ['Vues du contenu non retournées par Meta.'] : []),
    ...(reach === null ? ['Portée non retournée par Meta.'] : []),
    ...(!engagements.length ? ['Engagements non retournés par Meta.'] : []),
    ...(!pageViews.length ? ['Vues de Page non retournées par Meta.'] : []),
    ...(followers === null ? ['Nombre total d’abonnés non retourné par Meta.'] : []),
    ...unavailableMetrics.map((metric) => `Métrique indisponible : ${metric}.`),
  ];
  return {
    followers,
    followersAtStart: follows[0]?.value ?? null,
    followersAtEnd: follows.at(-1)?.value ?? null,
    views: views.reduce((total, point) => total + point.value, 0),
    reach,
    engagements: engagements.reduce((total, point) => total + point.value, 0),
    pageViews: pageViews.reduce((total, point) => total + point.value, 0),
    timeline: Array.from(timelineByDate.values()).sort((left, right) => left.date.localeCompare(right.date)),
    warnings,
    fetchedAt: now.toISOString(),
  };
}

export type SocialPostMetrics = { likes: number | null; comments: number | null; shares: number | null; saves: number | null; reach: number | null; views: number | null };

// Statistiques d'un post de Page. Les kits publient une photo : son identifiant est converti en identifiant de post.
// Les arêtes likes et comments exigent pages_read_user_content; les métriques ci-dessous suffisent avec pages_read_engagement.
export async function getFacebookPostInsights(id: string, env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch): Promise<SocialPostMetrics> {
  const metrics: SocialPostMetrics = { likes: null, comments: null, shares: null, saves: null, reach: null, views: null };
  const token = env.FACEBOOK_ACCESS_TOKEN?.trim();
  const version = env.FACEBOOK_GRAPH_API_VERSION?.trim() || 'v26.0';
  if (!token || !/^\d+(_\d+)?$/.test(id) || !/^v\d+\.\d+$/.test(version)) return metrics;
  const secret = env.FACEBOOK_APP_SECRET?.trim() || env.META_APP_SECRET?.trim();
  const proof = secret ? createHmac('sha256', secret).update(token).digest('hex') : undefined;
  const get = async (path: string, params: Record<string, string>) => {
    const url = new URL(`https://graph.facebook.com/${version}/${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    if (proof) url.searchParams.set('appsecret_proof', proof);
    const response = await fetcher(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(12_000) });
    const body = await response.json() as Record<string, any>;
    if (!response.ok || body.error) throw new Error(`Meta ${response.status}`);
    return body;
  };

  let postId = id;
  if (!id.includes('_')) {
    try { postId = String((await get(id, { fields: 'page_story_id' })).page_story_id || ''); }
    catch { return metrics; }
    if (!/^\d+_\d+$/.test(postId)) return metrics;
  }
  const [post, insights] = await Promise.allSettled([
    get(postId, { fields: 'shares' }),
    get(`${postId}/insights`, { metric: 'post_activity_by_action_type,post_reactions_by_type_total,post_media_view,post_total_media_view_unique' }),
  ]);
  if (insights.status === 'fulfilled') {
    const value = (name: string) => (insights.value.data as Array<{ name?: string; values?: Array<{ value?: unknown }> }> | undefined)?.find((row) => row.name === name)?.values?.at(-1)?.value;
    const activity = value('post_activity_by_action_type');
    const reactions = value('post_reactions_by_type_total');
    if (activity && typeof activity === 'object') {
      const byAction = activity as Record<string, unknown>;
      metrics.comments = count(byAction.comment) ?? 0;
      metrics.shares = count(byAction.share) ?? 0;
      metrics.likes = count(byAction.like) ?? 0;
    }
    if (reactions && typeof reactions === 'object') {
      metrics.likes = Object.values(reactions as Record<string, unknown>).reduce<number>((total, item) => total + (count(item) ?? 0), 0);
    }
    metrics.views = count(value('post_media_view'));
    metrics.reach = count(value('post_total_media_view_unique'));
  }
  if (post.status === 'fulfilled') metrics.shares = count(post.value.shares?.count) ?? metrics.shares;
  return metrics;
}

function count(raw: unknown): number | null {
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
}
