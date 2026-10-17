import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { ADMIN_SESSION_COOKIE, isConfiguredAdmin, isListedAdminEmail, requireAdmin } from '@/lib/admin-auth';
import { z } from 'zod';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';

const sessionSchema = z.object({
  idToken: z.string().min(1).max(10000),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    if (!origin || origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: 'Origine de la demande non autorisée.' }, { status: 403 });
    }
    const parsedBody = sessionSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) return NextResponse.json({ error: 'Token Firebase manquant ou invalide.' }, { status: 400 });
    const decodedToken = await getAdminAuth().verifyIdToken(parsedBody.data.idToken);
    if (!decodedToken.auth_time || Date.now() / 1000 - decodedToken.auth_time > 5 * 60) {
      return NextResponse.json({ error: 'Reconnecte-toi avant de créer une session.' }, { status: 401 });
    }
    const userDocument = await getAdminDb().collection('users').doc(decodedToken.uid).get();
    const claimRole = (decodedToken as typeof decodedToken & { role?: string }).role;
    const hasAdminRole = userDocument.data()?.role === 'admin' || decodedToken.admin === true || claimRole === 'admin';
    const hasCmRole = claimRole === 'cm';
    const isEmailAdmin = isConfiguredAdmin(decodedToken);
    if (!hasAdminRole && !hasCmRole && !isEmailAdmin) {
      const message = isListedAdminEmail(decodedToken.email)
        ? 'Adresse administrateur non vérifiée. Vérifie cette adresse e-mail dans Firebase, ou attribue le rôle admin avec « npm run create-admin -- adresse@email », puis reconnecte-toi.'
        : userDocument.data()?.role === 'cm'
          ? 'Profil CM trouvé, mais le claim Firebase role=cm manque. Un administrateur doit attribuer le rôle dans Administration > Accès CM, puis le compte doit se reconnecter.'
          : 'Compte Firebase connecté, mais aucun rôle autorisé. Demande à un administrateur de provisionner ce compte.';
      return NextResponse.json({ error: message }, { status: 403 });
    }

    const sessionCookie = await getAdminAuth().createSessionCookie(parsedBody.data.idToken, { expiresIn: 1000 * 60 * 60 * 8 });
    const response = NextResponse.json({ authenticated: true, role: hasAdminRole || isEmailAdmin ? 'admin' : 'cm' });
    response.cookies.set(ADMIN_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch (error) {
    reportUserError();
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
    return NextResponse.json({ authenticated: false }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
