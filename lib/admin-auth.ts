import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function requireAdmin(request: NextRequest) {
  const supabase = createSupabaseServerClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('UNAUTHORIZED');

  const allowedEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (!user.email || !allowedEmails.includes(user.email.toLowerCase())) {
    throw new Error('FORBIDDEN');
  }

  return user;
}