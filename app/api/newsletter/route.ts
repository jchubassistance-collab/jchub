import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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

    const { email } = await request.json();

    const normalizedEmail =
      typeof email === 'string'
        ? email.trim().toLowerCase()
        : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Adresse e-mail invalide.' },
        { status: 400 }
      );
    }

    const subscriberRef = adminDb
      .collection('newsletter_subscribers')
      .doc(normalizedEmail);

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
      console.error('Erreur Brevo newsletter:', brevoResponse.status, brevoError);
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

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      'Erreur inscription newsletter:',
      error
    );

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