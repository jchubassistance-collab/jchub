import type { PublicationRecord, SocialPlatform, SocialSource } from './social-types';
import { createHmac } from 'node:crypto';

export type AdapterResult = { externalId: string; externalUrl?: string; unchanged?: boolean };
export class PlatformError extends Error {
  readonly outcome: 'failed' | 'unknown';
  readonly code: string;
  constructor(message: string, outcome: 'failed' | 'unknown' = 'failed', code = 'PLATFORM_ERROR') {
    super(message);
    this.name = 'PlatformError';
    this.outcome = outcome;
    this.code = code;
  }
}

type AdapterDependencies = { fetcher?: typeof fetch; env?: NodeJS.ProcessEnv; timeoutMs?: number; wait?: (ms: number) => Promise<void> };
const defaultWait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const noRedirect = { redirect: 'error' as RequestRedirect, cache: 'no-store' as RequestCache };

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.trim();
  if (!value) throw new PlatformError(`Configuration requise absente: ${key}.`, 'failed', 'MISSING_CREDENTIALS');
  return value;
}

function timeoutSignal(ms: number): AbortSignal { return AbortSignal.timeout(ms); }

async function safeJson(response: Response): Promise<Record<string, any>> {
  try { return await response.json() as Record<string, any>; }
  catch { return {}; }
}

function responseError(response: Response, _data: Record<string, any>): PlatformError {
  if (response.ok) return new PlatformError('La plateforme a répondu sans identifiant de publication; vérifie le résultat avant toute nouvelle tentative.', 'unknown', 'POST_OUTCOME_UNKNOWN');
  return new PlatformError(
    `La plateforme a refusé la publication (HTTP ${response.status}).`,
    response.status >= 500 ? 'unknown' : 'failed',
    `HTTP_${response.status}`,
  );
}

function normalizePostText(record: PublicationRecord): string { return record.content.trim(); }

async function fetchApprovedImage(source: SocialSource, env: NodeJS.ProcessEnv, fetcher: typeof fetch, timeoutMs: number): Promise<{ bytes: ArrayBuffer; mime: string } | null> {
  if (!source.imageUrl) return null;
  let url: URL;
  try { url = new URL(source.imageUrl); } catch { throw new PlatformError('URL d’image invalide.'); }
  const siteHost = new URL(env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').hostname;
  if (url.protocol !== 'https:' || url.username || url.password || url.port || ![siteHost, 'res.cloudinary.com'].includes(url.hostname)) {
    throw new PlatformError('Hôte d’image non autorisé.');
  }
  let response: Response;
  try { response = await fetcher(url, { ...noRedirect, signal: timeoutSignal(timeoutMs) }); }
  catch { return null; }
  if (!response.ok) return null;
  const mime = (response.headers.get('content-type') || '').split(';')[0].toLowerCase();
  if (!['image/jpeg', 'image/png', 'image/gif'].includes(mime)) return null;
  const declaredSize = Number(response.headers.get('content-length') || 0);
  if (declaredSize > 5 * 1024 * 1024) return null;
  const bytes = await response.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > 5 * 1024 * 1024) return null;
  return { bytes, mime };
}

function linkedinHeaders(token: string, version: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'LinkedIn-Version': version, 'X-Restli-Protocol-Version': '2.0.0' };
}

