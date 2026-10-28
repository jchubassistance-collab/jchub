import { NextRequest, NextResponse } from 'next/server';
import { cleanUpReports } from '@/lib/reports/read';
import { hasReportsDatabase } from '@/lib/reports/rtdb';
import { reportOutcome, withReport } from '@/lib/reports/server';
import { reportUserError } from '@/lib/user-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/** Daily: requests are kept 30 days, errors 90 days. */
export const GET = withReport(async (request: NextRequest) => {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  if (!hasReportsDatabase()) return NextResponse.json({ error: 'La base des rapports n’est pas configurée.' }, { status: 503 });

  try {
    const deleted = await cleanUpReports();
    reportOutcome(request, { summary: `${deleted.days} jour(s) de requêtes, ${deleted.errors} erreur(s) et ${deleted.fingerprints} compteur(s) supprimés` });
    return NextResponse.json({ deleted });
  } catch (error) {
    reportUserError(error, { request });
    return NextResponse.json({ error: 'Le nettoyage des rapports a échoué.' }, { status: 500 });
  }
});
