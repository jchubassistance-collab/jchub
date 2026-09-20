import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { reportUserError } from '@/lib/user-error';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
    const user = await getAdminAuth().verifyIdToken(token);
    await getAdminDb().collection('users').doc(user.uid).set({ 'subscription.cancelAt': FieldValue.serverTimestamp(), 'subscription.autoRenew': false, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    reportUserError();
    return NextResponse.json({ error: 'Impossible d’annuler l’abonnement.' }, { status: 500 });
  }
}
