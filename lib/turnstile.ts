import 'server-only';

import { NextRequest } from 'next/server';

export async function verifyTurnstileToken(token: unknown, request: NextRequest): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;
  if (typeof token !== 'string' || token.length < 10 || token.length > 4096) return false;

  const formData = new URLSearchParams();
  formData.set('secret', secret);
  formData.set('response', token);
  const remoteIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (remoteIp) formData.set('remoteip', remoteIp);

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
}
