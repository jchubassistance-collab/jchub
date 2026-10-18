import 'server-only';

import { createKit, findArticleKit, getKit, markKitPublishRequested, setKitChannel, type CmKit } from '@/lib/cm-publication-kit';
import { kitPostText, validateKitPost, type KitPlatform } from '@/lib/social-copy';
import { publishToPlatform, PlatformError } from '@/lib/social-platforms';
import { claimPublication, finishPublication, getPublication, getSocialSettings, upsertKitPublication } from '@/lib/social-publications-store';
import { getSocialPlatformReadiness } from '@/lib/social-readiness';
import type { PublicationRecord, SocialSource } from '@/lib/social-types';
import { externalPublishingEnabled, shouldAutoPublish } from '@/lib/social-utils';
import { reportUserError } from '@/lib/user-error';

export const KIT_PLATFORMS: KitPlatform[] = ['facebook', 'instagram'];
const platformLabel = (platform: KitPlatform) => platform === 'facebook' ? 'Facebook' : 'Instagram';

// Visuels publics du kit, téléchargés par Meta. La version change à chaque modification du kit.
function kitImageUrl(kit: CmKit, format: KitPlatform): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').replace(/\/$/, '');
  const version = kit.updatedAt ? Date.parse(kit.updatedAt) || 0 : 0;
  return `${base}/api/kit-image/${encodeURIComponent(kit.id)}?format=${format}&v=${version}`;
}

export function kitSocialSource(kit: CmKit): SocialSource {
  return {
    id: kit.id, title: kit.title, description: kit.imageSubtitle, content: '', url: kit.url,
    imageUrl: kitImageUrl(kit, 'facebook'), portraitImageUrl: kitImageUrl(kit, 'instagram'),
    tags: kit.tags, category: kit.category, author: 'JcHub',
  };
}

export type KitPublishOutcome = {
  platform: KitPlatform;
  outcome: 'queued' | 'already-published' | 'in-progress' | 'needs-confirmation' | 'blocked' | 'dry-run';
  message: string;
};
type Runner = (publicationId: string, allowManualRetry: boolean, confirmUnknownRetry: boolean) => Promise<unknown>;

// Publie un kit sur les réseaux demandés. Chaque réseau échoue indépendamment; run lance l'envoi
// (workflow durable depuis l'interface, appel direct depuis la publication automatique).
export async function publishKit(kitId: string, options: { platforms: KitPlatform[]; confirmUnknown?: boolean; run: Runner }): Promise<KitPublishOutcome[]> {
  const kit = await getKit(kitId);
  if (!kit) throw new Error('KIT_NOT_FOUND');
  const settings = await getSocialSettings();
  const outcomes: KitPublishOutcome[] = [];
  for (const platform of options.platforms) {
    const label = platformLabel(platform);
    if (!externalPublishingEnabled(settings)) { outcomes.push({ platform, outcome: 'dry-run', message: `${label} : mode test actif, rien n’a été envoyé.` }); continue; }
    const readiness = getSocialPlatformReadiness(platform, settings);
    if (!readiness.enabled) { outcomes.push({ platform, outcome: 'blocked', message: `${label} est désactivé dans les réglages de publication.` }); continue; }
    if (!readiness.configured) { outcomes.push({ platform, outcome: 'blocked', message: `${label} : connexion incomplète (${readiness.missing.join(', ')}).` }); continue; }
    const text = kitPostText(kit, platform);
    const issue = validateKitPost(platform, text);
    if (issue) { outcomes.push({ platform, outcome: 'blocked', message: `${label} : ${issue}` }); continue; }

    await markKitPublishRequested(kit.id);
    const record = await upsertKitPublication(kit, platform, text);
    if (record.status === 'PUBLISHED') {
      await setKitChannel(kit.id, platform, { status: 'PUBLISHED', publicationId: record.id, externalUrl: record.externalUrl || null, error: null });
      outcomes.push({ platform, outcome: 'already-published', message: `${label} : ce contenu y est déjà publié.` });
      continue;
    }
    if (record.status === 'PUBLISHING' || record.status === 'SCHEDULED') { outcomes.push({ platform, outcome: 'in-progress', message: `${label} : une publication est déjà en cours.` }); continue; }
    if (record.status === 'UNKNOWN' && !options.confirmUnknown) {
      await setKitChannel(kit.id, platform, { status: 'UNKNOWN', publicationId: record.id, externalUrl: null, error: record.error || null });
      outcomes.push({ platform, outcome: 'needs-confirmation', message: `${label} : le résultat d’un envoi précédent est incertain. Vérifie le compte, puis confirme la relance.` });
      continue;
    }
    if (record.status === 'FAILED') { outcomes.push({ platform, outcome: 'blocked', message: `${label} : ${record.error || 'envoi précédent en échec.'}` }); continue; }

    await setKitChannel(kit.id, platform, { status: 'PUBLISHING', publicationId: record.id, externalUrl: null, error: null });
    const retryUnknown = record.status === 'UNKNOWN';
    await options.run(record.id, retryUnknown, retryUnknown);
    outcomes.push({ platform, outcome: 'queued', message: `${label} : publication en cours.` });
  }
  return outcomes;
}

