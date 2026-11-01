/**
 * Rules of the article comments: a name and a message, published at once, with no account.
 * The browser and the server check the same limits.
 *
 * This module has no Next.js or Firebase import so that the tests and the browser can use it.
 */

export const COMMENT_LIMITS = { name: 60, message: 2000, links: 2 } as const;
export const MIN_COMMENT_LENGTH = 3;

/** Comment as the article page shows it. createdAt is an ISO string. */
export type BlogComment = { id: string; name: string; message: string; createdAt: string | null };

/** Comment as the admin moderates it, with the article it was written on. */
export type AdminBlogComment = BlogComment & { articleId: string; articleTitle: string; articleSlug: string; locale: string };

export type CommentProblem = 'name' | 'message' | 'links';

/** Trimmed name and message, with spaces and blank lines tidied. */
export function cleanComment(input: { name: string; message: string }): { name: string; message: string } {
  return {
    name: input.name.replace(/\s+/g, ' ').trim(),
    message: input.message.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(),
  };
}

/** What stops a comment from being published, or null. Links are counted to keep spam out. */
export function commentProblem(input: { name: string; message: string }): CommentProblem | null {
  const { name, message } = cleanComment(input);
  if (name.length < 2 || name.length > COMMENT_LIMITS.name) return 'name';
  if (message.length < MIN_COMMENT_LENGTH || message.length > COMMENT_LIMITS.message) return 'message';
  if ((message.match(/https?:\/\/|www\./gi)?.length ?? 0) > COMMENT_LIMITS.links) return 'links';
  return null;
}
