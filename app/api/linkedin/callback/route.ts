import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[character] ?? character,
  );
}

function errorResponse(message: string, status = 400) {
  return new NextResponse(
    `<!doctype html>
<html lang="fr">
  <head><meta charset="utf-8"><title>Connexion LinkedIn</title></head>
  <body style="font-family: sans-serif; max-width: 720px; margin: 48px auto; padding: 0 20px">
    <h1>Connexion LinkedIn impossible</h1>
    <p>${escapeHtml(message)}</p>
  </body>
</html>`,
    {
      status,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    },
  );
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const returnedState = requestUrl.searchParams.get('state');
  const linkedinError = requestUrl.searchParams.get('error_description');
  const expectedState = (await cookies()).get('linkedin_oauth_state')?.value;

  if (linkedinError) {
    return errorResponse(linkedinError);
  }

  if (!code || !returnedState || !expectedState || returnedState !== expectedState) {
    return errorResponse('La validation OAuth a échoué. Recommence la connexion LinkedIn.');
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? requestUrl.origin;
  const redirectUri = `${siteUrl.replace(/\/$/, '')}/api/linkedin/callback`;

  if (!clientId || !clientSecret) {
    return errorResponse('LINKEDIN_CLIENT_ID ou LINKEDIN_CLIENT_SECRET est manquant.', 500);
  }

  const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
    cache: 'no-store',
  });

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };

  if (!tokenResponse.ok || !tokenData.access_token) {
    return errorResponse(
      tokenData.error_description ?? 'LinkedIn n’a pas retourné de token.',
      502,
    );
  }

  const response = new NextResponse(
    `<!doctype html>
<html lang="fr">
  <head><meta charset="utf-8"><title>Token LinkedIn obtenu</title></head>
  <body style="font-family: sans-serif; max-width: 720px; margin: 48px auto; padding: 0 20px">
    <h1>Token LinkedIn obtenu</h1>
    <p>Copie cette valeur dans ton fichier <code>.env</code>, puis supprime-la de cette page.</p>
    <textarea readonly style="width: 100%; min-height: 100px; font-family: monospace">${escapeHtml(tokenData.access_token)}</textarea>
    <p>Ajoute :</p>
    <pre>LINKEDIN_ACCESS_TOKEN=${escapeHtml(tokenData.access_token)}</pre>
    <p>Durée annoncée : ${tokenData.expires_in ? `${Math.round(tokenData.expires_in / 86400)} jours` : 'non communiquée'}.</p>
  </body>
</html>`,
    {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    },
  );
  response.cookies.delete('linkedin_oauth_state');
  return response;
}
