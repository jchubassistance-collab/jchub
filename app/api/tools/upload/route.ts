import { apiMessage } from '@/lib/api-messages';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import {
  deleteTemporaryBlob,
  temporaryUploadPolicies,
  TemporaryBlobError,
  type TemporaryConversionTool,
} from '@/lib/temporary-conversion-blobs';
import { reportUserError } from '@/lib/user-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isTemporaryConversionTool(value: string): value is TemporaryConversionTool {
  return Object.hasOwn(temporaryUploadPolicies, value);
}

export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: apiMessage(request, 'Le stockage temporaire des fichiers n’est pas configuré.') }, { status: 503 });
  }

  let body: HandleUploadBody;
  try {
    body = await request.clone().json() as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: apiMessage(request, 'Demande de transfert invalide.') }, { status: 400 });
  }

  let invalidUpload = false;
  let rateLimitResponse: NextResponse | null = null;
  try {
    const result = await handleUpload({
      request,
      body,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const [, tool, filename, ...rest] = pathname.split('/');
        if (!pathname.startsWith('temporary/') || !tool || !filename || rest.length || !isTemporaryConversionTool(tool)) {
          invalidUpload = true;
          throw new Error('Destination de transfert invalide.');
        }
        let payload: { tool?: unknown };
        try {
          payload = JSON.parse(clientPayload ?? '{}') as { tool?: unknown };
        } catch {
          invalidUpload = true;
          throw new Error('Outil de conversion invalide.');
        }
        if (payload.tool !== tool) {
          invalidUpload = true;
          throw new Error('Outil de conversion invalide.');
        }

        const limited = await enforceRateLimit(request, `conversion-blob-upload:${tool}`, 25, 60_000);
        if (limited) {
          rateLimitResponse = limited;
          throw new Error('Upload rate limited.');
        }

        const policy = temporaryUploadPolicies[tool];
        return {
          allowedContentTypes: [...policy.allowedContentTypes],
          maximumSizeInBytes: policy.maximumSizeInBytes,
          validUntil: Date.now() + 10 * 60_000,
          addRandomSuffix: false,
          allowOverwrite: false,
          cacheControlMaxAge: 60,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    if (rateLimitResponse) return rateLimitResponse;
    if (invalidUpload) return NextResponse.json({ error: apiMessage(request, 'Paramètres de transfert invalides.') }, { status: 400 });
    reportUserError();
    return NextResponse.json({ error: apiMessage(request, 'Impossible de transférer le fichier temporairement.') }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  let body: { tool?: unknown; urls?: unknown };
  try {
    body = await request.json() as { tool?: unknown; urls?: unknown };
  } catch {
    return NextResponse.json({ error: apiMessage(request, 'Demande de suppression invalide.') }, { status: 400 });
  }

  const tool = body.tool;
  try {
    if (
      typeof tool !== 'string' ||
      !isTemporaryConversionTool(tool) ||
      !Array.isArray(body.urls) ||
      body.urls.length > 20 ||
      !body.urls.every((url): url is string => typeof url === 'string')
    ) {
      return NextResponse.json({ error: apiMessage(request, 'Demande de suppression invalide.') }, { status: 400 });
    }

    await Promise.all(body.urls.map((url) => deleteTemporaryBlob(url, tool)));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof TemporaryBlobError) {
      return NextResponse.json({ error: apiMessage(request, error.message) }, { status: error.status });
    }
    reportUserError();
    return NextResponse.json({ error: apiMessage(request, 'Impossible de supprimer le fichier temporaire.') }, { status: 503 });
  }
}
