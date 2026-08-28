import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyMtnPayment } from '@/lib/mtn';
import { subscriptionExpiry, type SubscriptionTier } from '@/lib/subscription';

async function completePayment(reference: string, data: FirebaseFirestore.DocumentData) {
  const adminDb = getAdminDb();
  const userId = data.userId as string | undefined;
  const plan = data.plan as string | undefined;
  if (!userId || !plan) return;

  const paymentRef = adminDb.collection('payments').doc(reference);
  if ((await paymentRef.get()).data()?.status === 'success') return;

  if (['day', 'monthly', 'yearly', 'lifetime'].includes(plan)) {
    const tier = plan as SubscriptionTier;
    const userRef = adminDb.collection('users').doc(userId);
    const userSnapshot = await userRef.get();
    const currentExpiresAt = userSnapshot.data()?.subscription?.expiresAt?.toDate?.() as Date | undefined;
    const start = currentExpiresAt && currentExpiresAt > new Date() ? currentExpiresAt : new Date();
    const expiresAt = subscriptionExpiry(tier, start);

    await paymentRef.set({ status: 'success', provider: 'mtn', completedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await userRef.set({
      subscription: { tier, status: 'active', startedAt: FieldValue.serverTimestamp(), expiresAt, autoRenew: false, paymentMethod: 'mtn', lastPaymentId: reference, cancelAt: null },
      isPremium: true,
      premiumPlan: plan,
      premiumUntil: expiresAt,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return;
  }

  if (plan === 'book' && data.bookSlug) {
    const userRef = adminDb.collection('users').doc(userId);
    await paymentRef.set({ status: 'success', provider: 'mtn', completedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await userRef.collection('purchasedBooks').doc(data.bookSlug).set({ bookSlug: data.bookSlug, purchasedAt: new Date(), transactionId: reference, paymentMethod: 'mtn' });
    await userRef.set({ purchases: FieldValue.arrayUnion(data.bookSlug), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }
}

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get('reference')?.trim();
  if (!reference) return NextResponse.json({ status: 'FAILED', error: 'Référence manquante' }, { status: 400 });

  const payment = await getAdminDb().collection('payments').doc(reference).get();
  if (!payment.exists) return NextResponse.json({ status: 'FAILED', error: 'Transaction introuvable' }, { status: 404 });

  const storedStatus = payment.data()?.status;
  if (storedStatus === 'success') return NextResponse.json({ status: 'SUCCESS' });
  if (storedStatus === 'failed') return NextResponse.json({ status: 'FAILED' });

  const verification = await verifyMtnPayment(reference);
  const status = verification.status.toUpperCase();
  if (['SUCCESSFUL', 'SUCCESS', 'COMPLETED', 'PAID'].includes(status)) {
    await completePayment(reference, payment.data() || {});
    return NextResponse.json({ status: 'SUCCESS' });
  }
  if (['FAILED', 'REJECTED', 'CANCELLED', 'DECLINED'].includes(status)) {
    return NextResponse.json({ status: 'FAILED' });
  }
  return NextResponse.json({ status: 'PENDING' });
}