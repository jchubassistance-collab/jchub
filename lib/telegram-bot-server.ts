import 'server-only';

import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import type { Locale } from '@/i18n/routing';
import { getPublishedArticles, type BlogArticle } from '@/lib/blog';
import { categoryLabel } from '@/lib/categories';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { BOT_COPY, botLocale, categoryKeyboard, linkKeyboard, mainMenu, parseUpdate, type BotAction, type BotUpdate, type InlineKeyboard } from '@/lib/telegram-bot';
import { TELEGRAM_CHANNEL_URL } from '@/lib/telegram-links';
import { recommendToolsWithAi } from '@/lib/tool-assistant';
import { findToolsByKeywords, normalizeSearchText, STOP_WORDS } from '@/lib/tool-search';
import { getPublishedTools, localizeTool, toolPath, type Tool } from '@/lib/tools';
import { cacheGet, cacheSet, consumeLimit } from '@/lib/turso-store';
import { reportUserError } from '@/lib/user-error';

/**
 * What @jchub_bot does with each update received by app/api/telegram/webhook. Firestore:
 * - telegram_bot_stats/{YYYY-MM-DD}: daily counters (messages, actions, new users).
 * - telegram_bot_users/{hash}: one document per person (hashed Telegram id), first and last visit.
 * - contact_messages: support messages, shown in Admin > Inbox (source "telegram"); answering
 *   there, or replying in Telegram to the forwarded message, sends the answer to the person.
 */

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://jchub.dev').replace(/\/$/, '');
const tracked = (url: string) => { const address = new URL(url); address.searchParams.set('utm_source', 'telegram'); address.searchParams.set('utm_medium', 'bot'); return address.toString(); };

export function telegramAdminIds(env: NodeJS.ProcessEnv = process.env): number[] {
  return (env.TELEGRAM_ADMIN_IDS || '').split(/[\s,;]+/).map(Number).filter((id) => Number.isSafeInteger(id) && id > 0);
}

export async function telegramApi<T = unknown>(method: string, body: Record<string, unknown>): Promise<T> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN manquant.');
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000), cache: 'no-store', redirect: 'error',
  });
  const data = await response.json().catch(() => ({})) as { ok?: boolean; result?: T; description?: string };
  if (!data.ok) throw new Error(`Telegram ${method} : ${String(data.description || response.status).slice(0, 200)}`);
  return data.result as T;
}

const send = (chatId: number, text: string, keyboard?: InlineKeyboard) => telegramApi('sendMessage', {
  chat_id: chatId, text, link_preview_options: { is_disabled: true }, ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
});

/** A menu button edits the message it belongs to, so the conversation does not pile up menus. */
async function show(chatId: number, messageId: number | undefined, text: string, keyboard: InlineKeyboard) {
  if (messageId) {
    try {
      await telegramApi('editMessageText', { chat_id: chatId, message_id: messageId, text, link_preview_options: { is_disabled: true }, reply_markup: { inline_keyboard: keyboard } });
      return;
    } catch { /* Too old or unchanged: a new message is sent instead. */ }
  }
  await send(chatId, text, keyboard);
}

async function catalog(locale: Locale): Promise<(Tool & { href: string })[]> {
  const base = siteUrl();
  return (await getPublishedTools()).map((tool) => ({ ...localizeTool(tool, locale), href: `${base}${toolPath(tool, locale)}` }));
}

const articleUrl = (article: BlogArticle, locale: Locale) => `${siteUrl()}/${locale}/blog/${encodeURIComponent(article.slug)}`;

function findArticles(query: string, articles: BlogArticle[]): BlogArticle[] {
  const words = Array.from(new Set(normalizeSearchText(query).split(' ').filter((word) => word.length >= 3 && !STOP_WORDS.has(word))));
  if (!words.length) return [];
  return articles.map((article) => {
    const title = new Set(normalizeSearchText(article.title).split(' '));
    const tags = new Set(normalizeSearchText([...article.keywords, ...article.tags].join(' ')).split(' '));
    const description = new Set(normalizeSearchText(article.description).split(' '));
    const score = words.reduce((total, word) => total + (title.has(word) ? 3 : 0) + (tags.has(word) ? 2 : 0) + (description.has(word) ? 1 : 0), 0);
    return { article, score };
  }).filter((item) => item.score >= 3).sort((a, b) => b.score - a.score).slice(0, 3).map((item) => item.article);
}

