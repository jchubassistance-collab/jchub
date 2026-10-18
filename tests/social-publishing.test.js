import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildKitCopyPrompt, buildSocialVisualPrompt, generateKitCopy, generateSocialVisual, kitPostText, parseKitCopy, parseSocialVisual, readSocialVisual, usesFormalAddress, validateKitPost } from '../lib/social-copy.ts';
import { publicImageUrl, publishToPlatform, PlatformError } from '../lib/social-platforms.ts';
import { canRetryPublication, externalPublishingEnabled, isCronBearerAuthorized, isPlatformEnabled, publicationGuardId, publicationId, zonedDateTimeToUtc, shouldAutoPublish, settleIndependently } from '../lib/social-utils.ts';
import { getLinkedInRedirectUri, isMatchingOAuthState, updateEnvFile } from '../lib/linkedin-oauth.ts';
import { facebookAppSecretProof, facebookGraphApiVersion, getFacebookAppId, getFacebookAppSecret, getFacebookRedirectUri, selectFacebookPage } from '../lib/facebook-oauth.ts';
import { getSocialPlatformReadiness } from '../lib/social-readiness.ts';
import { FacebookInsightsError, getFacebookInsights } from '../lib/facebook-insights.ts';
import { GitHubInsightsError, getGitHubInsights } from '../lib/github-insights.ts';

const source = {
  id: 'article-security-2026', title: 'Sécuriser une application web',
  description: 'Les bases de la sécurité web.', content: 'Validez les entrées côté serveur.',
  url: 'https://jchub.dev/blog/article-security-2026', tags: ['sécurité'], category: 'Web', author: 'JcHub',
};
const copies = {
  linkedin: `Les erreurs de sécurité web commencent souvent par une validation absente.\n\nValide les entrées côté serveur et ajoute des limites adaptées.\n\nÀ lire : ${source.url}\n#Cybersecurite #WebDev`,
  facebook: `Un formulaire accepte-t-il tout ce qu’on lui envoie ? La validation doit aussi se faire côté serveur.\n\nDécouvre les conseils : ${source.url} #Sécurité`,
  instagram: `Ton formulaire fait-il confiance à tout le monde ? 🔐\n\nLa validation côté serveur reste ta meilleure défense.\n\nL’article complet est sur jchub.dev (lien en bio).\n\n#sécurité #webdev #javascript #dev #jchub`,
  github: `## Sécuriser une application web\n\nValider les données reçues côté serveur évite plusieurs erreurs fréquentes.\n\n[Lire l’article](${source.url})\n\nTags : sécurité, Web`,
};

