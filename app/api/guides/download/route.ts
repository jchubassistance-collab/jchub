import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { getGuideBySlug } from '@/lib/guides-server';
import { signedCloudinaryDownloadUrl } from '@/lib/cloudinary';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';

const MAX_DOWNLOAD_REQUESTS_PER_DAY = 3;
const DOWNLOAD_WINDOW_MS = 24 * 60 * 60 * 1000;

function validEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variable ${name} manquante`);
  return value;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: unknown; guideSlug?: unknown; newsletterOptIn?: unknown; turnstileToken?: unknown };
    if (!await verifyTurnstileToken(body.turnstileToken, request)) {
      return NextResponse.json({ error: 'Vérification anti-abus échouée. Réessaie.' }, { status: 403 });
    }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const guideSlug = typeof body.guideSlug === 'string' ? body.guideSlug : '';
    const guide = await getGuideBySlug(guideSlug);

    if (!validEmail(email)) return NextResponse.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
    if (!guide) return NextResponse.json({ error: 'Guide introuvable.' }, { status: 404 });
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Le service est temporairement indisponible.' }, { status: 503 });
    if (!process.env.BREVO_API_KEY?.trim() || !process.env.BREVO_SENDER_EMAIL?.trim()) {
      return NextResponse.json({ error: 'L’envoi par e-mail est temporairement indisponible.' }, { status: 503 });
    }

    const adminDb = getAdminDb();
    const windowStart = Timestamp.fromMillis(Date.now() - DOWNLOAD_WINDOW_MS);
    const recentRequests = await adminDb
      .collection('guide_download_leads')
      .where('email', '==', email)
      .where('downloadedAt', '>=', windowStart)
      .limit(MAX_DOWNLOAD_REQUESTS_PER_DAY + 1)
      .get();

    if (recentRequests.docs.some((document) => document.data().guideSlug === guide.slug)) {
      return NextResponse.json(
        { error: 'Tu as déjà demandé ce guide au cours des dernières 24 heures.' },
        { status: 429 },
      );
    }

    if (recentRequests.size >= MAX_DOWNLOAD_REQUESTS_PER_DAY) {
      return NextResponse.json(
        { error: 'Tu as atteint la limite de 3 téléchargements par jour. Réessaie demain.' },
        { status: 429 },
      );
    }

    const senderEmail = requiredEnvironment('BREVO_SENDER_EMAIL');
    const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'JcHub';
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || new URL(request.url).origin).replace(/\/$/, '');
    const downloadUrl = guide.cloudinaryPublicId
      ? signedCloudinaryDownloadUrl(guide.cloudinaryPublicId, guide.format.toLowerCase())
      : `${siteUrl}/api/guides/file/${encodeURIComponent(guide.slug)}`;

    const newsletterOptIn = body.newsletterOptIn === true;
    const lead = await adminDb.collection('guide_download_leads').add({
      email,
      guideSlug: guide.slug,
      newsletterOptIn,
      newsletterStatus: newsletterOptIn ? 'pending' : 'not_requested',
      guideEmailStatus: 'pending',
      downloadedAt: FieldValue.serverTimestamp(),
      userAgent: request.headers.get('user-agent') || null,
    });

    const guideEmailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': requiredEnvironment('BREVO_API_KEY'),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email }],
        subject: `Ton guide JcHub : ${guide.title}`,
        textContent: `Bonjour,\n\nVoici le lien pour télécharger ton guide « ${guide.title} » :\n${downloadUrl}\n\nÀ bientôt,\nL’équipe JcHub`,
        htmlContent: `<p>Bonjour,</p><p>Voici ton guide <strong>${guide.title}</strong> :</p><p><a href="${downloadUrl}" style="display:inline-block;padding:12px 18px;background:#22d3ee;color:#07142b;text-decoration:none;font-weight:700;border-radius:8px;">Télécharger le guide</a></p><p>Si le bouton ne fonctionne pas, ouvre ce lien :</p><p><a href="${downloadUrl}">${downloadUrl}</a></p><p>À bientôt,<br>L’équipe JcHub</p>`,
      }),
      cache: 'no-store',
    });

    if (!guideEmailResponse.ok) {
      reportUserError();
      await lead.update({ guideEmailStatus: 'failed', updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ error: 'Impossible d’envoyer le guide par e-mail pour le moment.' }, { status: 502 });
    }

    await lead.update({ guideEmailStatus: 'sent', updatedAt: FieldValue.serverTimestamp() });

    if (newsletterOptIn && process.env.BREVO_API_KEY && process.env.BREVO_NEWSLETTER_LIST_ID) {
      const newsletterResponse = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email,
          listIds: [Number(process.env.BREVO_NEWSLETTER_LIST_ID)],
          updateEnabled: true,
        }),
        cache: 'no-store',
      });

      await lead.update({ newsletterStatus: newsletterResponse.ok ? 'subscribed' : 'failed' });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    reportUserError();
    return NextResponse.json({ error: 'Impossible de préparer le téléchargement.' }, { status: 500 });
  }
}
