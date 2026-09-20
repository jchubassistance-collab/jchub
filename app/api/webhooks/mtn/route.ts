import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { subscriptionExpiry, type SubscriptionTier } from '@/lib/subscription';
import { timingSafeEqual } from 'node:crypto';
import { reportUserError } from '@/lib/user-error';

function hasValidWebhookSecret(request: NextRequest): boolean {
  const expected = process.env.MTN_WEBHOOK_SECRET?.trim();
  if (!expected) return true;
  const received = request.headers.get('x-mtn-webhook-secret') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!received) return false;
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes);
}

function normalizeStatus(value: unknown): string {
  if (typeof value === 'string') return value.toUpperCase();
  if (typeof value === 'number') return String(value);
  return '';
}

export async function POST(request: NextRequest) {
  try {
    if (!hasValidWebhookSecret(request)) {
      return NextResponse.json({ received: false, error: 'Webhook non autorisé.' }, { status: 401 });
    }
    const adminDb = getAdminDb();
    const body = await request.json().catch(() => ({}));

    const status = normalizeStatus(body.status ?? body.state ?? body.transactionStatus ?? body.resultCode ?? body.data?.status);
    const reference = String(body.reference ?? body.externalId ?? body.transactionId ?? body.data?.reference ?? body.data?.transactionId ?? body.id ?? '');

    if (!reference) {
      return NextResponse.json({ received: false, error: 'reference MTN manquante' }, { status: 400 });
    }

    const paymentRef = adminDb.collection('payments').doc(reference);
    const paymentSnapshot = await paymentRef.get();
    const paymentData = paymentSnapshot.data();
    if (paymentData?.status === 'success') {
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    const metadataInput = body.metadata ?? body.data?.metadata ?? body.cpm_custom ?? {};
    let metadata: { userId?: string; plan?: string; bookSlug?: string } = {};

    try {
      metadata = typeof metadataInput === 'string' ? JSON.parse(metadataInput) : metadataInput;
    } catch {
      metadata = {};
    }

    // MTN ne renvoie pas toujours les metadata de requesttopay. La transaction
    // créée avant l'appel contient donc la source de vérité côté serveur.
    metadata = {
      userId: metadata.userId || paymentData?.userId,
      plan: metadata.plan || paymentData?.plan || paymentData?.tier,
      bookSlug: metadata.bookSlug || paymentData?.bookSlug,
    };

    const userId = metadata.userId || body.userId || body.data?.userId;
    if (!userId) {
      return NextResponse.json({ received: false, error: 'userId manquant' }, { status: 400 });
    }

    const isSuccessful = ['SUCCESS', 'SUCCESSFUL', 'COMPLETED', 'PAID'].includes(status);
    if (!isSuccessful) {
      await paymentRef.set({
        userId,
        status: 'pending',
        provider: 'mtn',
        reference,
        raw: body,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      return NextResponse.json({ received: true, status: 'PENDING' });
    }

    const plan = metadata.plan || body.plan || body.data?.plan;
    const bookSlug = metadata.bookSlug || body.bookSlug || body.data?.bookSlug;

    if (plan === 'day' || plan === 'monthly' || plan === 'yearly' || plan === 'lifetime') {
      const tier = plan as SubscriptionTier;
      const userRef = adminDb.collection('users').doc(userId);
      const userSnapshot = await userRef.get();
      const currentExpiresAt = userSnapshot.data()?.subscription?.expiresAt?.toDate?.() as Date | undefined;
      const start = currentExpiresAt && currentExpiresAt > new Date() ? currentExpiresAt : new Date();

      await paymentRef.set({
        status: 'success',
        userId,
        provider: 'mtn',
        tier,
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        raw: body,
      }, { merge: true });

      await userRef.set({
        subscription: {
          tier,
          status: 'active',
          startedAt: FieldValue.serverTimestamp(),
          expiresAt: subscriptionExpiry(tier, start),
          autoRenew: false,
          paymentMethod: 'mtn',
          lastPaymentId: reference,
          cancelAt: null,
        },
        isPremium: true,
        premiumPlan: plan,
        premiumUntil: subscriptionExpiry(tier, start),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      return NextResponse.json({ received: true, status: 'SUCCESS', type: 'subscription', plan });
    }

    if (plan === 'book' && bookSlug) {
      const userRef = adminDb.collection('users').doc(userId);
      await paymentRef.set({
        status: 'success',
        userId,
        provider: 'mtn',
        tier: 'free',
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        raw: body,
      }, { merge: true });

      await userRef.collection('purchasedBooks').doc(bookSlug).set({
        bookSlug,
        purchasedAt: new Date(),
        transactionId: reference,
        paymentMethod: 'mtn',
      });

      await userRef.update({
        purchases: FieldValue.arrayUnion(bookSlug),
        updatedAt: new Date(),
      });

      return NextResponse.json({ received: true, status: 'SUCCESS', type: 'book', bookSlug });
    }

    await paymentRef.set({
      status: 'success',
      userId,
      provider: 'mtn',
      raw: body,
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ received: true, status: 'SUCCESS', warning: 'Type de paiement inconnu' });
  } catch (error: any) {
    reportUserError();
    return NextResponse.json({ received: false, error: error?.message || 'Erreur webhook MTN' }, { status: 500 });
  }
}
