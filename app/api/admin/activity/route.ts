import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { readActivity } from '@/lib/activity-log';
import { hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Activity log, newest first: ?before=<ISO date> for the next page, ?email= for one account. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const params = request.nextUrl.searchParams;
    const page = await readActivity({
      limit: Number(params.get('limit')) || 50,
      before: params.get('before') || undefined,
      email: params.get('email')?.trim().toLowerCase() || undefined,
    });
    return NextResponse.json(page, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'UNAUTHORIZED') return NextResponse.json({ error: 'Accès administrateur requis.' }, { status: 401 });
    if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    reportUserError(error, { request });
    return NextResponse.json({ error: 'Impossible de lire le journal d’activité.' }, { status: 500 });
  }
}
