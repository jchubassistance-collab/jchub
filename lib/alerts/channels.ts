import 'server-only';

/** Alerts and reports reach the administrator by e-mail, through Brevo, at ALERT_EMAIL (or CONTACT_NOTIFICATION_EMAIL). */

export type SendResult = { ok: boolean; detail?: string };
export type Attachment = { name: string; content: Buffer };

function emailConfig() {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const sender = process.env.BREVO_SENDER_EMAIL?.trim();
  const recipient = (process.env.ALERT_EMAIL || process.env.CONTACT_NOTIFICATION_EMAIL)?.trim();
  return apiKey && sender && recipient ? { apiKey, sender, recipient } : null;
}

/** Which channels are ready, without revealing any secret (shown on the Alertes page). */
export function channelStatus() {
  const email = emailConfig();
  return {
    email: email ? { ready: true as const, to: email.recipient } : { ready: false as const, missing: ['BREVO_API_KEY', 'BREVO_SENDER_EMAIL', 'ALERT_EMAIL ou CONTACT_NOTIFICATION_EMAIL'].filter((name) => !(name.includes(' ou ') ? process.env.ALERT_EMAIL || process.env.CONTACT_NOTIFICATION_EMAIL : process.env[name])) },
  };
}

export async function sendEmail(subject: string, text: string, attachments: Attachment[] = []): Promise<SendResult> {
  const config = emailConfig();
  if (!config) return { ok: false, detail: 'E-mail non configuré' };
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { accept: 'application/json', 'api-key': config.apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: { email: config.sender, name: process.env.BREVO_SENDER_NAME?.trim() || 'JcHub' },
        to: [{ email: config.recipient }],
        subject,
        textContent: text,
        ...(attachments.length ? { attachment: attachments.map((file) => ({ name: file.name, content: file.content.toString('base64') })) } : {}),
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
    if (response.ok) return { ok: true };
    // Brevo says why ("sender not valid", "unauthorized"…): shown on the Alertes page.
    const body = await response.json().catch(() => null) as { message?: unknown } | null;
    return { ok: false, detail: `Brevo ${response.status}${typeof body?.message === 'string' ? ` : ${body.message.slice(0, 200)}` : ''}` };
  } catch {
    return { ok: false, detail: 'Échec réseau vers Brevo' };
  }
}
