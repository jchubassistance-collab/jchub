import 'server-only';

import { getPublishedArticleBySlug } from '@/lib/blog';
import { generateOpenRouterText } from '@/lib/content-agent';
import { reportUserError } from '@/lib/user-error';
import { generateSocialCopies } from '@/lib/social-copy';
import { publishToPlatform, PlatformError } from '@/lib/social-platforms';
import { createPlatformPublications, destinationFor, finishPublication, getPublication, getSocialSettings, updatePublicationStatus, claimPublication } from '@/lib/social-publications-store';
import { externalPublishingEnabled, settleIndependently, shouldAutoPublish } from '@/lib/social-utils';
import { getSocialPlatformReadiness } from '@/lib/social-readiness';
import type { PublicationRecord, SocialPlatform, SocialSource } from '@/lib/social-types';

function asSocialSource(article: NonNullable<Awaited<ReturnType<typeof getPublishedArticleBySlug>>>): SocialSource {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').replace(/\/$/, '');
  const imageUrl = article.image.startsWith('http') ? article.image : `${base}${article.image.startsWith('/') ? '' : '/'}${article.image}`;
  return {
    id: article.slug,
    title: article.title,
    description: article.description,
    content: article.content,
    url: `${base}/blog/${encodeURIComponent(article.slug)}`,
    imageUrl,
    tags: article.tags,
    category: article.category,
    author: article.author,
    publishedAt: article.publishedAt,
  };
}

export async function prepareSocialPublications(sourceContentId: string, allowAutoPublish = true): Promise<PublicationRecord[]> {
  const article = await getPublishedArticleBySlug(sourceContentId);
  if (!article || article.status !== 'published') throw new Error('Choisis un article publié sur JcHub.');
  const source = asSocialSource(article);
  const copies = await generateSocialCopies(source, generateOpenRouterText);
  const settings = await getSocialSettings();
  const records = await createPlatformPublications(source, copies, 'DRAFT');
  if (!allowAutoPublish || !settings.autoPublish) return records;

  const enabled = new Set<SocialPlatform>([
    ...(settings.linkedinEnabled ? ['linkedin' as const] : []),
    ...(settings.facebookEnabled ? ['facebook' as const] : []),
    ...(settings.githubEnabled ? ['github' as const] : []),
  ]);
  const results = await settleIndependently(records, async (record) => {
    if (!enabled.has(record.platform) || !shouldAutoPublish(settings, record.platform)) return record;
    await updatePublicationStatus(record.id, ['DRAFT'], 'APPROVED');
    const result = await publishPublication(record.id);
    if (result.ok) return result.publication || record;
    return (await getPublication(record.id)) || record;
  });
  return results.map((result) => result.ok ? result.result : result.item);
}

export async function publishPublication(id: string, allowManualRetry = false, confirmUnknownRetry = false) {
  const record = await getPublication(id);
  if (!record) return { ok: false as const, reason: 'Publication introuvable.' };
  const settings = await getSocialSettings();
  if (!externalPublishingEnabled(settings)) return { ok: true as const, dryRun: true, wouldPublish: record.platform, destination: record.destination };
  const readiness = getSocialPlatformReadiness(record.platform, settings);
  if (!readiness.enabled) return { ok: false as const, reason: 'Cette plateforme est désactivée.' };
  if (!readiness.configured) return { ok: false as const, reason: `Configuration serveur manquante ou invalide : ${readiness.missing.join(', ')}.` };

  const claim = await claimPublication(id, allowManualRetry, confirmUnknownRetry);
  if (!claim.ok) return { ok: false as const, reason: claim.reason };
  const article = await getPublishedArticleBySlug(claim.record.sourceContentId);
  if (!article) {
    await finishPublication(id, claim.leaseId, { status: 'FAILED', error: 'Le contenu source n’est plus disponible.', errorCode: 'SOURCE_NOT_FOUND' });
    return { ok: false as const, reason: 'Le contenu source n’est plus disponible.' };
  }

  try {
    const result = await publishToPlatform(claim.record.platform, claim.record, asSocialSource(article));
    await finishPublication(id, claim.leaseId, { status: 'PUBLISHED', ...result });
    const updated = await getPublication(id);
    return { ok: true as const, publication: updated, unchanged: Boolean(result.unchanged) };
  } catch (error) {
    const safeError = error instanceof PlatformError ? error : new PlatformError('Erreur inattendue pendant la publication.', 'unknown', 'UNEXPECTED_OUTCOME');
    reportUserError();
    await finishPublication(id, claim.leaseId, {
      status: safeError.outcome === 'unknown' ? 'UNKNOWN' : 'FAILED',
      error: safeError.message,
      errorCode: safeError.code,
    });
    return { ok: false as const, reason: safeError.message, status: safeError.outcome === 'unknown' ? 'UNKNOWN' : 'FAILED' };
  }
}

export async function publishScheduledPublication(id: string) {
  return publishPublication(id, false);
}

export function getDestination(platform: SocialPlatform) { return destinationFor(platform); }
