import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { z } from 'zod';
import { reportUserError } from '@/lib/user-error';
import { enforceRateLimit } from '@/lib/rate-limit';

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(5000),
});

function getRequiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variable ${name} manquante`);
  return value;
}

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'contact', 3, 10 * 60_000);
  if (limited) return limited;
  try {
    if (!hasFirebaseAdminConfig()) {
      return NextResponse.json({ error: 'Le service de contact est temporairement indisponible.' }, { status: 503 });
    }

    const parsedBody = contactSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Vérifie les champs du formulaire.' }, { status: 400 });
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

    const apiKey = getRequiredEnvironment('BREVO_API_KEY');
    const sendEmail = (payload: Record<string, unknown>) => fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const [notificationResult, confirmationResult] = await Promise.allSettled([
      sendEmail({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: notificationEmail }],
        replyTo: { email, name },
        subject: `[JcHub] ${subjectLabel}`,
        textContent: `Nouveau message de contact\n\nNom : ${name}\nEmail : ${email}\nSujet : ${subjectLabel}\n\n${message}`,
      }),
      sendEmail({
        sender: { email: senderEmail, name: senderName },
        to: [{ email, name }],
        replyTo: { email: notificationEmail, name: senderName },
        subject: 'Nous avons bien reçu ton message - JcHub',
        textContent: `Bonjour ${name},\n\nNous avons bien reçu ton message concernant « ${subjectLabel} ». Notre équipe reviendra vers toi sous 24h ouvrées.\n\nÀ bientôt,\nL’équipe JcHub`,
      }),
    ]);

    const notificationSent = notificationResult.status === 'fulfilled' && notificationResult.value.ok;
    const confirmationSent = confirmationResult.status === 'fulfilled' && confirmationResult.value.ok;
    if (!notificationSent || !confirmationSent) {
      const details = await Promise.all([
        notificationSent ? Promise.resolve('') : notificationResult.status === 'fulfilled'
          ? notificationResult.value.text().then((body) => `Notification Brevo ${notificationResult.value.status}: ${body.slice(0, 500)}`)
          : Promise.resolve(`Notification erreur réseau: ${String(notificationResult.reason).slice(0, 300)}`),
        confirmationSent ? Promise.resolve('') : confirmationResult.status === 'fulfilled'
          ? confirmationResult.value.text().then((body) => `Confirmation Brevo ${confirmationResult.value.status}: ${body.slice(0, 500)}`)
          : Promise.resolve(`Confirmation erreur réseau: ${String(confirmationResult.reason).slice(0, 300)}`),
      ]);
      console.error('Contact email delivery failed:', details.filter(Boolean).join(' | '));
      reportUserError();
    }

    await messageRef.update({
      notificationStatus: notificationSent ? 'sent' : 'failed',
      confirmationStatus: confirmationSent ? 'sent' : 'failed',
      ...(!notificationSent ? { notificationError: 'Échec de livraison Brevo' } : {}),
      ...(!confirmationSent ? { confirmationError: 'Échec de livraison Brevo' } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      ...(!notificationSent || !confirmationSent ? {
        warning: `${notificationSent ? '' : 'La notification pour notre équipe n’a pas été envoyée. '}${confirmationSent ? '' : 'La confirmation pour toi n’a pas été envoyée.'}`.trim(),
      } : {}),
    }, { status: notificationSent && confirmationSent ? 200 : 202 });
  } catch (error) {
    reportUserError();
    return NextResponse.json({ error: 'Impossible d’envoyer ton message pour le moment.' }, { status: 500 });
  }
}
