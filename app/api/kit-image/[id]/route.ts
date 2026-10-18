import { NextRequest, NextResponse } from 'next/server';
import { getKit, kitCardInput } from '@/lib/cm-publication-kit';
import { renderSocialCardJpeg } from '@/lib/social-card';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Visuel public d'un kit, téléchargé par Meta au moment de la publication (JPEG, seul format accepté par Instagram).
 * Il n'est servi qu'après une demande de publication : un brouillon reste privé.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return NextResponse.json({ error: 'Visuel introuvable.' }, { status: 404 });
  const kit = await getKit(id).catch(() => null);
  if (!kit?.publishRequestedAt) return NextResponse.json({ error: 'Visuel introuvable.' }, { status: 404 });
  try {
    const facebook = request.nextUrl.searchParams.get('format') === 'facebook';
    const jpeg = await renderSocialCardJpeg(kitCardInput(kit), facebook ? 'landscape' : 'portrait');
    return new NextResponse(jpeg, {
      headers: {
        'Content-Type': 'image/jpeg',
        // L'URL porte la version du kit (paramètre v) : une modification produit une nouvelle adresse.
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    reportUserError();
    return NextResponse.json({ error: 'Visuel indisponible.' }, { status: 500 });
  }
}
