import { start } from 'workflow/api';
import { NextRequest, NextResponse } from 'next/server';
import { handleUserSignup } from '@/workflows/user-signup';
import { z } from 'zod';
import { verifyTurnstileToken } from '@/lib/turnstile';

const signupSchema = z.object({
  email: z.string().trim().email().max(254),
  turnstileToken: z.string().max(4096).optional(),
}).strict();

export async function POST(request: NextRequest) {
  const parsedBody = signupSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 });
  }
  if (!await verifyTurnstileToken(parsedBody.data.turnstileToken, request)) {
    return NextResponse.json({ error: 'Vérification anti-abus échouée. Réessaie.' }, { status: 403 });
  }

  const run = await start(handleUserSignup, [parsedBody.data.email.toLowerCase()]);

  return NextResponse.json({
    message: 'Workflow d’inscription lancé.',
    runId: run.runId,
  }, { status: 202 });
}