async function search(chatId: number, userKey: string, query: string, locale: Locale) {
  const t = BOT_COPY[locale];
  const [tools, articles] = await Promise.all([catalog(locale), getPublishedArticles(locale)]);
  const toolMatch = findToolsByKeywords(query, tools);
  const articleMatches = findArticles(query, articles);
  let foundTools = toolMatch.tools.slice(0, 3) as (Tool & { href: string })[];
  let intro: string = t.results;

  // The AI only judges requests the keywords cannot answer, within a daily quota per person.
  if (!toolMatch.confident && !articleMatches.length && query.length >= 4) {
    const quota = await consumeLimit(`tgbot:ai:${userKey}`, 10, 86_400_000);
    if (!quota || quota.allowed) {
      try {
        const answer = await recommendToolsWithAi(query, tools, locale);
        const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
        const suggested = answer.suggestions.map((suggestion) => bySlug.get(suggestion.slug)).filter((tool): tool is Tool & { href: string } => Boolean(tool));
        if (suggested.length) { foundTools = suggested.slice(0, 3); intro = answer.message.trim().slice(0, 400) || t.results; }
      } catch (error) { reportUserError(error, { details: { étape: 'assistant du bot Telegram' } }); }
    }
  }

  const links = [
    ...foundTools.map((tool) => ({ text: `🛠️ ${tool.name}`, url: tracked(tool.href) })),
    ...articleMatches.map((article) => ({ text: `📖 ${article.title}`, url: tracked(articleUrl(article, locale)) })),
  ];
  if (!links.length) { await send(chatId, t.noResult, mainMenu(locale, siteUrl(), TELEGRAM_CHANNEL_URL)); return 'none'; }
  await send(chatId, intro, linkKeyboard(links, locale));
  return foundTools.length && intro !== t.results ? 'ai' : 'found';
}

/** Tool categories as stored (French keys), sorted: a button carries the index, the same in both languages. */
async function categoryKeys(): Promise<string[]> {
  return Array.from(new Set((await getPublishedTools()).map((tool) => tool.category))).sort((a, b) => a.localeCompare(b, 'fr'));
}

async function notifySupportByEmail(name: string, text: string) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const sender = process.env.BREVO_SENDER_EMAIL?.trim();
  const to = process.env.CONTACT_NOTIFICATION_EMAIL?.trim();
  if (!apiKey || !sender || !to) return;
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { email: sender, name: process.env.BREVO_SENDER_NAME?.trim() || 'JcHub' },
      to: [{ email: to }],
      subject: '[JcHub] Assistance via Telegram',
      textContent: `Nouveau message reçu par le bot Telegram\n\nDe : ${name}\n\n${text}\n\nRéponds depuis Admin > Boîte de réception, ou en répondant au message transmis par le bot dans Telegram.`,
    }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Brevo ${response.status}`);
}

async function support(chatId: number, userKey: string, from: { first_name?: string; username?: string }, text: string, locale: Locale) {
  const t = BOT_COPY[locale];
  if (text.length < 10) { await send(chatId, t.supportTooShort); return false; }
  const quota = await consumeLimit(`tgbot:support:${userKey}`, 5, 86_400_000);
  if (quota && !quota.allowed) { await send(chatId, t.supportLimit, mainMenu(locale, siteUrl(), TELEGRAM_CHANNEL_URL)); return false; }
  const name = `${(from.first_name || 'Utilisateur').slice(0, 80)} (Telegram${from.username ? ` @${from.username}` : ''})`;
  const message = text.slice(0, 5000);
  const reference = await getAdminDb().collection('contact_messages').add({
    name, email: '', subject: 'telegram', message, locale, status: 'new', source: 'telegram', telegramChatId: chatId,
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
  await cacheSet(`tgbot:await:${userKey}`, false, 1_000);
  await send(chatId, t.supportSent, [[{ text: t.back, callback_data: 'menu' }]]);
  const forwarded = `📩 Nouveau message d’assistance\nDe : ${name}\n\n${message.slice(0, 3500)}\n\nRéponds à ce message pour répondre à la personne.\n#ticket-${reference.id}`;
  await Promise.allSettled([
    ...telegramAdminIds().map((adminId) => send(adminId, forwarded)),
    notifySupportByEmail(name, message).catch((error) => reportUserError(error, { details: { fournisseur: 'Brevo', étape: 'assistance Telegram' } })),
  ]);
  return true;
}