async function publishLinkedIn(record: PublicationRecord, source: SocialSource, dependencies: AdapterDependencies): Promise<AdapterResult> {
  const env = dependencies.env || process.env;
  const fetcher = dependencies.fetcher || fetch;
  const timeoutMs = dependencies.timeoutMs || 12_000;
  const token = required(env, 'LINKEDIN_ACCESS_TOKEN');
  let author = env.LINKEDIN_AUTHOR_URN?.trim();
  if (author && !/^urn:li:person:[A-Za-z0-9_-]+$/.test(author)) throw new PlatformError('LINKEDIN_AUTHOR_URN doit désigner un membre LinkedIn.');
  if (!author) {
    let profileResponse: Response;
    try {
      profileResponse = await fetcher('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` }, signal: timeoutSignal(timeoutMs), ...noRedirect,
      });
    } catch {
      throw new PlatformError('Impossible de joindre LinkedIn pour déterminer le profil. Réessaie plus tard.', 'failed', 'PROFILE_LOOKUP_FAILED');
    }
    if (profileResponse.status === 401) throw new PlatformError('Le token LinkedIn est invalide ou expiré. Reconnecte le compte et remplace LINKEDIN_ACCESS_TOKEN.', 'failed', 'TOKEN_INVALID');
    if (profileResponse.status === 403) throw new PlatformError('Le token LinkedIn ne permet pas de lire le profil. Vérifie les scopes OpenID profile.', 'failed', 'PROFILE_PERMISSION_DENIED');
    const profile = await safeJson(profileResponse);
    if (profileResponse.ok && typeof profile.sub === 'string' && /^[A-Za-z0-9_-]+$/.test(profile.sub)) author = `urn:li:person:${profile.sub}`;
    if (!author) throw new PlatformError('Impossible de déterminer le profil LinkedIn. Configure LINKEDIN_AUTHOR_URN ou utilise un token avec les scopes OpenID profile.', 'failed', 'MISSING_AUTHOR_URN');
  }
  const version = env.LINKEDIN_API_VERSION?.trim() || '202609';
  if (!/^urn:li:person:[A-Za-z0-9_-]+$/.test(author)) throw new PlatformError('LINKEDIN_AUTHOR_URN doit désigner un membre LinkedIn.');
  if (!/^\d{6}$/.test(version)) throw new PlatformError('LINKEDIN_API_VERSION invalide.');

  let imageUrn: string | undefined;
  const image = await fetchApprovedImage(source, env, fetcher, timeoutMs);
  if (image) {
    let initResponse: Response;
    try {
      initResponse = await fetcher('https://api.linkedin.com/rest/images?action=initializeUpload', {
        method: 'POST', headers: linkedinHeaders(token, version),
        body: JSON.stringify({ initializeUploadRequest: { owner: author } }), signal: timeoutSignal(timeoutMs), ...noRedirect,
      });
    } catch { throw new PlatformError('Initialisation de l’image LinkedIn impossible.', 'unknown', 'IMAGE_UPLOAD_UNKNOWN'); }
    const initData = await safeJson(initResponse);
    if (!initResponse.ok || !initData.value?.uploadUrl || !initData.value?.image) throw responseError(initResponse, initData);
    const upload = new URL(String(initData.value.uploadUrl));
    if (upload.protocol !== 'https:' || !(upload.hostname === 'linkedin.com' || upload.hostname.endsWith('.linkedin.com'))) throw new PlatformError('URL d’envoi LinkedIn invalide.');
    let uploadResponse: Response;
    try {
      uploadResponse = await fetcher(upload, { method: 'PUT', headers: { 'Content-Type': image.mime }, body: image.bytes, signal: timeoutSignal(timeoutMs), ...noRedirect });
    } catch { throw new PlatformError('Envoi de l’image LinkedIn impossible.', 'failed', 'IMAGE_UPLOAD_FAILED'); }
    if (!uploadResponse.ok) throw new PlatformError(`Envoi de l’image refusé (HTTP ${uploadResponse.status}).`);
    imageUrn = String(initData.value.image);
  }

  const post: Record<string, unknown> = {
    author,
    commentary: normalizePostText(record),
    visibility: 'PUBLIC',
    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
    ...(imageUrn ? { content: { media: { title: source.title.slice(0, 200), id: imageUrn } } } : {}),
  };
  let response: Response;
  try {
    response = await fetcher('https://api.linkedin.com/rest/posts', {
      method: 'POST', headers: linkedinHeaders(token, version), body: JSON.stringify(post), signal: timeoutSignal(timeoutMs), ...noRedirect,
    });
  } catch { throw new PlatformError('Résultat LinkedIn incertain après envoi; vérifie le profil avant toute nouvelle tentative.', 'unknown', 'POST_OUTCOME_UNKNOWN'); }
  const data = await safeJson(response);
  const id = response.headers.get('x-restli-id') || String(data.id || '');
  if (!response.ok || !id) throw responseError(response, data);
  return { externalId: id, externalUrl: `https://www.linkedin.com/feed/update/${encodeURIComponent(id)}` };
}

