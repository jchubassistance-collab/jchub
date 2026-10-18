import { apiMessage } from '@/lib/api-messages';
import 'server-only';

import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { reportUserError } from '@/lib/user-error';

/** Only read client IP headers that the hosting ingress is expected to overwrite. */
function getTrustedClientIp(request: NextRequest) {
  return request.headers.get('cf-connecting-ip')?.trim() || request.headers.get('x-real-ip')?.trim() ||
    (process.env.NODE_ENV !== 'production' ? 'local-development' : '');
}

/** Distributed Firestore fixed-window limiter. It stores only a one-way IP hash. */
export async function enforceRateLimit(
  request: NextRequest,
  key: string,
  limit: number,
  windowMs: number,
): Promise<NextResponse | null> {
  const ip = getTrustedClientIp(request);
  if (!ip) return NextResponse.json({ error: apiMessage(request, 'Service temporairement indisponible.') }, { status: 503 });
  if (!hasFirebaseAdminConfig()) {
    return process.env.NODE_ENV === 'production'
      ? NextResponse.json({ error: apiMessage(request, 'Service temporairement indisponible.') }, { status: 503 })
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
    return NextResponse.json({ error: apiMessage(request, 'Trop de demandes. Réessaie dans quelques instants.') }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(windowMs / 1000)) },
    });
  } catch {
    return NextResponse.json({ error: apiMessage(request, 'Service temporairement indisponible.') }, { status: 503 });
  }
}

/** Daily quota for public AI tool discovery; only a one-way IP hash is stored. */
export async function enforceDailyToolAssistantQuota(request: NextRequest): Promise<NextResponse | null> {
  const ip = getTrustedClientIp(request);
  if (!ip) return NextResponse.json({ error: apiMessage(request, 'Service temporairement indisponible.') }, { status: 503 });
  if (!hasFirebaseAdminConfig()) {
    return process.env.NODE_ENV === 'production'
      ? NextResponse.json({ error: apiMessage(request, 'Service temporairement indisponible.') }, { status: 503 })
      : null;
  }

  try {
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const id = createHash('sha256').update(`tool-assistant:${day}:${ip}`).digest('hex');
    const ref = getAdminDb().collection('_dailyAiQuotas').doc(id);
    const allowed = await getAdminDb().runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      const count = Number(snapshot.data()?.count || 0);
      if (count >= 5) return false;
      tx.set(ref, { day, count: count + 1, expiresAt: new Date(now.getTime() + 2 * 86400_000), updatedAt: FieldValue.serverTimestamp() });
      return true;
    });
    if (allowed) return null;
    const tomorrow = new Date(`${day}T00:00:00.000Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return NextResponse.json({ error: apiMessage(request, 'Tu as utilisé tes 5 recherches assistées du jour. Reviens demain 🙂') }, {
      status: 429,
      headers: { 'Retry-After': String(Math.max(1, Math.ceil((tomorrow.getTime() - now.getTime()) / 1000))) },
    });
  } catch {
    reportUserError();
    return NextResponse.json({ error: apiMessage(request, 'Service temporairement indisponible.') }, { status: 503 });
  }
}

/** Daily per-tool Firestore quota. Only a one-way hash of the client IP is stored. */
export async function enforceDailyConversionQuota(
  request: NextRequest,
  tool: string,
): Promise<NextResponse | null> {
  const ip = getTrustedClientIp(request);

  if (!ip) return NextResponse.json({ error: apiMessage(request, 'Service temporairement indisponible.') }, { status: 503 });
  if (!hasFirebaseAdminConfig()) {
    return process.env.NODE_ENV === 'production'
      ? NextResponse.json({ error: apiMessage(request, 'Service temporairement indisponible.') }, { status: 503 })
      : null;
  }

  try {
    const id = createHash('sha256').update(`daily-conversion:${tool}:${ip}`).digest('hex');
    const ref = getAdminDb().collection('_dailyConversionQuotas').doc(id);
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const result = await getAdminDb().runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      const data = snapshot.data();
      const count = data?.day === day ? Number(data.count || 0) : 0;
      if (count >= 5) return { allowed: false };

      tx.set(ref, { day, count: count + 1, updatedAt: FieldValue.serverTimestamp() });
      return { allowed: true };
    });

    if (result.allowed) return null;

    const nextDay = new Date(`${day}T00:00:00.000Z`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const retryAfter = Math.max(1, Math.ceil((nextDay.getTime() - now.getTime()) / 1000));
    return NextResponse.json(
      { error: apiMessage(request, 'Limite atteinte : 5 conversions par outil et par jour. Réessaie demain.') },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  } catch {
    reportUserError();
    return NextResponse.json({ error: apiMessage(request, 'Service temporairement indisponible.') }, { status: 503 });
  }
}
