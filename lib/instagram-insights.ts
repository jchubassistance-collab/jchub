import 'server-only';

import { createHmac } from 'node:crypto';

type MetaResponse = { data?: Array<{ name?: string; values?: Array<{ value?: unknown }>; total_value?: { value?: unknown } }>; error?: { message?: string; code?: number } };
type PostMetrics = { likes: number | null; comments: number | null; shares: number | null; saves: number | null; reach: number | null; views: number | null };

function config(env: NodeJS.ProcessEnv) {
  const token = env.FACEBOOK_ACCESS_TOKEN?.trim();
  const id = env.INSTAGRAM_USER_ID?.trim();
  const version = env.FACEBOOK_GRAPH_API_VERSION?.trim() || 'v26.0';
  if (!token || !id || !/^\d+$/.test(id) || !/^v\d+\.\d+$/.test(version)) throw new Error('Configuration Instagram Meta incomplète.');
  const secret = env.FACEBOOK_APP_SECRET?.trim() || env.META_APP_SECRET?.trim();
  const proof = secret ? createHmac('sha256', secret).update(token).digest('hex') : undefined;
  return { token, id, version, proof };
}

async function get(path: string, params: Record<string, string>, env: NodeJS.ProcessEnv, fetcher: typeof fetch = fetch) {
  const { token, version, proof } = config(env);
  const url = new URL(`https://graph.facebook.com/${version}/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  if (proof) url.searchParams.set('appsecret_proof', proof);
  const response = await fetcher(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(12_000) });
  const body = await response.json() as MetaResponse & Record<string, unknown>;
  if (!response.ok || body.error) throw new Error(`Meta Instagram indisponible (HTTP ${response.status}).`);
  return body;
}

export async function getInstagramWeeklyInsights(env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch, now = new Date()) {
  const { id } = config(env);
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() || 7) - 1) - 7);
  const sunday = new Date(monday); sunday.setUTCDate(sunday.getUTCDate() + 6); sunday.setUTCHours(23, 59, 59, 999);
  const since = Math.floor(monday.getTime() / 1000); const until = Math.floor(sunday.getTime() / 1000);
  const [body, profile] = await Promise.all([
    // views et total_interactions exigent metric_type=total_value : Meta renvoie alors un total unique pour la période,
    // et une portée dédoublonnée (pas une somme de portées quotidiennes).
    get(`${id}/insights`, { metric: 'reach,views,total_interactions', period: 'day', metric_type: 'total_value', since: String(since), until: String(until) }, env, fetcher),
    get(id, { fields: 'followers_count' }, env, fetcher).catch(() => ({} as Record<string, unknown>)),
  ]);
  const total = (name: string) => {
    const value = body.data?.find((row) => row.name === name)?.total_value?.value;
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  };
  const followers = (profile as Record<string, unknown>).followers_count;
  return { followers: typeof followers === 'number' ? followers : null, reach: total('reach'), views: total('views'), interactions: total('total_interactions') };
}

export async function getInstagramPostInsights(mediaId: string, env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch): Promise<PostMetrics> {
  const metrics: PostMetrics = { likes: null, comments: null, shares: null, saves: null, reach: null, views: null };
  if (!/^\d+$/.test(mediaId)) return metrics;
  try {
    const media = await get(mediaId, { fields: 'like_count,comments_count' }, env, fetcher);
    metrics.likes = typeof media.like_count === 'number' ? media.like_count : null;
    metrics.comments = typeof media.comments_count === 'number' ? media.comments_count : null;
  } catch { /* Insights may still be available. */ }
  try {
    const body = await get(`${mediaId}/insights`, { metric: 'reach,saved,shares,views' }, env, fetcher);
    for (const row of body.data || []) {
      const raw = row.values?.at(-1)?.value;
      if (typeof raw !== 'number') continue;
      if (row.name === 'reach') metrics.reach = raw;
      if (row.name === 'saved') metrics.saves = raw;
      if (row.name === 'shares') metrics.shares = raw;
      if (row.name === 'views') metrics.views = raw;
    }
  } catch { /* Keep partial media results. */ }
  return metrics;
}
