import { timingSafeEqual } from 'node:crypto';

export function isMatchingOAuthState(expected: string | undefined, received: string | null): boolean {
  if (!expected || !received) return false;
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes);
}

export function getLinkedInRedirectUri(env: NodeJS.ProcessEnv): string {
  const value = env.LINKEDIN_REDIRECT_URI?.trim();
  if (!value) throw new Error('LINKEDIN_REDIRECT_URI is not configured.');
  let uri: URL;
  try { uri = new URL(value); } catch { throw new Error('LINKEDIN_REDIRECT_URI is invalid.'); }
  const localHttp = uri.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(uri.hostname);
  if (uri.protocol !== 'https:' && !(env.NODE_ENV !== 'production' && localHttp)) {
    throw new Error('LINKEDIN_REDIRECT_URI must use HTTPS outside local development.');
  }
  if (uri.username || uri.password || uri.search || uri.hash) throw new Error('LINKEDIN_REDIRECT_URI is invalid.');
  if (uri.pathname !== '/api/auth/linkedin/callback') throw new Error('LINKEDIN_REDIRECT_URI must use /api/auth/linkedin/callback.');
  return uri.toString().replace(/\/$/, '');
}

export function updateEnvFile(source: string, values: Record<string, string>): string {
  let output = source;
  for (const [name, value] of Object.entries(values)) {
    const assignment = `${name}=${JSON.stringify(value)}`;
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^(?:export\\s+)?${escapedName}\\s*=.*$`, 'gm');
    if (pattern.test(output)) {
      pattern.lastIndex = 0;
      let replaced = false;
      output = output.replace(pattern, (line) => {
        if (replaced) return line;
        replaced = true;
        return assignment;
      });
    } else {
      output = `${output.replace(/[\r\n]*$/, '')}${output.trim() ? '\r\n' : ''}${assignment}\r\n`;
    }
  }
  return output;
}
