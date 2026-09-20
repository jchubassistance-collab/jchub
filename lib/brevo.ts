import 'server-only';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';
import { reportUserError } from '@/lib/user-error';

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

export async function notifyBrevoNewArticle(article: PublishedArticlePayload): Promise<boolean> {
  return notifyBrevoNewContent({
    type: 'article',
    title: article.title,
    description: article.description,
    slug: article.slug,
    path: `/blog/${article.slug}`,
    image: article.image,
    category: article.category,
    label: `${article.category} · ${article.readingTime}`,
  });
}

export async function notifyBrevoNewContent(content: PublishedContentPayload): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const listId = Number(process.env.BREVO_NEWSLETTER_LIST_ID);
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  if (!apiKey || !Number.isInteger(listId) || listId < 1 || !senderEmail) {
    reportUserError();
    return false;
  }

  const notificationId = `${content.type}_${content.slug}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  if (hasFirebaseAdminConfig()) {
    const notificationReference = getAdminDb().collection('newsletter_notifications').doc(notificationId);
    const notification = await notificationReference.get();
    if (notification.data()?.status === 'sent') return true;
    await notificationReference.set({ type: content.type, slug: content.slug, status: 'sending', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://jchub.dev';
  const contentUrl = `${siteUrl}${content.path}`;
  const title = escapeHtml(content.title);
  const description = escapeHtml(content.description);
  const image = escapeHtml(content.image || `${siteUrl}/blog/default.svg`);
  const label = escapeHtml(content.label || content.category);
  const response = await fetch('https://api.brevo.com/v3/emailCampaigns', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      name: `JcHub - ${content.type} - ${content.title}`,
      subject: `${content.type === 'tool' ? 'Nouvel outil' : 'Nouvel article'} : ${content.title}`,
      sender: { name: process.env.BREVO_SENDER_NAME?.trim() || 'JcHub', email: senderEmail },
      recipients: { listIds: [listId] },
      htmlContent: `<html><body style="font-family:Arial,sans-serif;color:#17324d;max-width:640px;margin:auto"><img src="${image}" alt="${title}" style="width:100%;max-height:320px;object-fit:cover"><p style="color:#64748b;font-size:13px">${label}</p><h1>${title}</h1><p>${description}</p><p><a href="${contentUrl}" style="display:inline-block;background:#2d67f6;color:#fff;padding:12px 18px;text-decoration:none;border-radius:8px">${content.type === 'tool' ? 'Découvrir l’outil' : 'Lire l’article'}</a></p></body></html>`,
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