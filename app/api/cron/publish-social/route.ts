import { NextRequest, NextResponse } from 'next/server';
import { start } from 'workflow/api';
import { listDuePublications, getSocialSettings } from '@/lib/social-publications-store';
import { runSocialPublication } from '@/workflows/social-publishing';
import { reportUserError } from '@/lib/user-error';
import { isCronBearerAuthorized } from '@/lib/social-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isCronBearerAuthorized(request.headers.get('authorization'), process.env.CRON_SECRET)) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  try {
    const settings = await getSocialSettings();
    const due = await listDuePublications(10);
    if (settings.dryRun) return NextResponse.json({ queued: 0, dryRun: true, due: due.length });
    const enabled = (platform: string) => platform === 'linkedin' ? settings.linkedinEnabled : platform === 'facebook' ? settings.facebookEnabled : settings.githubEnabled;
    const results = await Promise.all(due.filter((item) => enabled(item.platform)).map(async (item) => {
      try {
        const run = await start(runSocialPublication, [item.id, false]);
        return { id: item.id, queued: true, runId: run.runId };
      } catch {
        reportUserError();
        return { id: item.id, queued: false };
      }
    }));
    return NextResponse.json({ queued: results.filter((item) => item.queued).length, results });
  } catch {
    reportUserError();
    return NextResponse.json({ error: 'Planificateur social indisponible.' }, { status: 503 });
  }
}
