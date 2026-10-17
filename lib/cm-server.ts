import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import type { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export function requireSameOrigin(request: NextRequest) {
  if (!request.headers.get('origin') || request.headers.get('origin') !== request.nextUrl.origin) {
    throw new Error('CSRF');
  }
}

export async function writeCmActivity(uid: string, action: string, itemId: string) {
  await getAdminDb().collection('cmActivity').add({ uid, action, itemId, createdAt: FieldValue.serverTimestamp() });
}

export function cmError(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  const status = code === 'UNAUTHORIZED' ? 401 : code === 'FORBIDDEN' || code === 'CSRF' ? 403 : 400;
  return Response.json({ error: status === 401 ? 'Session invalide.' : status === 403 ? 'Accès refusé.' : 'Données invalides ou opération impossible.' }, { status, headers: { 'Cache-Control': 'no-store' } });
}
