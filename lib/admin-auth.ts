import { NextRequest } from 'next/server';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { reportOutcome } from '@/lib/reports/server';

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

  // The token's claims or a listed address are enough; the Firestore profile is read only otherwise,
  // which spares a round trip on each admin request.
  const claimsAdmin = decodedToken.admin === true || decodedToken.role === 'admin' || isConfiguredAdmin(decodedToken);
  if (!claimsAdmin) {
    const userDocument = await getAdminDb().collection('users').doc(decodedToken.uid).get();
    if (userDocument.data()?.role !== 'admin') throw new Error('FORBIDDEN');
  }

  // The site reports name the account behind each admin action.
  reportOutcome(request, { user: decodedToken.email || decodedToken.uid });
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
  const role = (decodedToken as typeof decodedToken & { role?: string }).role;
  // Same as requireAdmin: the Firestore profile is read only when the token does not settle it.
  const isAdmin = role === 'admin' || decodedToken.admin === true || isConfiguredAdmin(decodedToken)
    || (await getAdminDb().collection('users').doc(decodedToken.uid).get()).data()?.role === 'admin';
  if (isAdmin || role === 'cm') {
    reportOutcome(request, { user: decodedToken.email || decodedToken.uid });
    return { token: decodedToken, isAdmin };
  }
  throw new Error('FORBIDDEN');
}

export async function requireCm(request: NextRequest) {
  return (await requireCmActor(request)).token;
}

export type Writer = { uid: string; email: string; name: string };

// Espace rédaction : rôle writer uniquement. Le nom signé sur les articles vient du claim authorName,
// que seul un administrateur peut changer (le profil Firestore et le nom Firebase sont modifiables par le compte).
function writerFromToken(token: DecodedIdToken): Writer | null {
  const claims = token as DecodedIdToken & { role?: string; authorName?: string };
  if (claims.role !== 'writer') return null;
  const email = token.email || '';
  return { uid: token.uid, email, name: String(claims.authorName || token.name || email.split('@')[0] || 'Rédaction JcHub').trim() };
}

/**
 * The writer behind a session cookie, or null when the session is missing, invalid or of another role.
 * Without checkRevoked, no request goes to Firebase: enough for the page frame, since every
 * /api/redaction route checks revoked sessions before giving out data.
 */
export async function writerFromSession(sessionCookie: string | undefined, checkRevoked = true): Promise<Writer | null> {
  if (!sessionCookie) return null;
  try {
    return writerFromToken(await getAdminAuth().verifySessionCookie(sessionCookie, checkRevoked));
  } catch {
    return null;
  }
}

export async function requireWriter(request: NextRequest): Promise<Writer> {
  assertSameOriginWrite(request);
  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!sessionCookie) throw new Error('UNAUTHORIZED');
  let decodedToken;
  try {
    decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie, true);
  } catch {
    throw new Error('UNAUTHORIZED');
  }
  const writer = writerFromToken(decodedToken);
  if (!writer) throw new Error('FORBIDDEN');
  reportOutcome(request, { user: writer.email || writer.uid });
  return writer;
}
