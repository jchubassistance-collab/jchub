// app/api/checkout/route.ts — Initie un paiement CinetPay ou MTN MoMo
import { NextRequest, NextResponse } from 'next/server';
import { initiatePayment, generateTransactionId, PaymentMethod } from '@/lib/payment';
import { initiateMtnPayment } from '@/lib/mtn';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { plans } from '@/lib/pricing';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return NextResponse.json({ error: 'Connecte-toi avant de t’abonner.' }, { status: 401 });
    const authenticatedUser = await getAdminAuth().verifyIdToken(token);
    const {
      plan,           // 'monthly' | 'yearly' | 'book'
      bookSlug,       // si achat livre
      bookPrice,      // en centimes
      paymentMethod,  // 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD'
      customerName,
      customerEmail,
      customerPhone,
      userId,
    } = body;

    // Le prix vient toujours du catalogue serveur, jamais du navigateur.
    let amount = 0;
    let description = '';

    const selectedPlan = plans.find((item) => item.id === plan);
    if (selectedPlan && ['day', 'monthly', 'yearly', 'lifetime'].includes(selectedPlan.id)) {
      amount = selectedPlan.priceXAF;
      description = `JcHub+ Abonnement ${selectedPlan.name}`;
    } else if (plan === 'monthly') {
      amount = Number(process.env.CINETPAY_PRICE_PREMIUM_MONTHLY) / 100;
      description = 'JcHub+ Abonnement mensuel';
    } else if (plan === 'yearly') {
      amount = Number(process.env.CINETPAY_PRICE_PREMIUM_YEARLY) / 100;
      description = 'JcHub+ Abonnement annuel';
    } else if (plan === 'lifetime') {
      amount = 49900;
      description = 'JcHub+ Lifetime';
    } else if (plan === 'book' && bookSlug && bookPrice) {
      amount = bookPrice;
      description = `JcHub - Livre audio : ${bookSlug}`;
    } else {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }

    if (!['MTN_MOMO', 'AIRTEL_MONEY', 'CARD'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Méthode de paiement indisponible' }, { status: 400 });
    }

    // Validation numéro Congo uniquement pour les paiements Mobile Money.
    const phoneRegex = /^242[0-9]{9}$/;
    if (['MTN_MOMO', 'AIRTEL_MONEY'].includes(paymentMethod) && (!customerPhone || !phoneRegex.test(customerPhone.replace(/\s/g, '')))) {
      return NextResponse.json(
        { error: 'Numéro invalide. Format attendu : 242XXXXXXXX' },
        { status: 400 }
      );
    }

    const transactionId = generateTransactionId('JCH');
    const normalizedPhone = customerPhone?.replace(/\s/g, '') || '000000000';

    await getAdminDb().collection('payments').doc(transactionId).set({
      userId: authenticatedUser.uid,
      tier: plan,
      amount,
      currency: 'XAF',
      status: 'pending',
      provider: paymentMethod === 'MTN_MOMO' ? 'mtn' : 'cinetpay',
      cinetPayTransactionId: paymentMethod === 'MTN_MOMO' ? null : transactionId,
      paymentMethod: paymentMethod === 'MTN_MOMO' ? 'mtn' : paymentMethod === 'AIRTEL_MONEY' ? 'airtel' : 'card',
      plan,
      bookSlug: bookSlug || null,
      createdAt: FieldValue.serverTimestamp(),
    });
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev';

    if (paymentMethod === 'MTN_MOMO') {
      const payment = await initiateMtnPayment({
        amount: Math.round(amount),
        phone: normalizedPhone,
        transactionId,
        description,
        metadata: {
          userId: authenticatedUser.uid,
          plan,
          bookSlug,
          bookPrice,
        },
      });

      if (!payment.success) {
        await getAdminDb().collection('payments').doc(transactionId).update({ status: 'failed', error: payment.error || 'MTN indisponible', updatedAt: FieldValue.serverTimestamp() });
        return NextResponse.json({ error: payment.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        paymentUrl: `${origin}/paiement/succes?tx=${transactionId}`,
        transactionId,
      });
    }

    const payment = await initiatePayment({
      amount,
      currency: 'XAF',
      transactionId,
      description,
      customerName,
      customerEmail,
      customerPhone: normalizedPhone,
      paymentMethod: paymentMethod as PaymentMethod,
      returnUrl: `${origin}/paiement/succes?tx=${transactionId}`,
      notifyUrl: `${origin}/api/webhooks/cinetpay`,
      metadata: {
        userId: authenticatedUser.uid,
        plan,
        bookSlug,
        bookPrice,
      },
    });

    if (!payment.success) {
      await getAdminDb().collection('payments').doc(transactionId).update({ status: 'failed', error: payment.error || 'CinetPay indisponible', updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ error: payment.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      paymentUrl: payment.paymentUrl,
      transactionId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
