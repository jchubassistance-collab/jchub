import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { apiMessage } from '@/lib/api-messages';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { reportUserError } from '@/lib/user-error';
import { enforceRateLimit } from '@/lib/rate-limit';
import { confirmationTokenHash, isConfirmationToken } from '@/lib/newsletter';
import { addNewsletterContact } from '@/lib/brevo';
import { findResourceById } from '@/lib/resources';
import { buildTemplateDocx, hasTemplate } from '@/lib/resource-templates';
import { downloadName } from '@/lib/download-name';
import { isLocale } from '@/i18n/routing';
import { withReport } from '@/lib/reports/server';

export const runtime = 'nodejs';

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Sends the Word file of a template to whoever opened the emailed link. A POST from the page's
 * button rather than the link itself: mail scanners open links on their own, and opening the
 * file also confirms the newsletter subscription when the box was ticked.
 */
export const POST = withReport(async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'resource-download', 20, 10 * 60_000);
  if (limited) return limited;
  const body = await request.json().catch(() => null) as { token?: unknown } | null;
  const expired = () => NextResponse.json({ error: apiMessage(request, 'Ce lien a expiré. Demande un nouveau lien depuis la page de la ressource.') }, { status: 410 });
  if (!isConfirmationToken(body?.token)) return expired();
  if (!hasFirebaseAdminConfig()) {
    return NextResponse.json({ error: apiMessage(request, 'Service temporairement indisponible.') }, { status: 503 });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db.collection('resource_requests').where('tokenHash', '==', confirmationTokenHash(body.token)).limit(1).get();
    const requestDocument = snapshot.docs[0];
    const data = requestDocument?.data();
    const resource = findResourceById(String(data?.resource ?? ''));
    if (!requestDocument || !data || (data.linkExpiresAt?.toMillis?.() ?? 0) < Date.now() || !resource || !hasTemplate(resource.id)) return expired();

    const locale = isLocale(data.locale) ? data.locale : 'fr';
    const file = await buildTemplateDocx(resource.id, locale);
    const email = String(data.email);
    const update: Record<string, unknown> = { downloads: FieldValue.increment(1), lastDownloadAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };

    if (data.newsletterOptIn === true && !data.newsletterAddedAt) {
      // The address is proved by this link and the box was ticked: the same as a confirmed opt-in.
      try {
        const subscriberRef = db.collection('newsletter_subscribers').doc(email);
        const subscriber = (await subscriberRef.get()).data();
        const added = subscriber?.status === 'active' ? { ok: true as const } : await addNewsletterContact(email, locale);
        if (added.ok) {
          if (subscriber?.status !== 'active') {
            await subscriberRef.set({
              email,
              locale,
              status: 'active',
              brevoStatus: 'subscribed',
              source: `resource:${resource.id}`,
              confirmedAt: FieldValue.serverTimestamp(),
              subscribedAt: subscriber?.subscribedAt ?? FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
          }
          update.newsletterAddedAt = FieldValue.serverTimestamp();
        } else {
          reportUserError(new Error(`Brevo a refusé l’inscription (${added.status}) : ${added.error}`), { request, status: added.status, details: { fournisseur: 'Brevo', liste: added.listId } });
        }
      } catch (error) {
        // The file is still sent: the subscription is tried again at the next download.
        reportUserError(error, { request });
      }
    }
    await requestDocument.ref.update(update);

    const name = downloadName(resource[locale].slug, 'docx');
    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': DOCX,
        'Content-Disposition': `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    reportUserError(error, { request });
    return NextResponse.json({ error: apiMessage(request, 'Impossible de préparer le fichier pour le moment.') }, { status: 500 });
  }
});