/** Sends an answer of the team to the person who wrote to the bot, and records it on the message. */
export async function replyToTelegramMessage(messageId: string, body: string, adminEmail: string): Promise<boolean> {
  const reference = getAdminDb().collection('contact_messages').doc(messageId);
  const snapshot = await reference.get();
  const chatId = Number(snapshot.data()?.telegramChatId);
  if (!snapshot.exists || !Number.isSafeInteger(chatId)) return false;
  const locale: Locale = snapshot.data()?.locale === 'en' ? 'en' : 'fr';
  await send(chatId, `${BOT_COPY[locale].adminReply}\n\n${body}`);
  await reference.update({ status: 'replied', replies: FieldValue.arrayUnion({ body, adminEmail, sentAt: new Date() }), updatedAt: FieldValue.serverTimestamp() });
  return true;
}

const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);

async function recordStats(userKey: string, action: BotAction['type'], locale: Locale) {
  if (action === 'ignore') return;
  const db = getAdminDb();
  const userRef = db.collection('telegram_bot_users').doc(userKey);
  const isNew = await userRef.create({ firstSeen: FieldValue.serverTimestamp(), lastSeen: FieldValue.serverTimestamp(), locale }).then(() => true, () => false);
  if (!isNew) await userRef.update({ lastSeen: FieldValue.serverTimestamp(), locale });
  await db.collection('telegram_bot_stats').doc(dayKey()).set({
    date: dayKey(), messages: FieldValue.increment(1), [`actions.${action}`]: FieldValue.increment(1), ...(isNew ? { newUsers: FieldValue.increment(1) } : {}),
  }, { merge: true });
}

async function statsText(): Promise<string> {
  const db = getAdminDb();
  const since = (days: number) => dayKey(new Date(Date.now() - (days - 1) * 86_400_000));
  const [snapshot, users] = await Promise.all([
    db.collection('telegram_bot_stats').where('date', '>=', since(30)).get(),
    db.collection('telegram_bot_users').count().get(),
  ]);
  const total = (days: number, read: (data: Record<string, any>) => number) => snapshot.docs.filter((doc) => String(doc.data().date) >= since(days)).reduce((sum, doc) => sum + (read(doc.data()) || 0), 0);
  const actions = (days: number) => {
    const sums: Record<string, number> = {};
    for (const doc of snapshot.docs) if (String(doc.data().date) >= since(days)) for (const [key, value] of Object.entries(doc.data().actions || {})) sums[key] = (sums[key] || 0) + Number(value);
    return Object.entries(sums).sort((a, b) => b[1] - a[1]).map(([key, value]) => `  • ${key} : ${value}`).join('\n') || '  • aucune';
  };
  const support = await db.collection('contact_messages').where('source', '==', 'telegram').count().get();
  return [
    '📊 Statistiques du bot JcHub',
    `Personnes au total : ${users.data().count}`,
    `Nouvelles personnes : ${total(7, (data) => data.newUsers)} (7 j) · ${total(30, (data) => data.newUsers)} (30 j)`,
    `Messages : ${total(7, (data) => data.messages)} (7 j) · ${total(30, (data) => data.messages)} (30 j)`,
    `Demandes d’assistance reçues : ${support.data().count}`,
    `Actions sur 7 jours :\n${actions(7)}`,
  ].join('\n');
}

