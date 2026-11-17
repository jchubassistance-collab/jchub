import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { insightsConfigured } from '@/lib/insights/db';
import { getHistory } from '@/lib/insights/history';
import { historyWorkbook } from '@/lib/insights/history-xlsx';
import { downloadName } from '@/lib/download-name';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function adminError(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  if (code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN') return NextResponse.json({ error: 'Accès administrateur requis.' }, { status: 401 });
  if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  reportUserError(error);
  return NextResponse.json({ error: 'L’historique n’a pas pu être préparé.' }, { status: 500 });
}

/** The history since 3 September: ?refresh=1 rebuilds it from the sources, ?format=xlsx downloads it. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!insightsConfigured()) return NextResponse.json({ configured: false });
    const history = await getHistory({ refresh: request.nextUrl.searchParams.get('refresh') === '1' });
    if (request.nextUrl.searchParams.get('format') === 'xlsx') {
      return new NextResponse(new Uint8Array(await historyWorkbook(history)), {
        headers: {
          'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'content-disposition': `attachment; filename="${downloadName(`historique-${history.range.from}-au-${history.range.to}`, 'xlsx')}"`,
          'cache-control': 'no-store',
        },
      });
    }
    return NextResponse.json({ configured: true, ...history });
  } catch (error) {
    return adminError(error);
  }
}
