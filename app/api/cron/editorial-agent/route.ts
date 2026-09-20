import { NextRequest, NextResponse } from 'next/server';
import { start } from 'workflow/api';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { runEditorialAgent } from '@/workflows/editorial-agent';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const authorization = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });

  const dateKey = new Date().toISOString().slice(0, 10);
  const lockReference = getAdminDb().collection('agent_runs').doc(dateKey);
  const lock = await getAdminDb().runTransaction(async (transaction) => {
    const existing = await transaction.get(lockReference);
    if (existing.exists) return false;
    transaction.create(lockReference, { date: dateKey, status: 'started', createdAt: new Date() });
    return true;
  });
  if (!lock) return NextResponse.json({ started: false, skipped: true, reason: 'already_started', date: dateKey });

  try {
    const run = await start(runEditorialAgent);
    await lockReference.update({ status: 'running', runId: run.runId, updatedAt: new Date() });
    return NextResponse.json({ started: true, runId: run.runId, date: dateKey }, { status: 202 });
  } catch (error) {
    await lockReference.update({ status: 'failed', error: error instanceof Error ? error.message : 'Erreur inconnue', updatedAt: new Date() });
    reportUserError();
    return NextResponse.json({ error: 'Impossible de démarrer l’agent.' }, { status: 500 });
  }
}

export const POST = GET;