import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { insightsConfigured } from '@/lib/insights/db';
import { ALERT_RULE_IDS, type AlertRuleId } from '@/lib/alerts/rules';
import { raiseAlert, saveRuleSettings } from '@/lib/alerts/server';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function adminError(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  if (code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN') return NextResponse.json({ error: 'Accès administrateur requis.' }, { status: 401 });
  if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  reportUserError(error);
  return NextResponse.json({ error: 'Les alertes sont indisponibles pour le moment.' }, { status: 500 });
}

const settingsSchema = z.object({
  rules: z.array(z.object({
    id: z.enum(ALERT_RULE_IDS as [AlertRuleId, ...AlertRuleId[]]),
    enabled: z.boolean(),
    threshold: z.number().min(0).max(1_000_000).nullable(),
    channels: z.array(z.literal('email')).max(1),
  })).max(20),
});

/** Saves the settings of the alert rules (Control Center › Alertes). */
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!insightsConfigured()) return NextResponse.json({ error: 'Base du Control Center non configurée.' }, { status: 503 });
    const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Réglages invalides.' }, { status: 400 });
    await saveRuleSettings(parsed.data.rules);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminError(error);
  }
}

/** Sends a test alert by e-mail, to check it arrives. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!insightsConfigured()) return NextResponse.json({ error: 'Base du Control Center non configurée.' }, { status: 503 });
    const result = await raiseAlert('error_spike', { title: 'Alerte de test', message: 'Si tu lis ce message, les alertes du Control Center arrivent bien.' }, { test: true });
    return NextResponse.json({ sent: result?.sent ?? {} });
  } catch (error) {
    return adminError(error);
  }
}
