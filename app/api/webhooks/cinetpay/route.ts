// app/api/webhooks/cinetpay/route.ts — Reçoit les notifications CinetPay

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';

import { verifyPayment } from '@/lib/payment';
import { getAdminDb } from '@/lib/firebase-admin';
import { subscriptionExpiry, type SubscriptionTier } from '@/lib/subscription';

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb();

    // ============================================================
    // 1. RÉCUPÉRER LA NOTIFICATION CINETPAY
    // ============================================================

    const body = await req.json();

    const {
      cpm_trans_id,
      cpm_result,
      cpm_custom,
    } = body;

    if (!cpm_trans_id) {
      return NextResponse.json(
        {
          received: false,
          error: 'cpm_trans_id manquant',
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 2. VÉRIFIER LE PAIEMENT AUPRÈS DE CINETPAY
    // ============================================================

    const verification = await verifyPayment(cpm_trans_id);

    if (verification.status !== 'ACCEPTED') {
      return NextResponse.json({
        received: true,
        status: verification.status,
      });
    }

    // ============================================================
    // 3. RÉCUPÉRER LES METADATA
    // ============================================================

    let metadata: {
      userId?: string;
      plan?: string;
      bookSlug?: string;
    } = {};

    try {
      if (typeof cpm_custom === 'string') {
        metadata = JSON.parse(cpm_custom);
      } else if (
        cpm_custom &&
        typeof cpm_custom === 'object'
      ) {
        metadata = cpm_custom;
      }
    } catch (error) {
      console.error(
        'Erreur parsing cpm_custom:',
        error
      );

      return NextResponse.json(
        {
          received: false,
          error: 'Metadata CinetPay invalide',
        },
        { status: 400 }
      );
    }

    const {
      userId,
      plan,
      bookSlug,
    } = metadata;

    const paymentRef = adminDb.collection('payments').doc(cpm_trans_id);
    const paymentSnapshot = await paymentRef.get();
    if (paymentSnapshot.exists && paymentSnapshot.data()?.status === 'success') {
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    // ============================================================
    // 4. VÉRIFIER L'UTILISATEUR
    // ============================================================

    if (!userId) {
      return NextResponse.json(
        {
          received: false,
          error: 'userId manquant',
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 5. ABONNEMENT JCHUB+
    // ============================================================

    if (plan === 'day' || plan === 'monthly' || plan === 'yearly' || plan === 'lifetime') {
      const tier = plan as SubscriptionTier;
      const userRef = adminDb.collection('users').doc(userId);
      const userSnapshot = await userRef.get();
      const currentExpiresAt = userSnapshot.data()?.subscription?.expiresAt?.toDate?.() as Date | undefined;
      const start = currentExpiresAt && currentExpiresAt > new Date() ? currentExpiresAt : new Date();
      await paymentRef.set({ status: 'success', userId, tier, completedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      await userRef.set({
        subscription: {
          tier,
          status: 'active',
          startedAt: FieldValue.serverTimestamp(),
          expiresAt: subscriptionExpiry(tier, start),
          autoRenew: false,
          paymentMethod: verification.paymentMethod?.toLowerCase().includes('airtel') ? 'airtel' : 'mtn',
          lastPaymentId: cpm_trans_id,
          cancelAt: null,
        },
        isPremium: true,
        premiumPlan: plan,
        premiumUntil: subscriptionExpiry(tier, start),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      return NextResponse.json({
        received: true,
        status: 'ACCEPTED',
        type: 'subscription',
        plan,
      });
    }

    // ============================================================
    // 6. ACHAT D'UN LIVRE AUDIO
    // ============================================================

    if (
      plan === 'book' &&
      bookSlug
    ) {
      const userRef = adminDb
        .collection('users')
        .doc(userId);

      await paymentRef.set({ status: 'success', userId, tier: 'free', completedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });

      // ----------------------------------------------------------
      // Enregistrer l'achat dans purchasedBooks
      // ----------------------------------------------------------

      await userRef
        .collection('purchasedBooks')
        .doc(bookSlug)
        .set({
          bookSlug,
          purchasedAt: new Date(),
          transactionId: cpm_trans_id,
          paymentMethod:
            verification.paymentMethod || null,
        });

      // ----------------------------------------------------------
      // Ajouter le livre dans purchases
      // ----------------------------------------------------------

      await userRef.update({
        purchases: FieldValue.arrayUnion(
          bookSlug
        ),
        updatedAt: new Date(),
      });

      return NextResponse.json({
        received: true,
        status: 'ACCEPTED',
        type: 'book',
        bookSlug,
      });
    }

    // ============================================================
    // 7. PLAN INCONNU
    // ============================================================

    console.warn(
      'Paiement accepté mais plan inconnu:',
      {
        userId,
        plan,
        bookSlug,
        transactionId: cpm_trans_id,
      }
    );

    return NextResponse.json({
      received: true,
      status: 'ACCEPTED',
      warning: 'Type de paiement inconnu',
    });
  } catch (error: any) {
    console.error(
      'Erreur webhook CinetPay:',
      error
    );

    return NextResponse.json(
      {
        received: false,
        error:
          error?.message ||
          'Erreur webhook CinetPay',
      },
      { status: 500 }
    );
  }
}