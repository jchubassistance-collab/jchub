import { NextRequest } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const ADMIN_SESSION_COOKIE = 'jchub_admin_session';

export function isListedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowedEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowedEmails.includes(email.toLowerCase());
}

/**
 * ADMIN_EMAILS grants admin only to a verified address: otherwise anyone could create
 * an unverified Firebase account with a listed address that has no account yet.
 */
export function isConfiguredAdmin(user: { email?: string; email_verified?: boolean }): boolean {
  return user.email_verified === true && isListedAdminEmail(user.email);
}

/**
 * A request that changes data must come from a page of the same site: the session cookie is
 * SameSite=Lax, which other subdomains of jchub.dev would still receive (CSRF).
 */
function assertSameOriginWrite(request: NextRequest) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
  const origin = request.headers.get('origin');
  if (!origin || origin !== request.nextUrl.origin) throw new Error('FORBIDDEN');
}

export async function requireAdmin(request: NextRequest) {
  assertSameOriginWrite(request);
  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!sessionCookie) throw new Error('UNAUTHORIZED');

  let decodedToken;
  try {
    decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    throw new Error('UNAUTHORIZED');
  }

  const userDocument = await getAdminDb().collection('users').doc(decodedToken.uid).get();
  const hasAdminRole = userDocument.data()?.role === 'admin' || decodedToken.admin === true || decodedToken.role === 'admin';
  const emailIsAllowed = isConfiguredAdmin(decodedToken);
  if (!hasAdminRole && !emailIsAllowed) {
    throw new Error('FORBIDDEN');
  }

  return decodedToken;
}

// Espace CM : rôle cm ou administrateur. isAdmin réserve certaines actions (réglages, canaux non CM) aux administrateurs.
export async function requireCmActor(request: NextRequest) {
  assertSameOriginWrite(request);
  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!sessionCookie) throw new Error('UNAUTHORIZED');
  let decodedToken;
  try {
    decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    throw new Error('UNAUTHORIZED');
  }
  const profile = await getAdminDb().collection('users').doc(decodedToken.uid).get();
  const role = (decodedToken as typeof decodedToken & { role?: string }).role;
  const isAdmin = role === 'admin' || decodedToken.admin === true || profile.data()?.role === 'admin' || isConfiguredAdmin(decodedToken);
  if (isAdmin || role === 'cm') return { token: decodedToken, isAdmin };
  throw new Error('FORBIDDEN');
}

export async function requireCm(request: NextRequest) {
  return (await requireCmActor(request)).token;
}
