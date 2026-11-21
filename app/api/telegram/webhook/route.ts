import { NextRequest, NextResponse } from 'next/server';
import { reportOutcome, withReport } from '@/lib/reports/server';
import { isWebhookAuthorized, type BotUpdate } from '@/lib/telegram-bot';
import { handleTelegramUpdate } from '@/lib/telegram-bot-server';
import { cacheGet, cacheSet } from '@/lib/turso-store';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Messages and button presses sent to @jchub_bot. Telegram signs each call with the secret given
 * to setWebhook (scripts/telegram-setup.ts). The answer is always 200 once the call is
 * authentic: Telegram would otherwise send the same update again and again.
 */
export const POST = withReport(async (request: NextRequest) => {
  if (!isWebhookAuthorized(request.headers.get('x-telegram-bot-api-secret-token'), process.env.TELEGRAM_BOT_TOKEN?.trim())) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  const update = await request.json().catch(() => null) as BotUpdate | null;
  if (!update || typeof update !== 'object') return NextResponse.json({ ok: true });

  // An update Telegram sends again after a slow answer is handled only once.
  if (Number.isSafeInteger(update.update_id)) {
    const key = `tgbot:update:${update.update_id}`;
    if (await cacheGet<boolean>(key)) return NextResponse.json({ ok: true });
    await cacheSet(key, true, 60 * 60_000);
  }

  try {
    await handleTelegramUpdate(update);
    reportOutcome(request, { summary: update.callback_query ? 'Bouton du bot Telegram' : 'Message au bot Telegram' });
  } catch (error) {
    reportUserError(error, { request });
  }
  return NextResponse.json({ ok: true });
});
