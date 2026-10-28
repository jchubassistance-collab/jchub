import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { isReportId } from '@/lib/reports/core';
import { getReport } from '@/lib/reports/read';
import { hasReportsDatabase } from '@/lib/reports/rtdb';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    if (!hasReportsDatabase()) return NextResponse.json({ error: 'La base Realtime des rapports n’est pas configurée.' }, { status: 503 });
    const { id } = await params;
    if (!isReportId(id)) return NextResponse.json({ error: 'Ce rapport est introuvable.' }, { status: 404 });
    const report = await getReport(id);
    if (!report) return NextResponse.json({ error: 'Ce rapport est introuvable ou a été supprimé (30 jours pour les requêtes, 90 jours pour les erreurs).' }, { status: 404 });
    return NextResponse.json(report, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' ? 401 : 500;
    if (status === 500) reportUserError(error, { request });
    return NextResponse.json({ error: status === 403 ? 'Accès refusé.' : status === 401 ? 'Authentification administrateur requise.' : 'Ce rapport est indisponible.' }, { status });
  }
}
