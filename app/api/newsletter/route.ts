import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { reportUserError } from '@/lib/user-error';

const newsletterSchema = z.object({
  email: z.string().trim().email().max(254),
  turnstileToken: z.string().max(4096).optional(),
}).strict();

function getRequiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variable ${name} manquante`);
  return value;
}

export async function POST(request: NextRequest) {
  try {
    if (!hasFirebaseAdminConfig()) {
      return NextResponse.json(
        { error: 'Le service newsletter est temporairement indisponible.' },
        { status: 503 }
      );
    }

    const adminDb = getAdminDb();

    const parsedBody = newsletterSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Adresse e-mail invalide.' },
        { status: 400 }
      );
    }
    if (!await verifyTurnstileToken(parsedBody.data.turnstileToken, request)) {
      return NextResponse.json({ error: 'Vérification anti-abus échouée. Réessaie.' }, { status: 403 });
    }
    const normalizedEmail = parsedBody.data.email.toLowerCase();

    const subscriberRef = adminDb
      .collection('newsletter_subscribers')
      .doc(normalizedEmail);
    const existingSubscriber = await subscriberRef.get();
    const shouldSendWelcome = !existingSubscriber.exists || existingSubscriber.data()?.status !== 'active';

    await subscriberRef.set(
      {
        email: normalizedEmail,
        status: 'pending',
        brevoStatus: 'pending',
        subscribedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const listId = Number(getRequiredEnvironment('BREVO_NEWSLETTER_LIST_ID'));
    if (!Number.isInteger(listId) || listId < 1) {
      throw new Error('BREVO_LIST_ID invalide');
    }

    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': getRequiredEnvironment('BREVO_API_KEY'),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: normalizedEmail,
        listIds: [listId],
        updateEnabled: true,
      }),
      cache: 'no-store',
    });

    if (!brevoResponse.ok) {
      const brevoError = await brevoResponse.text();
      reportUserError();
      await subscriberRef.update({
        status: 'pending',
        brevoStatus: 'failed',
        brevoError: `Brevo ${brevoResponse.status}`,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({
        success: true,
        warning: 'Inscription enregistrée. La synchronisation newsletter sera retentée prochainement.',
      }, { status: 202 });
    }

    await subscriberRef.update({
      status: 'active',
      brevoStatus: 'subscribed',
      brevoError: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (!shouldSendWelcome) {
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    const senderEmail = getRequiredEnvironment('BREVO_SENDER_EMAIL');
    const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'JcHub';
    const confirmationResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': getRequiredEnvironment('BREVO_API_KEY'),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: normalizedEmail }],
        subject: 'Bienvenue dans la newsletter JcHub',
        textContent: `Bonjour,\n\nTon inscription à la newsletter JcHub est confirmée.\nTu recevras nos nouveaux outils et articles directement par email.\n\nÀ bientôt,\nL’équipe JcHub`,
      }),
      cache: 'no-store',
    });

    if (!confirmationResponse.ok) {
      reportUserError();
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    reportUserError();

    return NextResponse.json(
      {
        error:
          'Impossible de t’inscrire pour le moment.',
      },
      {
        status: 500,
      }
    );
  }
}