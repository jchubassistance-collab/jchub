'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { cachedJson, fetchJson, rememberJson } from '@/lib/admin-cache';
import type { AdminBlogComment } from '@/lib/blog-comments';

export const COMMENTS_URL = '/api/admin/comments';
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://jchub.dev').replace(/\/$/, '');

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Date inconnue';
}

/** Comments of the blog articles, newest first: the admin deletes the unwanted ones. */
export function CommentsModeration({ onCount }: { onCount?: (count: number) => void }) {
  const [comments, setComments] = useState<AdminBlogComment[]>(() => cachedJson<{ comments?: AdminBlogComment[] }>(COMMENTS_URL)?.comments || []);
  const [loaded, setLoaded] = useState(() => cachedJson(COMMENTS_URL) !== undefined);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState('');

  useEffect(() => {
    fetchJson<{ comments?: AdminBlogComment[] }>(COMMENTS_URL, 'Impossible de charger les commentaires.')
      .then((data) => { setComments(data.comments || []); setLoaded(true); })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Impossible de charger les commentaires.'));
  }, []);
  useEffect(() => { onCount?.(comments.length); }, [comments.length, onCount]);

  const remove = async (comment: AdminBlogComment) => {
    if (!window.confirm(`Supprimer le commentaire de ${comment.name} ? Il disparaîtra de l’article.`)) return;
    setDeleting(comment.id); setError('');
    try {
      const response = await fetch(COMMENTS_URL, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ commentId: comment.id }) });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Suppression impossible.');
      const next = comments.filter((item) => item.id !== comment.id);
      setComments(next);
      rememberJson(COMMENTS_URL, { comments: next });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Suppression impossible.'); }
    finally { setDeleting(''); }
  };

  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    {error && <p role="alert" className="m-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {!loaded && !error ? null : comments.length ? <ul className="divide-y divide-slate-100">
      {comments.map((comment) => <li key={comment.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm"><strong className="text-slate-900">{comment.name}</strong><span className="text-xs text-slate-400">{formatDate(comment.createdAt)} · version {comment.locale === 'en' ? 'anglaise' : 'française'}</span></p>
          <a href={`${siteUrl}/fr/blog/${encodeURIComponent(comment.articleSlug)}#comments-title`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">{comment.articleTitle}<ExternalLink className="h-3 w-3" /></a>
          <p className="mt-2 whitespace-pre-line break-words rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{comment.message}</p>
        </div>
        <button type="button" onClick={() => void remove(comment)} disabled={deleting === comment.id} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">{deleting === comment.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Supprimer</button>
      </li>)}
    </ul> : <p className="p-8 text-center text-sm text-slate-500">Aucun commentaire sur les articles pour le moment.</p>}
    <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">Les commentaires sont publiés dès leur envoi. Supprime ceux qui sont hors sujet, abusifs ou publicitaires.</p>
  </section>;
}
