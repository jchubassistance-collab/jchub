import { NextRequest, NextResponse } from 'next/server';
import { start } from 'workflow/api';
import { z } from 'zod';
import { requireCm } from '@/lib/admin-auth';
import { cmError, requireSameOrigin, writeCmActivity } from '@/lib/cm-server';
import { KIT_PLATFORMS, publishKit } from '@/lib/publishing-agent';
import { runSocialPublication } from '@/workflows/social-publishing';

export const runtime = 'nodejs';

const schema = z.object({
  platforms: z.array(z.enum(['facebook', 'instagram'])).min(1).max(2).optional(),
  confirmUnknown: z.boolean().optional(),
}).strict();

// Publie le kit sur Facebook et Instagram via la connexion Meta du site (workflow durable par réseau).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireCm(request); requireSameOrigin(request);
    const { id } = await params;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return NextResponse.json({ error: 'Kit invalide.' }, { status: 400 });
    const parsed = schema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: 'Demande de publication invalide.' }, { status: 400 });
    let outcomes;
    try {
      outcomes = await publishKit(id, {
        platforms: parsed.data.platforms || KIT_PLATFORMS,
        confirmUnknown: parsed.data.confirmUnknown === true,
        run: (publicationId, retry, confirm) => start(runSocialPublication, [publicationId, retry, confirm]),
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'KIT_NOT_FOUND') return NextResponse.json({ error: 'Kit introuvable.' }, { status: 404 });
      throw error;
    }
    await writeCmActivity(actor.uid, 'kit.publish', id);
    return NextResponse.json({ outcomes }, { status: outcomes.some((item) => item.outcome === 'queued') ? 202 : 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return cmError(error); }
}
