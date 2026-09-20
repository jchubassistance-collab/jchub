import { NextRequest, NextResponse } from 'next/server';
import { start } from 'workflow/api';
import { requireAdmin } from '@/lib/admin-auth';
import { runEditorialAgent } from '@/workflows/editorial-agent';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const run = await start(runEditorialAgent);
    return NextResponse.json({ started: true, runId: run.runId }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne.';
    if (message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    if (message === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    reportUserError();
    return NextResponse.json({ error: 'Impossible de démarrer l’agent.' }, { status: 500 });
  }
}