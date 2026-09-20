// app/api/checkout/route.ts — Initie un paiement MTN MoMo
import { NextRequest, NextResponse } from 'next/server';
import { generateTransactionId, initiateMtnPayment } from '@/lib/mtn';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { plans } from '@/lib/pricing';
import { z } from 'zod';

const checkoutSchema = z.object({
  plan: z.enum(['day', 'monthly', 'yearly', 'lifetime']),
  paymentMethod: z.literal('MTN_MOMO'),
  customerPhone: z.string().trim().regex(/^242[0-9]{9}$/),
}).strict();

export async function POST(req: NextRequest) {
  try {
    const parsedBody = checkoutSchema.safeParse(await req.json().catch(() => null));
    if (!parsedBody.success) return NextResponse.json({ error: 'Données de paiement invalides.' }, { status: 400 });
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return NextResponse.json({ error: 'Connecte-toi avant de t’abonner.' }, { status: 401 });
    const authenticatedUser = await getAdminAuth().verifyIdToken(token);
    const { plan, customerPhone } = parsedBody.data;

    // Le prix vient toujours du catalogue serveur, jamais du navigateur.
    let amount = 0;
    let description = '';

    const selectedPlan = plans.find((item) => item.id === plan);
    if (selectedPlan && ['day', 'monthly', 'yearly', 'lifetime'].includes(selectedPlan.id)) {
      amount = selectedPlan.priceXAF;
      description = `JcHub+ Abonnement ${selectedPlan.name}`;
    } else {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 });
    }

    // Validation du numéro Congo pour MTN MoMo.
    const phoneRegex = /^242[0-9]{9}$/;
    if (!phoneRegex.test(customerPhone)) {
      return NextResponse.json(
        { error: 'Numéro invalide. Format attendu : 242XXXXXXXX' },
        { status: 400 }
      );
    }

    const transactionId = generateTransactionId('JCH');
    const normalizedPhone = customerPhone;

    await getAdminDb().collection('payments').doc(transactionId).set({
      userId: authenticatedUser.uid,
      tier: plan,
      amount,
      currency: 'XAF',
      status: 'pending',
      provider: 'mtn',
      paymentMethod: 'mtn',
      plan,
      createdAt: FieldValue.serverTimestamp(),
    });
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev';

    const payment = await initiateMtnPayment({
      amount: Math.round(amount),
      phone: normalizedPhone,
      transactionId,
      description,
      metadata: { userId: authenticatedUser.uid, plan },
    });

    if (!payment.success) {
      await getAdminDb().collection('payments').doc(transactionId).update({ status: 'failed', error: payment.error || 'MTN indisponible', updatedAt: FieldValue.serverTimestamp() });
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
