import { createHmac } from 'node:crypto';

export type FacebookPageCandidate = { id: string; name?: string; access_token: string };

export function getFacebookRedirectUri(env: NodeJS.ProcessEnv): string {
  const value = env.FACEBOOK_REDIRECT_URI?.trim();
  if (!value) throw new Error('FACEBOOK_REDIRECT_URI is not configured.');
  const uri = new URL(value);
  const localHttp = uri.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(uri.hostname);
  if (uri.protocol !== 'https:' && !(env.NODE_ENV !== 'production' && localHttp)) throw new Error('FACEBOOK_REDIRECT_URI must use HTTPS outside local development.');
  if (uri.username || uri.password || uri.search || uri.hash || uri.pathname !== '/api/auth/facebook/callback') throw new Error('FACEBOOK_REDIRECT_URI is invalid.');
  return uri.toString().replace(/\/$/, '');
}

export function selectFacebookPage(pages: FacebookPageCandidate[], configuredPageId: string): FacebookPageCandidate | 'PAGE_REQUIRED' | null {
  if (configuredPageId) {
    const page = pages.find((candidate) => candidate.id === configuredPageId);
    return page && /^[0-9]+$/.test(page.id) && page.access_token ? page : null;
  }
  if (pages.length > 1) return 'PAGE_REQUIRED';
  if (pages.length === 1 && /^[0-9]+$/.test(pages[0].id) && pages[0].access_token) return pages[0];
  return null;
}

export function facebookAppSecretProof(token: string, appSecret: string): string {
  return createHmac('sha256', appSecret).update(token).digest('hex');
}

export function facebookGraphApiVersion(env: NodeJS.ProcessEnv): string {
  const version = env.FACEBOOK_GRAPH_API_VERSION?.trim() || 'v26.0';
  if (!/^v\d+\.\d+$/.test(version)) throw new Error('FACEBOOK_GRAPH_API_VERSION is invalid.');
  return version;
}
