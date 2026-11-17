import 'server-only';

import { revalidateTag, unstable_cache } from 'next/cache';
import { getAdminDb } from '@/lib/firebase-admin';
import type { BlogComment } from '@/lib/blog-comments';

/**
 * The comments of an article, kept in the shared Next cache until one is added or deleted: an
 * article page no longer reads Firestore at each visit (Firestore usage of November 2026).
 */

const ALL_COMMENTS = 'blog-comments';
const articleTag = (articleId: string) => `blog-comments:${articleId}`;

export function cachedComments(articleId: string, max: number): Promise<BlogComment[]> {
  return unstable_cache(async () => {
    const snapshot = await getAdminDb().collection('blog_comments').where('articleId', '==', articleId).limit(max).get();
    return snapshot.docs
      .map((document) => {
        const data = document.data();
        return { id: document.id, name: String(data.name || ''), message: String(data.message || ''), createdAt: data.createdAt?.toDate?.()?.toISOString() || null };
      })
      .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  }, ['blog-comments', articleId, String(max)], { tags: [ALL_COMMENTS, articleTag(articleId)], revalidate: 86400 })();
}

/** After a comment was added to this article, or deleted (any article). */
export function revalidateComments(articleId?: string) {
  try {
    revalidateTag(articleId ? articleTag(articleId) : ALL_COMMENTS, { expire: 0 });
  } catch (error) {
    console.warn('[comments] Cache non vidé :', error instanceof Error ? error.message : error);
  }
}
