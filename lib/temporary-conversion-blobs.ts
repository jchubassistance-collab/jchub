import 'server-only';

import { BlobNotFoundError, del, get, head, list } from '@vercel/blob';
import { reportUserError } from '@/lib/user-error';

const MAX_AGE_MS = 60 * 60 * 1000;

export const temporaryUploadPolicies = {
  'image-optimizer': {
    maximumSizeInBytes: 15 * 1024 * 1024,
    allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  'images-to-pdf': {
    maximumSizeInBytes: 15 * 1024 * 1024,
    allowedContentTypes: ['image/jpeg', 'image/png'],
  },
  'pdf-compressor': {
    maximumSizeInBytes: 30 * 1024 * 1024,
    allowedContentTypes: ['application/pdf'],
  },
  'word-to-pdf': {
    maximumSizeInBytes: 10 * 1024 * 1024,
    allowedContentTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  'excel-to-csv': {
    maximumSizeInBytes: 10 * 1024 * 1024,
    allowedContentTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
      'application/vnd.ms-excel',
    ],
  },
  'csv-to-excel': {
    maximumSizeInBytes: 10 * 1024 * 1024,
    allowedContentTypes: ['text/csv', 'text/plain', 'application/vnd.ms-excel'],
  },
} as const;

export type TemporaryConversionTool = keyof typeof temporaryUploadPolicies;

export class TemporaryBlobError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = 'TemporaryBlobError';
  }
}

function assertTemporaryBlobUrl(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new TemporaryBlobError('Adresse du fichier temporaire invalide.');
  }
  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    !parsed.hostname.endsWith('.blob.vercel-storage.com')
  ) {
    throw new TemporaryBlobError('Adresse du fichier temporaire invalide.');
  }
}

export async function readTemporaryBlob(url: string, tool: TemporaryConversionTool) {
  assertTemporaryBlobUrl(url);
  const metadata = await head(url);
  const policy = temporaryUploadPolicies[tool];
  if (!metadata.pathname.startsWith(`temporary/${tool}/`)) {
    throw new TemporaryBlobError('Fichier temporaire invalide.');
  }
  if (Date.now() - metadata.uploadedAt.getTime() > MAX_AGE_MS) {
    throw new TemporaryBlobError('Le transfert a expiré. Téléverse le fichier à nouveau.', 410);
  }
  if (metadata.size > policy.maximumSizeInBytes) {
    throw new TemporaryBlobError('Le fichier dépasse la taille maximale autorisée.', 413);
  }
  if (!(policy.allowedContentTypes as readonly string[]).includes(metadata.contentType)) {
    throw new TemporaryBlobError('Le type de fichier reçu n’est pas accepté.');
  }

  const blob = await get(metadata.url, { access: 'private', useCache: false });
  if (!blob || blob.statusCode !== 200) {
    throw new TemporaryBlobError('Le fichier temporaire est introuvable.', 404);
  }

  return {
    url: metadata.url,
    pathname: metadata.pathname,
    contentType: metadata.contentType,
    size: metadata.size,
    buffer: Buffer.from(await new Response(blob.stream).arrayBuffer()),
  };
}

export async function deleteTemporaryBlob(url: string, tool: TemporaryConversionTool) {
  try {
    assertTemporaryBlobUrl(url);
    const metadata = await head(url);
    if (!metadata.pathname.startsWith(`temporary/${tool}/`)) {
      throw new TemporaryBlobError('Fichier temporaire invalide.');
    }
    await del(metadata.url);
  } catch (error) {
    if (error instanceof BlobNotFoundError) return;
    throw error;
  }
}

export async function cleanUpTemporaryBlobs(urls: string[], tool: TemporaryConversionTool) {
  const results = await Promise.allSettled(urls.map((url) => deleteTemporaryBlob(url, tool)));
  if (results.some((result) => result.status === 'rejected')) reportUserError();
}

export async function cleanUpExpiredConversionBlobs() {
  const cutoff = Date.now() - MAX_AGE_MS;
  let cursor: string | undefined;
  let deleted = 0;

  do {
    const page = await list({ prefix: 'temporary/', limit: 100, ...(cursor ? { cursor } : {}) });
    const expired = page.blobs.filter((blob) => blob.uploadedAt.getTime() < cutoff);
    if (expired.length) {
      await del(expired.map((blob) => blob.url));
      deleted += expired.length;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return deleted;
}
