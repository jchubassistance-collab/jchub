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
  { params }: { params: { slug: string } },
) {
  const file = files[params.slug];
  if (!file) {
    const guide = await getGuideBySlug(params.slug);
    if (!guide || !/^https?:\/\//i.test(guide.downloadUrl)) {
      return NextResponse.json({ error: 'Guide introuvable.' }, { status: 404 });
    }

    const sourceUrl = guide.cloudinaryPublicId
      ? signedCloudinaryDownloadUrl(guide.cloudinaryPublicId, guide.format.toLowerCase())
      : guide.downloadUrl;
    const cloudinaryResponse = await fetch(sourceUrl, { cache: 'no-store' });
    if (!cloudinaryResponse.ok) {
      return NextResponse.json({ error: 'Fichier du guide indisponible.' }, { status: 502 });
    }

    const contents = await cloudinaryResponse.arrayBuffer();
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