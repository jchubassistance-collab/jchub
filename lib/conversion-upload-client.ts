'use client';

import { upload } from '@vercel/blob/client';

export type ConversionUploadTool =
  | 'image-optimizer'
  | 'images-to-pdf'
  | 'pdf-compressor'
  | 'word-to-pdf'
  | 'excel-to-csv'
  | 'csv-to-excel';

export async function uploadConversionFile(tool: ConversionUploadTool, file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const contentType = file.type || (
    extension === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : extension === 'csv'
        ? 'text/csv'
        : extension === 'txt'
          ? 'text/plain'
          : extension === 'pdf'
            ? 'application/pdf'
            : 'application/octet-stream'
  );
  try {
    const blob = await upload(`temporary/${tool}/${crypto.randomUUID()}.${extension}`, file, {
      access: 'private',
      handleUploadUrl: '/api/tools/upload',
      clientPayload: JSON.stringify({ tool }),
      contentType,
    });
    return blob.url;
  } catch (error) {
    if (error instanceof Error && /Failed to\s+retrieve the client token/i.test(error.message)) {
      throw new Error(
        'Le téléversement ne peut pas obtenir de jeton Vercel Blob. Vérifie qu’un Blob Store est associé au projet et que BLOB_READ_WRITE_TOKEN est configuré pour cet environnement Vercel, puis redéploie.',
      );
    }
    throw error;
  }
}

export async function postConversion(endpoint: string, payload: unknown): Promise<Response> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (response.ok) return response;

  let message: string | undefined;
  try {
    const errorPayload = await response.json() as { error?: unknown };
    if (typeof errorPayload.error === 'string') message = errorPayload.error;
  } catch {
    message = undefined;
  }
  throw new Error(message || 'La conversion a échoué.');
}

export async function cleanUpConversionFiles(tool: ConversionUploadTool, urls: string[]): Promise<void> {
  if (!urls.length) return;
  const response = await fetch('/api/tools/upload', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, urls }),
  });
  if (!response.ok) {
    console.error('Impossible de supprimer un fichier temporaire de conversion.');
  }
}
