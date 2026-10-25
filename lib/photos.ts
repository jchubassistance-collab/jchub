// Photos Unsplash des visuels (couvertures d'articles, kits réseaux sociaux).
// Règles de l'API : afficher les images depuis images.unsplash.com, créditer l'auteur et signaler
// chaque photo retenue via son download_location. https://help.unsplash.com/en/collections/1463188-unsplash-api-guidelines

export type Photo = {
  id: string;
  url: string; // image brute sur images.unsplash.com, recadrée à la demande par photoImageUrl
  thumb: string;
  alt: string;
  author: string;
  authorUrl: string;
  pageUrl: string;
  downloadLocation: string;
};
export type PhotoOrientation = 'landscape' | 'portrait' | 'squarish';

const API = 'https://api.unsplash.com';
const REFERRAL = 'utm_source=jchub&utm_medium=referral';

export const photosEnabled = () => Boolean(process.env.UNSPLASH_ACCESS_KEY?.trim());

function hostIs(value: string, hostname: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === hostname;
  } catch {
    return false;
  }
}

// Seules les images d'Unsplash sont téléchargées par le serveur : une adresse enregistrée ne peut pas le faire appeler ailleurs.
export const isUnsplashImage = (value: string) => hostIs(value, 'images.unsplash.com');

export function photoImageUrl(url: string, width: number, height: number): string {
  const image = new URL(url);
  for (const [key, value] of Object.entries({ w: String(width), h: String(height), fit: 'crop', crop: 'entropy', fm: 'jpg', q: '80' })) image.searchParams.set(key, value);
  return image.toString();
}

const withReferral = (url: string) => `${url}${url.includes('?') ? '&' : '?'}${REFERRAL}`;
export const unsplashHomeUrl = `https://unsplash.com/?${REFERRAL}`;

async function unsplash(path: string): Promise<Response> {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (!key) throw new Error('UNSPLASH_ACCESS_KEY est manquante.');
  const response = await fetch(`${API}${path}`, {
    headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Unsplash a répondu ${response.status}.`);
  return response;
}

type UnsplashPhoto = {
  id: string;
  alt_description?: string | null;
  description?: string | null;
  urls: { raw: string; small: string };
  links: { html: string; download_location: string };
  user: { name: string; links: { html: string } };
};

function toPhoto(item: UnsplashPhoto): Photo | null {
  if (!isUnsplashImage(item.urls.raw) || !isUnsplashImage(item.urls.small)) return null;
  return {
    id: item.id,
    url: item.urls.raw,
    thumb: item.urls.small,
    alt: String(item.alt_description || item.description || '').slice(0, 200),
    author: item.user.name.slice(0, 100),
    authorUrl: withReferral(item.user.links.html),
    pageUrl: withReferral(item.links.html),
    downloadLocation: item.links.download_location,
  };
}

export async function searchPhotos(query: string, orientation: PhotoOrientation, perPage = 9): Promise<Photo[]> {
  const params = new URLSearchParams({ query: query.slice(0, 100), orientation, per_page: String(perPage), content_filter: 'high' });
  const data = await (await unsplash(`/search/photos?${params}`)).json() as { results?: UnsplashPhoto[] };
  return (data.results || []).flatMap((item) => toPhoto(item) ?? []);
}

// Photos de plusieurs recherches, sans doublon, dans l'ordre des recherches : la première est la plus parlante.
export async function findPhotos(queries: string[], orientation: PhotoOrientation, perQuery = 6): Promise<Photo[]> {
  const results = await Promise.allSettled(queries.slice(0, 3).map((query) => searchPhotos(query, orientation, perQuery)));
  const seen = new Set<string>();
  return results.flatMap((result) => (result.status === 'fulfilled' ? result.value : [])).filter((photo) => !seen.has(photo.id) && seen.add(photo.id));
}

// Revalide une photo reçue ou enregistrée (kit, article) avant de l'afficher ou de la télécharger.
export function readPhoto(value: unknown): Photo | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  const text = (key: keyof Photo, max: number) => (typeof data[key] === 'string' ? (data[key] as string).slice(0, max) : '');
  const photo: Photo = {
    id: text('id', 64), url: text('url', 600), thumb: text('thumb', 600), alt: text('alt', 200), author: text('author', 100),
    authorUrl: text('authorUrl', 300), pageUrl: text('pageUrl', 300), downloadLocation: text('downloadLocation', 300),
  };
  const valid = /^[\w-]{1,64}$/.test(photo.id) && photo.author && isUnsplashImage(photo.url) && isUnsplashImage(photo.thumb)
    && hostIs(photo.authorUrl, 'unsplash.com') && hostIs(photo.pageUrl, 'unsplash.com');
  return valid ? photo : null;
}

// À appeler quand une photo est retenue pour un visuel (exigence de l'API Unsplash).
export async function trackPhotoDownload(photo: Pick<Photo, 'downloadLocation'>): Promise<void> {
  if (!hostIs(photo.downloadLocation, 'api.unsplash.com')) return;
  const location = new URL(photo.downloadLocation);
  await unsplash(`${location.pathname}${location.search}`).catch(() => undefined);
}

// Image en data URI pour next/og : une photo injoignable donne null, et le visuel se dessine sans elle.
export async function photoDataUri(url: string, width: number, height: number): Promise<string | null> {
  if (!isUnsplashImage(url)) return null;
  try {
    const response = await fetch(photoImageUrl(url, width, height), { signal: AbortSignal.timeout(8_000) });
    const type = response.headers.get('content-type') || '';
    if (!response.ok || !/^image\/(jpeg|png)/.test(type)) return null;
    return `data:${type.split(';')[0]};base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`;
  } catch {
    return null;
  }
}
