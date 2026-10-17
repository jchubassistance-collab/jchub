import { NextRequest, NextResponse } from 'next/server';
import { cleanUpExpiredConversionBlobs } from '@/lib/temporary-conversion-blobs';
import { reportUserError } from '@/lib/user-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const deleted = await cleanUpExpiredConversionBlobs();
    return NextResponse.json({ deleted });
  } catch {
    reportUserError();
    return NextResponse.json({ error: 'Le nettoyage des fichiers temporaires a échoué.' }, { status: 500 });
  }
}
