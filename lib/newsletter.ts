import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

/**
 * Double opt-in: an address joins the Brevo list only once its owner clicks the link mailed to
 * it. Otherwise anyone could subscribe a stranger, who would get our mail without consenting.
 * Firestore keeps only the token's hash, so the link cannot be rebuilt from the database.
 */

/** A confirmation link stays valid this long. */
export const CONFIRMATION_LIFETIME_MS = 7 * 86400_000;
/** At most one confirmation email per address in this period, whatever IPs ask for it. */
export const CONFIRMATION_RESEND_DELAY_MS = 24 * 3600_000;

export function newConfirmationToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: confirmationTokenHash(token) };
}

export function confirmationTokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Tokens are 32 random bytes in base64url: 43 characters. */
export function isConfirmationToken(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
}

export function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variable ${name} manquante`);
  return value;
}

/** Sends a plain-text email through Brevo; true when Brevo accepted it. */
export async function sendBrevoEmail(to: string, subject: string, textContent: string): Promise<{ ok: boolean; status: number }> {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': requiredEnvironment('BREVO_API_KEY'),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: requiredEnvironment('BREVO_SENDER_EMAIL'), name: process.env.BREVO_SENDER_NAME?.trim() || 'JcHub' },
      to: [{ email: to }],
      subject,
      textContent,
    }),
    cache: 'no-store',
  });
  return { ok: response.ok, status: response.status };
}
