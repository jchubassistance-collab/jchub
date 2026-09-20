import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { z } from 'zod';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { reportUserError } from '@/lib/user-error';

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(5000),
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
      return NextResponse.json({ error: 'Le service de contact est temporairement indisponible.' }, { status: 503 });
    }

    const parsedBody = contactSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Vérifie les champs du formulaire.' }, { status: 400 });
    }
    if (!await verifyTurnstileToken(parsedBody.data.turnstileToken, request)) {
      return NextResponse.json({ error: 'Vérification anti-abus échouée. Réessaie.' }, { status: 403 });
    }
    const { name, subject, message } = parsedBody.data;
    const email = parsedBody.data.email.toLowerCase();

    const notificationEmail = getRequiredEnvironment('CONTACT_NOTIFICATION_EMAIL');
    const senderEmail = getRequiredEnvironment('BREVO_SENDER_EMAIL');
    const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'JcHub';
    const subjectLabel = subject.replace(/[-_]/g, ' ');

    const messageRef = await getAdminDb().collection('contact_messages').add({
      name,
      email,
      subject,
      message,
      status: 'new',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const sendEmail = (payload: Record<string, unknown>) => fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': getRequiredEnvironment('BREVO_API_KEY'),
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const notificationResponse = await sendEmail({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: notificationEmail }],
      replyTo: { email, name },
      subject: `[JcHub] ${subjectLabel}`,
      textContent: `Nouveau message de contact\n\nNom : ${name}\nEmail : ${email}\nSujet : ${subjectLabel}\n\n${message}`,
    });

    if (!notificationResponse.ok) {
      const brevoError = await notificationResponse.text();
      reportUserError();
      await messageRef.update({
        notificationStatus: 'failed',
        notificationError: `Brevo ${notificationResponse.status}`,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({
        success: true,
        warning: 'Message enregistré. La notification email sera renvoyée dès que le service sera disponible.',
      }, { status: 202 });
    }

    const confirmationResponse = await sendEmail({
      sender: { email: senderEmail, name: senderName },
      to: [{ email, name }],
      replyTo: { email: notificationEmail, name: senderName },
      subject: 'Nous avons bien reçu ton message - JcHub',
      textContent: `Bonjour ${name},\n\nNous avons bien reçu ton message concernant « ${subjectLabel} ». Notre équipe reviendra vers toi sous 24h ouvrées.\n\nÀ bientôt,\nL’équipe JcHub`,
    });

    if (!confirmationResponse.ok) {
      reportUserError();
    }

    await messageRef.update({
      notificationStatus: 'sent',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    reportUserError();
    return NextResponse.json({ error: 'Impossible d’envoyer ton message pour le moment.' }, { status: 500 });
  }
}