import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { facebookAppSecretProof, facebookGraphApiVersion, getFacebookRedirectUri, selectFacebookPage, type FacebookPageCandidate } from '@/lib/facebook-oauth';
import { saveLocalEnvValues } from '@/lib/local-env-store';
import { isMatchingOAuthState } from '@/lib/linkedin-oauth';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function finish(request: NextRequest, result: 'connected' | 'page-required' | 'error', status = 303) {
  const url = new URL('/admin/social', request.url);
  url.searchParams.set('facebook', result);
  const response = NextResponse.redirect(url, status);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.cookies.set('facebook_oauth_state', '', { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 0, path: '/api/auth/facebook' });
  return response;
}

type TokenResponse = { access_token?: string; expires_in?: number };
type PagesResponse = { data?: FacebookPageCandidate[] };

async function readJson<T>(response: Response): Promise<T | null> {
  try { return await response.json() as T; } catch { return null; }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'UNAUTHORIZED' ? 401 : code === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: status === 401 ? 'Authentification administrateur requise.' : status === 403 ? 'Accès administrateur refusé.' : 'Connexion Facebook indisponible.' }, { status, headers: { 'Cache-Control': 'no-store' } });
  }

  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'En production, configure FACEBOOK_ACCESS_TOKEN et FACEBOOK_PAGE_ID dans les variables secrètes Vercel, puis redéploie.' }, { status: 409, headers: { 'Cache-Control': 'no-store' } });
  }

  const returnedState = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get('facebook_oauth_state')?.value;
  const code = request.nextUrl.searchParams.get('code');
  if (request.nextUrl.searchParams.has('error') || !isMatchingOAuthState(expectedState, returnedState) || !code || code.length > 4096) return finish(request, 'error');

  const appId = process.env.FACEBOOK_APP_ID?.trim();
  const appSecret = process.env.FACEBOOK_APP_SECRET?.trim();
  let redirectUri: string;
  let version: string;
  try { redirectUri = getFacebookRedirectUri(process.env); version = facebookGraphApiVersion(process.env); }
  catch { return finish(request, 'error'); }
  if (!appId || !appSecret || appId.toLowerCase().includes('demo') || appSecret.toLowerCase().includes('demo')) return finish(request, 'error');

  const tokenUrl = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
  tokenUrl.searchParams.set('client_id', appId);
  tokenUrl.searchParams.set('client_secret', appSecret);
  tokenUrl.searchParams.set('redirect_uri', redirectUri);
  tokenUrl.searchParams.set('code', code);
  let shortTokenResponse: Response;
  try {
    shortTokenResponse = await fetch(tokenUrl, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(12_000) });
  } catch { reportUserError(); return finish(request, 'error'); }
  const shortTokenData = await readJson<TokenResponse>(shortTokenResponse);
  if (!shortTokenResponse.ok || !shortTokenData?.access_token || shortTokenData.access_token.length > 8192) {
    reportUserError();
    return finish(request, 'error');
  }

  const longTokenUrl = new URL(`https://graph.facebook.com/${version}/oauth/access_token`);
  longTokenUrl.searchParams.set('grant_type', 'fb_exchange_token');
  longTokenUrl.searchParams.set('client_id', appId);
  longTokenUrl.searchParams.set('client_secret', appSecret);
  longTokenUrl.searchParams.set('fb_exchange_token', shortTokenData.access_token);
  let longTokenResponse: Response;
  try {
    longTokenResponse = await fetch(longTokenUrl, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(12_000) });
  } catch { reportUserError(); return finish(request, 'error'); }
  const longTokenData = await readJson<TokenResponse>(longTokenResponse);
  const userToken = longTokenData?.access_token;
  if (!longTokenResponse.ok || !userToken || userToken.length > 8192) {
    reportUserError();
    return finish(request, 'error');
  }

  const pagesUrl = new URL(`https://graph.facebook.com/${version}/me/accounts`);
  pagesUrl.searchParams.set('fields', 'id,name,access_token');
  pagesUrl.searchParams.set('limit', '100');
  pagesUrl.searchParams.set('appsecret_proof', facebookAppSecretProof(userToken, appSecret));
  let pagesResponse: Response;
  try {
    pagesResponse = await fetch(pagesUrl, { headers: { Authorization: `Bearer ${userToken}` }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(12_000) });
  } catch { reportUserError(); return finish(request, 'error'); }
  const pagesData = await readJson<PagesResponse>(pagesResponse);
  if (!pagesResponse.ok || !Array.isArray(pagesData?.data)) {
    reportUserError();
    return finish(request, 'error');
  }

  const pages = pagesData.data.filter((page) => typeof page?.id === 'string' && typeof page?.access_token === 'string');
  const selected = selectFacebookPage(pages, process.env.FACEBOOK_PAGE_ID?.trim() || '');
  if (selected === 'PAGE_REQUIRED') return finish(request, 'page-required');
  if (!selected) return finish(request, 'error');

  const values: Record<string, string> = { FACEBOOK_PAGE_ID: selected.id, FACEBOOK_ACCESS_TOKEN: selected.access_token };
  try {
    await saveLocalEnvValues(values);
    return finish(request, 'connected');
  } catch {
    reportUserError();
    return finish(request, 'error');
  }
}
