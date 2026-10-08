import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getGuideBySlug } from '@/lib/guides-server';
import { signedCloudinaryDownloadUrl } from '@/lib/cloudinary';
import { reportUserError } from '@/lib/user-error';

const files: Record<string, { directory: string; fileName: string }> = {
  'creer-un-utilisateur-windows-cmd': { directory: 'public/guides', fileName: 'creer-un-utilisateur-windows-cmd.txt' },
  'changer-mot-de-passe-windows': { directory: 'app/guides', fileName: 'Guide_Changer_Mot_de_Passe_Windows_v2.pdf' },
};

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const file = files[slug];
  if (!file) {
    const guide = await getGuideBySlug(slug);
    if (!guide) {
      return NextResponse.json({ error: 'Guide introuvable.' }, { status: 404 });
    }

    const sourceUrl = guide.cloudinaryPublicId
      ? signedCloudinaryDownloadUrl(guide.cloudinaryPublicId, guide.format.toLowerCase())
      : guide.downloadUrl;
    let parsedUrl: URL;
    try { parsedUrl = new URL(sourceUrl); }
    catch { return NextResponse.json({ error: 'Fichier du guide indisponible.' }, { status: 404 }); }
    if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname !== 'res.cloudinary.com' ||
        parsedUrl.pathname.split('/')[1] !== (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo')) {
      return NextResponse.json({ error: 'Fichier du guide indisponible.' }, { status: 404 });
    }
    const cloudinaryResponse = await fetch(parsedUrl, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
    if (!cloudinaryResponse.ok) {
      return NextResponse.json({ error: 'Fichier du guide indisponible.' }, { status: 502 });
    }

    const contents = await cloudinaryResponse.arrayBuffer();
    if (contents.byteLength > 50 * 1024 * 1024) return NextResponse.json({ error: 'Fichier du guide trop volumineux.' }, { status: 413 });
    const safeFileName = `${guide.slug}.pdf`;
    return new NextResponse(contents, {
      headers: {
        'Content-Type': cloudinaryResponse.headers.get('content-type') || 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  }

  try {
    const contents = await readFile(path.join(process.cwd(), file.directory, file.fileName));
    const contentType = file.fileName.endsWith('.pdf') ? 'application/pdf' : 'text/plain; charset=utf-8';
    return new NextResponse(contents, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${file.fileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    reportUserError();
    return NextResponse.json({ error: 'Fichier du guide indisponible.' }, { status: 404 });
  }
}
