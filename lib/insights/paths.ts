/**
 * Small helpers on addresses, shared by the collection route and the browser tracker. No
 * dependency, so the tracker stays light. Only relative imports: tested with plain Node.
 */

export type TrafficSource = 'google' | 'facebook' | 'instagram' | 'linkedin' | 'whatsapp' | 'x' | 'youtube' | 'bing' | 'autre-moteur' | 'direct' | 'site-referent' | 'interne';

/**
 * Where a visit comes from, read from utm_source first, then the referrer's host.
 * `siteHost` is the site's own host: a referrer from it is internal navigation.
 */
export function classifySource(referrer: string | undefined, utm: string | undefined, siteHost: string): TrafficSource {
  const tag = utm?.toLowerCase().trim();
  if (tag) {
    if (/^(fb|facebook)/.test(tag)) return 'facebook';
    if (/^(ig|instagram)/.test(tag)) return 'instagram';
    if (/^(li|linkedin|lnkd)/.test(tag)) return 'linkedin';
    if (/^(wa|whatsapp)/.test(tag)) return 'whatsapp';
    if (/^google/.test(tag)) return 'google';
  }
  if (!referrer) return 'direct';
  let host: string;
  try { host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, ''); } catch { return 'direct'; }
  if (host === siteHost.replace(/^www\./, '') || host.endsWith(`.${siteHost.replace(/^www\./, '')}`)) return 'interne';
  if (/(^|\.)google\.[a-z.]+$/.test(host) || host === 'news.google.com') return 'google';
  if (/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/.test(host) || host === 'l.facebook.com' || host === 'lm.facebook.com') return 'facebook';
  if (/(^|\.)instagram\.com$/.test(host) || host === 'l.instagram.com') return 'instagram';
  if (/(^|\.)(linkedin\.com|lnkd\.in)$/.test(host)) return 'linkedin';
  if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(host)) return 'whatsapp';
  if (/(^|\.)(t\.co|x\.com|twitter\.com)$/.test(host)) return 'x';
  if (/(^|\.)(youtube\.com|youtu\.be)$/.test(host)) return 'youtube';
  if (/(^|\.)bing\.com$/.test(host)) return 'bing';
  if (/(^|\.)(duckduckgo\.com|yahoo\.com|ecosia\.org|qwant\.com|yandex\.[a-z]+|baidu\.com)$/.test(host)) return 'autre-moteur';
  return 'site-referent';
}

/** Language of a page from its address prefix. */
export function pageLang(path: string): 'fr' | 'en' | '' {
  return path.startsWith('/en/') || path === '/en' ? 'en' : path.startsWith('/fr/') || path === '/fr' ? 'fr' : '';
}

/** The tool page a path belongs to, as { locale, slug }, or null. */
export function toolPageOf(path: string): { locale: 'fr' | 'en'; slug: string } | null {
  const match = path.match(/^\/(fr|en)\/(?:outils|tools)\/([a-z0-9-]+)\/?$/);
  if (!match || match[2] === 'categorie' || match[2] === 'category' || match[2] === 'apercu' || match[2] === 'preview') return null;
  return { locale: match[1] as 'fr' | 'en', slug: match[2] };
}

/** An article page of the blog, as { locale, slug }, or null. */
export function articlePageOf(path: string): { locale: 'fr' | 'en'; slug: string } | null {
  const match = path.match(/^\/(fr|en)\/blog\/([a-z0-9-]+)\/?$/);
  return match ? { locale: match[1] as 'fr' | 'en', slug: match[2] } : null;
}

/** Device family from the user agent. */
export function deviceOf(userAgent: string): 'mobile' | 'tablette' | 'ordinateur' {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) return 'tablette';
  if (/mobi|iphone|android/i.test(userAgent)) return 'mobile';
  return 'ordinateur';
}