async function publishFacebook(record: PublicationRecord, source: SocialSource, dependencies: AdapterDependencies): Promise<AdapterResult> {
  const env = dependencies.env || process.env;
  const fetcher = dependencies.fetcher || fetch;
  const timeoutMs = dependencies.timeoutMs || 12_000;
  const token = required(env, 'FACEBOOK_ACCESS_TOKEN');
  const pageId = required(env, 'FACEBOOK_PAGE_ID');
  if (!/^[0-9]+$/.test(pageId)) throw new PlatformError('FACEBOOK_PAGE_ID invalide.');
  const version = env.FACEBOOK_GRAPH_API_VERSION?.trim() || 'v26.0';
  if (!/^v\d+\.\d+$/.test(version)) throw new PlatformError('FACEBOOK_GRAPH_API_VERSION invalide.');
  const image = await fetchApprovedImage(source, env, fetcher, timeoutMs);
  const hasImage = Boolean(image && source.imageUrl);
  const endpoint = `https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}/${hasImage ? 'photos' : 'feed'}`;
  const appSecret = env.FACEBOOK_APP_SECRET?.trim() || env.META_APP_SECRET?.trim();
  const url = new URL(endpoint);
  if (appSecret) url.searchParams.set('appsecret_proof', createHmac('sha256', appSecret).update(token).digest('hex'));
  const body = new URLSearchParams({ access_token: token, ...(hasImage ? { url: source.imageUrl!, caption: normalizePostText(record) } : { message: normalizePostText(record), link: source.url }) });
  let response: Response;
  try { response = await fetcher(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, signal: timeoutSignal(timeoutMs), ...noRedirect }); }
  catch { throw new PlatformError('Résultat Facebook incertain après envoi; vérifie la Page avant toute nouvelle tentative.', 'unknown', 'POST_OUTCOME_UNKNOWN'); }
  const data = await safeJson(response);
  if (!response.ok || !data.id) throw responseError(response, data);
  return { externalId: String(data.id), externalUrl: `https://www.facebook.com/${encodeURIComponent(String(data.id))}` };
}

