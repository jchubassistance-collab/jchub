import { NextRequest, NextResponse } from 'next/server';
import { start } from 'workflow/api';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { runSocialPreparation } from '@/workflows/social-publishing';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';

const schema = z.object({ sourceContentId: z.string().trim().min(1).max(180) }).strict();

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Article source invalide.' }, { status: 400 });
    const run = await start(runSocialPreparation, [parsed.data.sourceContentId]);
    return NextResponse.json({ queued: true, runId: run.runId }, { status: 202 });
  } catch (error) {
    reportUserError();
    const code = error instanceof Error ? error.message : '';
    return NextResponse.json({ error: code === 'FORBIDDEN' ? 'Accès refusé.' : code === 'UNAUTHORIZED' ? 'Authentification administrateur requise.' : 'Préparation des publications impossible.' }, { status: code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' ? 401 : 400 });
  }
}