function mockResponse(status, body = {}, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

function record(platform, content = copies[platform]) {
  return { id: 'a'.repeat(64), sourceContentId: source.id, sourceTitle: source.title, sourceUrl: source.url, imageUrl: undefined, platform, destination: platform === 'github' ? 'jchubassistance-collab/jchub@main:docs/social-publications.md' : 'configured', content, contentHash: 'hash123', status: 'APPROVED', retryCount: 0 };
}

const kitSource = { kind: 'article', title: source.title, description: source.description, category: 'Web', url: source.url, tags: ['sécurité'] };
const kitCopy = {
  imageTitle: 'Valide tes entrées côté serveur',
  imageSubtitle: 'Les bases pour ne plus faire confiance aux données reçues.',
  instagramCaption: 'Ton formulaire fait-il confiance à tout le monde ? La validation côté serveur reste ta meilleure défense. Lien en bio.',
  instagramHashtags: ['#securite', 'webdev', '#jchub'],
  facebookCaption: 'Un formulaire accepte-t-il tout ce qu’on lui envoie ? Découvre comment valider côté serveur.',
  facebookHashtags: ['#securite', '#webdev'],
};

test('les textes du kit sont générés en JSON, tutoient le lecteur et normalisent les hashtags', async () => {
  const prompt = buildKitCopyPrompt(kitSource);
  assert.match(prompt, /Tutoie toujours le lecteur/);
  assert.match(prompt, /sans coller l'URL : le lien est ajouté automatiquement/);
  assert.match(prompt, /"facebookCaption"/);
  const parsed = parseKitCopy(JSON.stringify(kitCopy));
  assert.deepEqual(parsed.instagramHashtags, ['#securite', '#webdev', '#jchub']);
  assert.throws(() => parseKitCopy(JSON.stringify({ ...kitCopy, facebookCaption: 'Découvrez comment valider vos formulaires côté serveur.' })), /tutoyer/);
  assert.throws(() => parseKitCopy(JSON.stringify({ ...kitCopy, instagramCaption: 'x'.repeat(1001) })));
  assert.throws(() => parseKitCopy(JSON.stringify({ ...kitCopy, snapchatCaption: 'ancien champ' })));
});

test('redemande une génération après une sortie tronquée ou invalide, dans la limite des essais', async () => {
  const outputs = [() => { throw new Error('OPENROUTER_OUTPUT_TRUNCATED'); }, () => 'User Safety: safe', () => JSON.stringify(kitCopy)];
  let calls = 0;
  const generated = await generateKitCopy(kitSource, async () => outputs[calls++](), 3);
  assert.equal(generated.imageTitle, kitCopy.imageTitle);
  assert.equal(calls, 3);
  calls = 0;
  await assert.rejects(generateKitCopy(kitSource, async () => outputs[calls++](), 2), /JSON/);
  assert.equal(calls, 2);
});

test('le texte publié depuis un kit ajoute les hashtags et garde un lien cliquable sur Facebook', () => {
  const kit = { ...parseKitCopy(JSON.stringify(kitCopy)), url: source.url };
  assert.equal(kitPostText(kit, 'instagram'), `${kitCopy.instagramCaption}\n\n#securite #webdev #jchub`);
  assert.equal(kitPostText(kit, 'facebook'), `${kitCopy.facebookCaption}\n\n${source.url}\n\n#securite #webdev`);
  assert.equal(kitPostText({ ...kit, facebookCaption: `À lire : ${source.url}` }, 'facebook'), `À lire : ${source.url}\n\n#securite #webdev`);
  assert.equal(validateKitPost('instagram', kitPostText(kit, 'instagram')), null);
  assert.match(validateKitPost('instagram', Array.from({ length: 31 }, (_, i) => `#t${i}`).join(' ')), /30 hashtags/);
  assert.match(validateKitPost('facebook', ' '), /vide/);
});

const jwtVisual = {
  badge: 'Technique',
  subtitle: 'Comprends et débogue tes tokens JWT sans quitter ton navigateur',
  diagram: { kind: 'flow', blocks: [
    { label: 'header', lines: [], tone: 'red' },
    { label: 'payload', lines: ['{', '  "userId": "12345",', '  "role": "admin",', '  "exp": 1625184000', '}'], tone: 'green' },
    { label: 'signature', lines: [], tone: 'violet' },
  ] },
};

test('le schéma du visuel est validé pour tenir dans l’image et tutoyer le lecteur', async () => {
  assert.deepEqual(parseSocialVisual(JSON.stringify(jwtVisual)), jwtVisual);
  const prompt = buildSocialVisualPrompt(source);
  assert.match(prompt, /"flow"/);
  assert.match(prompt, /"code"/);
  assert.match(prompt, /"steps"/);
  const longLine = structuredClone(jwtVisual);
  longLine.diagram.blocks[1].lines.push('"email": "john.doe@example.com", "ok": 1');
  assert.throws(() => parseSocialVisual(JSON.stringify(longLine)), /30 caractères/);
  const twoBlocks = structuredClone(jwtVisual);
  twoBlocks.diagram.blocks = [twoBlocks.diagram.blocks[0], { ...twoBlocks.diagram.blocks[1], lines: ['"email": "john.doe@example.com", "ok": 1'] }];
  assert.equal(parseSocialVisual(JSON.stringify(twoBlocks)).diagram.blocks.length, 2);
  assert.throws(() => parseSocialVisual(JSON.stringify({ ...jwtVisual, subtitle: 'Comprenez et déboguez vos tokens JWT facilement' })), /tutoyer/);
  assert.throws(() => parseSocialVisual(JSON.stringify({ ...jwtVisual, diagram: { kind: 'steps', items: [{ title: 'Un', text: 'a', tone: 'blue' }] } })));
  assert.throws(() => parseSocialVisual(JSON.stringify({ ...jwtVisual, diagram: { kind: 'chart' } })));
  assert.equal(readSocialVisual({ badge: 'x' }), null);
  let calls = 0;
  const generated = await generateSocialVisual(source, async () => (calls++ === 0 ? 'pas du JSON' : JSON.stringify(jwtVisual)), 2);
  assert.equal(calls, 2);
  assert.equal(generated.diagram.kind, 'flow');
});

test('repère le vouvoiement sans confondre « Chez » ni les impératifs tutoyés', () => {
  assert.equal(usesFormalAddress('Standardisez vos fichiers.'), true);
  assert.equal(usesFormalAddress('Prêt ? Essayez l’outil.'), true);
  assert.equal(usesFormalAddress('Chez JcHub, découvre et adopte les bonnes pratiques.'), false);
  assert.equal(usesFormalAddress(copies.instagram), false);
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
  assert.equal(shouldAutoPublish({ ...settings, autoPublish: true }, 'instagram'), false);
  assert.equal(shouldAutoPublish({ ...settings, autoPublish: true, instagramEnabled: true }, 'instagram'), true);
  assert.equal(isPlatformEnabled({ ...settings, instagramEnabled: true }, 'instagram'), true);
  assert.equal(externalPublishingEnabled({ ...settings, dryRun: false }), true);
});

test('la readiness sociale vérifie activation et variables serveur sans retourner leurs valeurs', () => {
  const settings = { linkedinEnabled: true, facebookEnabled: true, githubEnabled: true, autoPublish: false, dryRun: false, timezone: 'Africa/Brazzaville' };
  const env = {
    LINKEDIN_ACCESS_TOKEN: 'secret-value', LINKEDIN_AUTHOR_URN: 'urn:li:person:123',
    FACEBOOK_ACCESS_TOKEN: 'another-secret', FACEBOOK_PAGE_ID: '123456',
    GITHUB_TOKEN: 'github-secret', GITHUB_OWNER: 'jchub', GITHUB_REPOSITORY: 'site',
  };
  assert.deepEqual(getSocialPlatformReadiness('linkedin', settings, env), { enabled: true, configured: true, ready: true, missing: [] });
  assert.deepEqual(getSocialPlatformReadiness('facebook', settings, env), { enabled: true, configured: true, ready: true, missing: [] });
  assert.deepEqual(getSocialPlatformReadiness('github', settings, env), { enabled: true, configured: true, ready: true, missing: [] });
  assert.deepEqual(getSocialPlatformReadiness('linkedin', settings, { LINKEDIN_ACCESS_TOKEN: 'secret' }), { enabled: true, configured: true, ready: true, missing: [] });
  assert.deepEqual(getSocialPlatformReadiness('github', settings, { GITHUB_TOKEN: 'secret' }), { enabled: true, configured: true, ready: true, missing: [] });
  assert.deepEqual(getSocialPlatformReadiness('facebook', settings, {
    FACEBOOK_ACCESS_TOKEN: 'secret', FACEBOOK_PAGE_ID: '123', FACEBOOK_GRAPH_API_VERSION: 'latest',
  }).missing, ['FACEBOOK_GRAPH_API_VERSION']);
  assert.deepEqual(getSocialPlatformReadiness('facebook', settings, { FACEBOOK_ACCESS_TOKEN: 'secret' }), {
    enabled: true, configured: false, ready: false, missing: ['FACEBOOK_PAGE_ID'],
  });
  assert.deepEqual(getSocialPlatformReadiness('facebook', { ...settings, facebookEnabled: false }, env), {
    enabled: false, configured: true, ready: false, missing: [],
  });
  assert.doesNotMatch(JSON.stringify(getSocialPlatformReadiness('facebook', settings, env)), /secret/);
  const instagramSettings = { ...settings, instagramEnabled: true };
  assert.deepEqual(getSocialPlatformReadiness('instagram', instagramSettings, { FACEBOOK_ACCESS_TOKEN: 'secret', INSTAGRAM_USER_ID: '17841400000000000' }), { enabled: true, configured: true, ready: true, missing: [] });
  assert.deepEqual(getSocialPlatformReadiness('instagram', instagramSettings, { FACEBOOK_ACCESS_TOKEN: 'secret' }).missing, ['INSTAGRAM_USER_ID']);
  assert.deepEqual(getSocialPlatformReadiness('instagram', instagramSettings, { FACEBOOK_ACCESS_TOKEN: 'secret', INSTAGRAM_USER_ID: '178', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' }).missing, ['NEXT_PUBLIC_SITE_URL']);
  assert.equal(getSocialPlatformReadiness('instagram', settings, { FACEBOOK_ACCESS_TOKEN: 'secret', INSTAGRAM_USER_ID: '178' }).ready, false);
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

test('LinkedIn déduit l’URN du membre depuis le profil OpenID si elle n’est pas configurée', async () => {
  const calls = [];
  await publishToPlatform('linkedin', record('linkedin'), source, {
    env: { LINKEDIN_ACCESS_TOKEN: 'mock-token' },
    fetcher: async (url, init) => {
      calls.push({ url: String(url), body: init.body });
      if (String(url).endsWith('/v2/userinfo')) return mockResponse(200, { sub: 'member-789' });
      return mockResponse(201, {}, { 'x-restli-id': 'urn:li:share:789' });
    },
  });
  assert.equal(calls[0].url, 'https://api.linkedin.com/v2/userinfo');
  assert.equal(JSON.parse(calls[1].body).author, 'urn:li:person:member-789');
});

test('LinkedIn signale un token expiré avant de tenter la publication', async () => {
  let calls = 0;
  await assert.rejects(publishToPlatform('linkedin', record('linkedin'), source, {
    env: { LINKEDIN_ACCESS_TOKEN: 'expired-token' },
    fetcher: async () => { calls += 1; return mockResponse(401); },
  }), (error) => error instanceof PlatformError && error.code === 'TOKEN_INVALID' && /expiré/.test(error.message));
  assert.equal(calls, 1);
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
    env: { FACEBOOK_ACCESS_TOKEN: 'mock-page-token', FACEBOOK_PAGE_ID: '123456', FACEBOOK_GRAPH_API_VERSION: 'v26.0', FACEBOOK_APP_SECRET: 'mock-app-secret' },
    fetcher: async (url, init) => { requestUrl = String(url); requestBody = String(init.body); return mockResponse(200, { id: '123456_987' }); },
  });
  const facebookUrl = new URL(requestUrl);
  assert.equal(facebookUrl.origin + facebookUrl.pathname, 'https://graph.facebook.com/v26.0/123456/feed');
  assert.equal(facebookUrl.searchParams.get('appsecret_proof'), facebookAppSecretProof('mock-page-token', 'mock-app-secret'));
  assert.match(requestBody, /message=/);
  assert.equal(result.externalId, '123456_987');
  await assert.rejects(publishToPlatform('facebook', record('facebook'), source, {
    env: { FACEBOOK_ACCESS_TOKEN: 'mock-page-token', FACEBOOK_PAGE_ID: '123456' },
    fetcher: async () => mockResponse(403, { error: { message: 'private-token-detail' } }),
  }), (error) => !error.message.includes('private-token-detail'));
});

const kitImage = 'https://jchub.dev/api/kit-image/kit123?format=instagram&v=1';
const instagramSource = { ...source, portraitImageUrl: kitImage };
const instagramEnv = { FACEBOOK_ACCESS_TOKEN: 'mock-page-token', INSTAGRAM_USER_ID: '17841400000000000', FACEBOOK_GRAPH_API_VERSION: 'v26.0', FACEBOOK_APP_SECRET: 'mock-app-secret', NEXT_PUBLIC_SITE_URL: 'https://jchub.dev' };
const noWait = async () => {};
const jpegResponse = () => new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xdb]), { status: 200, headers: { 'Content-Type': 'image/jpeg', 'Content-Length': '4' } });

test('Instagram crée un conteneur avec le visuel JPEG, attend son traitement puis publie', async () => {
  const calls = [];
  let statusChecks = 0;
  const result = await publishToPlatform('instagram', record('instagram'), instagramSource, {
    env: instagramEnv, wait: noWait,
    fetcher: async (url, init = {}) => {
      const parsed = new URL(String(url));
      calls.push({ url: parsed, method: init.method || 'GET', body: init.body ? new URLSearchParams(String(init.body)) : null, headers: init.headers });
      if (parsed.hostname === 'jchub.dev') return jpegResponse();
      if (parsed.pathname.endsWith('/media')) return mockResponse(200, { id: '900' });
      if (parsed.pathname.endsWith('/900')) { statusChecks += 1; return mockResponse(200, { status_code: statusChecks === 1 ? 'IN_PROGRESS' : 'FINISHED' }); }
      if (parsed.pathname.endsWith('/media_publish')) return mockResponse(200, { id: '901' });
      return mockResponse(200, { permalink: 'https://www.instagram.com/p/abc123/' });
    },
  });
  assert.equal(calls[0].url.toString(), kitImage);
  const container = calls.find((call) => call.url.pathname.endsWith('/media'));
  assert.equal(container.url.origin + container.url.pathname, 'https://graph.facebook.com/v26.0/17841400000000000/media');
  assert.equal(container.method, 'POST');
  assert.equal(container.body.get('image_url'), kitImage);
  assert.equal(container.body.get('caption'), copies.instagram);
  assert.equal(container.url.searchParams.get('appsecret_proof'), facebookAppSecretProof('mock-page-token', 'mock-app-secret'));
  assert.equal(statusChecks, 2);
  const publish = calls.find((call) => call.url.pathname.endsWith('/media_publish'));
  assert.equal(publish.body.get('creation_id'), '900');
  assert.ok(calls.filter((call) => call.method === 'GET' && call.url.hostname === 'graph.facebook.com').every((call) => call.headers.Authorization === 'Bearer mock-page-token' && !call.url.search.includes('mock-page-token')));
  assert.deepEqual(result, { externalId: '901', externalUrl: 'https://www.instagram.com/p/abc123/' });
});

test('Instagram ne publie pas quand Meta rejette le visuel; l’échec reste relançable', async () => {
  let publishCalls = 0;
  await assert.rejects(publishToPlatform('instagram', record('instagram'), instagramSource, {
    env: instagramEnv, wait: noWait,
    fetcher: async (url) => {
      if (new URL(String(url)).hostname === 'jchub.dev') return jpegResponse();
      const path = new URL(String(url)).pathname;
      if (path.endsWith('/media')) return mockResponse(200, { id: '900' });
      if (path.endsWith('/media_publish')) publishCalls += 1;
      return mockResponse(200, { status_code: 'ERROR' });
    },
  }), (error) => error instanceof PlatformError && error.outcome === 'failed' && error.code === 'IG_CONTAINER_ERROR');
  assert.equal(publishCalls, 0);
  assert.equal(canRetryPublication('FAILED', 'IG_CONTAINER_ERROR'), true);
  await assert.rejects(publishToPlatform('instagram', record('instagram'), instagramSource, {
    env: instagramEnv, wait: noWait,
    fetcher: async (url) => new URL(String(url)).hostname === 'jchub.dev' ? jpegResponse() : mockResponse(400, { error: { message: 'private-provider-detail' } }),
  }), (error) => error.outcome === 'failed' && !error.message.includes('private-provider-detail'));
});

test('un timeout Instagram pendant media_publish devient UNKNOWN', async () => {
  await assert.rejects(publishToPlatform('instagram', record('instagram'), instagramSource, {
    env: instagramEnv, wait: noWait,
    fetcher: async (url) => {
      if (new URL(String(url)).hostname === 'jchub.dev') return jpegResponse();
      const path = new URL(String(url)).pathname;
      if (path.endsWith('/media')) return mockResponse(200, { id: '900' });
      if (path.endsWith('/media_publish')) throw new Error('timeout');
      return mockResponse(200, { status_code: 'FINISHED' });
    },
  }), (error) => error instanceof PlatformError && error.outcome === 'unknown' && error.code === 'POST_OUTCOME_UNKNOWN');
});

test('Instagram retente quand Meta n’a pas pu télécharger le visuel, puis explique le refus sans détail brut', async () => {
  let mediaCalls = 0;
  const fetchFailure = { error: { code: 100, error_subcode: 2207052, message: 'detail-brut-fournisseur' } };
  const result = await publishToPlatform('instagram', record('instagram'), instagramSource, {
    env: instagramEnv, wait: noWait,
    fetcher: async (url) => {
      const parsed = new URL(String(url));
      if (parsed.hostname === 'jchub.dev') return jpegResponse();
      if (parsed.pathname.endsWith('/media')) { mediaCalls += 1; return mediaCalls === 1 ? mockResponse(400, fetchFailure) : mockResponse(200, { id: '900' }); }
      if (parsed.pathname.endsWith('/media_publish')) return mockResponse(200, { id: '901' });
      if (parsed.pathname.endsWith('/900')) return mockResponse(200, { status_code: 'FINISHED' });
      return mockResponse(200, { permalink: 'https://www.instagram.com/p/abc123/' });
    },
  });
  assert.equal(mediaCalls, 2);
  assert.equal(result.externalId, '901');
  mediaCalls = 0;
  await assert.rejects(publishToPlatform('instagram', record('instagram'), instagramSource, {
    env: instagramEnv, wait: noWait,
    fetcher: async (url) => {
      if (new URL(String(url)).hostname === 'jchub.dev') return jpegResponse();
      mediaCalls += 1;
      return mockResponse(400, fetchFailure);
    },
  }), (error) => error.outcome === 'failed' && /code Meta 100\/2207052 : Instagram n’a pas pu télécharger le visuel/.test(error.message) && !error.message.includes('detail-brut-fournisseur'));
  assert.equal(mediaCalls, 3);
});

test('Instagram s’arrête avant Meta si le visuel n’est pas accessible', async () => {
  const hosts = [];
  await assert.rejects(publishToPlatform('instagram', record('instagram'), instagramSource, {
    env: instagramEnv, wait: noWait,
    fetcher: async (url) => { hosts.push(new URL(String(url)).hostname); return mockResponse(404, { error: 'Visuel introuvable.' }); },
  }), (error) => error.code === 'IMAGE_UNREACHABLE' && /HTTP 404/.test(error.message));
  assert.deepEqual(hosts, ['jchub.dev']);
});

test('Facebook retente une photo dont le visuel n’a pas pu être lu et traduit les codes Meta', async () => {
  const photoSource = { ...source, imageUrl: 'https://jchub.dev/api/kit-image/kit123?format=facebook&v=1' };
  const env = { FACEBOOK_ACCESS_TOKEN: 'mock-page-token', FACEBOOK_PAGE_ID: '123456' };
  let photoCalls = 0;
  const result = await publishToPlatform('facebook', record('facebook'), photoSource, {
    env, wait: noWait,
    fetcher: async (url) => {
      const parsed = new URL(String(url));
      if (parsed.hostname === 'jchub.dev') return jpegResponse();
      photoCalls += 1;
      assert.equal(parsed.pathname, '/v26.0/123456/photos');
      return photoCalls === 1 ? mockResponse(400, { error: { code: 324, message: 'Missing or invalid image file' } }) : mockResponse(200, { id: '123456_42' });
    },
  });
  assert.equal(photoCalls, 2);
  assert.equal(result.externalId, '123456_42');
  await assert.rejects(publishToPlatform('facebook', record('facebook'), photoSource, {
    env, wait: noWait,
    fetcher: async (url) => new URL(String(url)).hostname === 'jchub.dev' ? jpegResponse() : mockResponse(403, { error: { code: 200, message: 'detail-brut-fournisseur' } }),
  }), (error) => /code Meta 200 : permission manquante sur le jeton/.test(error.message) && !error.message.includes('detail-brut-fournisseur'));
});

test('Instagram exige un visuel public servi par le site et des identifiants avant tout appel', async () => {
  assert.equal(publicImageUrl(kitImage, {}), kitImage);
  assert.throws(() => publicImageUrl(kitImage, { NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' }), (error) => error.code === 'IMAGE_URL_NOT_PUBLIC');
  assert.throws(() => publicImageUrl('https://autre-site.example/image.jpg', {}), (error) => error.code === 'IMAGE_URL_NOT_PUBLIC');
  assert.throws(() => publicImageUrl(undefined, {}), (error) => error.code === 'IMAGE_MISSING');
  let calls = 0;
  const fetcher = async () => { calls += 1; return mockResponse(200, {}); };
  await assert.rejects(publishToPlatform('instagram', record('instagram'), source, { env: instagramEnv, fetcher }), (error) => error.code === 'IMAGE_MISSING');
  await assert.rejects(publishToPlatform('instagram', record('instagram'), instagramSource, { env: { FACEBOOK_ACCESS_TOKEN: 'mock' }, fetcher }), (error) => error.code === 'MISSING_CREDENTIALS');
  assert.equal(calls, 0);
});

test('Meta Insights agrège les métriques de Page sur 28 jours sans exposer le token', async () => {
  let request;
  const result = await getFacebookInsights({ FACEBOOK_ACCESS_TOKEN: 'private-token', FACEBOOK_PAGE_ID: '123456', FACEBOOK_GRAPH_API_VERSION: 'v26.0', FACEBOOK_APP_SECRET: 'mock-app-secret' }, {
    now: new Date('2026-10-14T12:00:00.000Z'),
    fetcher: async (url, init) => {
      const parsedUrl = new URL(String(url));
      if (parsedUrl.pathname.endsWith('/insights')) {
        request = { url: parsedUrl, init };
        return mockResponse(200, { data: [
          { name: 'page_impressions', values: [{ end_time: '2026-10-13T07:00:00+0000', value: 100 }, { end_time: '2026-10-14T07:00:00+0000', value: 150 }] },
          { name: 'page_post_engagements', values: [{ end_time: '2026-10-13T07:00:00+0000', value: 12 }, { end_time: '2026-10-14T07:00:00+0000', value: 18 }] },
          { name: 'page_views_total', values: [{ end_time: '2026-10-14T07:00:00+0000', value: 33 }] },
        ] });
      }
      return mockResponse(200, { followers_count: 842 });
    },
  });
  assert.equal(request.url.pathname, '/v26.0/123456/insights');
  assert.match(request.url.searchParams.get('metric'), /page_post_engagements/);
  assert.equal(request.url.searchParams.get('period'), 'day');
  assert.equal(request.url.searchParams.get('appsecret_proof'), facebookAppSecretProof('private-token', 'mock-app-secret'));
  assert.equal(request.init.headers.Authorization, 'Bearer private-token');
  assert.equal(request.url.search.includes('private-token'), false);
  assert.equal(result.impressions, 250);
  assert.equal(result.engagements, 30);
  assert.equal(result.pageViews, 33);
  assert.equal(result.followers, 842);
  assert.deepEqual(result.timeline, [
    { date: '2026-10-13', impressions: 100, engagements: 12 },
    { date: '2026-10-14', impressions: 150, engagements: 18 },
  ]);
  assert.deepEqual(result.warnings, []);
});

test('Meta Insights isole les métriques obsolètes et conserve les autres statistiques', async () => {
  const requests = [];
  const result = await getFacebookInsights({ FACEBOOK_ACCESS_TOKEN: 'private-token', FACEBOOK_PAGE_ID: '123456' }, {
    now: new Date('2026-10-14T12:00:00.000Z'),
    fetcher: async (url) => {
      const parsed = new URL(String(url));
      requests.push(parsed);
      if (!parsed.pathname.endsWith('/insights')) return mockResponse(200, { followers_count: 842 });
      if (parsed.searchParams.get('metric').includes(',')) return mockResponse(400, { error: { code: 100 } });
      const metric = parsed.searchParams.get('metric');
      if (metric === 'page_impressions') return mockResponse(400, { error: { code: 100 } });
      return mockResponse(200, { data: [{ name: metric, values: [{ end_time: '2026-10-14T07:00:00+0000', value: metric === 'page_views_total' ? 22 : 8 }] }] });
    },
  });
  assert.equal(requests.filter((url) => url.pathname.endsWith('/insights')).length, 4);
  assert.equal(result.engagements, 8);
  assert.equal(result.pageViews, 22);
  assert.equal(result.followers, 842);
  assert.equal(result.impressions, 0);
  assert.ok(result.warnings.some((warning) => warning.includes('page_impressions')));
});

test('Meta Insights transforme les permissions refusées en consigne sûre', async () => {
  await assert.rejects(getFacebookInsights({ FACEBOOK_ACCESS_TOKEN: 'private-token', FACEBOOK_PAGE_ID: '123456' }, {
    fetcher: async () => mockResponse(403, { error: { code: 200, message: 'sensitive provider detail' } }),
  }), (error) => error instanceof FacebookInsightsError && /read_insights/.test(error.message) && !error.message.includes('sensitive provider detail'));
});

test('GitHub Insights retourne les métriques du dépôt sans exposer le token', async () => {
  let request;
  const report = await getGitHubInsights({
    GITHUB_TOKEN: 'private-token',
    GITHUB_OWNER: 'jchubassistance-collab',
    GITHUB_REPOSITORY: 'jchub',
  }, {
    now: new Date('2026-10-14T12:00:00.000Z'),
    fetcher: async (url, init) => {
      request = { url: String(url), init };
      return mockResponse(200, {
        full_name: 'jchubassistance-collab/jchub',
        stargazers_count: 20,
        forks_count: 5,
        subscribers_count: 7,
        open_issues_count: 3,
        updated_at: '2026-10-13T12:00:00Z',
      });
    },
  });
  assert.equal(request.url, 'https://api.github.com/repos/jchubassistance-collab/jchub');
  assert.equal(request.init.headers.Authorization.startsWith('Bearer '), true);
  assert.equal(report.stars, 20);
  assert.equal(report.forks, 5);
  assert.equal(report.watchers, 7);
  assert.equal(report.openItems, 3);
  assert.doesNotMatch(JSON.stringify(report), /private-token/);
  await assert.rejects(getGitHubInsights({}, { fetcher: async () => { throw new Error('unexpected'); } }), (error) => error instanceof GitHubInsightsError);
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

test('GitHub publie vers le dépôt par défaut sans owner ou repository explicites', async () => {
  const calls = [];
  await publishToPlatform('github', record('github'), source, {
    env: { GITHUB_TOKEN: 'mock-token' },
    fetcher: async (url, init) => {
      calls.push({ url: String(url), method: init.method || 'GET' });
      if (calls.length === 1) return mockResponse(200, { full_name: 'jchubassistance-collab/jchub' });
      if (calls.length === 2) return mockResponse(200, { ref: 'refs/heads/main' });
      if (calls.length === 3) return mockResponse(404, {});
      return mockResponse(201, { commit: { sha: 'default-commit', html_url: 'https://github.com/commit/default' }, content: { sha: 'default-blob' } });
    },
  });
  assert.match(calls[0].url, /repos\/jchubassistance-collab\/jchub$/);
  assert.equal(calls.at(-1).method, 'PUT');
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

test('les routes des kits vérifient la session CM et l’origine; les réglages restent aux administrateurs', async () => {
  const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
  const publishRoute = await read('../app/api/cm/kits/[id]/publish/route.ts');
  assert.match(publishRoute, /await requireCm\(request\); requireSameOrigin\(request\)/);
  assert.match(await read('../app/api/cm/kits/[id]/image/route.ts'), /await requireCm\(request\)/);
  const settingsRoute = await read('../app/api/cm/publishing/route.ts');
  assert.match(settingsRoute, /export async function GET[\s\S]*await requireCmActor\(request\)/);
  assert.match(settingsRoute, /export async function PATCH[\s\S]*await requireAdmin\(request\); requireSameOrigin\(request\)/);
  // Le visuel public d'un kit n'est servi qu'après une demande de publication.
  assert.match(await read('../app/api/kit-image/[id]/route.ts'), /if \(!kit\?\.publishRequestedAt\)/);
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
  assert.equal(getFacebookAppId({ META_APP_ID: 'meta-app-id' }), 'meta-app-id');
  assert.equal(getFacebookAppSecret({ META_APP_SECRET: 'meta-app-secret' }), 'meta-app-secret');
  assert.equal(getFacebookRedirectUri({ NODE_ENV: 'development', META_REDIRECT_URI: 'http://localhost:3000/api/auth/facebook/callback' }), 'http://localhost:3000/api/auth/facebook/callback');
  assert.equal(getFacebookRedirectUri({ NODE_ENV: 'development', FACEBOOK_REDIRECT_URI: 'https://jchub-tunnel.example/api/auth/facebook/callback' }), 'https://jchub-tunnel.example/api/auth/facebook/callback');
  assert.equal(facebookGraphApiVersion({ META_GRAPH_API_VERSION: 'v26.0' }), 'v26.0');
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
  const facebookLogin = await readFile(new URL('../app/api/auth/facebook/login/route.ts', import.meta.url), 'utf8');
  assert.match(facebookLogin, /pages_show_list,pages_manage_posts,pages_read_engagement,read_insights,instagram_basic,instagram_content_publish/);
  const facebookCallback = await readFile(new URL('../app/api/auth/facebook/callback/route.ts', import.meta.url), 'utf8');
  assert.match(facebookCallback, /fields', 'instagram_business_account'/);
  assert.match(facebookLogin, /secure: new URL\(redirectUri\)\.protocol === 'https:'/);
  const nextConfig = await readFile(new URL('../next.config.mjs', import.meta.url), 'utf8');
  assert.match(nextConfig, /allowedDevOrigins: \['127\.0\.0\.1', \.\.\.\(facebookOAuthHost \? \[facebookOAuthHost\] : \[\]\)\]/);
});
