import 'server-only';

import { getAdminDb } from '@/lib/firebase-admin';
import { reportUserError } from '@/lib/user-error';

type ToolRecommendation = {
  type: 'tool' | 'article';
  title: string;
};

export async function notifyAdminOfEditorialDraft(
  draftId: string,
  title: string,
  description: string,
  recommendations: ToolRecommendation[],
): Promise<{ ok: boolean; reason?: string }> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const recipient = process.env.CONTACT_NOTIFICATION_EMAIL?.trim();
  if (!apiKey || !senderEmail || !recipient) {
    reportUserError();
    return { ok: false, reason: 'Configuration Brevo ou adresse de notification manquante.' };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://jchub.dev').replace(/\/$/, '');
  const previewUrl = `${siteUrl}/admin/agent#draft-${encodeURIComponent(draftId)}`;
  const toolIdeas = recommendations.filter((recommendation) => recommendation.type === 'tool');
  const ideaSummary = toolIdeas.length
    ? `\n\nIdées d’outils à examiner :\n${toolIdeas.map((idea) => `- ${idea.title}`).join('\n')}`
    : '';
  let weeklySummary = '';
  try {
    const drafts = await getAdminDb().collection('agent_drafts')
      .where('createdAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .get();
    const counts = new Map<string, number>();
    drafts.docs.forEach((draft) => {
      const status = String(draft.data().status || 'draft');
      counts.set(status, (counts.get(status) || 0) + 1);
    });
    weeklySummary = `\n\nÉtat éditorial des 7 derniers jours : ${drafts.size} brouillon(s) créé(s), ${counts.get('draft') || 0} à examiner, ${counts.get('approved') || 0} approuvé(s), ${counts.get('scheduled') || 0} programmé(s), ${counts.get('published') || 0} publié(s), ${counts.get('rejected') || 0} refusé(s).`;
  } catch {
    reportUserError();
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { accept: 'application/json', 'api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME?.trim() || 'JcHub' },
        to: [{ email: recipient }],
        subject: `JcHub — brouillon à examiner : ${title.slice(0, 100)}`,
        textContent: `Un nouveau brouillon de l’agent éditorial est prêt à être examiné.\n\n${title}\n\n${description}${ideaSummary}${weeklySummary}\n\nAucune publication n’a été effectuée. Ouvre l’aperçu et approuve ou rejette le brouillon : ${previewUrl}`,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      reportUserError();
      return { ok: false, reason: `Brevo a répondu avec le statut ${response.status}.` };
    }
    return { ok: true };
  } catch {
    reportUserError();
    return { ok: false, reason: 'Échec réseau lors de la notification par e-mail.' };
  }
}
