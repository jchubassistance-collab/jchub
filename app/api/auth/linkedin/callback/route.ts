import { randomUUID } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getLinkedInRedirectUri, isMatchingOAuthState, updateEnvFile } from '@/lib/linkedin-oauth';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function finish(request: NextRequest, result: 'connected' | 'error', status = 303) {
  const url = new URL('/admin/social', request.url);
  url.searchParams.set('linkedin', result);
  const response = NextResponse.redirect(url, status);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.cookies.set('linkedin_oauth_state', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: '/api/auth/linkedin' });
  return response;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'UNAUTHORIZED' ? 401 : code === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: status === 401 ? 'Authentification administrateur requise.' : status === 403 ? 'Accès administrateur refusé.' : 'Connexion LinkedIn indisponible.' }, { status, headers: { 'Cache-Control': 'no-store' } });
  }

  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'En production, configure LINKEDIN_ACCESS_TOKEN et LINKEDIN_AUTHOR_URN dans les variables secrètes Vercel, puis redéploie.' }, { status: 409, headers: { 'Cache-Control': 'no-store' } });
  }

  const returnedState = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get('linkedin_oauth_state')?.value;
  const code = request.nextUrl.searchParams.get('code');
  if (request.nextUrl.searchParams.has('error') || !isMatchingOAuthState(expectedState, returnedState) || !code || code.length > 4096) {
    return finish(request, 'error');
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID?.trim();
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET?.trim();
  let redirectUri: string;
  try { redirectUri = getLinkedInRedirectUri(process.env); }
  catch { return finish(request, 'error'); }
  if (!clientId || !clientSecret || clientId.toLowerCase().includes('demo') || clientSecret.toLowerCase().includes('demo')) {
    return finish(request, 'error');
  }

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri }),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    reportUserError();
    return finish(request, 'error');
  }

  let tokenData: { access_token?: string; expires_in?: number };
  try { tokenData = await tokenResponse.json(); }
  catch { return finish(request, 'error'); }
  if (!tokenResponse.ok || !tokenData.access_token || tokenData.access_token.length > 8192) {
    reportUserError();
    return finish(request, 'error');
  }

  let authorUrn = process.env.LINKEDIN_AUTHOR_URN?.trim() || '';
  try {
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(8_000),
    });
    if (profileResponse.ok) {
      const profile = await profileResponse.json() as { sub?: string };
      if (profile.sub && /^[A-Za-z0-9_-]{1,200}$/.test(profile.sub)) authorUrn = `urn:li:person:${profile.sub}`;
    }
  } catch {
    // Keep a previously configured member URN if the optional profile lookup is unavailable.
  }
  if (!authorUrn || !/^urn:li:person:[A-Za-z0-9_-]+$/.test(authorUrn)) {
    return finish(request, 'error');
  }

  const envPath = path.join(process.cwd(), '.env.local');
  const tempPath = `${envPath}.${randomUUID()}.tmp`;
  try {
    const existing = await readFile(envPath, 'utf8');
    const values: Record<string, string> = { LINKEDIN_ACCESS_TOKEN: tokenData.access_token, LINKEDIN_AUTHOR_URN: authorUrn };
    if (tokenData.expires_in && Number.isFinite(tokenData.expires_in)) {
      values.LINKEDIN_ACCESS_TOKEN_EXPIRES_AT = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
    }
    const updated = updateEnvFile(existing, values);
    await writeFile(tempPath, updated, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    await rename(tempPath, envPath);
    process.env.LINKEDIN_ACCESS_TOKEN = tokenData.access_token;
    process.env.LINKEDIN_AUTHOR_URN = authorUrn;
    return finish(request, 'connected');
  } catch {
    await import('node:fs/promises').then(({ rm }) => rm(tempPath, { force: true })).catch(() => undefined);
    reportUserError();
    return finish(request, 'error');
  }
}
