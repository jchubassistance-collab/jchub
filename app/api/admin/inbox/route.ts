import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const replySchema = z.object({ messageId: z.string().min(1).max(160), body: z.string().trim().min(1).max(5000) }).strict();

function errorResponse(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  const status = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' ? 401 : 500;
  return NextResponse.json({ error: status === 403 ? 'Accès refusé.' : status === 401 ? 'Authentification administrateur requise.' : 'La boîte de réception est indisponible.' }, { status });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const db = getAdminDb();
    const [messagesSnapshot, subscribersSnapshot] = await Promise.all([
      db.collection('contact_messages').orderBy('createdAt', 'desc').limit(500).get(),
      db.collection('newsletter_subscribers').orderBy('subscribedAt', 'desc').limit(1000).get(),
    ]);
    const messages = messagesSnapshot.docs.map((document) => {
      const data = document.data();
      return { id: document.id, name: String(data.name || ''), email: String(data.email || ''), subject: String(data.subject || ''), message: String(data.message || ''), status: String(data.status || 'new'), createdAt: data.createdAt?.toDate?.()?.toISOString() || null, replies: Array.isArray(data.replies) ? data.replies.map((reply: Record<string, unknown>) => ({ body: String(reply.body || ''), sentAt: (reply.sentAt as { toDate?: () => Date } | undefined)?.toDate?.()?.toISOString() || null, adminEmail: String(reply.adminEmail || '') })) : [] };
    }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const subscribers = subscribersSnapshot.docs.map((document) => {
      const data = document.data();
      return { email: String(data.email || document.id), status: String(data.status || 'pending'), subscribedAt: data.subscribedAt?.toDate?.()?.toISOString() || null, brevoStatus: String(data.brevoStatus || 'unknown') };
    }).sort((a, b) => (b.subscribedAt || '').localeCompare(a.subscribedAt || ''));
    return NextResponse.json({ messages, subscribers }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const parsed = replySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Le message de réponse est invalide.' }, { status: 400 });
    const db = getAdminDb();
    const reference = db.collection('contact_messages').doc(parsed.data.messageId);
    const snapshot = await reference.get();
    if (!snapshot.exists) return NextResponse.json({ error: 'Ce message est introuvable.' }, { status: 404 });
    const contact = snapshot.data()!;
    const email = String(contact.email || '');
    const name = String(contact.name || '');
    const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
    const apiKey = process.env.BREVO_API_KEY?.trim();
    if (!senderEmail || !apiKey || !email) return NextResponse.json({ error: 'La configuration e-mail est incomplète.' }, { status: 503 });

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { accept: 'application/json', 'api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME?.trim() || 'JcHub' },
        to: [{ email, ...(name ? { name } : {}) }],
        replyTo: { email: process.env.CONTACT_NOTIFICATION_EMAIL?.trim() || senderEmail, name: process.env.BREVO_SENDER_NAME?.trim() || 'JcHub' },
        subject: `Re: ${String(contact.subject || 'Votre message à JcHub').replace(/[\r\n]/g, ' ').slice(0, 120)}`,
        textContent: parsed.data.body,
      }),
      cache: 'no-store',
    });
    if (!response.ok) {
      reportUserError();
      return NextResponse.json({ error: 'Brevo n’a pas pu envoyer la réponse. Réessaie plus tard.' }, { status: 502 });
    }
    await reference.update({ status: 'replied', replies: FieldValue.arrayUnion({ body: parsed.data.body, adminEmail: admin.email || '', sentAt: new Date() }), updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ success: true });
  } catch (error) { return errorResponse(error); }
}
