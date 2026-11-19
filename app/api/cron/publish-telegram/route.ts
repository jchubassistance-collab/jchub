import { NextRequest, NextResponse } from 'next/server';
import { hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { reportOutcome, withReport } from '@/lib/reports/server';
import { runTelegramChannel } from '@/lib/telegram-channel';
import { reportUserError } from '@/lib/user-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/** Daily: new articles and tools on the Telegram channel, plus a few older ones (see lib/telegram-channel.ts). */
export const GET = withReport(async (request: NextRequest) => {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });

  try {
    const result = await runTelegramChannel();
    if (result.status === 'not-configured') {
      reportOutcome(request, { summary: 'Telegram non configuré (TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID) : rien envoyé' });
      return NextResponse.json(result);
    }
    const problems = [
      ...(result.error ? [result.error] : []),
      ...result.failed.map((failure) => `${failure.id} : ${failure.error}`),
      ...(result.uncertain.length ? [`Résultat incertain, à vérifier sur la chaîne : ${result.uncertain.join(', ')}`] : []),
    ];
    if (problems.length) reportUserError(new Error(`Chaîne Telegram : ${problems.join(' | ')}`), { request });
    reportOutcome(request, { summary: `${result.posted.length} publication(s) sur Telegram, ${result.remaining} contenu(s) encore à publier${problems.length ? `, ${problems.length} problème(s)` : ''}` });
    return NextResponse.json(result, { status: result.status === 'stopped' ? 502 : 200 });
  } catch (error) {
    reportUserError(error, { request });
    return NextResponse.json({ error: 'La publication sur Telegram a échoué.' }, { status: 500 });
  }
});
