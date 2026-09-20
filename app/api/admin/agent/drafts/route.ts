import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { reportUserError } from '@/lib/user-error';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const snapshot = await getAdminDb().collection('agent_drafts').orderBy('createdAt', 'desc').limit(30).get();
    const drafts = snapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });
    return NextResponse.json({ drafts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne.';
    if (message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    if (message === 'FORBIDDEN') return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
    reportUserError();
    return NextResponse.json({ error: 'Impossible de charger les brouillons.' }, { status: 500 });
  }
}