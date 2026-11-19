/**
 * The @jchub_bot conversation: texts, menus and the reading of Telegram updates. No server-only
 * import, so it is tested with plain Node (tests/telegram.test.js). What the bot does with an
 * update (search, support, statistics) lives in lib/telegram-bot-server.ts; the webhook is
 * app/api/telegram/webhook/route.ts and is registered by scripts/telegram-setup.ts.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Locale } from '@/i18n/routing';

/** Secret Telegram sends back in X-Telegram-Bot-Api-Secret-Token: derived from the bot token, nothing more to configure. */
export function webhookSecret(token: string): string {
  return createHmac('sha256', token).update('jchub-telegram-webhook').digest('hex');
}

export function isWebhookAuthorized(header: string | null, token: string | undefined): boolean {
  if (!token || !header) return false;
  const expected = Buffer.from(webhookSecret(token));
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export const BOT_COPY = {
  fr: {
    welcome: (name: string) => `Bienvenue sur JcHub${name ? `, ${name}` : ''} ! 👋\n\nDes outils gratuits et des guides pratiques pour tes projets numériques.\n\nQue souhaites-tu faire aujourd’hui ?`,
    menu: 'Que souhaites-tu faire ?',
    tools: '🛠️ Nos outils',
    blog: '📰 Notre blog',
    search: '🔎 Rechercher',
    support: '💬 Assistance',
    channel: '📢 Notre chaîne',
    site: '🌐 Site JcHub',
    back: '⬅️ Menu',
    allTools: 'Voir tous les outils',
    allArticles: 'Tout le blog',
    toolsIntro: 'Choisis une catégorie :',
    categoryIntro: (category: string) => `Outils « ${category} » :`,
    blogIntro: 'Les derniers articles :',
    searchPrompt: 'Écris ce que tu veux faire, par exemple « compresser un PDF », « calculer la TVA » ou « créer un QR code ».',
    supportPrompt: 'Écris ton message (problème, suggestion ou question) en un seul message. Je le transmets à l’équipe JcHub, qui te répondra ici.',
    supportSent: '✅ Merci ! Ton message a bien été transmis à l’équipe JcHub. Tu recevras la réponse ici.',
    supportTooShort: 'Ton message est trop court. Décris ton problème ou ta suggestion en quelques mots.',
    results: 'Voici ce que j’ai trouvé :',
    noResult: 'Je n’ai rien trouvé pour cette recherche. Essaie avec d’autres mots, ou écris à l’équipe avec « 💬 Assistance ».',
    tooMany: 'Tu envoies beaucoup de messages. Réessaie dans quelques minutes.',
    supportLimit: 'Tu as déjà envoyé plusieurs messages aujourd’hui. L’équipe te répondra au plus vite.',
    error: 'Un souci technique m’empêche de répondre. Réessaie dans un instant.',
    adminReply: '💬 Réponse de l’équipe JcHub :',
    unsupported: 'Je ne lis que les messages texte. Écris ta demande, ou utilise le menu.',
  },
  en: {
    welcome: (name: string) => `Welcome to JcHub${name ? `, ${name}` : ''}! 👋\n\nFree tools and practical guides for your digital projects.\n\nWhat would you like to do today?`,
    menu: 'What would you like to do?',
    tools: '🛠️ Our tools',
    blog: '📰 Our blog',
    search: '🔎 Search',
    support: '💬 Support',
    channel: '📢 Our channel',
    site: '🌐 JcHub website',
    back: '⬅️ Menu',
    allTools: 'See all tools',
    allArticles: 'The whole blog',
    toolsIntro: 'Pick a category:',
    categoryIntro: (category: string) => `“${category}” tools:`,
    blogIntro: 'Latest articles:',
    searchPrompt: 'Write what you want to do, for example “compress a PDF”, “calculate VAT” or “create a QR code”.',
    supportPrompt: 'Write your message (problem, suggestion or question) in a single message. I will pass it to the JcHub team, who will answer you here.',
    supportSent: '✅ Thanks! Your message was passed to the JcHub team. You will get the answer here.',
    supportTooShort: 'Your message is too short. Describe your problem or suggestion in a few words.',
    results: 'Here is what I found:',
    noResult: 'I found nothing for this search. Try other words, or write to the team with “💬 Support”.',
    tooMany: 'You are sending a lot of messages. Try again in a few minutes.',
    supportLimit: 'You already sent several messages today. The team will answer you as soon as possible.',
    error: 'A technical issue keeps me from answering. Try again in a moment.',
    adminReply: '💬 Answer from the JcHub team:',
    unsupported: 'I only read text messages. Write your request, or use the menu.',
  },
} satisfies Record<Locale, Record<string, unknown>>;

/** French unless Telegram says the person uses English. */
export function botLocale(languageCode: string | undefined): Locale {
  return languageCode?.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

export type InlineButton = { text: string; url: string } | { text: string; callback_data: string };
export type InlineKeyboard = InlineButton[][];

/** `channelUrl`: TELEGRAM_CHANNEL_URL of lib/telegram-links.ts. */
export function mainMenu(locale: Locale, siteUrl: string, channelUrl: string): InlineKeyboard {
  const t = BOT_COPY[locale];
  return [
    [{ text: t.tools, callback_data: 'tools' }, { text: t.blog, callback_data: 'blog' }],
    [{ text: t.search, callback_data: 'search' }, { text: t.support, callback_data: 'support' }],
    [{ text: t.channel, url: channelUrl }, { text: t.site, url: `${siteUrl}/${locale}` }],
  ];
}

/** Buttons opening pages, one per row, then a row back to the menu. */
export function linkKeyboard(links: Array<{ text: string; url: string }>, locale: Locale, extra?: { text: string; url: string }): InlineKeyboard {
  return [
    ...links.map((link) => [{ text: link.text.slice(0, 64), url: link.url }]),
    ...(extra ? [[extra]] : []),
    [{ text: BOT_COPY[locale].back, callback_data: 'menu' }],
  ];
}

/** Telegram callback_data is limited to 64 bytes: categories travel by their index. */
export function categoryKeyboard(categories: string[], locale: Locale, allToolsUrl: string): InlineKeyboard {
  const rows: InlineKeyboard = [];
  for (let index = 0; index < categories.length; index += 2) {
    rows.push(categories.slice(index, index + 2).map((category, offset) => ({ text: category.slice(0, 40), callback_data: `cat:${index + offset}` })));
  }
  return [...rows, [{ text: BOT_COPY[locale].allTools, url: allToolsUrl }], [{ text: BOT_COPY[locale].back, callback_data: 'menu' }]];
}

export type BotAction =
  | { type: 'start' | 'menu' | 'tools' | 'blog' | 'search-prompt' | 'support-prompt' | 'stats' }
  | { type: 'category'; index: number }
  | { type: 'support'; text: string }
  | { type: 'search'; query: string }
  | { type: 'admin-reply'; ticket: string; text: string }
  | { type: 'unsupported' }
  | { type: 'ignore' };

export type BotUpdate = {
  update_id?: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string };
    from?: { id: number; is_bot?: boolean; first_name?: string; username?: string; language_code?: string };
    text?: string;
    reply_to_message?: { text?: string; from?: { is_bot?: boolean } };
  };
  callback_query?: {
    id: string;
    from: { id: number; first_name?: string; username?: string; language_code?: string };
    message?: { message_id: number; chat: { id: number; type: string } };
    data?: string;
  };
};

