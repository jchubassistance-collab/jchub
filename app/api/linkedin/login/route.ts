import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const redirectUri = `${siteUrl.replace(/\/$/, '')}/api/linkedin/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'LINKEDIN_CLIENT_ID is not configured' },
      { status: 500 },
    );
  }

  const state = crypto.randomBytes(24).toString('hex');
  const authorizationUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('client_id', clientId);
  authorizationUrl.searchParams.set('redirect_uri', redirectUri);
  authorizationUrl.searchParams.set('state', state);
  authorizationUrl.searchParams.set('scope', 'w_member_social');

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set('linkedin_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
