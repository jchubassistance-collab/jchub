import crypto from 'node:crypto';

type XCredentials = {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
};

function getRequiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variable ${name} manquante`);
  return value;
}

function getCredentials(): XCredentials {
  return {
    apiKey: getRequiredEnvironment('X_API_KEY'),
    apiSecret: getRequiredEnvironment('X_API_SECRET'),
    accessToken: getRequiredEnvironment('X_ACCESS_TOKEN'),
    accessTokenSecret: getRequiredEnvironment('X_ACCESS_TOKEN_SECRET'),
  };
}

function encode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function createAuthorizationHeader(url: string, method: string, credentials: XCredentials): string {
  const oauthParameters: Record<string, string> = {
    oauth_consumer_key: credentials.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: credentials.accessToken,
    oauth_version: '1.0',
  };
  const parameterString = Object.keys(oauthParameters)
    .sort()
    .map((key) => `${encode(key)}=${encode(oauthParameters[key])}`)
    .join('&');
  const signatureBase = [method.toUpperCase(), encode(url), encode(parameterString)].join('&');
  const signingKey = `${encode(credentials.apiSecret)}&${encode(credentials.accessTokenSecret)}`;
  oauthParameters.oauth_signature = crypto.createHmac('sha1', signingKey).update(signatureBase).digest('base64');

  return `OAuth ${Object.keys(oauthParameters)
    .sort()
    .map((key) => `${encode(key)}="${encode(oauthParameters[key])}"`)
    .join(', ')}`;
}

export async function getXCurrentUser() {
  const credentials = getCredentials();
  const url = 'https://api.x.com/2/users/me';

  const response = await fetch(url, {
    headers: { Authorization: createAuthorizationHeader(url, 'GET', credentials) },
    cache: 'no-store',
  });
  const data = await response.json();

  return { response, data };
}

export async function publishXTweet(text: string) {
  const credentials = getCredentials();
  const url = 'https://api.x.com/2/tweets';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: createAuthorizationHeader(url, 'POST', credentials),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
    cache: 'no-store',
  });
  const data = await response.json();

  return { response, data };
}
