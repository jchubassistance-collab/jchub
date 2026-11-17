import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { insightsConfigured } from '@/lib/insights/db';
import { buildReport, CSV_DATASETS, reportPdf, reportPeriod, sendReport, type ReportPeriod } from '@/lib/insights/report';
import { reportWorkbook } from '@/lib/insights/report-xlsx';
import { INSIGHT_PERIODS } from '@/lib/insights/sections';
import { downloadName } from '@/lib/download-name';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function adminError(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  if (code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN') return NextResponse.json({ error: 'Accès administrateur requis.' }, { status: 401 });
  if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  reportUserError(error);
  return NextResponse.json({ error: 'Le rapport n’a pas pu être préparé.' }, { status: 500 });
}

/** The period asked: ?week=YYYY-MM-DD (a Monday), ?month=YYYY-MM, or ?days=7|28|90|365 up to now. */
function periodOf(request: NextRequest): ReportPeriod | null {
  const params = request.nextUrl.searchParams;
  if (params.get('week') || params.get('month')) return reportPeriod({ week: params.get('week'), month: params.get('month') });
  const days = Number(params.get('days'));
  if (!INSIGHT_PERIODS.includes(days)) return null;
  const to = Date.now();
  return { range: { from: to - days * 86400_000, to }, label: `${days} derniers jours`, slug: `${days}-jours`, kind: 'days' };
}

function file(body: Uint8Array | string, type: string, name: string) {
  return new NextResponse(typeof body === 'string' ? body : new Uint8Array(body), {
    headers: { 'content-type': type, 'content-disposition': `attachment; filename="${name}"`, 'cache-control': 'no-store' },
  });
}

/** The report as JSON (preview), Excel, PDF, or one CSV table: ?format=json|xlsx|pdf|csv&dataset=pages… */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!insightsConfigured()) return NextResponse.json({ configured: false });
    const period = periodOf(request);
    if (!period) return NextResponse.json({ error: 'Période invalide.' }, { status: 400 });
    const format = request.nextUrl.searchParams.get('format') || 'json';
    const report = await buildReport(period.range, period.label);
    if (format === 'xlsx') return file(await reportWorkbook(report), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', downloadName(`rapport-${period.slug}`, 'xlsx'));
    if (format === 'pdf') return file(await reportPdf(report), 'application/pdf', downloadName(`rapport-${period.slug}`, 'pdf'));
    if (format === 'csv') {
      const dataset = request.nextUrl.searchParams.get('dataset') || 'resume';
      const table = CSV_DATASETS[dataset];
      if (!table) return NextResponse.json({ error: 'Tableau inconnu.' }, { status: 400 });
      return file(table.build(report), 'text/csv; charset=utf-8', downloadName(`${dataset}-${period.slug}`, 'csv'));
    }
    return NextResponse.json({ configured: true, ...report });
  } catch (error) {
    return adminError(error);
  }
}

/** Sends the report of a week or a month by e-mail now, as the cron does every Monday. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!insightsConfigured()) return NextResponse.json({ error: 'Base du Control Center non configurée.' }, { status: 503 });
    const body = await request.json().catch(() => null) as { week?: unknown; month?: unknown } | null;
    const period = reportPeriod({ week: typeof body?.week === 'string' ? body.week : null, month: typeof body?.month === 'string' ? body.month : null });
    if (!period) return NextResponse.json({ error: 'Période invalide.' }, { status: 400 });
    const result = await sendReport(period);
    return result.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: `E-mail non envoyé : ${result.detail}` }, { status: 502 });
  } catch (error) {
    return adminError(error);
  }
}
