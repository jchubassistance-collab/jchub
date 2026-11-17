import { NextRequest, NextResponse } from 'next/server';
import { createBackup, hasBackupStorage, purgeOldBackups } from '@/lib/backups';
import { logActivity } from '@/lib/activity-log';
import { reportOutcome, withReport } from '@/lib/reports/server';
import { reportUserError } from '@/lib/user-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/** Daily: a backup of Firestore and Turso, then the backups older than 30 days go. */
export const GET = withReport(async (request: NextRequest) => {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }
  if (!hasBackupStorage()) return NextResponse.json({ error: 'Le stockage des sauvegardes (Vercel Blob) n’est pas configuré.' }, { status: 503 });

  try {
    const backup = await createBackup('cron', 'cron');
    const purged = await purgeOldBackups().catch((error) => { reportUserError(error, { request }); return 0; });
    const documents = backup.contents.firestore.reduce((total, item) => total + item.documents, 0);
    const rows = backup.contents.turso.reduce((total, item) => total + item.rows, 0);
    const summary = `Sauvegarde ${backup.id} : ${documents} document(s) Firestore, ${rows} ligne(s) Turso, ${Math.round(backup.size / 1024)} Ko ; ${purged} ancienne(s) supprimée(s)`;
    reportOutcome(request, { summary });
    logActivity(null, { uid: 'cron', email: 'Tâche planifiée', role: 'system' }, summary);
    return NextResponse.json({ id: backup.id, size: backup.size, contents: backup.contents, purged });
  } catch (error) {
    reportUserError(error, { request, action: 'Sauvegarde quotidienne' });
    return NextResponse.json({ error: 'La sauvegarde a échoué.' }, { status: 500 });
  }
});
