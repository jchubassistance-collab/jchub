import { NextRequest, NextResponse } from 'next/server';
import { requireCm } from '@/lib/admin-auth';
import { cmError } from '@/lib/cm-server';
import { getKit } from '@/lib/cm-publication-kit';
import { findPhotos, photosEnabled } from '@/lib/photos';

export const runtime = 'nodejs';

// Photos proposées pour le visuel d'un kit : les recherches de l'IA, ou celle saisie par le CM.
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireCm(request);
    if (!photosEnabled()) return NextResponse.json({ error: 'Ajoute UNSPLASH_ACCESS_KEY pour chercher des photos.' }, { status: 503 });
    const { id } = await context.params;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return NextResponse.json({ error: 'Kit invalide.' }, { status: 400 });
    const kit = await getKit(id);
    if (!kit) return NextResponse.json({ error: 'Kit introuvable.' }, { status: 404 });
    const query = request.nextUrl.searchParams.get('q')?.trim().slice(0, 80);
    const queries = query ? [query] : kit.photoQueries.length ? kit.photoQueries : [kit.title];
    const photos = await findPhotos(queries, 'landscape', query ? 12 : 4);
    return NextResponse.json({ photos, queries }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) { return cmError(error); }
}
