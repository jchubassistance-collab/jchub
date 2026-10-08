import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { subscriptionExpiry, type SubscriptionTier } from '@/lib/subscription';
import { timingSafeEqual } from 'node:crypto';
import { reportUserError } from '@/lib/user-error';

function hasValidWebhookSecret(request: NextRequest): boolean {
  const expected = process.env.MTN_WEBHOOK_SECRET?.trim();
  if (!expected) return false;
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
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 64 * 1024) return NextResponse.json({ received: false, error: 'Requête invalide.' }, { status: 413 });
    if (!hasValidWebhookSecret(request)) {
      return NextResponse.json({ received: false, error: 'Webhook non autorisé.' }, { status: 401 });
    }
    const adminDb = getAdminDb();
    const body = await request.json().catch(() => ({}));

    const status = normalizeStatus(body.status ?? body.state ?? body.transactionStatus ?? body.resultCode ?? body.data?.status);
    const reference = String(body.reference ?? body.externalId ?? body.transactionId ?? body.data?.reference ?? body.data?.transactionId ?? body.id ?? '');

    if (!/^[A-Za-z0-9_-]{8,100}$/.test(reference)) {
      return NextResponse.json({ received: false, error: 'reference MTN manquante' }, { status: 400 });
    }

    const paymentRef = adminDb.collection('payments').doc(reference);
    const paymentSnapshot = await paymentRef.get();
    const paymentData = paymentSnapshot.data();
    if (!paymentSnapshot.exists || paymentData?.provider !== 'mtn') {
      return NextResponse.json({ received: false, error: 'Transaction inconnue.' }, { status: 404 });
    }
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

    const userId = paymentData.userId;
    if (!userId) {
      return NextResponse.json({ received: false, error: 'userId manquant' }, { status: 400 });
    }

    const isSuccessful = ['SUCCESS', 'SUCCESSFUL', 'COMPLETED', 'PAID'].includes(status);
    const isPending = ['PENDING', 'PROCESSING', 'ACCEPTED'].includes(status);
    const isFailed = ['FAILED', 'REJECTED', 'CANCELLED', 'DECLINED'].includes(status);
    if (!isSuccessful && !isPending && !isFailed) {
      return NextResponse.json({ received: false, error: 'Statut invalide.' }, { status: 400 });
    }
    if (!isSuccessful) {
      if (isFailed) {
        await paymentRef.set({ status: 'failed', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        return NextResponse.json({ received: true, status: 'FAILED' });
      }
      await paymentRef.set({
        status: 'pending',
        provider: 'mtn',
        reference,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      return NextResponse.json({ received: true, status: 'PENDING' });
    }

    const plan = paymentData.plan || paymentData.tier;
    const bookSlug = paymentData.bookSlug;
    const amount = Number(body.amount ?? body.data?.amount);
    if (Number.isFinite(amount) && amount > 0 && amount !== Number(paymentData.amount)) {
      return NextResponse.json({ received: false, error: 'Montant invalide.' }, { status: 400 });
    }

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

    return NextResponse.json({ received: false, error: 'Type de paiement inconnu.' }, { status: 400 });
  } catch (error: any) {
    reportUserError();
    return NextResponse.json({ received: false, error: 'Erreur temporaire du webhook.' }, { status: 500 });
  }
}
