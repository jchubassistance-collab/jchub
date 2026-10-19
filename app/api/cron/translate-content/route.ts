import { NextRequest, NextResponse } from 'next/server';
import { translatePendingContent } from '@/lib/content-translation';
import { logSyncError, syncAllArticleFiles } from '@/lib/article-repository';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Daily catch-up: writes the English version of articles and tools that miss one or have
 * changed, then brings the files of content/articles in line with Firestore.
 */
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  try {
    const results = await translatePendingContent(4);
    const files = await syncAllArticleFiles().catch((error) => { logSyncError(error); return null; });
    return NextResponse.json({ results, files: files ? { status: files.status, changed: files.changed.length } : null });
  } catch {
    reportUserError();
    return NextResponse.json({ error: 'Traduction impossible.' }, { status: 500 });
  }
}

export const POST = GET;
