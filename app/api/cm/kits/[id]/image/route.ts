import { NextRequest, NextResponse } from 'next/server';
import { requireCm } from '@/lib/admin-auth';
import { cmError } from '@/lib/cm-server';
import { getKit, kitCardInput } from '@/lib/cm-publication-kit';
import { renderSocialCardJpeg } from '@/lib/social-card';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Aperçu et téléchargement du visuel d'un kit : portrait 1080×1350 pour Instagram, paysage 1200×630 pour Facebook.
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireCm(request);
    const { id } = await context.params;
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return NextResponse.json({ error: 'Kit invalide.' }, { status: 400 });
    const kit = await getKit(id);
    if (!kit) return NextResponse.json({ error: 'Kit introuvable.' }, { status: 404 });
    const facebook = request.nextUrl.searchParams.get('format') === 'facebook';
    const jpeg = await renderSocialCardJpeg(kitCardInput(kit), facebook ? 'landscape' : 'portrait');
    const safeSlug = kit.slug.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60) || 'publication';
    const download = request.nextUrl.searchParams.get('download') === '1';
    return new NextResponse(jpeg, {
      headers: {
        'Content-Type': 'image/jpeg',
        ...(download ? { 'Content-Disposition': `attachment; filename="jchub-${safeSlug}-${facebook ? 'facebook' : 'instagram'}.jpg"` } : {}),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) { return cmError(error); }
}
