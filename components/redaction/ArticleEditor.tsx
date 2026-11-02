'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertCircle, ArrowLeft, Bold, Check, CircleDashed, Code, Columns2, ExternalLink, Eye, Heading2, Heading3, Heading4, Image as ImageIcon, Italic, Link2, List, ListOrdered, Loader2, Lock, Minus, Pencil, Quote, Redo2, Send, SquareCode, Trash2, Undo2, X } from 'lucide-react';
import { articleUrl, canDelete, Card, CategoryField, deleteArticle, formatDay, Notice, StatusBadge } from '@/components/redaction/shared';
import { publicSiteUrl, useWriter, WRITER_TIMEOUT_EVENT, type WriterTimeoutEvent } from '@/components/redaction/WriterShell';
import { cachedJson, fetchJson, rememberJson } from '@/lib/admin-cache';
import { formatEdit, type Edit, type Format } from '@/lib/markdown-format';
import { parseKeywords, publicationChecks, readTime, slugify, wordCount, writingTips, WRITER_LIMITS, type WriterArticle } from '@/lib/writer-rules';

type Form = { title: string; description: string; content: string; category: string; keywords: string; plannedFor: string; slug: string };

const AUTOSAVE_DELAY_MS = 2500;
const field = 'w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500';

type Tool = { kind: Format; label: string; icon: typeof Bold };
const toolbar: Tool[][] = [
  [
    { kind: 'h2', label: 'Sous-titre (##)', icon: Heading2 },
    { kind: 'h3', label: 'Sous-partie (###)', icon: Heading3 },
    { kind: 'h4', label: 'Petit intertitre (####)', icon: Heading4 },
  ],
  [
    { kind: 'bold', label: 'Gras (Ctrl+B)', icon: Bold },
    { kind: 'italic', label: 'Italique (Ctrl+I)', icon: Italic },
    { kind: 'code', label: 'Code dans la phrase', icon: Code },
  ],
  [
    { kind: 'list', label: 'Liste à puces', icon: List },
    { kind: 'ordered', label: 'Liste numérotée', icon: ListOrdered },
    { kind: 'quote', label: 'Citation', icon: Quote },
  ],
  [
    { kind: 'link', label: 'Lien (Ctrl+K)', icon: Link2 },
    { kind: 'image', label: 'Image (adresse d’une image en ligne)', icon: ImageIcon },
    { kind: 'codeblock', label: 'Bloc de code', icon: SquareCode },
    { kind: 'rule', label: 'Séparateur', icon: Minus },
  ],
];

const blankForm = (plannedFor: string): Form => ({ title: '', description: '', content: '', category: 'Technologie', keywords: '', plannedFor, slug: '' });
const formOf = (article: WriterArticle): Form => ({ title: article.title, description: article.description, content: article.content, category: article.category || 'Technologie', keywords: article.keywords.join(', '), plannedFor: article.plannedFor || '', slug: article.slug });
const apiUrl = (id: string) => `/api/redaction/articles/${encodeURIComponent(id)}`;
const unsavedKey = (id: string) => `jchub_writer_unsaved_${id}`;

