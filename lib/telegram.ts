/**
 * Publishing articles and tools on the JcHub Telegram channel through the Bot API.
 * No server-only import: formatting, selection and sending are tested with plain Node
 * (tests/telegram.test.js). The Firestore state and the cron live in lib/telegram-channel.ts.
 */

export type TelegramItem = {
  /** `article:<id>` or `tool:<slug>`: the key of its record in Firestore. */
  id: string;
  kind: 'article' | 'tool';
  title: string;
  description: string;
  /** Absolute address of the page, without tracking parameters. */
  url: string;
  category: string;
  /** ISO date the content went public, when known. */
  date?: string;
};

export type TelegramConfig = { token: string; chatId: string; backlogPerRun: number };

export class TelegramError extends Error {
  /** `retry`: nothing was sent, try again on the next run. `stop`: the bot or the channel is misconfigured. `unknown`: the message may have been sent. */
  readonly outcome: 'retry' | 'stop' | 'unknown';
  constructor(message: string, outcome: 'retry' | 'stop' | 'unknown') {
    super(message);
    this.name = 'TelegramError';
    this.outcome = outcome;
  }
}

const FRESH_DAYS = 7;
const MAX_FRESH_PER_RUN = 10;
const DEFAULT_BACKLOG_PER_RUN = 3;

/** Bot token and channel from the environment, or null when Telegram is not set up. */
export function getTelegramConfig(env: NodeJS.ProcessEnv = process.env): TelegramConfig | null {
  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = env.TELEGRAM_CHANNEL_ID?.trim();
  if (!token || !chatId) return null;
  if (!/^\d+:[A-Za-z0-9_-]{30,}$/.test(token)) return null;
  if (!/^(@[A-Za-z][A-Za-z0-9_]{3,}|-100\d+)$/.test(chatId)) return null;
  const backlog = Number.parseInt(env.TELEGRAM_BACKLOG_PER_RUN?.trim() || '', 10);
  return { token, chatId, backlogPerRun: Number.isFinite(backlog) && backlog >= 0 ? Math.min(backlog, 10) : DEFAULT_BACKLOG_PER_RUN };
}

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const shorten = (value: string, max: number) => {
  const text = value.replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20)).trimEnd()}…`;
};

/** « Sécurité & Réseau » → #SecuriteReseau */
export function categoryHashtag(category: string): string {
  const words = category.normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[A-Za-z0-9]+/g) || [];
  const tag = words.map((word) => word[0].toUpperCase() + word.slice(1)).join('');
  return tag ? `#${tag}` : '';
}

/** Address shared on the channel: tagged so the Control Center counts these visits as Telegram. */
export function telegramUrl(url: string): string {
  const address = new URL(url);
  address.searchParams.set('utm_source', 'telegram');
  address.searchParams.set('utm_medium', 'social');
  return address.toString();
}

export function isFresh(item: TelegramItem, now = Date.now()): boolean {
  const date = Date.parse(item.date || '');
  return Number.isFinite(date) && date <= now && now - date <= FRESH_DAYS * 86_400_000;
}

/** Message in Telegram's HTML mode. The large link preview above the text shows the page's image. */
export function formatTelegramMessage(item: TelegramItem, fresh: boolean): string {
  const heading = item.kind === 'article'
    ? (fresh ? '🆕 <b>Nouvel article</b>' : '📖 <b>À lire sur JcHub</b>')
    : (fresh ? '🛠️ <b>Nouvel outil gratuit</b>' : '🛠️ <b>Outil gratuit JcHub</b>');
  const link = item.kind === 'article' ? 'Lire l’article' : 'Essayer l’outil gratuitement';
  return [
    heading,
    `<b>${escapeHtml(shorten(item.title, 200))}</b>`,
    item.description.trim() ? escapeHtml(shorten(item.description, 320)) : '',
    `👉 <a href="${escapeHtml(telegramUrl(item.url))}">${link}</a>`,
    [categoryHashtag(item.category), '#JcHub'].filter(Boolean).join(' '),
  ].filter(Boolean).join('\n\n');
}

/**
 * What to post on this run: every new content not posted yet (oldest first, so the channel
 * follows the order of publication), then a few older ones, alternating articles and tools,
 * the most recent first. Older contents are spread over the days instead of flooding the channel.
 */
export function selectTelegramPosts(items: TelegramItem[], posted: Set<string>, backlogPerRun: number, now = Date.now()): Array<{ item: TelegramItem; fresh: boolean }> {
  // A content dated in the future is not public yet.
  const pending = items.filter((item) => !posted.has(item.id) && !(Date.parse(item.date || '') > now));
  const byDateDesc = (a: TelegramItem, b: TelegramItem) => (Date.parse(b.date || '') || 0) - (Date.parse(a.date || '') || 0);
  const fresh = pending.filter((item) => isFresh(item, now)).sort((a, b) => byDateDesc(b, a)).slice(0, MAX_FRESH_PER_RUN);
  const freshIds = new Set(fresh.map((item) => item.id));
  const older = pending.filter((item) => !freshIds.has(item.id) && !isFresh(item, now)).sort(byDateDesc);
  const articles = older.filter((item) => item.kind === 'article');
  const tools = older.filter((item) => item.kind === 'tool');
  const backlog: TelegramItem[] = [];
  while (backlog.length < backlogPerRun && (articles.length || tools.length)) {
    const next = (backlog.length % 2 === 0 ? articles.shift() || tools.shift() : tools.shift() || articles.shift())!;
    backlog.push(next);
  }
  return [...fresh.map((item) => ({ item, fresh: true })), ...backlog.map((item) => ({ item, fresh: false }))];
}

type Dependencies = { fetcher?: typeof fetch; timeoutMs?: number };

/** Sends one message; returns its id on the channel. */
export async function sendTelegramMessage(config: TelegramConfig, text: string, previewUrl: string, dependencies: Dependencies = {}): Promise<number> {
  const fetcher = dependencies.fetcher || fetch;
  let response: Response;
  try {
    response = await fetcher(`https://api.telegram.org/bot${config.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: 'HTML',
        link_preview_options: { url: previewUrl, prefer_large_media: true, show_above_text: true },
      }),
      signal: AbortSignal.timeout(dependencies.timeoutMs || 15_000),
      cache: 'no-store',
      redirect: 'error',
    });
  } catch {
    throw new TelegramError('Telegram n’a pas répondu : le message est peut-être parti.', 'unknown');
  }
  let data: { ok?: boolean; result?: { message_id?: number }; description?: string; error_code?: number } = {};
  try { data = await response.json(); } catch { data = {}; }
  if (response.ok && data.ok && typeof data.result?.message_id === 'number') return data.result.message_id;
  const detail = String(data.description || `HTTP ${response.status}`).slice(0, 200);
  if (response.status === 401 || response.status === 403 || /chat not found|not enough rights|bot is not a member/i.test(detail)) {
    throw new TelegramError(`Le bot ne peut pas publier sur la chaîne (${detail}). Vérifie le token et que le bot est administrateur de la chaîne.`, 'stop');
  }
  if (response.status === 429) throw new TelegramError(`Telegram limite les envois (${detail}).`, 'stop');
  if (response.status >= 500) throw new TelegramError(`Erreur de Telegram (${detail}).`, 'unknown');
  throw new TelegramError(`Telegram a refusé le message (${detail}).`, 'retry');
}