// Remet l'état du réseau dans le kit quand l'envoi n'a pas pu démarrer.
async function releaseKitChannel(record: PublicationRecord, error: string) {
  if (!record.kitId || (record.platform !== 'facebook' && record.platform !== 'instagram')) return;
  await setKitChannel(record.kitId, record.platform, { status: record.status, publicationId: record.id, externalUrl: record.externalUrl || null, error }).catch(() => reportUserError());
}

export async function publishPublication(id: string, allowManualRetry = false, confirmUnknownRetry = false) {
  const record = await getPublication(id);
  if (!record) return { ok: false as const, reason: 'Publication introuvable.' };
  const settings = await getSocialSettings();
  if (!externalPublishingEnabled(settings)) {
    await releaseKitChannel(record, 'Mode test actif : rien n’a été envoyé.');
    return { ok: true as const, dryRun: true, wouldPublish: record.platform, destination: record.destination };
  }
  const readiness = getSocialPlatformReadiness(record.platform, settings);
  const blocked = !readiness.enabled ? 'Cette plateforme est désactivée.' : !readiness.configured ? `Configuration serveur manquante ou invalide : ${readiness.missing.join(', ')}.` : '';
  if (blocked) { await releaseKitChannel(record, blocked); return { ok: false as const, reason: blocked }; }

  const claim = await claimPublication(id, allowManualRetry, confirmUnknownRetry);
  if (!claim.ok) { await releaseKitChannel(record, claim.reason); return { ok: false as const, reason: claim.reason }; }
  const kit = claim.record.kitId ? await getKit(claim.record.kitId) : null;
  if (!kit || (claim.record.platform !== 'facebook' && claim.record.platform !== 'instagram')) {
    await finishPublication(id, claim.leaseId, { status: 'FAILED', error: 'Le kit de publication n’existe plus.', errorCode: 'SOURCE_NOT_FOUND' });
    return { ok: false as const, reason: 'Le kit de publication n’existe plus.' };
  }
  const platform = claim.record.platform;
  const sync = (status: 'PUBLISHED' | 'FAILED' | 'UNKNOWN', externalUrl: string | null, error: string | null) =>
    setKitChannel(kit.id, platform, { status, publicationId: id, externalUrl, error }).catch(() => reportUserError());

  try {
    const result = await publishToPlatform(platform, claim.record, kitSocialSource(kit));
    await finishPublication(id, claim.leaseId, { status: 'PUBLISHED', ...result });
    await sync('PUBLISHED', result.externalUrl || null, null);
    return { ok: true as const, publication: await getPublication(id), unchanged: Boolean(result.unchanged) };
  } catch (error) {
    const safeError = error instanceof PlatformError ? error : new PlatformError('Erreur inattendue pendant la publication.', 'unknown', 'UNEXPECTED_OUTCOME');
    reportUserError();
    const status = safeError.outcome === 'unknown' ? 'UNKNOWN' : 'FAILED';
    await finishPublication(id, claim.leaseId, { status, error: safeError.message, errorCode: safeError.code });
    await sync(status, null, safeError.message);
    return { ok: false as const, reason: safeError.message, status };
  }
}

// Article tout juste publié : l'IA prépare son kit (ou reprend celui du CM), puis le publie si la publication
// automatique est active. Sinon le kit attend la relecture du CM.
export async function prepareSocialPublications(slug: string) {
  const kit = (await findArticleKit(slug)) || await createKit('article', slug, 'agent');
  const settings = await getSocialSettings();
  const platforms = KIT_PLATFORMS.filter((platform) => shouldAutoPublish(settings, platform));
  if (!platforms.length || !externalPublishingEnabled(settings)) return { kitId: kit.id, outcomes: [] as KitPublishOutcome[] };
  const outcomes = await publishKit(kit.id, { platforms, run: (publicationId, retry, confirm) => publishPublication(publicationId, retry, confirm) });
  return { kitId: kit.id, outcomes };
}
