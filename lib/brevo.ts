export type PublishedArticlePayload = {
  title: string;
  description: string;
  slug: string;
  image: string;
  readingTime: string;
  category: string;
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
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const listId = Number(process.env.BREVO_NEWSLETTER_LIST_ID);
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  if (!apiKey || !Number.isInteger(listId) || listId < 1 || !senderEmail) {
    console.warn('[BREVO] Configuration de campagne article incomplète.');
    return false;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://jchub.dev';
  const articleUrl = `${siteUrl}/blog/${encodeURIComponent(article.slug)}`;
  const title = escapeHtml(article.title);
  const description = escapeHtml(article.description);
  const image = escapeHtml(article.image);
  const readingTime = escapeHtml(article.readingTime);
  const category = escapeHtml(article.category);
  const response = await fetch('https://api.brevo.com/v3/emailCampaigns', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      name: `JcHub - ${article.title}`,
      subject: article.title,
      sender: { name: process.env.BREVO_SENDER_NAME?.trim() || 'JcHub', email: senderEmail },
      recipients: { listIds: [listId] },
      htmlContent: `<html><body style="font-family:Arial,sans-serif;color:#17324d;max-width:640px;margin:auto"><img src="${image}" alt="${title}" style="width:100%;max-height:320px;object-fit:cover"><p style="color:#64748b;font-size:13px">${category} · ${readingTime}</p><h1>${title}</h1><p>${description}</p><p><a href="${articleUrl}" style="display:inline-block;background:#f97316;color:#fff;padding:12px 18px;text-decoration:none;border-radius:8px">Lire l'article</a></p></body></html>`,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    console.error('[BREVO] Création de campagne refusée:', response.status, await response.text());
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
    console.error('[BREVO] Envoi de campagne refusé:', sendResponse.status, await sendResponse.text());
    return false;
  }
  return true;
}