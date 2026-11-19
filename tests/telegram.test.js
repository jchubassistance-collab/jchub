import test from 'node:test';
import assert from 'node:assert/strict';
import { categoryHashtag, formatTelegramMessage, getTelegramConfig, isFresh, selectTelegramPosts, sendTelegramMessage, telegramUrl, TelegramError } from '../lib/telegram.ts';
import { classifySource } from '../lib/insights/paths.ts';

const NOW = Date.parse('2026-11-19T10:00:00Z');
const daysAgo = (days) => new Date(NOW - days * 86_400_000).toISOString();
const item = (id, kind, date) => ({ id, kind, title: `Titre ${id}`, description: 'Description', url: `https://jchub.dev/fr/x/${id}`, category: 'Sécurité', date });
const TOKEN = '123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw';

test('configuration lue depuis l’environnement', () => {
  assert.equal(getTelegramConfig({}), null);
  assert.equal(getTelegramConfig({ TELEGRAM_BOT_TOKEN: 'mauvais', TELEGRAM_CHANNEL_ID: '@jchub_dev' }), null);
  assert.equal(getTelegramConfig({ TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHANNEL_ID: 'jchub' }), null);
  assert.deepEqual(getTelegramConfig({ TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHANNEL_ID: '@jchub_dev' }), { token: TOKEN, chatId: '@jchub_dev', backlogPerRun: 3 });
  assert.equal(getTelegramConfig({ TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHANNEL_ID: '-1001234567890', TELEGRAM_BACKLOG_PER_RUN: '0' }).backlogPerRun, 0);
  assert.equal(getTelegramConfig({ TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHANNEL_ID: '@jchub_dev', TELEGRAM_BACKLOG_PER_RUN: '50' }).backlogPerRun, 10);
});

