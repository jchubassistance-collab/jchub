import { NextRequest, NextResponse } from 'next/server';
import { reportOutcome, withReport } from '@/lib/reports/server';
import { reportUserError } from '@/lib/user-error';
import { insightsConfigured, takeLock } from '@/lib/insights/db';
import { runDailyChecks } from '@/lib/alerts/server';
import { reportPeriod, sendReport } from '@/lib/insights/report';
import { previousWeekStart } from '@/lib/insights/report-format';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/** Every day at 7:00 (Brazzaville): the daily alert checks; on Mondays, last week's report by e-mail. */
export const GET = withReport(async (request: NextRequest) => {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  if (!insightsConfigured()) return NextResponse.json({ error: 'Base du Control Center non configurée.' }, { status: 503 });
  try {
    const checks = await runDailyChecks();
    let weekly: string | null = null;
    const now = Date.now();
    // Monday, Brazzaville time; the lock keeps a retried cron from sending it twice.
    if (new Date(now + 3600_000).getUTCDay() === 1) {
      const week = previousWeekStart(now);
      const period = reportPeriod({ week });
      if (period && await takeLock(`weekly-report:${week}`, 26 * 3600_000)) {
        const result = await sendReport(period);
        weekly = result.ok ? `rapport de la semaine du ${week} envoyé` : `rapport de la semaine du ${week} non envoyé : ${result.detail}`;
      }
    }
    reportOutcome(request, { summary: `Contrôles : ${Object.entries(checks).map(([rule, result]) => `${rule} ${result === 'ok' ? 'ok' : 'alerte'}`).join(', ') || 'aucun'}${weekly ? ` ; ${weekly}` : ''}` });
    return NextResponse.json({ checks, weekly });
  } catch (error) {
    reportUserError(error, { request });
    return NextResponse.json({ error: 'Les contrôles quotidiens ont échoué.' }, { status: 500 });
  }
});
