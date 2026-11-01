'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Loader2, MessageCircle, Send } from 'lucide-react';
import { bilingual } from '@/i18n/copy';
import { commentProblem, COMMENT_LIMITS, type BlogComment } from '@/lib/blog-comments';

const copy = bilingual({
  title: 'Commentaires',
  count: (count: number) => count === 0 ? 'Aucun commentaire pour le moment' : `${count} commentaire${count > 1 ? 's' : ''}`,
  empty: 'Sois le premier à donner ton avis ou à poser une question.',
  formTitle: 'Laisser un commentaire',
  name: 'Ton nom',
  namePlaceholder: 'Ex. : Marie',
  message: 'Ton commentaire',
  messagePlaceholder: 'Ton avis, ta question, ton astuce…',
  submit: 'Publier le commentaire',
  sending: 'Publication…',
  notice: 'Ton nom et ton commentaire seront visibles par tous. Reste courtois : les messages hors sujet ou abusifs sont supprimés.',
  thanks: 'Merci, ton commentaire est publié !',
  loadError: 'Impossible de charger les commentaires.',
  sendError: 'Impossible de publier ton commentaire pour le moment.',
  problems: { name: 'Indique un nom de 2 à 60 caractères.', message: 'Ton commentaire doit faire entre 3 et 2000 caractères.', links: 'Ton commentaire contient trop de liens (2 au maximum).' },
  dateLocale: 'fr-FR',
}, {
  title: 'Comments',
  count: (count: number) => count === 0 ? 'No comments yet' : `${count} comment${count > 1 ? 's' : ''}`,
  empty: 'Be the first to share your opinion or ask a question.',
  formTitle: 'Leave a comment',
  name: 'Your name',
  namePlaceholder: 'E.g. Mary',
  message: 'Your comment',
  messagePlaceholder: 'Your opinion, your question, your tip…',
  submit: 'Post comment',
  sending: 'Posting…',
  notice: 'Your name and comment will be visible to everyone. Please be courteous: off-topic or abusive messages are removed.',
  thanks: 'Thank you, your comment is posted!',
  loadError: 'Could not load the comments.',
  sendError: 'We can’t post your comment right now.',
  problems: { name: 'Enter a name of 2 to 60 characters.', message: 'Your comment must be 3 to 2000 characters long.', links: 'Your comment contains too many links (2 at most).' },
  dateLocale: 'en-GB',
});

const avatarTones = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-800', 'bg-violet-100 text-violet-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-800'];

/** Same colour for the same name, so a reader recognises who answers whom. */
function avatarTone(name: string) {
  let hash = 0;
  for (const character of name) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return avatarTones[hash % avatarTones.length];
}

const field = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100';

/** Comments of an article, shared by its French and English pages (found by the article id). */
export function ArticleComments({ articleId }: { articleId: string }) {
  const locale = useLocale();
  const t = copy[locale];
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [thanks, setThanks] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/blog/comments?article=${encodeURIComponent(articleId)}`, { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({})) as { comments?: BlogComment[] };
        if (!response.ok || !data.comments) throw new Error();
        if (!cancelled) setComments(data.comments);
      })
      .catch(() => { if (!cancelled) setLoadError(true); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [articleId]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(''); setThanks(false);
    const problem = commentProblem({ name, message });
    if (problem) { setError(t.problems[problem]); return; }
    setSending(true);
    try {
      const response = await fetch('/api/blog/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ articleId, name, message, website }) });
      const data = await response.json().catch(() => ({})) as { comment?: BlogComment; error?: string };
      if (!response.ok) throw new Error(data.error || t.sendError);
      if (data.comment) setComments((current) => [...current, data.comment!]);
      setMessage(''); setThanks(true);
    } catch (cause) { setError(cause instanceof Error && cause.message ? cause.message : t.sendError); }
    finally { setSending(false); }
  };

  const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat(t.dateLocale, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value)) : '';

  return (
    <section className="mt-12 border-t border-slate-200 pt-8" aria-labelledby="comments-title">
      <h2 id="comments-title" className="flex items-center gap-2 text-2xl font-black text-slate-900"><MessageCircle className="h-6 w-6 text-blue-600" />{t.title}</h2>
      <p className="mt-1 text-sm text-slate-500">{loaded && !loadError ? t.count(comments.length) : ' '}</p>

      {loadError ? <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{t.loadError}</p>
        : loaded && comments.length === 0 ? <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{t.empty}</p>
          : <ol className="mt-5 space-y-4">
            {comments.map((comment) => (
              <li key={comment.id} className="flex gap-3">
                <span aria-hidden="true" className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold uppercase ${avatarTone(comment.name)}`}>{comment.name.charAt(0)}</span>
                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3">
                  <p className="flex flex-wrap items-baseline gap-x-2"><strong className="text-sm font-bold text-slate-900">{comment.name}</strong>{comment.createdAt && <time dateTime={comment.createdAt} className="text-xs text-slate-400">{formatDate(comment.createdAt)}</time>}</p>
                  <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-6 text-slate-700">{comment.message}</p>
                </div>
              </li>
            ))}
          </ol>}

      <form onSubmit={submit} className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
        <h3 className="text-lg font-bold text-slate-900">{t.formTitle}</h3>
        <label className="mt-4 block text-sm font-semibold text-slate-700">{t.name}
          <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={COMMENT_LIMITS.name} autoComplete="name" placeholder={t.namePlaceholder} className={`${field} h-11 sm:max-w-xs`} />
        </label>
        <label className="mt-4 block text-sm font-semibold text-slate-700">{t.message}
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} required maxLength={COMMENT_LIMITS.message} rows={4} placeholder={t.messagePlaceholder} className={`${field} resize-y py-3 leading-6`} />
        </label>
        {/* Left empty by people, filled in by spam robots. */}
        <input type="text" name="website" value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
        <p className="mt-3 text-xs leading-5 text-slate-500">{t.notice}</p>
        {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {thanks && <p role="status" className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{t.thanks}</p>}
        <button type="submit" disabled={sending} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{sending ? t.sending : t.submit}
        </button>
      </form>
    </section>
  );
}
