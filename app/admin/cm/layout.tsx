import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { ADMIN_SESSION_COOKIE, isConfiguredAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/**
 * CM space: the cm role and administrators. The session is checked without asking Firebase about
 * revocation, so each page opens without that round trip; every /api/cm route checks it fully.
 */
export default async function CmLayout({ children }: { children: React.ReactNode }) {
  const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!session) redirect('/admin/login');
  let allowed: boolean;
  try {
    const user = await getAdminAuth().verifySessionCookie(session, false);
    const role = (user as typeof user & { role?: string }).role;
    allowed = role === 'cm' || role === 'admin' || user.admin === true || isConfiguredAdmin(user)
      || (await getAdminDb().collection('users').doc(user.uid).get()).data()?.role === 'admin';
  } catch {
    redirect('/admin/login');
  }
  if (!allowed) redirect('/admin/login?reason=forbidden');
  return children;
}
