import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { latestResourceAgentRuns, startResourceAgent } from '@/lib/resource-agent-start';
import { resourceAdminError as adminError } from '@/lib/resource-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The last runs of the weekly resource agent. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ runs: [] });
    return NextResponse.json({ runs: await latestResourceAgentRuns() });
  } catch (error) {
    return adminError(error);
  }
}

/** Starts the research now, without waiting for Monday. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const result = await startResourceAgent('admin');
    if (!result.started) return NextResponse.json({ error: 'Une recherche est déjà en cours. Attends qu’elle se termine.' }, { status: 409 });
    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    return adminError(error);
  }
}
