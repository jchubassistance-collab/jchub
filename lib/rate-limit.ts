import 'server-only';

import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';

/** Distributed Firestore fixed-window limiter. It stores only a one-way IP hash. */
export async function enforceRateLimit(
  request: NextRequest,
  key: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') ||
    (process.env.NODE_ENV !== 'production' ? 'local-development' : '');
  if (!ip) return NextResponse.json({ error: 'Service temporairement indisponible.' }, { status: 503 });
  if (!hasFirebaseAdminConfig()) {
    return process.env.NODE_ENV === 'production'
      ? NextResponse.json({ error: 'Service temporairement indisponible.' }, { status: 503 })
      : null;
  }

  try {
    const id = createHash('sha256').update(`${key}:${ip}`).digest('hex');
    const ref = getAdminDb().collection('_rateLimits').doc(id);
    const now = Date.now();
    const allowed = await getAdminDb().runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      const data = snapshot.data();
      const start = data?.windowStartedAt?.toMillis?.() ?? 0;
      const count = start + windowMs > now ? Number(data?.count || 0) : 0;
      if (count >= limit) return false;
      tx.set(ref, {
        windowStartedAt: count && data ? data.windowStartedAt : new Date(now),
        count: count + 1,
        expiresAt: new Date(now + windowMs * 2),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return true;
    });
    if (allowed) return null;
    return NextResponse.json({ error: 'Trop de demandes. Réessaie dans quelques instants.' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(windowMs / 1000)) },
    });
  } catch {
    return NextResponse.json({ error: 'Service temporairement indisponible.' }, { status: 503 });
  }
}
