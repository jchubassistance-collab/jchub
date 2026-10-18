import type { SocialPlatform, SocialSettings } from './social-types';

export type PlatformReadiness = { enabled: boolean; configured: boolean; ready: boolean; missing: string[] };

const platformEnabled = (platform: SocialPlatform, settings: SocialSettings) => {
  if (platform === 'linkedin') return settings.linkedinEnabled;
  if (platform === 'facebook') return settings.facebookEnabled;
  if (platform === 'instagram') return Boolean(settings.instagramEnabled);
  return settings.githubEnabled;
};

// Meta télécharge lui-même le visuel Instagram : le site doit être joignable publiquement en HTTPS.
const isPublicHttpsUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  } catch { return false; }
};

export function getSocialPlatformReadiness(
  platform: SocialPlatform,
  settings: SocialSettings,
  env: NodeJS.ProcessEnv = process.env,
): PlatformReadiness {
  const missing: string[] = [];
  const check = (key: string, valid = true) => {
    if (!env[key]?.trim() || !valid) missing.push(key);
  };

  if (platform === 'linkedin') {
    check('LINKEDIN_ACCESS_TOKEN');
    if (env.LINKEDIN_AUTHOR_URN?.trim() && !/^urn:li:person:[A-Za-z0-9_-]+$/.test(env.LINKEDIN_AUTHOR_URN.trim())) missing.push('LINKEDIN_AUTHOR_URN');
    if (env.LINKEDIN_API_VERSION?.trim() && !/^\d{6}$/.test(env.LINKEDIN_API_VERSION.trim())) missing.push('LINKEDIN_API_VERSION');
  } else if (platform === 'facebook') {
    check('FACEBOOK_ACCESS_TOKEN');
    check('FACEBOOK_PAGE_ID', /^[0-9]+$/.test(env.FACEBOOK_PAGE_ID?.trim() || ''));
    if (env.FACEBOOK_GRAPH_API_VERSION?.trim() && !/^v\d+\.\d+$/.test(env.FACEBOOK_GRAPH_API_VERSION.trim())) missing.push('FACEBOOK_GRAPH_API_VERSION');
  } else if (platform === 'instagram') {
    check('FACEBOOK_ACCESS_TOKEN');
    check('INSTAGRAM_USER_ID', /^[0-9]+$/.test(env.INSTAGRAM_USER_ID?.trim() || ''));
    if (env.FACEBOOK_GRAPH_API_VERSION?.trim() && !/^v\d+\.\d+$/.test(env.FACEBOOK_GRAPH_API_VERSION.trim())) missing.push('FACEBOOK_GRAPH_API_VERSION');
    if (env.NEXT_PUBLIC_SITE_URL?.trim() && !isPublicHttpsUrl(env.NEXT_PUBLIC_SITE_URL.trim())) missing.push('NEXT_PUBLIC_SITE_URL');
  } else {
    check('GITHUB_TOKEN');
    const owner = env.GITHUB_OWNER?.trim() || 'jchubassistance-collab';
    const repository = env.GITHUB_REPOSITORY?.trim() || 'jchub';
    if (!/^[A-Za-z0-9_.-]+$/.test(owner)) missing.push('GITHUB_OWNER');
    if (!/^[A-Za-z0-9_.-]+$/.test(repository)) missing.push('GITHUB_REPOSITORY');
    if (env.GITHUB_API_VERSION?.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(env.GITHUB_API_VERSION.trim())) missing.push('GITHUB_API_VERSION');
  }

  const enabled = platformEnabled(platform, settings);
  const configured = missing.length === 0;
  return { enabled, configured, ready: enabled && configured, missing };
}