// Meta télécharge lui-même le visuel Instagram : il doit être servi en HTTPS public par le site JcHub.
export function publicImageUrl(value: string | undefined, env: NodeJS.ProcessEnv = process.env): string {
  const site = new URL(env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://jchub.dev');
  let url: URL;
  try { url = new URL(value || ''); } catch { throw new PlatformError('Aucun visuel Instagram n’est disponible pour ce post.', 'failed', 'IMAGE_MISSING'); }
  if (url.protocol !== 'https:' || url.hostname !== site.hostname || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new PlatformError('Instagram doit pouvoir télécharger le visuel : NEXT_PUBLIC_SITE_URL doit être une URL HTTPS publique.', 'failed', 'IMAGE_URL_NOT_PUBLIC');
  }
  return url.toString();
}

const INSTAGRAM_STATUS_DELAYS = [0, 2_000, 3_000, 5_000, 5_000];

async function publishInstagram(record: PublicationRecord, source: SocialSource, dependencies: AdapterDependencies): Promise<AdapterResult> {
  const env = dependencies.env || process.env;
  const fetcher = dependencies.fetcher || fetch;
  const timeoutMs = dependencies.timeoutMs || 12_000;
  const wait = dependencies.wait || defaultWait;
  const token = required(env, 'FACEBOOK_ACCESS_TOKEN');
  const igUserId = required(env, 'INSTAGRAM_USER_ID');
  if (!/^[0-9]+$/.test(igUserId)) throw new PlatformError('INSTAGRAM_USER_ID invalide.');
  const version = env.FACEBOOK_GRAPH_API_VERSION?.trim() || 'v26.0';
  if (!/^v\d+\.\d+$/.test(version)) throw new PlatformError('FACEBOOK_GRAPH_API_VERSION invalide.');
  const appSecret = env.FACEBOOK_APP_SECRET?.trim() || env.META_APP_SECRET?.trim();
  const graphUrl = (path: string, params: Record<string, string> = {}) => {
    const url = new URL(`https://graph.facebook.com/${version}/${path}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    if (appSecret) url.searchParams.set('appsecret_proof', createHmac('sha256', appSecret).update(token).digest('hex'));
    return url;
  };
  const post = (url: URL, values: Record<string, string>) => fetcher(url, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...values, access_token: token }), signal: timeoutSignal(timeoutMs), ...noRedirect,
  });
  const get = (url: URL) => fetcher(url, { headers: { Authorization: `Bearer ${token}` }, signal: timeoutSignal(timeoutMs), ...noRedirect });

  // 1. Conteneur : aucune publication n'existe encore, un échec ici peut être relancé sans risque de doublon.
  const imageUrl = publicImageUrl(source.portraitImageUrl, env);
  let containerResponse: Response;
  try {
    containerResponse = await post(graphUrl(`${igUserId}/media`), {
      image_url: imageUrl,
      caption: normalizePostText(record),
      alt_text: `Visuel JcHub présentant l’article « ${source.title} »`.slice(0, 1000),
    });
  } catch { throw new PlatformError('Instagram n’a pas pu préparer le visuel. Réessaie plus tard.', 'failed', 'IG_CONTAINER_FAILED'); }
  const containerData = await safeJson(containerResponse);
  const containerId = String(containerData.id || '');
  if (!containerResponse.ok || !/^[0-9]+$/.test(containerId)) {
    throw new PlatformError(`Instagram a refusé le visuel ou la légende (HTTP ${containerResponse.status}).`, 'failed', `IG_CONTAINER_HTTP_${containerResponse.status}`);
  }

  // 2. Meta télécharge et traite l'image de façon asynchrone.
  let status = '';
  for (const delay of INSTAGRAM_STATUS_DELAYS) {
    if (delay) await wait(delay);
    try {
      const statusResponse = await get(graphUrl(containerId, { fields: 'status_code' }));
      status = String((await safeJson(statusResponse)).status_code || '');
    } catch { status = ''; }
    if (status === 'FINISHED' || status === 'ERROR' || status === 'EXPIRED') break;
  }
  if (status === 'ERROR' || status === 'EXPIRED') throw new PlatformError('Instagram n’a pas pu traiter le visuel.', 'failed', `IG_CONTAINER_${status}`);
  if (status !== 'FINISHED') throw new PlatformError('Instagram traite encore le visuel; réessaie dans quelques minutes.', 'failed', 'IG_CONTAINER_NOT_READY');

  // 3. Publication : à partir d'ici, un résultat ambigu doit être vérifié manuellement.
  let publishResponse: Response;
  try { publishResponse = await post(graphUrl(`${igUserId}/media_publish`), { creation_id: containerId }); }
  catch { throw new PlatformError('Résultat Instagram incertain après envoi; vérifie le compte avant toute nouvelle tentative.', 'unknown', 'POST_OUTCOME_UNKNOWN'); }
  const publishData = await safeJson(publishResponse);
  const mediaId = String(publishData.id || '');
  if (!publishResponse.ok || !/^[0-9]+$/.test(mediaId)) throw responseError(publishResponse, publishData);

  let externalUrl: string | undefined;
  try {
    const permalink = String((await safeJson(await get(graphUrl(mediaId, { fields: 'permalink' })))).permalink || '');
    if (/^https:\/\/(www\.)?instagram\.com\//.test(permalink)) externalUrl = permalink;
  } catch { externalUrl = undefined; }
  return { externalId: mediaId, externalUrl };
}

async function githubRequest(url: string, init: RequestInit, fetcher: typeof fetch, timeoutMs: number, wait: (ms: number) => Promise<void>, safeToRetry: boolean): Promise<Response> {
  const delays = safeToRetry ? [0, 250, 750] : [0];
  let lastError: unknown;
  for (let i = 0; i < delays.length; i += 1) {
    if (delays[i]) await wait(delays[i]);
    try {
      const response = await fetcher(url, { ...init, signal: timeoutSignal(timeoutMs), ...noRedirect });
      if (safeToRetry && i < delays.length - 1 && (response.status === 429 || response.status >= 500)) continue;
      return response;
    } catch (error) { lastError = error; if (!safeToRetry || i === delays.length - 1) break; }
  }
  if (safeToRetry) throw new PlatformError('Lecture du dépôt GitHub impossible.', 'failed', 'GITHUB_READ_FAILED');
  throw new PlatformError('Résultat GitHub incertain après envoi; vérifie le fichier avant toute nouvelle tentative.', 'unknown', 'POST_OUTCOME_UNKNOWN');
}

async function publishGitHub(record: PublicationRecord, dependencies: AdapterDependencies): Promise<AdapterResult> {
  const env = dependencies.env || process.env;
  const fetcher = dependencies.fetcher || fetch;
  const timeoutMs = dependencies.timeoutMs || 12_000;
  const wait = dependencies.wait || defaultWait;
  const token = required(env, 'GITHUB_TOKEN');
  const owner = env.GITHUB_OWNER?.trim() || 'jchubassistance-collab';
  const repository = env.GITHUB_REPOSITORY?.trim() || 'jchub';
  const branch = env.GITHUB_BRANCH?.trim() || 'main';
  const filePath = env.GITHUB_PUBLISH_PATH?.trim() || 'docs/social-publications.md';
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repository) || !/^[A-Za-z0-9_.\-/]+$/.test(branch) || filePath.startsWith('/') || filePath.split('/').some((part) => !part || part === '.' || part === '..')) {
    throw new PlatformError('Configuration du dépôt ou du chemin GitHub invalide.');
  }
  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`;
  const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': env.GITHUB_API_VERSION?.trim() || '2026-03-10' };
  const repoResponse = await githubRequest(base, { headers }, fetcher, timeoutMs, wait, true);
  const repoData = await safeJson(repoResponse);
  if (!repoResponse.ok || String(repoData.full_name || '').toLowerCase() !== `${owner}/${repository}`.toLowerCase()) throw new PlatformError('Dépôt GitHub introuvable ou non autorisé.', 'failed', `GITHUB_HTTP_${repoResponse.status}`);
  const refResponse = await githubRequest(`${base}/git/ref/heads/${branch.split('/').map(encodeURIComponent).join('/')}`, { headers }, fetcher, timeoutMs, wait, true);
  if (!refResponse.ok) throw new PlatformError('Branche GitHub configurée introuvable.', 'failed', `GITHUB_BRANCH_${refResponse.status}`);
  const path = filePath.split('/').map(encodeURIComponent).join('/');
  const readUrl = `${base}/contents/${path}?ref=${encodeURIComponent(branch)}`;
  const readResponse = await githubRequest(readUrl, { headers }, fetcher, timeoutMs, wait, true);
  let fileData: Record<string, any> | null = null;
  if (readResponse.ok) fileData = await safeJson(readResponse);
  else if (readResponse.status !== 404) throw new PlatformError('Lecture du fichier GitHub impossible.', 'failed', `GITHUB_HTTP_${readResponse.status}`);
  if (fileData && fileData.type !== 'file') throw new PlatformError('Le chemin GitHub configuré ne désigne pas un fichier.');
  const marker = `<!-- jchub-social:${record.contentHash} -->`;
  const existing = fileData?.content ? Buffer.from(String(fileData.content).replace(/\s/g, ''), 'base64').toString('utf8') : '';
  if (existing.includes(marker) || existing.trim() === record.content.trim()) return { externalId: String(fileData?.sha || ''), externalUrl: String(fileData?.html_url || ''), unchanged: true };
  const nextContent = `${existing.trimEnd()}${existing.trim() ? '\n\n---\n\n' : ''}${marker}\n${record.content.trim()}\n`;
  if (Buffer.byteLength(nextContent, 'utf8') > 900 * 1024) throw new PlatformError('Le fichier GitHub configuré est trop volumineux.');
  const putBody = { message: `docs: publish ${record.sourceTitle.slice(0, 64)}`, content: Buffer.from(nextContent, 'utf8').toString('base64'), branch, ...(fileData?.sha ? { sha: String(fileData.sha) } : {}) };
  const putResponse = await githubRequest(`${base}/contents/${path}`, {
    method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(putBody),
  }, fetcher, timeoutMs, wait, false);
  const putData = await safeJson(putResponse);
  if (!putResponse.ok || !putData.commit?.sha) throw responseError(putResponse, putData);
  return { externalId: String(putData.commit.sha), externalUrl: String(putData.commit.html_url || '') };
}

export async function publishToPlatform(
  platform: SocialPlatform,
  record: PublicationRecord,
  source: SocialSource,
  dependencies: AdapterDependencies = {},
): Promise<AdapterResult> {
  if (platform === 'linkedin') return publishLinkedIn(record, source, dependencies);
  if (platform === 'facebook') return publishFacebook(record, source, dependencies);
  if (platform === 'instagram') return publishInstagram(record, source, dependencies);
  return publishGitHub(record, dependencies);
}
