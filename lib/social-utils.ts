import { createHash, timingSafeEqual } from 'node:crypto';
import type { SocialPlatform, SocialSettings } from './social-types';

export function contentHash(content: string): string {
  return createHash('sha256').update(content.trim().replace(/\r\n/g, '\n')).digest('hex');
}

export function publicationId(sourceContentId: string, platform: SocialPlatform, destination: string, hash: string): string {
  return createHash('sha256').update([sourceContentId, platform, destination, hash].join('\0')).digest('hex');
}

export function publicationGuardId(sourceContentId: string, platform: SocialPlatform, destination: string): string {
  return createHash('sha256').update([sourceContentId, platform, destination].join('\0')).digest('hex');
}

export function canRetryPublication(status: string, errorCode?: string | null, confirmUnknown = false): boolean {
  if (status === 'FAILED') return errorCode !== 'POST_OUTCOME_UNKNOWN';
  return status === 'UNKNOWN' && confirmUnknown;
}

export function shouldAutoPublish(settings: SocialSettings, platform: SocialPlatform): boolean {
  if (!settings.autoPublish) return false;
  return platform === 'linkedin' ? settings.linkedinEnabled : platform === 'facebook' ? settings.facebookEnabled : settings.githubEnabled;
}

export function externalPublishingEnabled(settings: SocialSettings): boolean { return !settings.dryRun; }

export function isCronBearerAuthorized(header: string | null, secret: string | undefined): boolean {
  const expected = secret?.trim();
  const received = header?.replace(/^Bearer\s+/i, '').trim();
  if (!expected || !received) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function adminAuthStatus(error: unknown): 401 | 403 | 500 {
  const code = error instanceof Error ? error.message : '';
  return code === 'FORBIDDEN' ? 403 : code === 'UNAUTHORIZED' ? 401 : 500;
}

export async function settleIndependently<T, R>(items: T[], work: (item: T) => Promise<R>) {
  return Promise.all(items.map(async (item) => {
    try { return { item, ok: true as const, result: await work(item) }; }
    catch { return { item, ok: false as const }; }
  }));
}

function partsAsUtc(parts: Intl.DateTimeFormatPart[]): number {
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
}

export function zonedDateTimeToUtc(value: string, timeZone: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Date locale invalide.');
  const [date, time] = value.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  const checkDate = new Date(naive);
  if (checkDate.getUTCFullYear() !== year || checkDate.getUTCMonth() !== month - 1 || checkDate.getUTCDate() !== day || hour > 23 || minute > 59) {
    throw new Error('Date locale invalide.');
  }
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  let candidate = naive;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const localAsUtc = partsAsUtc(formatter.formatToParts(new Date(candidate)));
    const corrected = naive - (localAsUtc - candidate);
    if (corrected === candidate) break;
    candidate = corrected;
  }
  const finalParts = formatter.formatToParts(new Date(candidate));
  if (partsAsUtc(finalParts) !== naive) throw new Error('Cette heure locale n’existe pas dans le fuseau choisi.');
  return new Date(candidate);
}
