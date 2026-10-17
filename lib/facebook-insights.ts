import { createHmac } from 'node:crypto';

export type FacebookInsightPoint = { date: string; value: number };
export type FacebookInsightsReport = {
  followers: number | null;
  impressions: number;
  engagements: number;
  pageViews: number;
  timeline: Array<{ date: string; impressions: number; engagements: number }>;
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
  const since = new Date(until.getTime() - 27 * 24 * 60 * 60 * 1000);
  const appSecret = env.FACEBOOK_APP_SECRET?.trim() || env.META_APP_SECRET?.trim();
  const appSecretProof = appSecret ? createHmac('sha256', appSecret).update(token).digest('hex') : undefined;
  const metrics = ['page_impressions', 'page_post_engagements', 'page_views_total'];
  const fetcher = dependencies.fetcher || fetch;
  const makeInsightsUrl = (selectedMetrics: string[]) => {
    const endpoint = new URL(`https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}/insights`);
    endpoint.searchParams.set('metric', selectedMetrics.join(','));
    endpoint.searchParams.set('period', 'day');
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

  const byName = new Map(rows.map((row) => [String(row.name || ''), row]));
  const impressions = valuesFor(byName.get('page_impressions'));
  const engagements = valuesFor(byName.get('page_post_engagements'));
  const pageViews = valuesFor(byName.get('page_views_total'));
  const timelineByDate = new Map<string, { date: string; impressions: number; engagements: number }>();
  for (const point of impressions) timelineByDate.set(point.date, { date: point.date, impressions: point.value, engagements: 0 });
  for (const point of engagements) {
    const day = timelineByDate.get(point.date) || { date: point.date, impressions: 0, engagements: 0 };
    day.engagements = point.value;
    timelineByDate.set(point.date, day);
  }

  const warnings = [
    ...(!impressions.length ? ['Impressions non retournées par Meta.'] : []),
    ...(!engagements.length ? ['Engagements non retournés par Meta.'] : []),
    ...(!pageViews.length ? ['Vues de Page non retournées par Meta.'] : []),
    ...(followers === null ? ['Nombre total d’abonnés non retourné par Meta.'] : []),
    ...unavailableMetrics.map((metric) => `Métrique indisponible : ${metric}.`),
  ];
  return {
    followers,
    impressions: impressions.reduce((total, point) => total + point.value, 0),
    engagements: engagements.reduce((total, point) => total + point.value, 0),
    pageViews: pageViews.reduce((total, point) => total + point.value, 0),
    timeline: Array.from(timelineByDate.values()).sort((left, right) => left.date.localeCompare(right.date)),
    warnings,
    fetchedAt: now.toISOString(),
  };
}
