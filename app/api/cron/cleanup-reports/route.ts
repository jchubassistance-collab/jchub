import { NextRequest, NextResponse } from 'next/server';
import { cleanUpReports } from '@/lib/reports/read';
import { hasReportsDatabase } from '@/lib/reports/rtdb';
import { reportOutcome, withReport } from '@/lib/reports/server';
import { reportUserError } from '@/lib/user-error';
import { purgeOldEvents } from '@/lib/insights/db';
import { purgeOldActivity } from '@/lib/activity-log';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/** Daily: requests are kept 30 days, errors 90 days, Control Center events 13 months, the activity log a year. */
export const GET = withReport(async (request: NextRequest) => {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  if (!hasReportsDatabase()) return NextResponse.json({ error: 'La base des rapports n’est pas configurée.' }, { status: 503 });

  try {
    const deleted = await cleanUpReports();
    const events = await purgeOldEvents().catch((error) => { reportUserError(error, { request }); return 0; });
    const activity = await purgeOldActivity().catch((error) => { reportUserError(error, { request }); return 0; });
    reportOutcome(request, { summary: `${deleted.days} jour(s) de requêtes, ${deleted.errors} erreur(s), ${deleted.fingerprints} compteur(s), ${events} événement(s) d’audience et ${activity} entrée(s) du journal d’activité supprimés` });
    return NextResponse.json({ deleted, events, activity });
  } catch (error) {
    reportUserError(error, { request });
    return NextResponse.json({ error: 'Le nettoyage des rapports a échoué.' }, { status: 500 });
  }
});
