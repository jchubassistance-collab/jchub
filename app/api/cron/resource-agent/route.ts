import { NextRequest, NextResponse } from 'next/server';
import { hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { startResourceAgent } from '@/lib/resource-agent-start';
import { reportUserError } from '@/lib/user-error';
import { withReport } from '@/lib/reports/server';

export const runtime = 'nodejs';

/** Every Monday (vercel.json): research of the most wanted topics and at least two resource drafts. */
export const GET = withReport(async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
  try {
    const result = await startResourceAgent('cron');
    return NextResponse.json(result, { status: result.started ? 202 : 200 });
  } catch (error) {
    reportUserError(error, { request });
    return NextResponse.json({ error: 'Impossible de démarrer l’agent des ressources.' }, { status: 500 });
  }
});

export const POST = GET;
