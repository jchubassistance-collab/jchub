import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCm } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { cmError, requireSameOrigin, writeCmActivity } from '@/lib/cm-server';
import { reportUserError } from '@/lib/user-error';
import { createKit, KitSourceNotFoundError, toKit } from '@/lib/cm-publication-kit';

export const runtime = 'nodejs';
export const maxDuration = 120;

const requestSchema = z.object({ kind: z.enum(['article', 'tool']), slug: z.string().trim().min(1).max(180) }).strict();

export async function GET(request: NextRequest) {
  try {
    await requireCm(request);
    const snapshot = await getAdminDb().collection('cmKits').orderBy('createdAt', 'desc').limit(100).get();
    const kits = snapshot.docs.map((doc) => toKit(doc.id, doc.data()));
    return NextResponse.json({ kits }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return cmError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireCm(request); requireSameOrigin(request);
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Choisis un article ou un outil disponible.' }, { status: 400 });
    let kit;
    try {
      kit = await createKit(parsed.data.kind, parsed.data.slug, actor.uid);
    } catch (error) {
      if (error instanceof KitSourceNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
      reportUserError();
      const diagnostic = error instanceof Error ? error.message : '';
      // Garder les détails des fournisseurs hors de la réponse : certaines erreurs contiennent des éléments de requête.
      console.error('[cm/kits] Kit generation failed:', diagnostic.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]').slice(0, 400));
      return NextResponse.json({ error: 'L’IA n’a pas réussi à préparer ce kit. Réessaie dans un instant; si le problème persiste, consulte le terminal du serveur.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
    }
    await writeCmActivity(actor.uid, 'kit.generated', kit.id);
    return NextResponse.json({ kit }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof Error && (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN' || error.message === 'CSRF')) return cmError(error);
    reportUserError();
    console.error('[cm/kits] Request failed:', error instanceof Error ? error.message.slice(0, 400) : 'unknown error');
    return NextResponse.json({ error: 'La demande du kit a échoué. Consulte le terminal du serveur pour connaître la cause.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
