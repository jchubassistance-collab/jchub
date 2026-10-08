import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generateSocialCopies, parseSocialCopies } from '../lib/social-copy.ts';
import { publishToPlatform, PlatformError } from '../lib/social-platforms.ts';
import { canRetryPublication, externalPublishingEnabled, isCronBearerAuthorized, publicationGuardId, publicationId, zonedDateTimeToUtc, shouldAutoPublish, settleIndependently } from '../lib/social-utils.ts';
import { getLinkedInRedirectUri, isMatchingOAuthState, updateEnvFile } from '../lib/linkedin-oauth.ts';
import { facebookAppSecretProof, facebookGraphApiVersion, getFacebookRedirectUri, selectFacebookPage } from '../lib/facebook-oauth.ts';

const source = {
  id: 'article-security-2026', title: 'Sécuriser une application web',
  description: 'Les bases de la sécurité web.', content: 'Validez les entrées côté serveur.',
  url: 'https://jchub.dev/blog/article-security-2026', tags: ['sécurité'], category: 'Web', author: 'JcHub',
};
const copies = {
  linkedin: `Les erreurs de sécurité web commencent souvent par une validation absente.\n\nValide les entrées côté serveur et ajoute des limites adaptées.\n\nÀ lire : ${source.url}\n#Cybersecurite #WebDev`,
  facebook: `Un formulaire accepte-t-il tout ce qu’on lui envoie ? La validation doit aussi se faire côté serveur.\n\nDécouvre les conseils : ${source.url} #Sécurité`,
  github: `## Sécuriser une application web\n\nValider les données reçues côté serveur évite plusieurs erreurs fréquentes.\n\n[Lire l’article](${source.url})\n\nTags : sécurité, Web`,
};

