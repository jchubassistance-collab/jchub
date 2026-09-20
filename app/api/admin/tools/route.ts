import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getPublishedTools } from '@/lib/tools';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ tools: await getPublishedTools() });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    return NextResponse.json({ error: code === 'FORBIDDEN' ? 'Accès refusé.' : 'Accès administrateur requis.' }, { status: code === 'FORBIDDEN' ? 403 : 401 });
  }
}