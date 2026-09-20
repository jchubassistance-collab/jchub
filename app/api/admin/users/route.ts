import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });
    const snapshot = await getAdminDb().collection('users').limit(100).get();
    const users = snapshot.docs.map((document) => {
      const data = document.data();
      return { uid: document.id, email: String(data.email || ''), displayName: String(data.displayName || ''), role: String(data.role || 'user'), provider: String(data.provider || ''), createdAt: data.createdAt?.toDate?.()?.toISOString() || null };
    }).sort((first, second) => (second.createdAt || '').localeCompare(first.createdAt || ''));
    return NextResponse.json({ users });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    return NextResponse.json({ error: code === 'FORBIDDEN' ? 'Accès refusé.' : 'Accès administrateur requis.' }, { status: code === 'FORBIDDEN' ? 403 : 401 });
  }
}