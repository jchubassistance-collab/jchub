import { start } from 'workflow/api';
import { NextRequest, NextResponse } from 'next/server';
import { handleUserSignup } from '@/workflows/user-signup';
import { z } from 'zod';
import { enforceRateLimit } from '@/lib/rate-limit';

const signupSchema = z.object({
  email: z.string().trim().email().max(254),
});

export async function POST(request: NextRequest) {
  const limited = await enforceRateLimit(request, 'signup', 5, 10 * 60_000);
  if (limited) return limited;
  const parsedBody = signupSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 });
  }

  const run = await start(handleUserSignup, [parsedBody.data.email.toLowerCase()]);

  return NextResponse.json({
    message: 'Workflow d’inscription lancé.',
    runId: run.runId,
  }, { status: 202 });
}
