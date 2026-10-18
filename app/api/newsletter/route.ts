import { apiMessage } from '@/lib/api-messages';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { reportUserError } from '@/lib/user-error';
import { enforceRateLimit } from '@/lib/rate-limit';
import { newsletterListId } from '@/lib/brevo';
import { requestLocale } from '@/i18n/request-locale';

const WELCOME_EMAIL = {
  fr: {
    subject: 'Bienvenue dans la newsletter JcHub',
    text: `Bonjour,\n\nTon inscription à la newsletter JcHub est confirmée.\nTu recevras nos nouveaux outils et articles directement par email.\n\nÀ bientôt,\nL’équipe JcHub`,
  },
  en: {
    subject: 'Welcome to the JcHub newsletter',
    text: `Hello,\n\nYour subscription to the JcHub newsletter is confirmed.\nYou will receive our new tools and articles straight to your inbox.\n\nSee you soon,\nThe JcHub team`,
  },
};

const newsletterSchema = z.object({
  email: z.string().trim().email().max(254),
});

function getRequiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variable ${name} manquante`);
  return value;
}

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'newsletter', 3, 10 * 60_000);
  if (limited) return limited;
  try {
    if (!hasFirebaseAdminConfig()) {
      return NextResponse.json(
        { error: apiMessage(request, 'Le service newsletter est temporairement indisponible.') },
        { status: 503 }
      );
    }

    const adminDb = getAdminDb();

    const parsedBody = newsletterSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: apiMessage(request, 'Adresse e-mail invalide.') },
        { status: 400 }
      );
    }
    const normalizedEmail = parsedBody.data.email.toLowerCase();
    const locale = requestLocale(request);

    const subscriberRef = adminDb
      .collection('newsletter_subscribers')
      .doc(normalizedEmail);
    const existingSubscriber = await subscriberRef.get();
    const shouldSendWelcome = !existingSubscriber.exists || existingSubscriber.data()?.status !== 'active';

    await subscriberRef.set(
      {
        email: normalizedEmail,
        locale,
        status: 'pending',
        brevoStatus: 'pending',
        subscribedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    getRequiredEnvironment('BREVO_NEWSLETTER_LIST_ID');
    // English subscribers join the English list when it exists, the French one otherwise.
    const listId = newsletterListId(locale) ?? newsletterListId('fr');
    if (listId === null) {
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
        warning: apiMessage(request, 'Inscription enregistrée. La synchronisation newsletter sera retentée prochainement.'),
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
        subject: WELCOME_EMAIL[locale].subject,
        textContent: WELCOME_EMAIL[locale].text,
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
