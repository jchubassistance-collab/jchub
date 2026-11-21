import 'server-only';

import { FieldValue } from 'firebase-admin/firestore';
import { getPublishedArticles } from '@/lib/blog';
import { categoryLabel } from '@/lib/categories';
import { getAdminDb } from '@/lib/firebase-admin';
import { formatTelegramMessage, getTelegramConfig, selectTelegramPosts, sendTelegramMessage, TelegramError, type TelegramItem } from '@/lib/telegram';
import { getPublishedTools, toolPath } from '@/lib/tools';

/**
 * Daily run of the Telegram channel (cron /api/cron/publish-telegram): posts every article and
 * tool that went public and was not posted yet, plus a few older ones a day until all are posted.
 *
 * Firestore:
 * - telegram_posts/{article:<id> | tool:<slug>}: one document per content posted (or being posted).
 *   A content with a document is never posted again; delete it to post the content again.
 * - app_config/telegram: contents already online at a previous run. A content without a date
 *   (a tool without publishAt) seen for the first time counts as new.
 */

const POSTS = 'telegram_posts';
const STATE_DOC = 'telegram';
const PAUSE_MS = 1_500;

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://jchub.dev').replace(/\/$/, '');

async function onlineContents(): Promise<TelegramItem[]> {
  const [articles, tools] = await Promise.all([getPublishedArticles('fr'), getPublishedTools()]);
  const base = siteUrl();
  // The id is a Firestore document id: no slash.
  return ([

    ...articles.map((article): TelegramItem => ({
      id: `article:${article.id}`,
      kind: 'article',
      title: article.title,
      description: article.description || article.excerpt,
      url: `${base}/fr/blog/${encodeURIComponent(article.slug)}`,
      category: article.category,
      date: article.publishedAt || article.scheduledFor,
    })),
    ...tools.map((tool): TelegramItem => ({
      id: `tool:${tool.slug}`,
      kind: 'tool',
      title: tool.name,
      description: tool.description,
      url: `${base}${toolPath(tool, 'fr')}`,
      category: categoryLabel(tool.category, 'fr'),
      date: tool.publishAt,
    })),
  ] as TelegramItem[]).map((item) => ({ ...item, id: item.id.replace(/\//g, '_') }));
}

export type TelegramRunResult = {
  status: 'not-configured' | 'done' | 'stopped';
  posted: string[];
  /** Sent without a clear answer from Telegram: check the channel; they will not be sent again. */
  uncertain: string[];
  failed: Array<{ id: string; error: string }>;
  remaining: number;
  error?: string;
};

export async function runTelegramChannel(now = Date.now()): Promise<TelegramRunResult> {
  const config = getTelegramConfig();
  if (!config) return { status: 'not-configured', posted: [], uncertain: [], failed: [], remaining: 0 };

  const db = getAdminDb();
  const stateRef = db.collection('app_config').doc(STATE_DOC);
  const [contents, postedSnapshot, stateSnapshot] = await Promise.all([
    onlineContents(),
    db.collection(POSTS).select().get(),
    stateRef.get(),
  ]);
  const posted = new Set(postedSnapshot.docs.map((document) => document.id));
  const state = stateSnapshot.data() || {};
  const seen = new Set<string>(Array.isArray(state.seen) ? state.seen.map(String) : []);
  const initialized = Boolean(state.initializedAt);

  // A content without a date that appears after the first run is new; it keeps that date on the next runs.
  const firstSeen: Record<string, string> = { ...(state.firstSeen || {}) };
  const nowIso = new Date(now).toISOString();
  const items = contents.map((item) => {
    if (item.date) return item;
    if (firstSeen[item.id]) return { ...item, date: firstSeen[item.id] };
    if (initialized && !seen.has(item.id)) { firstSeen[item.id] = nowIso; return { ...item, date: nowIso }; }
    return item;
  });

  const selection = selectTelegramPosts(items, posted, config.backlogPerRun, now);
  const result: TelegramRunResult = { status: 'done', posted: [], uncertain: [], failed: [], remaining: 0 };

  for (let index = 0; index < selection.length; index += 1) {
    const { item, fresh } = selection[index];
    const ref = db.collection(POSTS).doc(item.id);
    // The document is created before sending: two runs at once cannot post the same content twice.
    try {
      await ref.create({ kind: item.kind, title: item.title, url: item.url, fresh, status: 'sending', createdAt: FieldValue.serverTimestamp() });
    } catch { continue; }
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
    try {
      const messageId = await sendTelegramMessage(config, formatTelegramMessage(item, fresh), item.url);
      await ref.update({ status: 'sent', messageId, sentAt: FieldValue.serverTimestamp() });
      result.posted.push(item.id);
    } catch (error) {
      const failure = error instanceof TelegramError ? error : new TelegramError('Erreur inattendue pendant l’envoi.', 'unknown');
      if (failure.outcome === 'unknown') {
        await ref.update({ status: 'unknown', error: failure.message, updatedAt: FieldValue.serverTimestamp() });
        result.uncertain.push(item.id);
        continue;
      }
      await ref.delete();
      if (failure.outcome === 'stop') { result.status = 'stopped'; result.error = failure.message; break; }
      result.failed.push({ id: item.id, error: failure.message });
    }
  }

  await stateRef.set({
    seen: items.map((item) => item.id),
    firstSeen: Object.fromEntries(Object.entries(firstSeen).filter(([id]) => items.some((item) => item.id === id))),
    ...(initialized ? {} : { initializedAt: FieldValue.serverTimestamp() }),
    lastRunAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  const done = new Set(Array.from(posted).concat(result.posted, result.uncertain));
  result.remaining = items.filter((item) => !done.has(item.id)).length;
  return result;
}
