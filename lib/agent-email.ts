import 'server-only';

import { getAdminDb } from '@/lib/firebase-admin';
import { reportUserError } from '@/lib/user-error';

type ToolRecommendation = {
  type: 'tool' | 'article';
  title: string;
  suggestedSlug: string;
};

type EmailResult = { ok: boolean; reason?: string };

/** Brevo settings of the e-mails sent to the site's administration address, or null when one is missing. */
function adminEmailConfig() {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const recipient = process.env.CONTACT_NOTIFICATION_EMAIL?.trim();
  return apiKey && senderEmail && recipient ? { apiKey, senderEmail, recipient } : null;
}

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://jchub.dev').replace(/\/$/, '');

async function sendAdminEmail(config: NonNullable<ReturnType<typeof adminEmailConfig>>, subject: string, textContent: string): Promise<EmailResult> {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { accept: 'application/json', 'api-key': config.apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({
        sender: { email: config.senderEmail, name: process.env.BREVO_SENDER_NAME?.trim() || 'JcHub' },
        to: [{ email: config.recipient }],
        subject,
        textContent,
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

export async function notifyAdminOfEditorialDraft(
  draftId: string,
  title: string,
  description: string,
  recommendations: ToolRecommendation[],
): Promise<EmailResult> {
  const config = adminEmailConfig();
  if (!config) {
    reportUserError();
    return { ok: false, reason: 'Configuration Brevo ou adresse de notification manquante.' };
  }

  const previewUrl = `${siteUrl()}/admin/agent#draft-${encodeURIComponent(draftId)}`;
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

  return sendAdminEmail(
    config,
    `JcHub — brouillon à examiner : ${title.slice(0, 100)}`,
    `Un nouveau brouillon de l’agent éditorial est prêt à être examiné.\n\n${title}\n\n${description}${ideaSummary}${weeklySummary}\n\nAucune publication n’a été effectuée. Ouvre l’aperçu et approuve ou rejette le brouillon : ${previewUrl}`,
  );
}

/** Sent when a writer puts an article online for the first time: the admin can reread it and withdraw it. */
export async function notifyAdminOfWriterPublication(article: { title: string; description: string; slug: string; author: string }): Promise<EmailResult> {
  const config = adminEmailConfig();
  if (!config) {
    reportUserError();
    return { ok: false, reason: 'Configuration Brevo ou adresse de notification manquante.' };
  }
  return sendAdminEmail(
    config,
    `JcHub — ${article.author.slice(0, 60)} a publié : ${article.title.slice(0, 100)}`,
    `${article.author} vient de publier un article depuis l’espace rédaction.\n\n${article.title}\n\n${article.description}\n\nIl sera en ligne dans quelques minutes, le temps du déploiement : ${siteUrl()}/fr/blog/${encodeURIComponent(article.slug)}\n\nPour le modifier ou le retirer (Déplacer en brouillon ou Archiver) : ${siteUrl()}/admin/content`,
  );
}

/** Sent after the weekly research of the resource agent: the drafts wait for the admin. */
export async function notifyAdminOfResourceDrafts(drafts: { title: string; reason: string }[], failures: string[]): Promise<EmailResult> {
  const config = adminEmailConfig();
  if (!config) {
    reportUserError();
    return { ok: false, reason: 'Configuration Brevo ou adresse de notification manquante.' };
  }
  const list = drafts.map((draft) => `- ${draft.title}\n  Pourquoi : ${draft.reason}`).join('\n\n');
  const problems = failures.length ? `\n\nÀ savoir :\n${failures.map((failure) => `- ${failure}`).join('\n')}` : '';
  const subject = drafts.length
    ? `JcHub — ${drafts.length} ressource${drafts.length > 1 ? 's' : ''} à relire`
    : 'JcHub — la recherche de ressources n’a rien produit cette semaine';
  const body = drafts.length
    ? `L’agent a cherché ce que les gens demandent et a rédigé ${drafts.length} ressource${drafts.length > 1 ? 's' : ''} en brouillon, en français et en anglais :\n\n${list}${problems}\n\nRien n’est publié. Relis, corrige si besoin, puis publie : ${siteUrl()}/admin/resources`
    : `Aucun brouillon n’a pu être créé.${problems}\n\nTu peux relancer la recherche depuis ${siteUrl()}/admin/resources`;
  return sendAdminEmail(config, subject, body);
}

/** Sent when a weekly agent could not finish: says why, instead of failing silently. */
export async function notifyAdminOfAgentFailure(agent: string, reason: string, retryPath: string): Promise<EmailResult> {
  const config = adminEmailConfig();
  if (!config) {
    reportUserError();
    return { ok: false, reason: 'Configuration Brevo ou adresse de notification manquante.' };
  }
  return sendAdminEmail(
    config,
    `JcHub — ${agent} n’a rien produit cette semaine`,
    `${agent} n’a pas pu terminer.\n\nRaison : ${reason.slice(0, 1500)}\n\nSi tous les fournisseurs IA échouent, vérifie leurs clés et leurs crédits (Gemini, OpenRouter, OpenAI), puis relance depuis ${siteUrl()}${retryPath}`,
  );
}
