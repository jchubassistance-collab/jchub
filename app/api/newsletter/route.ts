import { apiMessage } from '@/lib/api-messages';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { reportUserError } from '@/lib/user-error';
import { enforceRateLimit } from '@/lib/rate-limit';
import { newsletterListId } from '@/lib/brevo';
import { CONFIRMATION_LIFETIME_MS, CONFIRMATION_RESEND_DELAY_MS, newConfirmationToken, requiredEnvironment, sendBrevoEmail } from '@/lib/newsletter';
import { getPublicBaseUrl } from '@/lib/site-url';
import { requestLocale } from '@/i18n/request-locale';
import { withReport } from '@/lib/reports/server';

const CONFIRMATION_EMAIL = {
  fr: {
    subject: 'Confirme ton inscription à la newsletter JcHub',
    text: (link: string) => `Bonjour,\n\nQuelqu’un, sans doute toi, a demandé à recevoir la newsletter JcHub à cette adresse.\nPour confirmer ton inscription, ouvre ce lien :\n\n${link}\n\nLe lien reste valable 7 jours. Si tu n’as rien demandé, ignore ce message : tu ne recevras rien d’autre.\n\nL’équipe JcHub`,
  },
  en: {
    subject: 'Confirm your subscription to the JcHub newsletter',
    text: (link: string) => `Hello,\n\nSomeone, probably you, asked to receive the JcHub newsletter at this address.\nTo confirm your subscription, open this link:\n\n${link}\n\nThe link stays valid for 7 days. If you did not ask for anything, ignore this message: you will not get anything else.\n\nThe JcHub team`,
  },
};

const newsletterSchema = z.object({
  email: z.string().trim().email().max(254),
});

/**
 * First step of the double opt-in (see lib/newsletter.ts): the address is saved as pending and
 * gets a confirmation link. The answer is the same whether the address is new, pending or already
 * subscribed, so the form does not tell who is on the list.
 */
export const POST = withReport(async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'newsletter', 3, 10 * 60_000);
  if (limited) return limited;
  try {
    if (!hasFirebaseAdminConfig()) {
      return NextResponse.json(
        { error: apiMessage(request, 'Le service newsletter est temporairement indisponible.') },
        { status: 503 }
      );
    }

    const parsedBody = newsletterSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: apiMessage(request, 'Adresse e-mail invalide.') },
        { status: 400 }
      );
    }
    const normalizedEmail = parsedBody.data.email.toLowerCase();
    const locale = requestLocale(request);
    // Checked before saving anything: a missing list must not leave addresses that can never be confirmed.
    requiredEnvironment('BREVO_NEWSLETTER_LIST_ID');
    if ((newsletterListId(locale) ?? newsletterListId('fr')) === null) throw new Error('BREVO_LIST_ID invalide');

    const subscriberRef = getAdminDb().collection('newsletter_subscribers').doc(normalizedEmail);
    const existing = (await subscriberRef.get()).data();
    if (existing?.status === 'active') return NextResponse.json({ success: true, pending: true });
    const lastSent = existing?.confirmationSentAt?.toMillis?.() ?? 0;
    if (Date.now() - lastSent < CONFIRMATION_RESEND_DELAY_MS) return NextResponse.json({ success: true, pending: true });

    const { token, hash } = newConfirmationToken();
    await subscriberRef.set(
      {
        email: normalizedEmail,
        locale,
        status: 'pending',
        brevoStatus: 'awaiting-confirmation',
        confirmationTokenHash: hash,
        confirmationExpiresAt: new Date(Date.now() + CONFIRMATION_LIFETIME_MS),
        confirmationSentAt: FieldValue.serverTimestamp(),
        subscribedAt: existing?.subscribedAt ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const link = `${getPublicBaseUrl()}/${locale}/newsletter/confirmation?token=${token}`;
    const sent = await sendBrevoEmail(normalizedEmail, CONFIRMATION_EMAIL[locale].subject, CONFIRMATION_EMAIL[locale].text(link));
    if (!sent.ok) {
      // Without the email the address could never be confirmed: let a new attempt send another one.
      await subscriberRef.update({ confirmationSentAt: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
      reportUserError(new Error(`Brevo n’a pas envoyé l’e-mail de confirmation (${sent.status}).`), { request, status: sent.status, details: { fournisseur: 'Brevo' } });
      return NextResponse.json({ error: apiMessage(request, 'Impossible de t’inscrire pour le moment.') }, { status: 502 });
    }

    return NextResponse.json({ success: true, pending: true });
  } catch (error) {
    reportUserError(error, { request });
    return NextResponse.json({ error: apiMessage(request, 'Impossible de t’inscrire pour le moment.') }, { status: 500 });
  }
});
