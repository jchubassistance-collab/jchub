import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import type { DashboardLang } from '@/lib/ga4';
import { buildDashboard, DASHBOARD_PERIODS } from '@/lib/admin-dashboard';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CACHE_MS = 2 * 60_000;
const cache = new Map<string, { at: number; data: unknown }>();

/** Everything the admin dashboard shows, for a period (7, 28, 90 or 365 days) and a language. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const askedDays = Number(request.nextUrl.searchParams.get('days'));
    const days = (DASHBOARD_PERIODS as readonly number[]).includes(askedDays) ? askedDays : 28;
    const askedLang = request.nextUrl.searchParams.get('lang');
    const lang: DashboardLang = askedLang === 'fr' || askedLang === 'en' ? askedLang : 'all';
    const key = `${days}:${lang}`;
    const cached = cache.get(key);
    const fresh = request.nextUrl.searchParams.get('refresh') === '1';
    if (cached && !fresh && Date.now() - cached.at < CACHE_MS) return NextResponse.json(cached.data);
    const data = await buildDashboard(days, lang);
    cache.set(key, { at: Date.now(), data });
    return NextResponse.json(data);
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN') return NextResponse.json({ error: 'Accès administrateur requis.' }, { status: 401 });
    if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    reportUserError(error);
    return NextResponse.json({ error: 'Le tableau de bord est indisponible pour le moment.' }, { status: 500 });
  }
}