test('message HTML échappé, lien suivi et hashtags', () => {
  const text = formatTelegramMessage({ ...item('a', 'article', daysAgo(1)), title: 'JSON <script> & co', category: 'Sécurité & Réseau' }, true);
  assert.match(text, /^🆕 <b>Nouvel article<\/b>/);
  assert.match(text, /<b>JSON &lt;script&gt; &amp; co<\/b>/);
  assert.match(text, /href="https:\/\/jchub\.dev\/fr\/x\/a\?utm_source=telegram&amp;utm_medium=social"/);
  assert.match(text, /#SecuriteReseau #JcHub$/);
  assert.match(formatTelegramMessage(item('t', 'tool'), false), /^🛠️ <b>Outil gratuit JcHub<\/b>[\s\S]*Essayer l’outil/);
  assert.ok(formatTelegramMessage({ ...item('b', 'article'), description: 'mot '.repeat(200) }, false).length < 600);
  assert.equal(categoryHashtag('Développement web'), '#DeveloppementWeb');
  assert.equal(telegramUrl('https://jchub.dev/fr/outils/tva'), 'https://jchub.dev/fr/outils/tva?utm_source=telegram&utm_medium=social');
});

test('nouveautés d’abord, puis les anciens contenus au compte-gouttes en alternant', () => {
  const items = [
    item('article:old1', 'article', daysAgo(60)), item('article:old2', 'article', daysAgo(30)), item('article:old3', 'article', daysAgo(90)),
    item('tool:old', 'tool'), item('tool:old2', 'tool', daysAgo(40)),
    item('article:new', 'article', daysAgo(1)), item('tool:new', 'tool', daysAgo(3)),
    item('article:futur', 'article', new Date(NOW + 86_400_000).toISOString()),
  ];
  const picked = selectTelegramPosts(items, new Set(['article:old2']), 3, NOW).map(({ item: post, fresh }) => `${post.id}${fresh ? '*' : ''}`);
  assert.deepEqual(picked, ['tool:new*', 'article:new*', 'article:old1', 'tool:old2', 'article:old3']);
  assert.deepEqual(selectTelegramPosts(items, new Set(), 0, NOW).map(({ item: post }) => post.id), ['tool:new', 'article:new']);
  assert.equal(isFresh(item('x', 'article', daysAgo(8)), NOW), false);
  assert.equal(selectTelegramPosts(items, new Set(items.map((post) => post.id)), 3, NOW).length, 0);
});

const config = { token: TOKEN, chatId: '@jchub_dev', backlogPerRun: 3 };
const reply = (status, body) => async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('envoi : grand aperçu du lien et identifiant du message', async () => {
  let sent;
  const id = await sendTelegramMessage(config, 'Bonjour', 'https://jchub.dev/fr/blog/a', {
    fetcher: async (url, init) => { sent = { url: String(url), body: JSON.parse(init.body) }; return new Response(JSON.stringify({ ok: true, result: { message_id: 42 } })); },
  });
  assert.equal(id, 42);
  assert.equal(sent.url, `https://api.telegram.org/bot${TOKEN}/sendMessage`);
  assert.deepEqual(sent.body, { chat_id: '@jchub_dev', text: 'Bonjour', parse_mode: 'HTML', link_preview_options: { url: 'https://jchub.dev/fr/blog/a', prefer_large_media: true, show_above_text: true } });
});

test('erreurs Telegram classées', async () => {
  const outcome = async (fetcher) => { try { await sendTelegramMessage(config, 'x', 'https://jchub.dev', { fetcher }); } catch (error) { assert.ok(error instanceof TelegramError); return error.outcome; } return 'ok'; };
  assert.equal(await outcome(reply(400, { ok: false, description: 'Bad Request: chat not found' })), 'stop');
  assert.equal(await outcome(reply(401, { ok: false, description: 'Unauthorized' })), 'stop');
  assert.equal(await outcome(reply(429, { ok: false, description: 'Too Many Requests: retry after 30' })), 'stop');
  assert.equal(await outcome(reply(400, { ok: false, description: "Bad Request: can't parse entities" })), 'retry');
  assert.equal(await outcome(reply(502, {})), 'unknown');
  assert.equal(await outcome(async () => { throw new Error('réseau'); }), 'unknown');
});

test('visites venant de Telegram reconnues', () => {
  assert.equal(classifySource(undefined, 'telegram', 'jchub.dev'), 'telegram');
  assert.equal(classifySource('https://t.me/', undefined, 'jchub.dev'), 'telegram');
  assert.equal(classifySource('https://web.telegram.org/k/', undefined, 'jchub.dev'), 'telegram');
});

import { botLocale, categoryKeyboard, isWebhookAuthorized, linkKeyboard, mainMenu, parseUpdate, webhookSecret } from '../lib/telegram-bot.ts';

const message = (text, extra = {}) => ({ update_id: 1, message: { message_id: 5, chat: { id: 42, type: 'private' }, from: { id: 42, first_name: 'Ama', language_code: 'fr' }, text, ...extra } });
const press = (data, type = 'private') => ({ update_id: 2, callback_query: { id: 'q', from: { id: 42 }, message: { message_id: 9, chat: { id: 42, type } }, data } });
const plain = { awaitingSupport: false, isAdmin: false };

test('bot : secret du webhook vérifié en temps constant', () => {
  const secret = webhookSecret(TOKEN);
  assert.match(secret, /^[a-f0-9]{64}$/);
  assert.equal(isWebhookAuthorized(secret, TOKEN), true);
  assert.equal(isWebhookAuthorized(secret.slice(1), TOKEN), false);
  assert.equal(isWebhookAuthorized(null, TOKEN), false);
  assert.equal(isWebhookAuthorized(secret, undefined), false);
  assert.notEqual(webhookSecret(`${TOKEN}x`), secret);
});

test('bot : commandes, boutons et texte libre', () => {
  assert.deepEqual(parseUpdate(message('/start'), plain), { type: 'start' });
  assert.deepEqual(parseUpdate(message('/start@jchub_bot'), plain), { type: 'start' });
  assert.deepEqual(parseUpdate(message('/outils'), plain), { type: 'tools' });
  assert.deepEqual(parseUpdate(message('/recherche compresser pdf'), plain), { type: 'search', query: 'compresser pdf' });
  assert.deepEqual(parseUpdate(message('/aide'), plain), { type: 'support-prompt' });
  assert.deepEqual(parseUpdate(message('/aide le site plante sur mobile'), plain), { type: 'support', text: 'le site plante sur mobile' });
  assert.deepEqual(parseUpdate(message('calculer la TVA'), plain), { type: 'search', query: 'calculer la TVA' });
  assert.deepEqual(parseUpdate(message('Le bouton ne marche pas'), { ...plain, awaitingSupport: true }), { type: 'support', text: 'Le bouton ne marche pas' });
  assert.deepEqual(parseUpdate(message('/stats'), plain), { type: 'menu' });
  assert.deepEqual(parseUpdate(message('/stats'), { ...plain, isAdmin: true }), { type: 'stats' });
  assert.deepEqual(parseUpdate(message(undefined), plain), { type: 'unsupported' });
  assert.deepEqual(parseUpdate(press('cat:3'), plain), { type: 'category', index: 3 });
  assert.deepEqual(parseUpdate(press('support'), plain), { type: 'support-prompt' });
  assert.deepEqual(parseUpdate(press('inconnu'), plain), { type: 'ignore' });
});

test('bot : groupes ignorés et réponses de l’équipe réservées aux admins', () => {
  assert.deepEqual(parseUpdate({ message: { ...message('salut').message, chat: { id: -5, type: 'group' } } }, plain), { type: 'ignore' });
  assert.deepEqual(parseUpdate(press('menu', 'channel'), plain), { type: 'ignore' });
  const reply = message('Merci, c’est corrigé', { reply_to_message: { text: '📩 Nouveau message\n#ticket-AbC123xyz', from: { is_bot: true } } });
  assert.deepEqual(parseUpdate(reply, { ...plain, isAdmin: true }), { type: 'admin-reply', ticket: 'AbC123xyz', text: 'Merci, c’est corrigé' });
  assert.deepEqual(parseUpdate(reply, plain), { type: 'search', query: 'Merci, c’est corrigé' });
});

test('bot : menus et langue', () => {
  assert.equal(botLocale('en-GB'), 'en');
  assert.equal(botLocale('fr'), 'fr');
  assert.equal(botLocale(undefined), 'fr');
  const menu = mainMenu('fr', 'https://jchub.dev', 'https://t.me/JcHubOfficiel');
  assert.deepEqual(menu.flat().map((button) => button.text), ['🛠️ Nos outils', '📰 Notre blog', '🔎 Rechercher', '💬 Assistance', '📢 Notre chaîne', '🌐 Site JcHub']);
  assert.equal(menu[2][1].url, 'https://jchub.dev/fr');
  const categories = categoryKeyboard(['PDF', 'Images', 'Sécurité'], 'en', 'https://jchub.dev/en/tools');
  assert.deepEqual(categories[0].map((button) => button.callback_data), ['cat:0', 'cat:1']);
  assert.deepEqual(categories[1].map((button) => button.callback_data), ['cat:2']);
  assert.equal(categories.at(-1)[0].callback_data, 'menu');
  for (const button of [...menu.flat(), ...categories.flat()]) if ('callback_data' in button) assert.ok(Buffer.byteLength(button.callback_data) <= 64);
  const links = linkKeyboard([{ text: 'x'.repeat(100), url: 'https://jchub.dev/a' }], 'fr');
  assert.equal(links[0][0].text.length, 64);
});
