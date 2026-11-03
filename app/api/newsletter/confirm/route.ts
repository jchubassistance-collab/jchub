import { apiMessage } from '@/lib/api-messages';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { reportUserError } from '@/lib/user-error';
import { enforceRateLimit } from '@/lib/rate-limit';
import { newsletterListId } from '@/lib/brevo';
import { confirmationTokenHash, isConfirmationToken, requiredEnvironment, sendBrevoEmail } from '@/lib/newsletter';
import { isLocale } from '@/i18n/routing';
import { withReport } from '@/lib/reports/server';

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

/**
 * Second step of the double opt-in: the confirmation page posts the token from the emailed link.
 * A POST rather than the link itself, because mail scanners open links on their own.
 */
export const POST = withReport(async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'newsletter-confirm', 10, 10 * 60_000);
  if (limited) return limited;
  const body = await request.json().catch(() => null) as { token?: unknown } | null;
  const expired = () => NextResponse.json({ error: apiMessage(request, 'Ce lien a expiré ou a déjà servi. Inscris-toi à nouveau depuis le site.') }, { status: 410 });
  if (!isConfirmationToken(body?.token)) return expired();
  if (!hasFirebaseAdminConfig()) {
    return NextResponse.json({ error: apiMessage(request, 'Le service newsletter est temporairement indisponible.') }, { status: 503 });
  }

  try {
    const snapshot = await getAdminDb().collection('newsletter_subscribers').where('confirmationTokenHash', '==', confirmationTokenHash(body.token)).limit(1).get();
    const subscriber = snapshot.docs[0];
    const data = subscriber?.data();
    const expiresAt = data?.confirmationExpiresAt?.toMillis?.() ?? 0;
    if (!subscriber || !data || expiresAt < Date.now()) return expired();

    const email = String(data.email || subscriber.id);
    const locale = isLocale(data.locale) ? data.locale : 'fr';
    // English subscribers join the English list when it exists, the French one otherwise.
    const listId = newsletterListId(locale) ?? newsletterListId('fr');
    if (listId === null) throw new Error('BREVO_LIST_ID invalide');

    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': requiredEnvironment('BREVO_API_KEY'),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ email, listIds: [listId], updateEnabled: true }),
      cache: 'no-store',
    });
    if (!brevoResponse.ok) {
      // The token is kept: the visitor can press the button again once Brevo answers.
      const brevoError = await brevoResponse.text();
      reportUserError(new Error(`Brevo a refusé l’inscription (${brevoResponse.status}) : ${brevoError.slice(0, 300)}`), { request, status: brevoResponse.status, details: { fournisseur: 'Brevo', liste: listId } });
      await subscriber.ref.update({ brevoStatus: 'failed', brevoError: `Brevo ${brevoResponse.status}`, updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ error: apiMessage(request, 'Impossible de confirmer ton inscription pour le moment. Réessaie dans quelques instants.') }, { status: 502 });
    }

    await subscriber.ref.update({
      status: 'active',
      brevoStatus: 'subscribed',
      brevoError: FieldValue.delete(),
      // Proof of consent: when the owner of the address confirmed it.
      confirmedAt: FieldValue.serverTimestamp(),
      confirmationTokenHash: FieldValue.delete(),
      confirmationExpiresAt: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const welcome = await sendBrevoEmail(email, WELCOME_EMAIL[locale].subject, WELCOME_EMAIL[locale].text).catch(() => ({ ok: false, status: 0 }));
    if (!welcome.ok) {
      reportUserError(new Error(`Brevo n’a pas envoyé l’e-mail de bienvenue (${welcome.status}).`), { request, status: welcome.status, details: { fournisseur: 'Brevo' } });
    }
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    reportUserError(error, { request });
    return NextResponse.json({ error: apiMessage(request, 'Impossible de confirmer ton inscription pour le moment. Réessaie dans quelques instants.') }, { status: 500 });
  }
});
