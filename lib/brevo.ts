import 'server-only';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { getPublicBaseUrl } from '@/lib/site-url';
import { reportUserError } from '@/lib/user-error';
import type { Locale } from '@/i18n/routing';

/**
 * Brevo list of each language's subscribers. English subscribers have their own list
 * (BREVO_NEWSLETTER_LIST_ID_EN); without it they join the French list.
 */
export function newsletterListId(locale: Locale): number | null {
  const configured = locale === 'en' ? process.env.BREVO_NEWSLETTER_LIST_ID_EN : process.env.BREVO_NEWSLETTER_LIST_ID;
  const listId = Number(configured);
  return Number.isInteger(listId) && listId > 0 ? listId : null;
}

const EMAIL_TEXTS: Record<Locale, { newTool: string; newArticle: string; discoverTool: string; readArticle: string; footer: string }> = {
  fr: { newTool: 'Nouvel outil', newArticle: 'Nouvel article', discoverTool: 'Découvrir l’outil', readArticle: 'Lire l’article', footer: 'JcHub · Des outils et ressources numériques utiles.' },
  en: { newTool: 'New tool', newArticle: 'New article', discoverTool: 'Discover the tool', readArticle: 'Read the article', footer: 'JcHub · Useful digital tools and resources.' },
};

export type PublishedArticlePayload = {
  title: string;
  description: string;
  slug: string;
  image: string;
  readingTime: string;
  category: string;
};

export type PublishedContentPayload = {
  type: 'article' | 'tool';
  title: string;
  description: string;
  slug: string;
  path: string;
  image?: string;
  category: string;
  label: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] || character);
}

/** True when subscribers of `locale` were already emailed about this content. */
export async function wasNotified(type: PublishedContentPayload['type'], slug: string, locale: Locale): Promise<boolean> {
  if (!hasFirebaseAdminConfig()) return false;
  const notificationId = `${locale === 'en' ? 'en_' : ''}${type}_${slug}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const notification = await getAdminDb().collection('newsletter_notifications').doc(notificationId).get();
  return notification.data()?.status === 'sent';
}

export async function notifyBrevoNewArticle(article: PublishedArticlePayload, locale: Locale = 'fr'): Promise<boolean> {
  return notifyBrevoNewContent({
    type: 'article',
    title: article.title,
    description: article.description,
    slug: article.slug,
    path: `/${locale}/blog/${article.slug}`,
    image: article.image,
    category: article.category,
    label: `${article.category} · ${article.readingTime}`,
  }, locale);
}

/**
 * Emails a new article or tool to the subscribers of `locale`. The English campaign is only
 * sent when English subscribers have their own list, so they never get a French duplicate.
 */
export async function notifyBrevoNewContent(content: PublishedContentPayload, locale: Locale = 'fr'): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const listId = locale === 'en' && !process.env.BREVO_NEWSLETTER_LIST_ID_EN?.trim() ? null : newsletterListId(locale);
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  if (locale === 'en' && listId === null) return false;
  if (!apiKey || listId === null || !senderEmail) {
    reportUserError();
    return false;
  }
  const texts = EMAIL_TEXTS[locale];

  const notificationId = `${locale === 'en' ? 'en_' : ''}${content.type}_${content.slug}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  if (hasFirebaseAdminConfig()) {
    const notificationReference = getAdminDb().collection('newsletter_notifications').doc(notificationId);
    const notification = await notificationReference.get();
    if (notification.data()?.status === 'sent') return true;
    await notificationReference.set({ type: content.type, slug: content.slug, locale, status: 'sending', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }

  const siteUrl = getPublicBaseUrl();
  const contentUrl = new URL(content.path, siteUrl).toString();
  const title = escapeHtml(content.title);
  const description = escapeHtml(content.description);
  const image = escapeHtml(content.image ? new URL(content.image, siteUrl).toString() : `${siteUrl}/blog/default.svg`);
  const label = escapeHtml(content.label || content.category);
  const logoUrl = escapeHtml(`${siteUrl}/icon-192.png`);
  const response = await fetch('https://api.brevo.com/v3/emailCampaigns', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      name: `JcHub - ${content.type} - ${content.title}`,
      subject: `${content.type === 'tool' ? texts.newTool : texts.newArticle}${locale === 'en' ? ': ' : ' : '}${content.title}`,
      sender: { name: process.env.BREVO_SENDER_NAME?.trim() || 'JcHub', email: senderEmail },
      recipients: { listIds: [listId] },
      htmlContent: `<html lang="${locale}"><body style="margin:0;background:#f4f8ff;font-family:Arial,sans-serif;color:#17324d"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f8ff;padding:24px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border:1px solid #dbeafe;border-radius:12px;overflow:hidden"><tr><td style="padding:22px 28px;border-bottom:1px solid #e2e8f0"><a href="${siteUrl}" style="display:inline-flex;align-items:center;color:#0066ff;text-decoration:none"><img src="${logoUrl}" width="44" height="44" alt="" style="display:inline-block;vertical-align:middle;border:0;margin-right:10px"><span style="font-size:26px;font-weight:800;vertical-align:middle">JcHub</span></a></td></tr><tr><td><img src="${image}" alt="${title}" width="640" style="display:block;width:100%;max-height:320px;object-fit:cover;border:0"></td></tr><tr><td style="padding:28px"><p style="margin:0 0 12px;color:#64748b;font-size:13px">${label}</p><h1 style="margin:0 0 16px;color:#102a43;font-size:28px;line-height:1.25">${title}</h1><p style="margin:0 0 24px;color:#475569;font-size:16px;line-height:1.65">${description}</p><p style="margin:0"><a href="${contentUrl}" style="display:inline-block;background:#2d67f6;color:#fff;padding:12px 18px;text-decoration:none;border-radius:8px;font-weight:bold">${content.type === 'tool' ? texts.discoverTool : texts.readArticle}</a></p></td></tr><tr><td style="padding:18px 28px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.6">${texts.footer}<br><a href="${siteUrl}" style="color:#2563eb">jchub.dev</a> · <a href="mailto:hello@jchub.dev" style="color:#2563eb">hello@jchub.dev</a></td></tr></table></td></tr></table></body></html>`,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    reportUserError();
    if (hasFirebaseAdminConfig()) await getAdminDb().collection('newsletter_notifications').doc(notificationId).set({ status: 'failed', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return false;
  }

  const campaign = await response.json() as { id?: number };
  if (!campaign.id) return false;
  const sendResponse = await fetch(`https://api.brevo.com/v3/emailCampaigns/${campaign.id}/sendNow`, {
    method: 'POST',
    headers: { accept: 'application/json', 'api-key': apiKey },
    cache: 'no-store',
  });
  if (!sendResponse.ok) {
    reportUserError();
    if (hasFirebaseAdminConfig()) await getAdminDb().collection('newsletter_notifications').doc(notificationId).set({ status: 'failed', campaignId: campaign.id, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return false;
  }
  if (hasFirebaseAdminConfig()) await getAdminDb().collection('newsletter_notifications').doc(notificationId).set({ status: 'sent', campaignId: campaign.id, sentAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return true;
}