import { after, NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { logActivity } from '@/lib/activity-log';
import {
  backupStream, countContents, createBackup, deleteBackup, findBackup, hasBackupStorage, listBackups, readBackup, restoreBackup,
} from '@/lib/backups';
import { logSyncError, syncAllArticleFiles } from '@/lib/article-repository';
import { revalidateBlog } from '@/lib/live-articles';
import { revalidateTools } from '@/lib/tools-cache';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const noStore = { 'Cache-Control': 'no-store' };

function authError(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  if (code === 'UNAUTHORIZED') return NextResponse.json({ error: 'Accès administrateur requis.' }, { status: 401 });
  if (code === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  return null;
}

/** The list of backups, or ?download=<id> for the file itself. */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const download = request.nextUrl.searchParams.get('download');
    if (download) {
      const backup = await findBackup(download);
      if (!backup) return NextResponse.json({ error: 'Sauvegarde introuvable.' }, { status: 404 });
      return new NextResponse(await backupStream(backup), {
        headers: { ...noStore, 'Content-Type': 'application/gzip', 'Content-Disposition': `attachment; filename="sauvegarde-${backup.id}-jchub.json.gz"` },
      });
    }
    return NextResponse.json({ configured: hasBackupStorage(), backups: await listBackups() }, { headers: noStore });
  } catch (error) {
    const denied = authError(error);
    if (denied) return denied;
    reportUserError(error, { request });
    return NextResponse.json({ error: 'Impossible de lire les sauvegardes.' }, { status: 500 });
  }
}

const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create') }).strict(),
  z.object({ action: z.literal('contents'), id: z.string().min(1).max(80) }).strict(),
  z.object({
    action: z.literal('restore'),
    id: z.string().min(1).max(80),
    firestore: z.array(z.string().min(1).max(120)).max(200),
    turso: z.array(z.string().min(1).max(120)).max(200),
  }).strict(),
]);

export async function POST(request: NextRequest) {
  let actor: { uid: string; email?: string };
  try {
    actor = await requireAdmin(request);
  } catch (error) {
    return authError(error) || NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Demande invalide.' }, { status: 400 });
  const input = parsed.data;
  const by = actor.email || actor.uid;

  try {
    if (input.action === 'create') {
      const backup = await createBackup('manual', by);
      logActivity(request, { uid: actor.uid, email: actor.email, role: 'admin' }, `Sauvegarde manuelle ${backup.id}`);
      return NextResponse.json(backup, { headers: noStore });
    }

    const backup = await findBackup(input.id);
    if (!backup) return NextResponse.json({ error: 'Sauvegarde introuvable.' }, { status: 404 });
    const file = await readBackup(backup);
    if (input.action === 'contents') return NextResponse.json({ ...backup, by: file.by, contents: countContents(file) }, { headers: noStore });

    if (!input.firestore.length && !input.turso.length) return NextResponse.json({ error: 'Choisis au moins une collection ou une table à restaurer.' }, { status: 400 });
    // The current state is saved first: a restore can always be undone with this backup.
    const safety = await createBackup('pre-restore', by);
    const restored = await restoreBackup(file, { firestore: input.firestore, turso: input.turso });
    revalidateBlog();
    revalidateTools();
    if (restored.firestore.includes('articles')) after(() => syncAllArticleFiles().then(() => undefined, logSyncError));
    const parts = [
      restored.firestore.length ? `Firestore : ${restored.firestore.join(', ')}` : '',
      restored.turso.length ? `Turso : ${restored.turso.join(', ')}` : '',
    ].filter(Boolean).join(' ; ');
    logActivity(request, { uid: actor.uid, email: actor.email, role: 'admin' }, `Restauration de la sauvegarde ${backup.id} (${parts}) ; état précédent gardé dans ${safety.id}`);
    return NextResponse.json({ restored, safetyBackup: safety.id }, { headers: noStore });
  } catch (error) {
    reportUserError(error, { request, action: input.action === 'restore' ? 'Restauration d’une sauvegarde' : 'Sauvegarde' });
    const message = error instanceof Error && /BLOB_READ_WRITE_TOKEN/.test(error.message) ? error.message
      : input.action === 'restore' ? 'La restauration a échoué. L’état d’avant la restauration a été sauvegardé si l’erreur est survenue après cette étape.'
        : 'La sauvegarde a échoué.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const actor = await requireAdmin(request);
    const id = request.nextUrl.searchParams.get('id') || '';
    const backups = await listBackups();
    const backup = backups.find((item) => item.id === id);
    if (!backup) return NextResponse.json({ error: 'Sauvegarde introuvable.' }, { status: 404 });
    if (backups[0]?.id === id) return NextResponse.json({ error: 'La sauvegarde la plus récente ne peut pas être supprimée.' }, { status: 409 });
    await deleteBackup(backup);
    logActivity(request, { uid: actor.uid, email: actor.email, role: 'admin' }, `Suppression de la sauvegarde ${backup.id}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const denied = authError(error);
    if (denied) return denied;
    reportUserError(error, { request });
    return NextResponse.json({ error: 'Impossible de supprimer cette sauvegarde.' }, { status: 500 });
  }
}