/** Marker at the end of a support message forwarded to an admin: replying to it answers the person. */
export const TICKET_MARKER = /#ticket-([A-Za-z0-9]{6,40})\s*$/;

/**
 * What an update asks for. Only private chats are answered. `awaitingSupport` is true when the
 * person pressed « Assistance » just before: their next text is a support message.
 */
export function parseUpdate(update: BotUpdate, options: { awaitingSupport: boolean; isAdmin: boolean }): BotAction {
  const callback = update.callback_query;
  if (callback) {
    if (callback.message && callback.message.chat.type !== 'private') return { type: 'ignore' };
    const data = callback.data || '';
    if (data === 'menu') return { type: 'menu' };
    if (data === 'tools') return { type: 'tools' };
    if (data === 'blog') return { type: 'blog' };
    if (data === 'search') return { type: 'search-prompt' };
    if (data === 'support') return { type: 'support-prompt' };
    const category = /^cat:(\d{1,3})$/.exec(data);
    if (category) return { type: 'category', index: Number(category[1]) };
    return { type: 'ignore' };
  }
  const message = update.message;
  if (!message || message.chat.type !== 'private' || message.from?.is_bot) return { type: 'ignore' };
  const text = message.text?.trim();
  if (!text) return { type: 'unsupported' };
  const ticket = message.reply_to_message?.from?.is_bot ? TICKET_MARKER.exec(message.reply_to_message.text || '') : null;
  if (options.isAdmin && ticket) return { type: 'admin-reply', ticket: ticket[1], text };
  const command = /^\/([a-z_]+)(?:@\w+)?(?:\s+([\s\S]*))?$/i.exec(text);
  if (command) {
    const name = command[1].toLowerCase();
    const argument = command[2]?.trim() || '';
    if (name === 'start' || name === 'menu') return { type: name === 'start' ? 'start' : 'menu' };
    if (name === 'outils' || name === 'tools') return { type: 'tools' };
    if (name === 'blog') return { type: 'blog' };
    if (name === 'recherche' || name === 'search') return argument ? { type: 'search', query: argument } : { type: 'search-prompt' };
    if (name === 'aide' || name === 'help' || name === 'support') return argument ? { type: 'support', text: argument } : { type: 'support-prompt' };
    if (name === 'stats' && options.isAdmin) return { type: 'stats' };
    return { type: 'menu' };
  }
  if (options.awaitingSupport) return { type: 'support', text };
  return { type: 'search', query: text.slice(0, 300) };
}
