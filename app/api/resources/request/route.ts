import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { apiMessage } from '@/lib/api-messages';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { reportUserError } from '@/lib/user-error';
import { enforceRateLimit } from '@/lib/rate-limit';
import { newConfirmationToken, sendBrevoEmail } from '@/lib/newsletter';
import { getPublicBaseUrl } from '@/lib/site-url';
import { findResourceById } from '@/lib/resources';
import { hasTemplate } from '@/lib/resource-templates';
import { RESOURCE_LINK_LIFETIME_MS, RESOURCE_REQUEST_RETENTION_MS, RESOURCE_RESEND_DELAY_MS, RESOURCE_TOKEN_PARAM } from '@/lib/resource-requests';
import { getPathname } from '@/i18n/navigation';
import { requestLocale } from '@/i18n/request-locale';
import { withReport } from '@/lib/reports/server';

const EMAIL = {
  fr: {
    subject: (title: string) => `Ton modèle JcHub : ${title}`,
    text: (title: string, link: string) => `Bonjour,\n\nVoici le lien pour télécharger « ${title} » au format Word :\n\n${link}\n\nOuvre-le puis appuie sur « Télécharger ». Il reste valable 7 jours.\nSi tu n’as rien demandé, ignore ce message : tu ne recevras rien d’autre.\n\nL’équipe JcHub`,
  },
  en: {
    subject: (title: string) => `Your JcHub template: ${title}`,
    text: (title: string, link: string) => `Hello,\n\nHere is the link to download “${title}” as a Word file:\n\n${link}\n\nOpen it, then press “Download”. It stays valid for 7 days.\nIf you did not ask for anything, ignore this message: you will not get anything else.\n\nThe JcHub team`,
  },
};

const requestSchema = z.object({
  resource: z.string().max(60),
  email: z.string().trim().email().max(254),
  newsletter: z.boolean().optional(),
});

/**
 * A template is not downloaded from its page: its link is emailed, which proves the address.
 * The answer is the same whether or not an email was just sent, so the form tells nothing about
 * who asked before.
 */
export const POST = withReport(async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'resource-request', 5, 10 * 60_000);
  if (limited) return limited;
  try {
    if (!hasFirebaseAdminConfig()) {
      return NextResponse.json({ error: apiMessage(request, 'Service temporairement indisponible.') }, { status: 503 });
    }
    const parsed = requestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: apiMessage(request, 'Adresse e-mail invalide.') }, { status: 400 });
    const resource = findResourceById(parsed.data.resource);
    if (!resource?.gated || !hasTemplate(resource.id)) {
      return NextResponse.json({ error: apiMessage(request, 'Ressource introuvable.') }, { status: 404 });
    }

    const email = parsed.data.email.toLowerCase();
    const locale = requestLocale(request);
    const reference = getAdminDb().collection('resource_requests').doc(createHash('sha256').update(`${email}:${resource.id}`).digest('hex'));
    const existing = (await reference.get()).data();
    const lastSent = existing?.sentAt?.toMillis?.() ?? 0;
    if (Date.now() - lastSent < RESOURCE_RESEND_DELAY_MS) return NextResponse.json({ success: true });

    const { token, hash } = newConfirmationToken();
    await reference.set({
      email,
      resource: resource.id,
      locale,
      // Consent to the newsletter, given by ticking the box; applied once the link is opened.
      newsletterOptIn: parsed.data.newsletter === true,
      tokenHash: hash,
      linkExpiresAt: new Date(Date.now() + RESOURCE_LINK_LIFETIME_MS),
      sentAt: FieldValue.serverTimestamp(),
      requestedAt: existing?.requestedAt ?? FieldValue.serverTimestamp(),
      // Firestore TTL field: the request is erased after this date.
      expiresAt: new Date(Date.now() + RESOURCE_REQUEST_RETENTION_MS),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    const path = getPathname({ locale, href: { pathname: '/ressources/[slug]', params: { slug: resource[locale].slug } } });
    // Locally, the link leads back to the server that was tested; online, only to the configured address.
    const base = process.env.NODE_ENV === 'production' ? getPublicBaseUrl() : request.nextUrl.origin;
    const link = `${base}${path}?${RESOURCE_TOKEN_PARAM}=${token}`;
    const title = resource[locale].title;
    const sent = await sendBrevoEmail(email, EMAIL[locale].subject(title), EMAIL[locale].text(title, link));
    if (!sent.ok) {
      // Lets the visitor ask again right away.
      await reference.update({ sentAt: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
      reportUserError(new Error(`Brevo n’a pas envoyé le lien de la ressource (${sent.status}).`), { request, status: sent.status, details: { fournisseur: 'Brevo', ressource: resource.id } });
      return NextResponse.json({ error: apiMessage(request, 'Impossible d’envoyer le lien pour le moment.') }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    reportUserError(error, { request });
    return NextResponse.json({ error: apiMessage(request, 'Impossible d’envoyer le lien pour le moment.') }, { status: 500 });
  }
});
