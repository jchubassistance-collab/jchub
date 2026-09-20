import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getGa4Overview } from '@/lib/ga4';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    return NextResponse.json(await getGa4Overview());
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    reportUserError();
    return NextResponse.json({
      error: code === 'FORBIDDEN' ? 'Accès refusé.' : 'Rapport Analytics indisponible.',
      details: code === 'FORBIDDEN' ? undefined : code,
    }, { status: code === 'FORBIDDEN' ? 403 : 500 });
  }
}