export function ArticleEditor({ id: initialId, initialPlannedFor = '' }: { id?: string; initialPlannedFor?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { name } = useWriter();
  // An article opened before in this tab shows at once; the server's copy follows.
  const [cached] = useState(() => initialId ? cachedJson<{ article?: WriterArticle }>(apiUrl(initialId))?.article : undefined);
  const [articleId, setArticleId] = useState(initialId || '');
  const [loading, setLoading] = useState(Boolean(initialId) && !cached);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState<Form>(() => cached ? formOf(cached) : blankForm(initialPlannedFor));
  const [status, setStatus] = useState(cached?.status || 'draft');
  const [publishedAt, setPublishedAt] = useState<string | null>(cached?.publishedAt || null);
  const [customSlug, setCustomSlug] = useState(cached?.customSlug || false);
  const [slugEditor, setSlugEditor] = useState<string | null>(null);
  const [views, setViews] = useState(cached?.views || 0);
  const [tab, setTab] = useState<'write' | 'preview' | 'split'>('write');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(cached?.updatedAt || null);
  const [error, setError] = useState('');
  const [missing, setMissing] = useState<string[]>([]);
  const [justPublished, setJustPublished] = useState<'first' | 'update' | null>(null);
  const [confirming, setConfirming] = useState(false);
  // Each change bumps the version; the article is saved when the saved version catches up.
  const versionRef = useRef(0);
  const [version, setVersion] = useState(0);
  const [savedVersion, setSavedVersion] = useState(0);
  const savingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  // Until the writer clicks in the text, a button adds its formatting at the end.
  const touchedRef = useRef(false);

  const dirty = version !== savedVersion;
  const isPublished = status === 'published';
  const readOnly = !loading && status !== 'draft' && status !== 'published';
  const checks = publicationChecks(form);
  const ready = checks.every((check) => check.ok);
  const tips = writingTips(form);
  const words = wordCount(form.content);
  const shownSlug = publishedAt || customSlug || !dirty ? form.slug || slugify(form.title) : slugify(form.title);

  // On a wide screen the text and its rendering sit side by side.
  useEffect(() => { if (window.matchMedia('(min-width: 1280px)').matches) setTab('split'); }, []);

  useEffect(() => {
    if (!initialId) return;
    let cancelled = false;
    (async () => {
      try {
        const { article } = await fetchJson<{ article?: WriterArticle }>(apiUrl(initialId), 'Impossible de charger cet article.');
        if (!article) throw new Error('Impossible de charger cet article.');
        if (cancelled) return;
        // Text typed meanwhile is kept: only an untouched form takes the server's copy.
        if (versionRef.current === 0) { setForm(formOf(article)); setSavedAt(article.updatedAt); }
        setStatus(article.status); setPublishedAt(article.publishedAt); setCustomSlug(article.customSlug); setViews(article.views);
      } catch (cause) { if (!cancelled) setLoadError(cause instanceof Error ? cause.message : 'Impossible de charger cet article.'); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [initialId]);

  // After its first save, a new article takes its own address (history.replaceState). Coming back to
  // "Créer un article" may reuse this editor rather than mount a new one: it starts blank again.
  const previousPathname = useRef(pathname);
  useEffect(() => {
    const previous = previousPathname.current;
    previousPathname.current = pathname;
    if (initialId || pathname !== '/admin/redaction/nouveau' || previous === pathname || !articleId) return;
    setArticleId(''); setForm(blankForm(initialPlannedFor)); setStatus('draft'); setPublishedAt(null); setCustomSlug(false);
    setSlugEditor(null); setViews(0); setTab('write'); setSavedAt(null); setError(''); setMissing([]); setJustPublished(null);
    versionRef.current = 0; setVersion(0); setSavedVersion(0);
  }, [initialId, initialPlannedFor, pathname, articleId]);

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    versionRef.current += 1;
    setVersion(versionRef.current);
    setJustPublished(null);
  };

  const save = useCallback(async ({ publish = false, slug }: { publish?: boolean; slug?: string } = {}) => {
    if (savingRef.current) return false;
    if (!form.title.trim()) { setError('Donnez un titre à l’article pour l’enregistrer.'); return false; }
    savingRef.current = true; setSaving(true); setError(''); setMissing([]);
    const savingVersion = versionRef.current;
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      content: form.content,
      category: form.category.trim(),
      keywords: parseKeywords(form.keywords),
      plannedFor: form.plannedFor || null,
    };
    try {
      let id = articleId;
      if (!id) {
        const response = await fetch('/api/redaction/articles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await response.json().catch(() => ({})) as { id?: string; slug?: string; error?: string };
        if (!response.ok || !data.id) throw new Error(data.error || 'Enregistrement impossible.');
        id = data.id;
        setArticleId(id);
        setForm((current) => ({ ...current, slug: data.slug || current.slug }));
        // The address now names the article, without reloading the editor.
        window.history.replaceState(null, '', `/admin/redaction/articles/${encodeURIComponent(id)}`);
        if (!publish && slug === undefined) { setSavedVersion(savingVersion); setSavedAt(new Date().toISOString()); return true; }
      }
      const response = await fetch(`/api/redaction/articles/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, ...(slug !== undefined ? { slug } : {}), ...(publish ? { publish: true } : {}) }) });
      const data = await response.json().catch(() => ({})) as { slug?: string; status?: string; savedAt?: string; error?: string; missing?: string[] };
      if (!response.ok) { setMissing(data.missing || []); throw new Error(data.error || 'Enregistrement impossible.'); }
      setSavedVersion(savingVersion); setSavedAt(data.savedAt || new Date().toISOString());
      // The copy kept for the next opening of this article follows what was just saved.
      const kept = cachedJson<{ article?: WriterArticle }>(apiUrl(id))?.article;
      if (kept) {
        rememberJson(apiUrl(id), { article: { ...kept, ...payload, keywords: payload.keywords, plannedFor: payload.plannedFor, slug: data.slug || kept.slug, status: data.status || kept.status, updatedAt: data.savedAt || kept.updatedAt, customSlug: kept.customSlug || slug !== undefined, publishedAt: kept.publishedAt || (publish ? new Date().toISOString() : null) } });
      }
      if (data.slug) setForm((current) => ({ ...current, slug: data.slug! }));
      if (slug !== undefined) setCustomSlug(true);
      if (data.status) setStatus(data.status);
      if (publish) { setPublishedAt((current) => current || new Date().toISOString()); setJustPublished('first'); }
      else if (status === 'published') setJustPublished('update');
      return true;
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Enregistrement impossible.'); return false; }
    finally { savingRef.current = false; setSaving(false); }
  }, [articleId, form, status]);

  // Drafts save themselves; a published article waits for "Mettre à jour", since each save is redeployed.
  useEffect(() => {
    if (!dirty || isPublished || readOnly || loading || !form.title.trim()) return;
    const timer = window.setTimeout(() => { void save(); }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [dirty, version, savedVersion, isPublished, readOnly, loading, form.title, save]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); if (!readOnly && dirty) void save(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dirty, readOnly, save]);

  // Signed out for inactivity: a draft is saved; changes to a published article are kept in this
  // tab (they wait for « Mettre à jour ») and come back when the writer opens the article again.
  const leavingRef = useRef(false);
  useEffect(() => {
    const onTimeout = (event: Event) => {
      leavingRef.current = true;
      if (!dirty || readOnly) return;
      if (isPublished) {
        try { sessionStorage.setItem(unsavedKey(articleId), JSON.stringify(form)); } catch { /* Storage unavailable: nothing more to do. */ }
      } else if (form.title.trim()) (event as WriterTimeoutEvent).detail.waitUntil(save());
    };
    window.addEventListener(WRITER_TIMEOUT_EVENT, onTimeout);
    return () => window.removeEventListener(WRITER_TIMEOUT_EVENT, onTimeout);
  }, [dirty, readOnly, isPublished, articleId, form, save]);

  // Changes kept at the last sign-out come back once the article is loaded.
  const [recovered, setRecovered] = useState(false);
  useEffect(() => {
    if (loading || !articleId) return;
    let kept: string | null = null;
    try { kept = sessionStorage.getItem(unsavedKey(articleId)); sessionStorage.removeItem(unsavedKey(articleId)); } catch { return; }
    if (!kept) return;
    try {
      setForm({ ...blankForm(''), ...(JSON.parse(kept) as Partial<Form>) });
      versionRef.current += 1; setVersion(versionRef.current); setRecovered(true);
    } catch { /* A damaged copy is dropped. */ }
  }, [loading, articleId]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => { if (leavingRef.current) return; event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  /** Applies an edit where the writer is, without moving the page or the text under their eyes. */
  const runEdit = (edit: Edit) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const pageTop = window.scrollY;
    const textTop = touchedRef.current ? textarea.scrollTop : textarea.scrollHeight;
    textarea.focus({ preventScroll: true });
    textarea.setSelectionRange(edit.from, edit.to);
    // insertText keeps the change in the browser's history, so Ctrl+Z and « Annuler » undo it.
    const inserted = document.execCommand('insertText', false, edit.text);
    if (!inserted) update('content', textarea.value.slice(0, edit.from) + edit.text + textarea.value.slice(edit.to));
    requestAnimationFrame(() => {
      textarea.setSelectionRange(edit.selectStart, edit.selectEnd);
      textarea.scrollTop = textTop;
      window.scrollTo({ top: pageTop });
    });
    touchedRef.current = true;
  };

  const format = (kind: Format) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = touchedRef.current ? textarea.selectionStart : textarea.value.length;
    const end = touchedRef.current ? textarea.selectionEnd : textarea.value.length;
    runEdit(formatEdit(textarea.value, start, end, kind));
  };

  const history = (command: 'undo' | 'redo') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const pageTop = window.scrollY;
    textarea.focus({ preventScroll: true });
    document.execCommand(command);
    window.scrollTo({ top: pageTop });
  };

  const onEditorKey = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const kind = ({ b: 'bold', i: 'italic', k: 'link' } as Record<string, Format>)[event.key.toLowerCase()];
    if (kind) { event.preventDefault(); format(kind); }
  };

  // In the side-by-side view, the rendering follows the text as it scrolls.
  const followScroll = () => {
    const textarea = textareaRef.current;
    const preview = previewRef.current;
    if (!textarea || !preview || tab !== 'split') return;
    const ratio = textarea.scrollTop / Math.max(1, textarea.scrollHeight - textarea.clientHeight);
    preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
  };

  const publish = async () => {
    await save({ publish: true });
    setConfirming(false);
  };

  const remove = async () => {
    if (!articleId || !window.confirm('Supprimer ce brouillon ? Cette action est définitive.')) return;
    try { await deleteArticle(articleId); setSavedVersion(versionRef.current); router.push('/admin/redaction/articles'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Suppression impossible.'); }
  };

  const saveState = saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Enregistrement…</>
    : dirty ? <><CircleDashed className="h-3.5 w-3.5" />{isPublished ? 'Modifications non publiées' : 'Modifications en attente'}</>
      : savedAt ? <><Check className="h-3.5 w-3.5 text-emerald-600" />Enregistré {new Date(savedAt).toDateString() === new Date().toDateString() ? `à ${new Date(savedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : `le ${formatDay(savedAt)}`}</> : null;

  if (loadError) return <div className="mx-auto max-w-xl space-y-4"><Notice>{loadError}</Notice><Link href="/admin/redaction/articles" className="inline-flex items-center gap-2 text-sm font-medium text-blue-700"><ArrowLeft className="h-4 w-4" />Retour à mes articles</Link></div>;

  return <div className="mx-auto max-w-[1240px] space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <Link href="/admin/redaction/articles" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-700"><ArrowLeft className="h-4 w-4" />Mes articles</Link>
        <h1 className="mt-1 flex flex-wrap items-center gap-3 text-[26px] font-extrabold tracking-tight text-[#0f1c3f]">{articleId ? 'Modifier l’article' : 'Nouvel article'}{!loading && <StatusBadge status={status} />}</h1>
      </div>
      {!readOnly && <div className="flex flex-wrap items-center gap-2.5">
        <span className="flex items-center gap-1.5 text-xs text-slate-500" aria-live="polite">{saveState}</span>
        {isPublished ? <>
          <a href={articleUrl(form.slug)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-300"><ExternalLink className="h-4 w-4" />Voir en ligne</a>
          <button onClick={() => void save()} disabled={saving || loading || !dirty} className="inline-flex items-center gap-2 rounded-lg bg-[#1f6feb] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"><Send className="h-4 w-4" />Mettre à jour l’article</button>
        </> : <>
          <button onClick={() => void save()} disabled={saving || loading || (!dirty && Boolean(articleId))} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-300 disabled:opacity-50">Enregistrer</button>
          <button onClick={() => { setError(''); if (ready) setConfirming(true); else { setMissing(checks.filter((check) => !check.ok).map((check) => check.label)); setError('L’article n’est pas encore prêt à être publié.'); } }} disabled={saving || loading} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"><Send className="h-4 w-4" />Publier</button>
        </>}
      </div>}
    </header>

    {recovered && <Notice tone="info">Vos modifications non publiées, gardées lors de votre déconnexion automatique, ont été récupérées. Cliquez sur « Mettre à jour l’article » pour les publier.</Notice>}
    {readOnly && <Notice tone="info">Cet article est {status === 'archived' ? 'archivé' : 'programmé'} par l’administrateur : il n’est plus modifiable depuis votre espace.</Notice>}
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><p className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>{missing.length > 0 && <ul className="ml-6 mt-2 list-disc space-y-0.5">{missing.map((item) => <li key={item}>{item}</li>)}</ul>}</div>}
    {justPublished && <Notice tone="success">{justPublished === 'first' ? 'Article publié ! ' : 'Modifications publiées. '}Le site sera à jour dans quelques minutes, le temps de la mise en ligne{justPublished === 'first' ? ', puis la version anglaise suivra' : ''}. <a href={articleUrl(form.slug)} target="_blank" rel="noreferrer" className="font-semibold underline">Voir l’article</a></Notice>}

    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="min-w-0 p-4 sm:p-6">
        <fieldset disabled={readOnly || loading} className="space-y-5">
          <div>
            <label htmlFor="article-title" className="sr-only">Titre</label>
            <textarea id="article-title" rows={2} maxLength={WRITER_LIMITS.title} value={form.title} onChange={(event) => update('title', event.target.value.replace(/\n/g, ' '))} placeholder="Titre de l’article" className="w-full resize-none border-0 border-b border-slate-200 bg-transparent px-0 pb-3 text-2xl font-extrabold leading-tight text-[#0f1c3f] outline-none placeholder:text-slate-300 focus:border-blue-400 sm:text-[28px]" />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              {slugEditor !== null ? <form onSubmit={(event) => { event.preventDefault(); void save({ slug: slugEditor }).then((ok) => { if (ok) setSlugEditor(null); }); }} className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="hidden shrink-0 sm:inline">{publicSiteUrl.replace(/^https?:\/\//, '')}/fr/blog/</span>
                <input autoFocus value={slugEditor} onChange={(event) => setSlugEditor(event.target.value)} aria-label="Adresse de l’article" maxLength={WRITER_LIMITS.slug} className="h-8 min-w-0 flex-1 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-blue-400" />
                <button disabled={saving} className="grid h-8 w-8 place-items-center rounded-md bg-blue-600 text-white disabled:opacity-50" aria-label="Valider l’adresse"><Check className="h-4 w-4" /></button>
                <button type="button" onClick={() => setSlugEditor(null)} className="grid h-8 w-8 place-items-center rounded-md border border-slate-200" aria-label="Annuler"><X className="h-4 w-4" /></button>
              </form> : <span className="flex min-w-0 items-center gap-1.5"><span className="truncate">Adresse : {publicSiteUrl.replace(/^https?:\/\//, '')}/fr/blog/<strong className="font-semibold text-slate-700">{shownSlug || '…'}</strong></span>
                {publishedAt ? <Lock className="h-3.5 w-3.5 shrink-0" aria-label="L’adresse ne change plus après la publication" /> : articleId && !readOnly && <button type="button" onClick={() => setSlugEditor(shownSlug)} className="inline-flex shrink-0 items-center gap-1 font-medium text-blue-700 hover:underline"><Pencil className="h-3 w-3" />Modifier</button>}</span>}
              <span className={form.title.length > 70 ? 'text-amber-600' : ''}>{form.title.length}/70</span>
            </div>
          </div>

          <label className="block text-sm font-semibold text-slate-700">Résumé
            <span className="ml-1 font-normal text-slate-500">— affiché sous le titre et dans Google</span>
            <textarea rows={3} maxLength={WRITER_LIMITS.description} value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="En une ou deux phrases : ce que le lecteur va apprendre." className={`${field} mt-1.5 py-2.5 leading-6`} />
            <span className={`mt-1 block text-right text-xs font-normal ${form.description.trim().length >= 120 && form.description.trim().length <= 160 ? 'text-emerald-600' : 'text-slate-500'}`}>{form.description.trim().length} caractères · idéal : 120 à 160</span>
          </label>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200">
              <div role="tablist" className="flex">
                {([['write', 'Écrire', Pencil], ['preview', 'Aperçu', Eye], ['split', 'Côte à côte', Columns2]] as const).map(([value, label, Icon]) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`-mb-px items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold sm:px-4 ${value === 'split' ? 'hidden xl:inline-flex' : 'inline-flex'} ${tab === value ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Icon className="h-4 w-4" />{label}</button>)}
              </div>
            </div>
            {tab !== 'preview' && <div className="mt-3 flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-1" role="toolbar" aria-label="Mise en forme">
              {/* onMouseDown keeps the cursor and the selection in the text. */}
              {toolbar.map((group, index) => <div key={index} className="flex items-center gap-0.5 border-slate-200 pr-1 [&:not(:last-child)]:border-r">{group.map(({ kind, label, icon: Icon }) => <button key={kind} type="button" title={label} aria-label={label} onMouseDown={(event) => event.preventDefault()} onClick={() => format(kind)} className="grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"><Icon className="h-4 w-4" /></button>)}</div>)}
              <div className="ml-auto flex items-center gap-0.5">
                <button type="button" title="Annuler (Ctrl+Z)" aria-label="Annuler" onMouseDown={(event) => event.preventDefault()} onClick={() => history('undo')} className="grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"><Undo2 className="h-4 w-4" /></button>
                <button type="button" title="Rétablir (Ctrl+Y)" aria-label="Rétablir" onMouseDown={(event) => event.preventDefault()} onClick={() => history('redo')} className="grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"><Redo2 className="h-4 w-4" /></button>
              </div>
            </div>}
            <div className={tab === 'split' ? 'mt-3 grid gap-4 xl:grid-cols-2' : 'mt-3'}>
              {tab !== 'preview' && <textarea ref={textareaRef} aria-label="Contenu de l’article" value={form.content} onChange={(event) => update('content', event.target.value)} onKeyDown={onEditorKey} onFocus={() => { touchedRef.current = true; }} onScroll={followScroll} maxLength={WRITER_LIMITS.content} placeholder={'Introduction : le problème et ce que le lecteur va apprendre.\n\n## Premier sous-titre\n\nVotre texte…'} className={`w-full rounded-lg border border-slate-200 bg-white p-4 text-[15px] leading-7 text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 ${tab === 'split' ? 'h-[70vh] min-h-[480px] resize-none' : 'min-h-[360px] resize-y sm:min-h-[480px]'}`} />}
              {tab !== 'write' && <div ref={previewRef} className={tab === 'split' ? 'h-[70vh] min-h-[480px] overflow-y-auto rounded-lg border border-slate-200' : ''}>
                <article className={`min-h-[360px] bg-white p-4 sm:min-h-[480px] ${tab === 'split' ? 'sm:p-6' : 'rounded-lg border border-slate-200 sm:p-8'}`}>
                  {form.category && <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{form.category}</span>}
                  <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">{form.title || 'Titre de l’article'}</h1>
                  {form.description && <p className="mt-3 text-lg leading-8 text-slate-600">{form.description}</p>}
                  <p className="mt-4 border-b border-slate-100 pb-5 text-sm text-slate-600">Par <strong className="text-slate-900">{name}</strong> · {readTime(form.content)} de lecture</p>
                  <div className="article-markdown article-markdown--light mt-6"><ReactMarkdown components={{ h1: ({ children }) => <h2>{children}</h2>, a: ({ href, title, children }) => <a href={href} title={title} target="_blank" rel="noreferrer">{children}</a> }}>{form.content.replace(/^\s*#\s+[^\n]*\n+/, '') || '*Le texte apparaîtra ici.*'}</ReactMarkdown></div>
                </article>
              </div>}
            </div>
            <p className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500"><span>{words.toLocaleString('fr-FR')} mots · {readTime(form.content)} de lecture</span><Link href="/admin/redaction/ressources#markdown" className="text-blue-700 hover:underline">Aide à la mise en forme</Link></p>
          </div>
        </fieldset>
      </Card>

      {/* Stays in view while the writer scrolls through a long text. */}
      <div className="space-y-5 lg:sticky lg:top-[92px] lg:max-h-[calc(100vh-108px)] lg:overflow-y-auto lg:pb-1">
        <Card className="p-5">
          <h2 className="text-sm font-bold text-[#0f1c3f]">{isPublished ? 'Article en ligne' : 'Avant de publier'}</h2>
          {isPublished && <p className="mt-2 text-sm text-slate-600">Publié le {formatDay(publishedAt)} · <strong className="font-semibold text-slate-800">{views.toLocaleString('fr-FR')}</strong> vue{views > 1 ? 's' : ''}</p>}
          <ul className="mt-3 space-y-2">{checks.map((check) => <li key={check.id} className={`flex items-start gap-2 text-sm ${check.ok ? 'text-slate-600' : 'text-slate-800'}`}>{check.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}{check.label}</li>)}</ul>
          {tips.length > 0 && <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">{tips.map((tip) => <p key={tip} className="text-xs leading-5 text-slate-500">💡 {tip}</p>)}</div>}
        </Card>

        <Card className="p-5">
          <fieldset disabled={readOnly || loading} className="space-y-4">
            <label htmlFor="article-category" className="block text-sm font-semibold text-slate-700">Catégorie
              <CategoryField id="article-category" value={form.category} onChange={(value) => update('category', value)} className={`${field} mt-1.5 h-10`} />
              <span className="mt-1 block text-xs font-normal text-slate-500">Choisissez une suggestion, ou saisissez une nouvelle catégorie et ajoutez-la à la liste.</span>
            </label>
            <label className="block text-sm font-semibold text-slate-700">Mots-clés
              <input value={form.keywords} onChange={(event) => update('keywords', event.target.value)} placeholder="windows 11, ancien pc, installation" className={`${field} mt-1.5 h-10`} />
              <span className="mt-1 block text-xs font-normal text-slate-500">Séparés par des virgules, {WRITER_LIMITS.keywords} au plus : ce que les lecteurs taperaient dans Google.</span>
            </label>
            {!isPublished && <label className="block text-sm font-semibold text-slate-700">Date prévue
              <input type="date" value={form.plannedFor} onChange={(event) => update('plannedFor', event.target.value)} className={`${field} mt-1.5 h-10`} />
              <span className="mt-1 block text-xs font-normal text-slate-500">Place l’article dans votre calendrier éditorial.</span>
            </label>}
          </fieldset>
        </Card>

        {articleId && canDelete({ status, publishedAt }) && <button onClick={() => void remove()} className="inline-flex items-center gap-2 px-1 text-sm text-red-600 hover:underline"><Trash2 className="h-4 w-4" />Supprimer le brouillon</button>}
      </div>
    </div>

    {confirming && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3" role="dialog" aria-modal="true" aria-labelledby="publish-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 id="publish-title" className="text-lg font-extrabold text-[#0f1c3f]">Publier cet article ?</h2>
        <p className="mt-2 text-sm font-semibold text-slate-800">« {form.title} »</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-600">
          <li>Il sera visible sur {publicSiteUrl.replace(/^https?:\/\//, '')} dans quelques minutes, signé {name}.</li>
          <li>Une version anglaise est créée automatiquement.</li>
          <li>Son adresse ne pourra plus changer. Le texte, lui, restera modifiable.</li>
        </ul>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setConfirming(false)} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Annuler</button>
          <button onClick={() => void publish()} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Publier maintenant</button>
        </div>
      </div>
    </div>}
  </div>;
}
