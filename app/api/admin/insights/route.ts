import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { insightsConfigured } from '@/lib/insights/db';
import { blogSection, conversionsSection, INSIGHT_PERIODS, liveSection, overview, performanceSection, toolsSection, traffic } from '@/lib/insights/sections';
import { backfillFromReports, BackfillRunningError } from '@/lib/insights/backfill';
import { alertsSection, seoSection } from '@/lib/insights/sections-batch3';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function adminError(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  if (code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN') return NextResponse.json({ error: 'Accès administrateur requis.' }, { status: 401 });
  if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  reportUserError(error);
  return NextResponse.json({ error: 'Le Control Center est indisponible pour le moment.' }, { status: 500 });
}

/** Data of one Control Center page: ?section=overview|traffic|tools|…|seo|alerts&days=7|28|90|365. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!insightsConfigured()) return NextResponse.json({ configured: false });
    const askedDays = Number(request.nextUrl.searchParams.get('days'));
    const days = INSIGHT_PERIODS.includes(askedDays) ? askedDays : 28;
    const section = request.nextUrl.searchParams.get('section');
    const builders: Record<string, () => Promise<object>> = {
      traffic: () => traffic(days), tools: () => toolsSection(days), blog: () => blogSection(days),
      conversions: () => conversionsSection(days), live: () => liveSection(), performance: () => performanceSection(days),
      seo: () => seoSection(days, request.nextUrl.searchParams.get('fresh') === '1'), alerts: () => alertsSection(),
    };
    const data = await (builders[section ?? ''] ?? (() => overview(days)))();
    return NextResponse.json({ configured: true, days, ...data });
  } catch (error) {
    return adminError(error);
  }
}

/** Imports the 30 days kept by the site reports (pages seen, server tool calls). */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!insightsConfigured()) return NextResponse.json({ error: 'Base du Control Center non configurée.' }, { status: 503 });
    return NextResponse.json(await backfillFromReports());
  } catch (error) {
    if (error instanceof BackfillRunningError) return NextResponse.json({ error: error.message }, { status: 409 });
    return adminError(error);
  }
}
