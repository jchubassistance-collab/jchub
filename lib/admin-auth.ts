import { NextRequest } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export const ADMIN_SESSION_COOKIE = 'jchub_admin_session';

export async function requireAdmin(request: NextRequest) {
  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!sessionCookie) throw new Error('UNAUTHORIZED');

  let decodedToken;
  try {
    decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    throw new Error('UNAUTHORIZED');
  }

  const allowedEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const userDocument = await getAdminDb().collection('users').doc(decodedToken.uid).get();
  const hasAdminRole = userDocument.data()?.role === 'admin' || decodedToken.admin === true;
  const emailIsAllowed = Boolean(decodedToken.email && allowedEmails.includes(decodedToken.email.toLowerCase()));
  if (!hasAdminRole && !emailIsAllowed) {
    throw new Error('FORBIDDEN');
  }

  return decodedToken;
}