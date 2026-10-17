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

    // No confirmation email to the address typed in the form: anyone could otherwise make
    // JcHub mail arbitrary inboxes with their own text, burning the Brevo sender reputation.
    // The form shows the confirmation on screen instead.
    const [notificationResult] = await Promise.allSettled([
      sendEmail({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: notificationEmail }],
        replyTo: { email, name },
        subject: `[JcHub] ${subjectLabel}`,
        textContent: `Nouveau message de contact\n\nNom : ${name}\nEmail : ${email}\nSujet : ${subjectLabel}\n\n${message}`,
      }),
    ]);

    const notificationSent = notificationResult.status === 'fulfilled' && notificationResult.value.ok;
    if (!notificationSent) {
      const detail = notificationResult.status === 'fulfilled'
        ? await notificationResult.value.text().then((body) => `Notification Brevo ${notificationResult.value.status}: ${body.slice(0, 500)}`)
        : `Notification erreur réseau: ${String(notificationResult.reason).slice(0, 300)}`;
      console.error('Contact email delivery failed:', detail);
      reportUserError();
    }

    await messageRef.update({
      notificationStatus: notificationSent ? 'sent' : 'failed',
      ...(!notificationSent ? { notificationError: 'Échec de livraison Brevo' } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // The message is stored either way and appears in the admin inbox.
    return NextResponse.json({ success: true }, { status: notificationSent ? 200 : 202 });
  } catch (error) {
    reportUserError();
    return NextResponse.json({ error: 'Impossible d’envoyer ton message pour le moment.' }, { status: 500 });
  }
}
