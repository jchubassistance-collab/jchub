import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';
import { z } from 'zod';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';

function isAllowedAdmin(email: string | undefined) {
  const allowedEmails = (process.env.ADMIN_EMAILS || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
  return Boolean(email && allowedEmails.includes(email.toLowerCase()));
}

const sessionSchema = z.object({
  idToken: z.string().min(1).max(10000),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const parsedBody = sessionSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) return NextResponse.json({ error: 'Token Firebase manquant ou invalide.' }, { status: 400 });
    const decodedToken = await getAdminAuth().verifyIdToken(parsedBody.data.idToken);
    const userDocument = await getAdminDb().collection('users').doc(decodedToken.uid).get();
    const hasAdminRole = userDocument.data()?.role === 'admin' || decodedToken.admin === true;
    if (!hasAdminRole && !isAllowedAdmin(decodedToken.email)) return NextResponse.json({ error: 'Accès administrateur refusé.' }, { status: 403 });

    const sessionCookie = await getAdminAuth().createSessionCookie(parsedBody.data.idToken, { expiresIn: 1000 * 60 * 60 * 8 });
    const response = NextResponse.json({ authenticated: true });
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

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { httpOnly: true, expires: new Date(0), path: '/' });
  return response;
}