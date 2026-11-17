import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { ADMIN_SESSION_COOKIE, isConfiguredAdmin, isListedAdminEmail, requireAdmin } from '@/lib/admin-auth';
import { z } from 'zod';
import { reportUserError } from '@/lib/user-error';
import { checkAdminSecondFactor, type SecondFactorResult } from '@/lib/admin-2fa';
import { logActivity } from '@/lib/activity-log';

export const runtime = 'nodejs';

const sessionSchema = z.object({
  idToken: z.string().min(1).max(10000),
  // Code de l'appli d'authentification (6 chiffres) ou code de secours (ABCD-EFGH).
  code: z.string().max(20).optional(),
}).strict();

// Le temps de scanner le QR code à la première activation, sans accepter une vieille connexion.
const MAX_SIGN_IN_AGE_SECONDS = 10 * 60;

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    if (!origin || origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Origine de la demande non autorisée.' }, { status: 403 });
    }
    const parsedBody = sessionSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) return NextResponse.json({ error: 'Token Firebase manquant ou invalide.' }, { status: 400 });
    const decodedToken = await getAdminAuth().verifyIdToken(parsedBody.data.idToken);
    if (!decodedToken.auth_time || Date.now() / 1000 - decodedToken.auth_time > MAX_SIGN_IN_AGE_SECONDS) {
      return NextResponse.json({ error: 'Reconnecte-toi avant de créer une session.' }, { status: 401 });
    }
    const userDocument = await getAdminDb().collection('users').doc(decodedToken.uid).get();
    const claimRole = (decodedToken as typeof decodedToken & { role?: string }).role;
    const hasAdminRole = userDocument.data()?.role === 'admin' || decodedToken.admin === true || claimRole === 'admin';
    const hasCmRole = claimRole === 'cm';
    const hasWriterRole = claimRole === 'writer';
    const isEmailAdmin = isConfiguredAdmin(decodedToken);
    if (!hasAdminRole && !hasCmRole && !hasWriterRole && !isEmailAdmin) {
      const message = isListedAdminEmail(decodedToken.email)
        ? 'Adresse administrateur non vérifiée. Vérifie cette adresse e-mail dans Firebase, ou attribue le rôle admin avec « npm run create-admin -- adresse@email », puis reconnecte-toi.'
        : userDocument.data()?.role === 'cm'
          ? 'Profil CM trouvé, mais le claim Firebase role=cm manque. Un administrateur doit attribuer le rôle dans Administration > Accès CM, puis le compte doit se reconnecter.'
          : userDocument.data()?.role === 'writer'
            ? 'Profil rédaction trouvé, mais le claim Firebase role=writer manque. Un administrateur doit donner l’accès dans Administration > Accès rédaction, puis le compte doit se reconnecter.'
            : 'Compte Firebase connecté, mais aucun rôle autorisé. Demande à un administrateur de provisionner ce compte.';
      logActivity(request, { uid: decodedToken.uid, email: decodedToken.email, role: 'unknown' }, 'Connexion refusée : aucun rôle autorisé');
      return NextResponse.json({ error: message }, { status: 403 });
    }

    // Double authentification obligatoire pour les administrateurs, avant toute création de session.
    const isAdmin = hasAdminRole || isEmailAdmin;
    let secondFactor: Extract<SecondFactorResult, { status: 'ok' }> | null = null;
    if (isAdmin) {
      const result = await checkAdminSecondFactor(decodedToken.uid, decodedToken.email || decodedToken.uid, parsedBody.data.code);
      const noStore = { 'Cache-Control': 'no-store' };
      if (result.status === 'setup') {
        return NextResponse.json({ mfa: 'setup', secret: result.secret, otpauthUri: result.otpauthUri }, { status: 401, headers: noStore });
      }
      if (result.status === 'required') return NextResponse.json({ mfa: 'required' }, { status: 401, headers: noStore });
      if (result.status === 'invalid') {
        return NextResponse.json({ mfa: result.setup ? 'setup-retry' : 'required', error: 'Code incorrect ou déjà utilisé.' }, { status: 401, headers: noStore });
      }
      if (result.status === 'locked') {
        const minutes = Math.max(1, Math.ceil((result.retryAt - Date.now()) / 60000));
        return NextResponse.json({ mfa: 'locked', error: `Trop de codes incorrects. Réessaie dans ${minutes} min.` }, { status: 429, headers: noStore });
      }
      secondFactor = result;
    }

    const sessionCookie = await getAdminAuth().createSessionCookie(parsedBody.data.idToken, { expiresIn: 1000 * 60 * 60 * 8 });
    logActivity(request, { uid: decodedToken.uid, email: decodedToken.email, role: isAdmin ? 'admin' : hasCmRole ? 'cm' : 'writer' }, secondFactor?.usedRecoveryCode ? 'Connexion (code de secours utilisé)' : 'Connexion');
    const response = NextResponse.json({
      authenticated: true,
      role: isAdmin ? 'admin' : hasCmRole ? 'cm' : 'writer',
      ...(secondFactor?.recoveryCodes ? { recoveryCodes: secondFactor.recoveryCodes } : {}),
      ...(secondFactor?.usedRecoveryCode ? { remainingRecoveryCodes: secondFactor.remainingRecoveryCodes } : {}),
    }, { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set(ADMIN_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error) {
    reportUserError(error, { request });
    return NextResponse.json({ error: 'Session Firebase invalide.' }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== request.nextUrl.origin) return NextResponse.json({ error: 'Origine de la demande non autorisée.' }, { status: 403 });
  const cookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (cookie) {
    try {
      const user = await getAdminAuth().verifySessionCookie(cookie, false);
      await getAdminAuth().revokeRefreshTokens(user.uid);
      const role = (user as typeof user & { role?: string }).role;
      logActivity(request, { uid: user.uid, email: user.email, role: role === 'cm' || role === 'writer' || role === 'admin' ? role : 'unknown' }, 'Déconnexion');
    } catch { /* Supprimer aussi les cookies expirés ou révoqués. */ }
  }
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { httpOnly: true, expires: new Date(0), path: '/' });
  return response;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ authenticated: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = error instanceof Error && error.message === 'FORBIDDEN' ? 403 : 401;
    // A writer or a CM who opens an admin page goes back to their own space instead of being signed out.
    let home: string | undefined;
    if (status === 403) {
      try {
        const token = await getAdminAuth().verifySessionCookie(request.cookies.get(ADMIN_SESSION_COOKIE)?.value || '', true);
        const role = (token as typeof token & { role?: string }).role;
        home = role === 'writer' ? '/admin/redaction' : role === 'cm' ? '/admin/cm' : undefined;
      } catch { /* No space to send the account to: the admin page signs it out. */ }
    }
    return NextResponse.json({ authenticated: false, ...(home ? { home } : {}) }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
