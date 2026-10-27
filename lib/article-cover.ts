import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Covers drawn by /api/article-cover. Their text travels in the address, so the address is
 * signed: otherwise anyone could make jchub.dev serve a JcHub image saying whatever they like,
 * and each new address would cost a render. An unsigned address only gets the default card.
 */
export type ArticleCover = { title?: string | null; category?: string | null; photo?: string | null; lang?: 'en' | null };

export const ARTICLE_COVER_PATH = '/api/article-cover';

function signingKey(): string | null {
  // Derived from the cron secret, already set in every environment, unless a dedicated one exists.
  // Changing it turns the covers already shared into the default card.
  const secret = process.env.ARTICLE_COVER_SECRET || process.env.CRON_SECRET;
  if (secret) return createHmac('sha256', secret).update('jchub:article-cover:v1').digest('hex');
  return process.env.NODE_ENV === 'production' ? null : 'jchub-local-article-cover';
}

function signature({ title, category, photo, lang }: ArticleCover): string | null {
  const key = signingKey();
  if (!key) return null;
  const payload = JSON.stringify([title || '', category || '', photo || '', lang === 'en' ? 'en' : '']);
  return createHmac('sha256', key).update(payload).digest('base64url').slice(0, 22);
}

/** Address of the cover showing these texts; without text (or key), the default card in that language. */
export function articleCoverPath(cover: ArticleCover): string {
  const params = new URLSearchParams();
  const sig = cover.title || cover.category || cover.photo ? signature(cover) : null;
  if (sig && cover.title) params.set('title', cover.title);
  if (sig && cover.category) params.set('category', cover.category);
  if (sig && cover.photo) params.set('photo', cover.photo);
  if (cover.lang === 'en') params.set('lang', 'en');
  if (sig) params.set('sig', sig);
  const query = params.toString();
  return query ? `${ARTICLE_COVER_PATH}?${query}` : ARTICLE_COVER_PATH;
}

/** The cover an address asks for when this site signed it; otherwise only its language. */
export function readArticleCover(params: URLSearchParams): ArticleCover {
  const lang = params.get('lang') === 'en' ? 'en' : null;
  const cover: ArticleCover = { title: params.get('title'), category: params.get('category'), photo: params.get('photo'), lang };
  const expected = signature(cover);
  const given = params.get('sig') || '';
  const signed = Boolean(expected) && given.length === expected!.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected!));
  return signed ? cover : { lang };
}
