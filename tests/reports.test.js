import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRequestEntry, dayKey, describeCause, describeIntent, deviceLabel, errorEmail, errorFingerprint, errorReport,
  headerText, isBotRequest, isReportId, matchesRequest, newReportId, redactPath, redactQuery, redactSecrets, reportIdTime,
  reportKeyAt, requestKind, requestPath, requestReport, requestStats, sanitizeContext, shouldEmailError,
  shouldTrackRequest, visitorLocation,
} from '../lib/reports/core.ts';

const headers = (values) => ({ get: (name) => values[name.toLowerCase()] ?? null });

test('les identifiants se trient par date et donnent le jour de leur entrée', () => {
  const early = newReportId('r', Date.UTC(2026, 9, 28, 10, 0, 0));
  const late = newReportId('r', Date.UTC(2026, 9, 28, 10, 0, 1));
  assert.ok(isReportId(early, 'r'));
  assert.ok(!isReportId(early, 'e'));
  assert.ok(!isReportId('r../../x'));
  assert.ok(early < late);
  assert.equal(reportIdTime(early), Date.UTC(2026, 9, 28, 10, 0, 0));
  assert.ok(reportKeyAt('r', Date.UTC(2026, 9, 28, 10, 0, 0)) <= early);
  assert.equal(requestPath(early), `reports/requests/2026-10-28/${early}`);
  assert.equal(dayKey(Date.UTC(2026, 9, 28, 23, 59)), '2026-10-28');
});

test('seules les requêtes utiles sont journalisées', () => {
  const track = (pathname, method = 'GET', values = {}) => shouldTrackRequest({ pathname, method, get: headers(values).get });
  assert.equal(track('/fr/outils/pdf-to-word'), true);
  assert.equal(track('/api/tools/pdf-to-word', 'POST'), true);
  assert.equal(track('/admin/reports'), false);
  assert.equal(track('/api/admin/reports/r123'), false);
  assert.equal(track('/admin/reportsx'), true);
  assert.equal(track('/fr', 'GET', { 'next-router-prefetch': '1' }), false);
  assert.equal(track('/fr', 'OPTIONS'), false);
  assert.equal(track('/icons/logo.png'), false);
  assert.equal(track('/wp-login.php'), true);
  assert.equal(track('/.env'), true);
});

test('le type et l’intention décrivent la requête', () => {
  assert.equal(requestKind('/api/cron/publish-social'), 'cron');
  assert.equal(requestKind('/api/admin/session'), 'auth');
  assert.equal(requestKind('/api/cm/kits'), 'admin');
  assert.equal(requestKind('/admin/inbox'), 'admin');
  assert.equal(requestKind('/api/contact'), 'api');
  assert.equal(requestKind('/fr/blog/x'), 'page');
  assert.equal(describeIntent({ method: 'POST', pathname: '/api/tools/pdf-to-word' }), 'Conversion PDF → Word');
  assert.equal(describeIntent({ method: 'POST', pathname: '/api/contact' }), 'Envoi du formulaire de contact');
  assert.equal(describeIntent({ method: 'GET', pathname: '/fr/blog/convertir-timestamp-unix-date' }), 'Lecture de l’article /fr/blog/convertir-timestamp-unix-date');
  assert.equal(describeIntent({ method: 'GET', pathname: '/fr/outils/pdf-to-word', toolName: 'PDF vers Word' }), 'Ouverture de l’outil PDF vers Word');
  assert.equal(describeIntent({ method: 'GET', pathname: '/en/tools/compress-pdf' }), 'Ouverture de l’outil « compress-pdf »');
  assert.equal(describeIntent({ method: 'GET', pathname: '/api/nav-search', search: '?q=pdf&lang=fr' }), 'Recherche « pdf »');
  assert.equal(describeIntent({ method: 'GET', pathname: '/api/cron/cleanup-reports' }), 'Tâche planifiée : nettoyage des rapports');
  assert.equal(describeIntent({ method: 'PATCH', pathname: '/api/admin/content/abc' }), 'Admin · contenus (abc) : modification');
  assert.equal(describeIntent({ method: 'GET', pathname: '/fr' }), 'Visite de l’accueil');
  assert.match(describeIntent({ method: 'GET', pathname: '/wp-login.php' }), /^Sonde automatique/);
});

