import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { facebookGraphApiVersion, getFacebookRedirectUri } from '@/lib/facebook-oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'En production, configure les identifiants Facebook dans les variables secrètes Vercel.' }, { status: 409 });
    }
    const appId = process.env.FACEBOOK_APP_ID?.trim();
    if (!appId || appId.toLowerCase().includes('demo')) return NextResponse.json({ error: 'Configure un vrai FACEBOOK_APP_ID côté serveur.' }, { status: 503 });
    let redirectUri: string;
    let version: string;
    try { redirectUri = getFacebookRedirectUri(process.env); version = facebookGraphApiVersion(process.env); }
    catch { return NextResponse.json({ error: 'Configure FACEBOOK_REDIRECT_URI et FACEBOOK_GRAPH_API_VERSION.' }, { status: 503 }); }

    const state = randomBytes(32).toString('hex');
    const authorization = new URL(`https://www.facebook.com/${version}/dialog/oauth`);
    authorization.searchParams.set('client_id', appId);
    authorization.searchParams.set('redirect_uri', redirectUri);
    authorization.searchParams.set('response_type', 'code');
    authorization.searchParams.set('state', state);
    authorization.searchParams.set('scope', 'pages_show_list,pages_manage_posts,pages_read_engagement');

    const response = NextResponse.redirect(authorization);
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    response.cookies.set('facebook_oauth_state', state, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 600, path: '/api/auth/facebook' });
    return response;
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    return NextResponse.json({ error: code === 'UNAUTHORIZED' ? 'Connecte-toi avec un compte administrateur.' : code === 'FORBIDDEN' ? 'Accès administrateur refusé.' : 'Connexion Facebook indisponible.' }, { status: code === 'UNAUTHORIZED' ? 401 : code === 'FORBIDDEN' ? 403 : 500 });
  }
}
