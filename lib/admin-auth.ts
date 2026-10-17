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

export async function requireAdmin(request: NextRequest) {
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

export async function requireCm(request: NextRequest) {
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
  if (role === 'cm' || role === 'admin' || decodedToken.admin === true || profile.data()?.role === 'admin' || isConfiguredAdmin(decodedToken)) return decodedToken;
  throw new Error('FORBIDDEN');
}