test('les robots et les appareils sont reconnus', () => {
  assert.equal(isBotRequest('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), true);
  assert.equal(isBotRequest(''), true);
  assert.equal(isBotRequest('curl/8.4.0'), true);
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
  assert.equal(isBotRequest(iphone), false);
  assert.equal(isBotRequest(iphone, '/wp-admin/setup.php'), true);
  assert.equal(deviceLabel(iphone), 'Safari · iPhone');
  assert.equal(deviceLabel('Mozilla/5.0 (Linux; Android 14; SM-A146B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36'), 'Chrome · Android');
  assert.equal(deviceLabel('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0'), 'Edge · Windows');
});

test('la géolocalisation suit Cloudflare, sinon Vercel', () => {
  const values = { 'cf-ipcountry': 'cg', 'cf-ipcity': 'Brazzaville', 'cf-region': 'Brazzaville', 'x-vercel-ip-country': 'FR', 'x-vercel-ip-city': 'Paris' };
  assert.deepEqual(visitorLocation(headers(values), true), { country: 'CG', region: 'Brazzaville', city: 'Brazzaville' });
  assert.deepEqual(visitorLocation(headers({ 'x-vercel-ip-country': 'CI', 'x-vercel-ip-city': 'Grand-Bassam%20Sud', 'x-vercel-ip-country-region': 'AB' }), false), { country: 'CI', region: 'AB', city: 'Grand-Bassam Sud' });
  // UTF-8 read as Latin-1 by the HTTP layer.
  assert.equal(headerText(String.fromCharCode(...new TextEncoder().encode('Béjaïa'))), 'Béjaïa');
  assert.equal(headerText('Lomé'), 'Lomé');
});

test('les secrets sont masqués avant tout enregistrement', () => {
  assert.equal(redactQuery('?code=abc123&state=xyz&page=2'), 'code=[masqué]&state=[masqué]&page=2');
  assert.equal(redactPath('/.well-known/workflow/v1/webhook/tok_8f3a2b'), '/.well-known/workflow/v1/webhook/[masqué]');
  assert.equal(redactPath('/fr/outils/pdf-word'), '/fr/outils/pdf-word');
  const text = redactSecrets('Bearer abc.def.ghi failed for jean.dupont@example.com with api_key=sk_live_1234567890abcdef');
  assert.ok(!text.includes('abc.def.ghi'));
  assert.ok(!text.includes('jean.dupont'));
  assert.ok(!text.includes('1234567890abcdef'));
  assert.ok(!redactSecrets('-----BEGIN PRIVATE KEY-----\nMIIE\n-----END PRIVATE KEY-----').includes('MIIE'));
  const context = sanitizeContext({ outil: 'pdf-to-word', taille: 2048, token: 'secret', fichier: new Uint8Array(12), 'a.b': true });
  assert.deepEqual(context, { outil: 'pdf-to-word', taille: 2048, fichier: '[12 octets]', a_b: true });
});

test('une même erreur garde la même empreinte, et ne part par e-mail qu’une fois par demi-heure', () => {
  assert.equal(errorFingerprint('/api/cm/kits/abc123def', 'Kit 42 introuvable'), errorFingerprint('/api/cm/kits/zzz987yyy', 'Kit 7 introuvable'));
  assert.notEqual(errorFingerprint('/api/contact', 'Délai dépassé'), errorFingerprint('/api/newsletter', 'Délai dépassé'));
  const now = Date.UTC(2026, 9, 28, 12);
  assert.equal(shouldEmailError(undefined, now), true);
  assert.equal(shouldEmailError(now - 29 * 60_000, now), false);
  assert.equal(shouldEmailError(now - 30 * 60_000, now), true);
  const error = Object.assign(new Error('Échec avec token=abcdef123456'), { code: 'ECONNRESET', status: 502 });
  const described = describeCause(error);
  assert.equal(described.code, 'ECONNRESET');
  assert.equal(described.status, 502);
  assert.ok(!described.message.includes('abcdef123456'));
  assert.ok(described.stack.length <= 4000);
});

test('une entrée de requête est compacte et se relit', () => {
  const time = Date.UTC(2026, 9, 28, 9, 30);
  const entry = buildRequestEntry({
    time, method: 'post', pathname: '/api/tools/pdf-to-word', search: '', host: 'JcHub.dev', ip: '41.202.1.2', viaCloudflare: true, env: 'production',
    headers: headers({ 'user-agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36', 'cf-ipcountry': 'CG', 'accept-language': 'fr-FR,fr;q=0.9', referer: 'https://jchub.dev/fr/outils/pdf-to-word?x=1' }),
  });
  assert.deepEqual(Object.keys(entry).sort(), ['al', 'cc', 'h', 'i', 'ip', 'k', 'm', 'p', 'rf', 't', 'ua'].sort());
  assert.equal(entry.rf, 'https://jchub.dev/fr/outils/pdf-to-word');
  const id = newReportId('r', time);
  const report = requestReport(id, { ...entry, st: 200, ms: 830, rs: '3 pages converties', er: { [newReportId('e', time)]: true } });
  assert.equal(report.intent, 'Conversion PDF → Word');
  assert.equal(report.country, 'CG');
  assert.equal(report.errorIds.length, 1);
  assert.equal(matchesRequest(report, { status: 'errors' }), true);
  assert.equal(matchesRequest(report, { status: 'client' }), false);
  assert.equal(matchesRequest(report, { search: '41.202' }), true);
  assert.equal(matchesRequest(report, { country: 'fr' }), false);
  assert.deepEqual(requestStats([report]).countries, [{ code: 'CG', count: 1 }]);
});

test('l’e-mail d’erreur échappe le contenu et pointe vers le rapport', () => {
  const id = newReportId('e', Date.UTC(2026, 9, 28, 13, 5));
  const report = errorReport(id, { t: Date.UTC(2026, 9, 28, 13, 5), msg: '<script>alert(1)</script>', fp: 'abc', p: '/api/contact', m: 'POST', i: 'Envoi du formulaire de contact', ip: '41.202.1.2', cc: 'CG', ci: 'Brazzaville', sk: 'Error: x\n    at POST (route.js:1:1)' });
  const email = errorEmail({ error: report, link: `https://admin.jchub.dev/admin/reports/${id}`, occurrences: 3, quiet: 2, firstAt: Date.UTC(2026, 9, 28, 12) });
  assert.ok(!email.html.includes('<script>alert'));
  assert.ok(email.html.includes(`https://admin.jchub.dev/admin/reports/${id}`));
  assert.ok(email.html.includes('Brazzaville, Congo'));
  assert.ok(email.html.includes('14:05'), 'heure de Lagos');
  assert.match(email.text, /3 occurrences/);
  assert.ok(email.subject.length < 140);
});
