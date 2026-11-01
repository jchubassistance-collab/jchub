import 'server-only';

import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { buildArticleFiles, isPublicArticleStatus, parseArticleFiles } from '@/lib/article-files';
import { getAdminDb, hasFirebaseAdminConfig } from '@/lib/firebase-admin';

/**
 * Articles as Firestore holds them right now. The blog reads them on top of content/articles,
 * so an article published from the admin or the writing space is online at once, without
 * waiting for its files to be committed and the site redeployed. Each change to an article
 * calls revalidateBlog(); without it the copy is refreshed every few minutes anyway.
 */

const BLOG_TAG = 'blog-articles';
const REFRESH_SECONDS = 300;

export type LiveArticles = {
  /** Public articles, in the shape lib/blog.ts reads from the files. */
  records: Record<string, unknown>[];
  /** Ids of articles that exist but are not public (draft, archived…): their files must not show them. */
  hidden: string[];
};

/** Each article goes through the same files the repository keeps, so both sources read alike. */
function toRecord(id: string, data: Record<string, unknown>): Record<string, unknown> | null {
  const files = Object.values(buildArticleFiles(id, data));
  return files.length ? parseArticleFiles(id, files[0], files[1]) : null;
}

const readLiveArticles = unstable_cache(async (): Promise<LiveArticles> => {
  const db = getAdminDb();
  const [statuses, publics] = await Promise.all([
    db.collection('articles').select('status').get(),
    db.collection('articles').where('status', 'in', ['published', 'scheduled']).get(),
  ]);
  return {
    records: publics.docs.flatMap((document) => { const record = toRecord(document.id, document.data()); return record ? [record] : []; }),
    hidden: statuses.docs.filter((document) => !isPublicArticleStatus(document.data().status)).map((document) => document.id),
  };
}, ['live-articles'], { tags: [BLOG_TAG], revalidate: REFRESH_SECONDS });

/** Firestore's articles, or null when it cannot answer: the blog then shows the files alone. */
export async function getLiveArticles(): Promise<LiveArticles | null> {
  if (!hasFirebaseAdminConfig()) return null;
  try {
    return await readLiveArticles();
  } catch (error) {
    console.error('[blog] Articles Firestore illisibles, seuls les fichiers sont affichés :', error instanceof Error ? error.message : error);
    return null;
  }
}

/** After an article changed: the next visit of the blog, its pages, the sitemap and the feeds reads Firestore again. */
export function revalidateBlog() {
  try {
    revalidateTag(BLOG_TAG, { expire: 0 });
    // Also pages kept before the article existed, such as a 404 at its address.
    revalidatePath('/[locale]', 'layout');
  } catch (error) {
    // Outside a request (a script), there is no cache to clear.
    console.warn('[blog] Cache du blog non rafraîchi :', error instanceof Error ? error.message : error);
  }
}
