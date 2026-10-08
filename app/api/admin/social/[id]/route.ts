import { NextRequest, NextResponse } from 'next/server';
import { start } from 'workflow/api';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { getPublication, schedulePublication, updatePublicationStatus } from '@/lib/social-publications-store';
import { zonedDateTimeToUtc } from '@/lib/social-utils';
import { getSocialSettings } from '@/lib/social-publications-store';
import { runSocialPublication } from '@/workflows/social-publishing';

export const runtime = 'nodejs';

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }).strict(),
  z.object({ action: z.literal('publish') }).strict(),
  z.object({ action: z.literal('schedule'), localDateTime: z.string().max(16) }).strict(),
  z.object({ action: z.literal('cancel') }).strict(),
  z.object({ action: z.literal('retry'), confirmNoExternalPost: z.boolean().optional() }).strict(),
]);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    if (!/^[a-f0-9]{64}$/.test(id)) return NextResponse.json({ error: 'Publication introuvable.' }, { status: 404 });
    const parsed = actionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Action invalide.' }, { status: 400 });
    const publication = await getPublication(id);
    if (!publication) return NextResponse.json({ error: 'Publication introuvable.' }, { status: 404 });
    const { action } = parsed.data;

    if (action === 'approve') {
      const updated = await updatePublicationStatus(id, ['DRAFT'], 'APPROVED');
      return updated ? NextResponse.json({ status: 'APPROVED' }) : NextResponse.json({ error: 'Seul un brouillon peut être approuvé.' }, { status: 409 });
    }
    if (action === 'publish') {
      const settings = await getSocialSettings();
      if (settings.dryRun) return NextResponse.json({ ok: true, dryRun: true, wouldPublish: publication.platform, destination: publication.destination });
      const run = await start(runSocialPublication, [id, false]);
      return NextResponse.json({ queued: true, runId: run.runId }, { status: 202 });
    }
    if (action === 'retry') {
      if (publication.status !== 'FAILED' && publication.status !== 'UNKNOWN') return NextResponse.json({ error: 'Seule une publication en échec peut être relancée.' }, { status: 409 });
      if (publication.status === 'UNKNOWN' && parsed.data.confirmNoExternalPost !== true) return NextResponse.json({ error: 'Vérifie la plateforme et confirme l’absence de publication avant de relancer.' }, { status: 409 });
      const settings = await getSocialSettings();
      if (settings.dryRun) return NextResponse.json({ ok: true, dryRun: true, wouldPublish: publication.platform, destination: publication.destination });
      const run = await start(runSocialPublication, [id, true, parsed.data.confirmNoExternalPost === true]);
      return NextResponse.json({ queued: true, runId: run.runId }, { status: 202 });
    }
    if (action === 'schedule') {
      const settings = await getSocialSettings();
      let at: Date;
      try { at = zonedDateTimeToUtc(parsed.data.localDateTime, settings.timezone); }
      catch { return NextResponse.json({ error: 'Date ou fuseau horaire invalide.' }, { status: 400 }); }
      if (at.getTime() <= Date.now()) return NextResponse.json({ error: 'Choisis une heure future.' }, { status: 400 });
      const updated = await schedulePublication(id, at);
      return updated ? NextResponse.json({ status: 'SCHEDULED', scheduledAt: at.toISOString() }) : NextResponse.json({ error: 'Approuve le brouillon avant de le programmer.' }, { status: 409 });
    }
    const updated = await updatePublicationStatus(id, ['DRAFT', 'APPROVED', 'SCHEDULED'], 'CANCELLED');
    return updated ? NextResponse.json({ status: 'CANCELLED' }) : NextResponse.json({ error: 'Cette publication ne peut plus être annulée.' }, { status: 409 });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    return NextResponse.json({ error: code === 'FORBIDDEN' ? 'Accès refusé.' : 'Authentification administrateur requise.' }, { status: code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' ? 401 : 500 });
  }
}
