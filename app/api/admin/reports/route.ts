import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { ADMIN_PAGE_SIZES, pageFromParam } from '@/lib/pagination';
import { parsePeriod, REQUEST_KINDS, type RequestKind, type StatusFilter } from '@/lib/reports/core';
import { listErrors, listRequests } from '@/lib/reports/read';
import { hasReportsDatabase } from '@/lib/reports/rtdb';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUS_FILTERS: StatusFilter[] = ['ok', 'redirect', 'client', 'server', 'errors', 'unknown'];

function errorResponse(error: unknown, request: NextRequest) {
  const code = error instanceof Error ? error.message : '';
  const status = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' ? 401 : 500;
  if (status === 500) reportUserError(error, { request });
  return NextResponse.json({ error: status === 403 ? 'Accès refusé.' : status === 401 ? 'Authentification administrateur requise.' : 'Les rapports sont indisponibles.' }, { status });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasReportsDatabase()) return NextResponse.json({ error: 'La base Realtime des rapports n’est pas configurée.' }, { status: 503 });
    const params = request.nextUrl.searchParams;
    const tab = params.get('tab') === 'errors' ? 'errors' : 'requests';
    const kindParam = params.get('kind') || '';
    const kind = (REQUEST_KINDS as string[]).includes(kindParam) ? kindParam as RequestKind : '';
    const country = /^[A-Za-z0-9]{2}$/.test(params.get('country') || '') ? params.get('country')!.toUpperCase() : '';
    const search = (params.get('q') || '').trim().slice(0, 100);
    const sizeParam = Number(params.get('pageSize'));
    const pageSize = (ADMIN_PAGE_SIZES as readonly number[]).includes(sizeParam) ? sizeParam : ADMIN_PAGE_SIZES[1];
    const page = pageFromParam(params.get('page'));

    if (tab === 'errors') {
      const result = await listErrors({ period: parsePeriod(params.get('period'), '7d'), page, pageSize, filters: { kind, country, search } });
      return NextResponse.json({ tab, pageSize, generatedAt: Date.now(), ...result }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const statusParam = params.get('status') || '';
    const botsParam = params.get('bots') || '';
    const result = await listRequests({
      period: parsePeriod(params.get('period') === '90d' ? '30d' : params.get('period')),
      page,
      pageSize,
      filters: {
        kind,
        country,
        search,
        status: (STATUS_FILTERS as string[]).includes(statusParam) ? statusParam as StatusFilter : '',
        bots: botsParam === 'humans' || botsParam === 'bots' ? botsParam : '',
      },
    });
    return NextResponse.json({ tab, pageSize, generatedAt: Date.now(), ...result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error, request);
  }
}
