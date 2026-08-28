import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!name || name.length > 120 || !emailPattern.test(email) || email.length > 254 || !subject || subject.length > 80 || !message || message.length > 5000) {
      return NextResponse.json({ error: 'Vérifie les champs du formulaire.' }, { status: 400 });
    }

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
      console.error('Erreur Brevo contact:', notificationResponse.status, brevoError);
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
      console.warn('Accusé de réception Brevo non envoyé:', confirmationResponse.status, await confirmationResponse.text());
    }

    await messageRef.update({
      notificationStatus: 'sent',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur formulaire contact:', error);
    return NextResponse.json({ error: 'Impossible d’envoyer ton message pour le moment.' }, { status: 500 });
  }
}