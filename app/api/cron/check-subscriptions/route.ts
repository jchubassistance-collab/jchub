import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { reportUserError } from '@/lib/user-error';

export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
  try {
    const snapshot = await getAdminDb().collection('users').where('subscription.status', '==', 'active').where('subscription.expiresAt', '<=', Timestamp.now()).get();
    for (const document of snapshot.docs) {
      await document.ref.update({ 'subscription.status': 'expired', updatedAt: FieldValue.serverTimestamp() });
    }
    return NextResponse.json({ expired: snapshot.size });
  } catch (error) {
    reportUserError();
    return NextResponse.json({ error: 'Vérification impossible.' }, { status: 500 });
  }
}

export const GET = POST;
