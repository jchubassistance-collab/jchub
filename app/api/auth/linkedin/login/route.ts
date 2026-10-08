import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getLinkedInRedirectUri } from '@/lib/linkedin-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'En production, ajoute les identifiants LinkedIn dans les variables secrètes Vercel et redéploie.' }, { status: 409 });
    }
    const clientId = process.env.LINKEDIN_CLIENT_ID?.trim();
    if (!clientId || clientId.toLowerCase().includes('demo')) {
      return NextResponse.json({ error: 'Configure un vrai LINKEDIN_CLIENT_ID côté serveur.' }, { status: 503 });
    }
    let redirectUri: string;
    try { redirectUri = getLinkedInRedirectUri(process.env); }
    catch { return NextResponse.json({ error: 'Configure LINKEDIN_REDIRECT_URI avec l’URL exacte enregistrée dans LinkedIn.' }, { status: 503 }); }

    const state = randomBytes(32).toString('hex');
    const authorization = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authorization.searchParams.set('response_type', 'code');
    authorization.searchParams.set('client_id', clientId);
    authorization.searchParams.set('redirect_uri', redirectUri);
    authorization.searchParams.set('state', state);
    authorization.searchParams.set('scope', 'openid profile w_member_social');

    const response = NextResponse.redirect(authorization);
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    response.cookies.set('linkedin_oauth_state', state, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 600,
      path: '/api/auth/linkedin',
    });
    return response;
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    return NextResponse.json({ error: code === 'UNAUTHORIZED' ? 'Connecte-toi avec un compte administrateur.' : code === 'FORBIDDEN' ? 'Accès administrateur refusé.' : 'Connexion LinkedIn indisponible.' }, { status: code === 'UNAUTHORIZED' ? 401 : code === 'FORBIDDEN' ? 403 : 500 });
  }
}