function mockResponse(status, body = {}, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

function record(platform, content = copies[platform]) {
  return { id: 'a'.repeat(64), sourceContentId: source.id, sourceTitle: source.title, sourceUrl: source.url, imageUrl: undefined, platform, destination: platform === 'github' ? 'jchubassistance-collab/jchub@main:docs/social-publications.md' : 'configured', content, contentHash: 'hash123', status: 'APPROVED', retryCount: 0 };
}

test('génère et valide trois textes distincts, spécifiques et liés à la source', async () => {
  let prompt = '';
  const generated = await generateSocialCopies(source, async (value) => { prompt = value; return JSON.stringify(copies); });
  assert.deepEqual(generated, copies);
  assert.match(prompt, /Aucun issue, release/);
  assert.match(prompt, /2 à 4 points/);
});

test('rejette les copies répétées, le lien manquant et les textes trop longs', () => {
  assert.throws(() => parseSocialCopies(JSON.stringify({ ...copies, facebook: copies.linkedin }), source.url));
  assert.throws(() => parseSocialCopies(JSON.stringify({ ...copies, github: copies.github.replace(source.url, 'https://example.com') }), source.url));
  assert.throws(() => parseSocialCopies(JSON.stringify({ ...copies, linkedin: 'x'.repeat(3001) }), source.url));
});

test('identifiant de publication stable; l’empreinte et le garde source/destination ont leur rôle', () => {
  const first = publicationId(source.id, 'linkedin', 'member:123', 'hash-a');
  assert.equal(first, publicationId(source.id, 'linkedin', 'member:123', 'hash-a'));
  assert.notEqual(first, publicationId(source.id, 'linkedin', 'member:123', 'hash-b'));
  assert.equal(publicationGuardId(source.id, 'linkedin', 'member:123'), publicationGuardId(source.id, 'linkedin', 'member:123'));
  assert.notEqual(publicationGuardId(source.id, 'linkedin', 'member:123'), publicationGuardId(source.id, 'facebook', 'page:456'));
});

test('AUTO_PUBLISH requiert une plateforme active; DRY_RUN interdit les appels externes', () => {
  const settings = { linkedinEnabled: true, facebookEnabled: false, githubEnabled: true, autoPublish: false, dryRun: true, timezone: 'Africa/Brazzaville' };
  assert.equal(shouldAutoPublish(settings, 'linkedin'), false);
  assert.equal(externalPublishingEnabled(settings), false);
  assert.equal(shouldAutoPublish({ ...settings, autoPublish: true }, 'linkedin'), true);
  assert.equal(shouldAutoPublish({ ...settings, autoPublish: true }, 'facebook'), false);
  assert.equal(externalPublishingEnabled({ ...settings, dryRun: false }), true);
});

test('mode approbation garde le contenu en attente; dry-run ne requiert aucun credential', async () => {
  const settings = { autoPublish: false, dryRun: true, linkedinEnabled: false, facebookEnabled: false, githubEnabled: false, timezone: 'Africa/Brazzaville' };
  assert.equal(shouldAutoPublish(settings, 'linkedin'), false);
  let calls = 0;
  await assert.rejects(publishToPlatform('linkedin', record('linkedin'), source, { env: {}, fetcher: async () => { calls += 1; throw new Error('unexpected'); } }), (error) => error.code === 'MISSING_CREDENTIALS');
  assert.equal(calls, 0);
  assert.equal(externalPublishingEnabled(settings), false);
});

test('LinkedIn utilise le Posts API officiel et retourne son identifiant externe', async () => {
  let request;
  const result = await publishToPlatform('linkedin', record('linkedin'), source, {
    env: { LINKEDIN_ACCESS_TOKEN: 'mock-token', LINKEDIN_AUTHOR_URN: 'urn:li:person:123', LINKEDIN_API_VERSION: '202609' },
    fetcher: async (url, init) => { request = { url: String(url), init }; return mockResponse(201, {}, { 'x-restli-id': 'urn:li:share:456' }); },
  });
  assert.equal(request.url, 'https://api.linkedin.com/rest/posts');
  assert.equal(request.init.method, 'POST');
  assert.equal(JSON.parse(request.init.body).author, 'urn:li:person:123');
  assert.equal(request.init.headers['LinkedIn-Version'], '202609');
  assert.equal(result.externalId, 'urn:li:share:456');
});

test('un timeout LinkedIn après envoi devient UNKNOWN sans retry automatique', async () => {
  let calls = 0;
  await assert.rejects(publishToPlatform('linkedin', record('linkedin'), source, {
    env: { LINKEDIN_ACCESS_TOKEN: 'mock-token', LINKEDIN_AUTHOR_URN: 'urn:li:person:123' },
    fetcher: async () => { calls += 1; throw new Error('timeout'); },
  }), (error) => error instanceof PlatformError && error.outcome === 'unknown');
  assert.equal(calls, 1);
  assert.equal(canRetryPublication('UNKNOWN', 'POST_OUTCOME_UNKNOWN'), false);
  assert.equal(canRetryPublication('UNKNOWN', 'POST_OUTCOME_UNKNOWN', true), true);
  assert.equal(canRetryPublication('FAILED', 'POST_OUTCOME_UNKNOWN', true), false);
  assert.equal(canRetryPublication('FAILED', 'HTTP_400'), true);
});

test('Facebook publie seulement sur le feed de Page, avec une erreur API expurgée', async () => {
  let requestUrl = '';
  let requestBody = '';
  const result = await publishToPlatform('facebook', record('facebook'), source, {
    env: { FACEBOOK_ACCESS_TOKEN: 'mock-page-token', FACEBOOK_PAGE_ID: '123456', FACEBOOK_GRAPH_API_VERSION: 'v26.0' },
    fetcher: async (url, init) => { requestUrl = String(url); requestBody = String(init.body); return mockResponse(200, { id: '123456_987' }); },
  });
  assert.equal(requestUrl, 'https://graph.facebook.com/v26.0/123456/feed');
  assert.match(requestBody, /message=/);
  assert.equal(result.externalId, '123456_987');
  await assert.rejects(publishToPlatform('facebook', record('facebook'), source, {
    env: { FACEBOOK_ACCESS_TOKEN: 'mock-page-token', FACEBOOK_PAGE_ID: '123456' },
    fetcher: async () => mockResponse(403, { error: { message: 'private-token-detail' } }),
  }), (error) => !error.message.includes('private-token-detail'));
});

test('GitHub vérifie dépôt, branche et évite un PUT si le Markdown est identique', async () => {
  const existing = copies.github;
  const calls = [];
  const env = { GITHUB_TOKEN: 'mock-token', GITHUB_OWNER: 'jchubassistance-collab', GITHUB_REPOSITORY: 'jchub', GITHUB_BRANCH: 'main', GITHUB_PUBLISH_PATH: 'docs/social-publications.md' };
  const result = await publishToPlatform('github', record('github', existing), source, {
    env,
    fetcher: async (url, init) => {
      calls.push({ url: String(url), method: init.method || 'GET' });
      if (calls.length === 1) return mockResponse(200, { full_name: 'jchubassistance-collab/jchub' });
      if (calls.length === 2) return mockResponse(200, { ref: 'refs/heads/main' });
      return mockResponse(200, { type: 'file', sha: 'blob-sha', html_url: 'https://github.com/jchubassistance-collab/jchub/blob/main/docs/social-publications.md', content: Buffer.from(existing).toString('base64') });
    },
  });
  assert.equal(result.unchanged, true);
  assert.equal(result.externalId, 'blob-sha');
  assert.equal(calls.length, 3);
  assert.ok(calls.every((call) => call.method === 'GET'));
});

test('GitHub crée un commit uniquement après vérification de branche et fichier absent', async () => {
  const calls = [];
  const env = { GITHUB_TOKEN: 'mock-token', GITHUB_OWNER: 'jchubassistance-collab', GITHUB_REPOSITORY: 'jchub', GITHUB_BRANCH: 'main' };
  const result = await publishToPlatform('github', record('github'), source, {
    env,
    fetcher: async (url, init) => {
      calls.push({ url: String(url), method: init.method || 'GET', body: init.body });
      if (calls.length === 1) return mockResponse(200, { full_name: 'jchubassistance-collab/jchub' });
      if (calls.length === 2) return mockResponse(200, { ref: 'refs/heads/main' });
      if (calls.length === 3) return mockResponse(404, {});
      return mockResponse(201, { commit: { sha: 'commit-1', html_url: 'https://github.com/commit/1' }, content: { sha: 'blob-1' } });
    },
  });
  assert.equal(calls.at(-1).method, 'PUT');
  assert.equal(JSON.parse(calls.at(-1).body).branch, 'main');
  assert.equal(result.externalId, 'commit-1');
});

test('GitHub refuse une branche inconnue avant toute écriture', async () => {
  let puts = 0;
  let calls = 0;
  await assert.rejects(publishToPlatform('github', record('github'), source, {
    env: { GITHUB_TOKEN: 'mock-token', GITHUB_OWNER: 'jchubassistance-collab', GITHUB_REPOSITORY: 'jchub', GITHUB_BRANCH: 'absent' },
    fetcher: async () => { calls += 1; return calls === 1 ? mockResponse(200, { full_name: 'jchubassistance-collab/jchub' }) : mockResponse(404, {}); },
  }));
  assert.equal(puts, 0);
});

test('une plateforme en échec ne bloque pas le résultat des autres', async () => {
  const result = await settleIndependently(['linkedin', 'facebook', 'github'], async (platform) => {
    if (platform === 'facebook') throw new Error('simulated');
    return `${platform}-published`;
  });
  assert.deepEqual(result.map((item) => item.ok), [true, false, true]);
});

test('la planification convertit le fuseau et rejette les heures DST inexistantes', () => {
  assert.equal(zonedDateTimeToUtc('2026-01-01T09:00', 'Africa/Brazzaville').toISOString(), '2026-01-01T08:00:00.000Z');
  assert.throws(() => zonedDateTimeToUtc('2026-03-08T02:30', 'America/New_York'));
});

test('la route cron refuse les secrets absents ou incorrects', async () => {
  assert.equal(isCronBearerAuthorized(null, 'secret'), false);
  assert.equal(isCronBearerAuthorized('Bearer wrong', 'secret'), false);
  assert.equal(isCronBearerAuthorized('Bearer secret', 'secret'), true);
  const route = await readFile(new URL('../app/api/cron/publish-social/route.ts', import.meta.url), 'utf8');
  assert.match(route, /isCronBearerAuthorized\(request\.headers\.get\('authorization'\), process\.env\.CRON_SECRET\)/);
});

test('les routes d’administration appellent toutes requireAdmin', async () => {
  for (const path of [
    '../app/api/admin/social/route.ts',
    '../app/api/admin/social/prepare/route.ts',
    '../app/api/admin/social/[id]/route.ts',
  ]) {
    const route = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.match(route, /await requireAdmin\(request\)/, `${path} doit vérifier la session admin`);
  }
});

test('OAuth LinkedIn impose une URI de callback locale explicite, un state identique et une mise à jour dotenv sans exposer le jeton', async () => {
  assert.equal(getLinkedInRedirectUri({ NODE_ENV: 'development', LINKEDIN_REDIRECT_URI: 'http://localhost:3000/api/auth/linkedin/callback' }), 'http://localhost:3000/api/auth/linkedin/callback');
  assert.throws(() => getLinkedInRedirectUri({ NODE_ENV: 'production', LINKEDIN_REDIRECT_URI: 'http://localhost:3000/api/auth/linkedin/callback' }));
  assert.equal(isMatchingOAuthState('nonce-state', 'nonce-state'), true);
  assert.equal(isMatchingOAuthState('nonce-state', 'other-state'), false);
  const result = updateEnvFile('EXISTING=keep\r\nLINKEDIN_ACCESS_TOKEN="old"\r\n', { LINKEDIN_ACCESS_TOKEN: 'new-secret', LINKEDIN_AUTHOR_URN: 'urn:li:person:123' });
  assert.match(result, /EXISTING=keep/);
  assert.match(result, /LINKEDIN_ACCESS_TOKEN="new-secret"/);
  assert.match(result, /LINKEDIN_AUTHOR_URN="urn:li:person:123"/);
  assert.equal((result.match(/^LINKEDIN_ACCESS_TOKEN=/gm) || []).length, 1);
  const route = await readFile(new URL('../app/api/auth/linkedin/callback/route.ts', import.meta.url), 'utf8');
  assert.match(route, /process\.env\.NODE_ENV === 'production'/);
  assert.match(route, /requireAdmin\(request\)/);
  assert.doesNotMatch(route, /<textarea|access_token=.*html/i);
});

test('OAuth Facebook exige la callback locale exacte et ne sélectionne jamais arbitrairement une Page', async () => {
  assert.equal(getFacebookRedirectUri({ NODE_ENV: 'development', FACEBOOK_REDIRECT_URI: 'http://127.0.0.1:3000/api/auth/facebook/callback' }), 'http://127.0.0.1:3000/api/auth/facebook/callback');
  assert.throws(() => getFacebookRedirectUri({ NODE_ENV: 'production', FACEBOOK_REDIRECT_URI: 'http://127.0.0.1:3000/api/auth/facebook/callback' }));
  const pages = [{ id: '123', name: 'Page A', access_token: 'page-token-a' }, { id: '456', name: 'Page B', access_token: 'page-token-b' }];
  assert.equal(selectFacebookPage(pages, ''), 'PAGE_REQUIRED');
  assert.equal(selectFacebookPage(pages, '456'), pages[1]);
  assert.equal(selectFacebookPage(pages, '999'), null);
  assert.equal(selectFacebookPage([pages[0]], ''), pages[0]);
  assert.equal(facebookAppSecretProof('user-token', 'app-secret').length, 64);
  assert.equal(facebookGraphApiVersion({ FACEBOOK_GRAPH_API_VERSION: 'v26.0' }), 'v26.0');
  assert.throws(() => facebookGraphApiVersion({ FACEBOOK_GRAPH_API_VERSION: 'latest' }));
  for (const path of ['../app/api/auth/facebook/login/route.ts', '../app/api/auth/facebook/callback/route.ts']) {
    const route = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.match(route, /requireAdmin\(request\)/);
    assert.match(route, /process\.env\.NODE_ENV === 'production'/);
    assert.doesNotMatch(route, /<textarea|access_token=.*html/i);
  }
});
