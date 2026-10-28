import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, writerFromSession } from '@/lib/admin-auth';
import { WriterShell } from '@/components/redaction/WriterShell';

export const dynamic = 'force-dynamic';

/** Writing space: writer accounts only. Each /api/redaction route checks the session again, revocation included. */
export default async function WriterLayout({ children }: { children: React.ReactNode }) {
  const writer = await writerFromSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value, false);
  if (!writer) redirect('/admin/login');
  return <WriterShell name={writer.name}>{children}</WriterShell>;
}
