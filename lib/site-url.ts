const FALLBACK_SITE_URL = 'https://jchub.dev';

export function getPublicBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_SITE_URL;

  try {
    const url = new URL(configuredUrl);
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    url.pathname = '';
    url.search = '';
    url.hash = '';

    if (process.env.NODE_ENV === 'production') {
      url.protocol = 'https:';
    }

    return url.origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}
