
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { ADMIN_SESSION_COOKIE, isConfiguredAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export default async function CmLayout({ children }: { children: React.ReactNode }) {
  const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!session) redirect('/admin/login');
  try {
    const user = await getAdminAuth().verifySessionCookie(session, true);
    const role = (user as typeof user & { role?: string }).role;
    const profile = await getAdminDb().collection('users').doc(user.uid).get();
    if (role !== 'cm' && role !== 'admin' && user.admin !== true && profile.data()?.role !== 'admin' && !isConfiguredAdmin(user)) redirect('/admin/login?reason=forbidden');
  } catch { redirect('/admin/login'); }
  return children;
}
