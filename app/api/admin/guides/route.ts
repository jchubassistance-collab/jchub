import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { getGuides } from '@/lib/guides-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    if (!hasFirebaseAdminConfig()) return NextResponse.json({ error: 'Firebase indisponible.' }, { status: 503 });

    const leadsCollection = getAdminDb().collection('guide_download_leads');
    const [leadsSnapshot, availableGuides, totalLeadsSnapshot, sentEmailsSnapshot] = await Promise.all([
      leadsCollection.orderBy('downloadedAt', 'desc').limit(10).get(),
      getGuides(),
      leadsCollection.count().get(),
      leadsCollection.where('guideEmailStatus', '==', 'sent').count().get(),
    ]);
    const leads = leadsSnapshot.docs.map((document) => {
      const data = document.data();
      return {
        guideSlug: String(data.guideSlug || ''),
        email: String(data.email || ''),
        guideEmailStatus: String(data.guideEmailStatus || 'unknown'),
        newsletterOptIn: data.newsletterOptIn === true,
        downloadedAt: data.downloadedAt?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({ guides: availableGuides, leads, totalLeads: totalLeadsSnapshot.data().count, sentEmails: sentEmailsSnapshot.data().count });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    const status = code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' || code === 'INVALID_TOKEN' ? 401 : 500;
    return NextResponse.json({ error: status === 403 ? 'Accès refusé.' : 'Accès administrateur requis.' }, { status });
  }
}