export async function handleTelegramUpdate(update: BotUpdate): Promise<void> {
  const callback = update.callback_query;
  const from = callback?.from || update.message?.from;
  const chatId = callback?.message?.chat.id ?? update.message?.chat.id;
  if (!from || chatId === undefined) return;
  if (callback) await telegramApi('answerCallbackQuery', { callback_query_id: callback.id }).catch(() => undefined);

  const locale = botLocale(from.language_code);
  const t = BOT_COPY[locale];
  const userKey = createHash('sha256').update(`telegram:${from.id}`).digest('hex').slice(0, 32);
  const isAdmin = telegramAdminIds().includes(from.id);
  const awaitingSupport = Boolean(update.message && await cacheGet<boolean>(`tgbot:await:${userKey}`));
  const action = parseUpdate(update, { awaitingSupport, isAdmin });
  if (action.type === 'ignore') return;

  const burst = await consumeLimit(`tgbot:burst:${userKey}`, 30, 5 * 60_000);
  if (burst && !burst.allowed) { if (burst.count === 31) await send(chatId, t.tooMany); return; }
  if (hasFirebaseAdminConfig()) await recordStats(userKey, action.type, locale).catch((error) => reportUserError(error, { details: { étape: 'statistiques du bot Telegram' } }));

  const base = siteUrl();
  const editable = callback?.message?.message_id;
  try {
    switch (action.type) {
      case 'start': await send(chatId, t.welcome((from.first_name || '').slice(0, 40)), mainMenu(locale, base, TELEGRAM_CHANNEL_URL)); break;
      case 'menu': await show(chatId, editable, t.menu, mainMenu(locale, base, TELEGRAM_CHANNEL_URL)); break;
      case 'tools': {
        const names = (await categoryKeys()).map((key) => categoryLabel(key, locale));
        await show(chatId, editable, t.toolsIntro, categoryKeyboard(names, locale, tracked(`${base}${locale === 'en' ? '/en/tools' : '/fr/outils'}`)));
        break;
      }
      case 'category': {
        const key = (await categoryKeys())[action.index];
        if (!key) { await show(chatId, editable, t.menu, mainMenu(locale, base, TELEGRAM_CHANNEL_URL)); break; }
        const tools = (await getPublishedTools()).filter((tool) => tool.category === key).slice(0, 20)
          .map((tool) => ({ text: `${tool.icon} ${localizeTool(tool, locale).name}`, url: tracked(`${base}${toolPath(tool, locale)}`) }));
        await show(chatId, editable, t.categoryIntro(categoryLabel(key, locale)), linkKeyboard(tools, locale, { text: t.allTools, url: tracked(`${base}${locale === 'en' ? '/en/tools' : '/fr/outils'}`) }));
        break;
      }
      case 'blog': {
        const latest = [...(await getPublishedArticles(locale))].sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || ''))).slice(0, 6);
        await show(chatId, editable, t.blogIntro, linkKeyboard(latest.map((article) => ({ text: `📖 ${article.title}`, url: tracked(articleUrl(article, locale)) })), locale, { text: t.allArticles, url: tracked(`${base}/${locale}/blog`) }));
        break;
      }
      case 'search-prompt': await send(chatId, t.searchPrompt); break;
      case 'support-prompt':
        await cacheSet(`tgbot:await:${userKey}`, true, 15 * 60_000);
        await send(chatId, t.supportPrompt);
        break;
      case 'support': await support(chatId, userKey, from, action.text, locale); break;
      case 'search': await search(chatId, userKey, action.query, locale); break;
      case 'admin-reply': {
        const sent = await replyToTelegramMessage(action.ticket, action.text, `telegram:${from.username || from.id}`);
        await send(chatId, sent ? '✅ Réponse envoyée.' : '⚠️ Message d’origine introuvable : réponse non envoyée.');
        break;
      }
      case 'stats': await send(chatId, await statsText()); break;
      case 'unsupported': await send(chatId, t.unsupported, mainMenu(locale, base, TELEGRAM_CHANNEL_URL)); break;
    }
  } catch (error) {
    reportUserError(error, { details: { étape: `bot Telegram : ${action.type}` } });
    await send(chatId, t.error).catch(() => undefined);
  }
}
