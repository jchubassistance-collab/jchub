'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, Check, Eye, FolderDown, Loader2, Pencil, Sparkles, Trash2, Undo2, X } from 'lucide-react';
import { cachedJson, fetchJson, rememberJson } from '@/lib/admin-cache';
import { sectionsToText, textToSections, type StoredResource } from '@/lib/resource-schema';

type BuiltIn = { id: string; kind: string; gated: boolean; fr: { slug: string; title: string }; en: { slug: string; title: string } };
type ResourcesData = { builtIn?: BuiltIn[]; stored?: StoredResource[]; firestore?: boolean };
type Locale = 'fr' | 'en';
type TextFields = { slug: string; title: string; summary: string; seoTitle: string; seoDescription: string; content: string };
type Editor = { id: string; kind: 'cheatsheet' | 'checklist'; code: boolean; fr: TextFields; en: TextFields };

const URL_LIST = '/api/admin/resources';
const URL_AGENT = '/api/admin/resources/agent';
type AgentRun = { id: string; trigger: string; status: string; drafts: number; failures: string[]; createdAt: string | null; finishedAt: string | null };
const RUN_STATUS: Record<string, string> = { started: 'démarrée', writing: 'rédaction en cours', done: 'terminée', failed: 'échouée' };
const KIND_LABELS: Record<string, string> = { cheatsheet: 'Aide-mémoire', checklist: 'Checklist', template: 'Modèle' };
const input = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
const FIELDS: { key: keyof Omit<TextFields, 'content'>; label: string; max: number; long?: boolean }[] = [
  { key: 'title', label: 'Titre', max: 80 },
  { key: 'slug', label: 'Adresse (slug)', max: 80 },
  { key: 'summary', label: 'Résumé affiché sur la page', max: 220, long: true },
  { key: 'seoTitle', label: 'Titre Google', max: 90 },
  { key: 'seoDescription', label: 'Description Google', max: 200, long: true },
];

function toEditor(resource: StoredResource): Editor {
  const fields = (locale: Locale): TextFields => ({
    slug: resource[locale].slug,
    title: resource[locale].title,
    summary: resource[locale].summary,
    seoTitle: resource[locale].seoTitle,
    seoDescription: resource[locale].seoDescription,
    content: sectionsToText(resource[locale].sections ?? []),
  });
  return { id: resource.id, kind: resource.kind === 'checklist' ? 'checklist' : 'cheatsheet', code: Boolean(resource.code), fr: fields('fr'), en: fields('en') };
}

async function send(url: string, method: string, body?: unknown) {
  const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await response.json().catch(() => ({})) as { error?: string; resource?: StoredResource };
  if (!response.ok) throw new Error(data.error || 'L’opération a échoué.');
  return data;
}

export default function AdminResourcesPage() {
  const [data, setData] = useState<ResourcesData>(() => cachedJson<ResourcesData>(URL_LIST) ?? {});
  const [topic, setTopic] = useState('');
  const [kind, setKind] = useState<'cheatsheet' | 'checklist'>('cheatsheet');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState<Editor | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>(() => cachedJson<{ runs?: AgentRun[] }>(URL_AGENT)?.runs ?? []);

  const refresh = useCallback(async () => {
    try {
      const [list, agent] = await Promise.all([
        fetchJson<ResourcesData>(URL_LIST, 'Impossible de charger les ressources.'),
        fetchJson<{ runs?: AgentRun[] }>(URL_AGENT, 'Impossible de charger les recherches.').catch(() => ({ runs: [] })),
      ]);
      setData(list);
      setRuns(agent.runs ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de charger les ressources.');
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const replaceStored = (resource: StoredResource) => setData((current) => {
    const stored = current.stored ?? [];
    const next = { ...current, stored: stored.some((item) => item.id === resource.id) ? stored.map((item) => item.id === resource.id ? resource : item) : [resource, ...stored] };
    rememberJson(URL_LIST, next);
    return next;
  });

  const run = async (label: string, action: () => Promise<void>) => {
    setBusy(label);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'L’opération a échoué.');
    } finally {
      setBusy('');
    }
  };

  const generate = () => run('generate', async () => {
    const { resource } = await send(URL_LIST, 'POST', { topic, kind, notes });
    if (!resource) throw new Error('La ressource générée est introuvable.');
    replaceStored(resource);
    setEditor(toEditor(resource));
    setTopic('');
    setNotes('');
    setNotice('Brouillon créé. Relis-le, corrige ce qui doit l’être, puis publie-le.');
  });

  const startAgent = () => run('agent', async () => {
    await send(URL_AGENT, 'POST');
    setNotice('Recherche lancée. Les brouillons apparaîtront ici dans quelques minutes, et tu recevras un e-mail.');
    setRuns(await fetchJson<{ runs?: AgentRun[] }>(URL_AGENT).then((value) => value.runs ?? []).catch(() => runs));
  });

  const setStatus = (resource: StoredResource, status: 'draft' | 'published') => run(resource.id, async () => {
    const saved = await send(`${URL_LIST}/${resource.id}`, 'PATCH', { status });
    if (saved.resource) replaceStored(saved.resource);
    setNotice(status === 'published' ? 'Ressource publiée : elle apparaît sur le site d’ici une minute.' : 'Ressource retirée du site.');
  });

  const remove = (resource: StoredResource) => {
    if (!window.confirm(`Supprimer définitivement « ${resource.fr.title} » ?`)) return;
    void run(resource.id, async () => {
      await send(`${URL_LIST}/${resource.id}`, 'DELETE');
      setData((current) => ({ ...current, stored: (current.stored ?? []).filter((item) => item.id !== resource.id) }));
      if (editor?.id === resource.id) setEditor(null);
      setNotice('Ressource supprimée.');
    });
  };

  const stored = data.stored ?? [];
  return (
    <main className="mx-auto max-w-[1500px] space-y-5 pb-10">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Ressources</h1>
        <p className="mt-1 text-sm text-slate-500">Crée des aide-mémoire et des checklists avec l’IA, relis-les puis publie-les sur la page Ressources, en français et en anglais.</p>
      </header>
      {error && <p role="alert" className="whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}
      {data.firestore === false && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Firebase n’est pas configuré : la création de ressources est indisponible.</p>}

      <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-violet-200 bg-violet-50/60 p-5">
        <div className="max-w-3xl">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><Bot className="h-4 w-4 text-violet-600" /> Recherche automatique</h2>
          <p className="mt-1 text-sm text-slate-600">Chaque lundi à 8 h (Brazzaville), l’IA regarde ce que les gens cherchent : les recherches faites sur JcHub, les suggestions Google et les sujets les plus demandés sur Stack Overflow. Elle rédige au moins 2 ressources sur les sujets les plus demandés, en brouillon, et t’envoie un e-mail. Tu n’as plus qu’à relire et publier.</p>
          {runs[0] && <p className="mt-2 text-xs text-slate-500">Dernière recherche : {runs[0].createdAt ? new Date(runs[0].createdAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : '?'} ({runs[0].trigger === 'cron' ? 'automatique' : 'manuelle'}), {RUN_STATUS[runs[0].status] ?? runs[0].status}{runs[0].status === 'done' || runs[0].status === 'failed' ? `, ${runs[0].drafts} brouillon(s)` : ''}.{runs[0].failures.length > 0 && <span className="mt-1 block text-amber-700">{runs[0].failures.join(' · ')}</span>}</p>}
        </div>
        <button type="button" onClick={() => void startAgent()} disabled={Boolean(busy) || data.firestore === false} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-violet-300 bg-white px-4 text-xs font-bold text-violet-700 hover:bg-violet-50 disabled:opacity-50">
          {busy === 'agent' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />} Lancer la recherche maintenant
        </button>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900"><Sparkles className="h-4 w-4 text-violet-600" /> Nouvelle ressource</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,2fr)_200px]">
          <label className="block text-xs font-semibold text-slate-600">Sujet
            <input value={topic} onChange={(event) => setTopic(event.target.value)} maxLength={160} placeholder="ex. Commandes Git essentielles, Raccourcis VS Code, Sécuriser un site WordPress" className={`${input} mt-1`} />
          </label>
          <label className="block text-xs font-semibold text-slate-600">Type
            <select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)} className={`${input} mt-1`}>
              <option value="cheatsheet">Aide-mémoire</option>
              <option value="checklist">Checklist</option>
            </select>
          </label>
        </div>
        <label className="mt-3 block text-xs font-semibold text-slate-600">Consignes (facultatif)
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} rows={2} placeholder="ex. Pour des débutants, avec une partie sur les erreurs fréquentes" className={`${input} mt-1`} />
        </label>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => void generate()} disabled={Boolean(busy) || topic.trim().length < 3 || data.firestore === false} className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50">
            {busy === 'generate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy === 'generate' ? 'Rédaction en cours…' : 'Générer avec l’IA'}
          </button>
          <span className="text-xs text-slate-500">Compte 20 à 60 secondes. La ressource est créée en brouillon : rien n’est publié sans toi.</span>
        </div>
      </section>

      {editor && <ResourceEditor key={editor.id} initial={editor} onClose={() => setEditor(null)} onSaved={(resource) => { replaceStored(resource); setNotice('Modifications enregistrées.'); }} />}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500"><th className="px-4 py-3">Ressource</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Statut</th><th className="px-3 py-3">Origine</th><th className="px-3 py-3">Actions</th></tr></thead>
            <tbody>
              {stored.map((resource) => (
                <tr key={resource.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                  <td className="max-w-[520px] px-4 py-3"><strong className="block text-sm text-slate-800">{resource.fr.title}</strong><small className="text-xs text-slate-400">{resource.en.title} · /ressources/{resource.fr.slug}</small>{resource.research?.reason && <small className="mt-1 block text-xs text-violet-700">Pourquoi : {resource.research.reason}</small>}</td>
                  <td className="px-3 py-3 text-xs text-slate-600">{KIND_LABELS[resource.kind]}</td>
                  <td className="px-3 py-3">{resource.status === 'published' ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Publiée</span> : <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">Brouillon</span>}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{resource.origin === 'agent' ? 'Recherche auto' : 'Demande admin'} · IA ({resource.provider || '?'}){resource.createdAt ? ` · ${new Date(resource.createdAt).toLocaleDateString('fr-FR')}` : ''}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <IconButton title="Modifier" onClick={() => setEditor(toEditor(resource))}><Pencil className="h-3.5 w-3.5" /></IconButton>
                      {resource.status === 'published'
                        ? <>
                            <a title="Voir sur le site" href={`/fr/ressources/${resource.fr.slug}`} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700"><Eye className="h-3.5 w-3.5" /></a>
                            <IconButton title="Retirer du site" disabled={busy === resource.id} onClick={() => void setStatus(resource, 'draft')}><Undo2 className="h-3.5 w-3.5" /></IconButton>
                          </>
                        : <button type="button" disabled={busy === resource.id} onClick={() => void setStatus(resource, 'published')} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><Check className="h-3.5 w-3.5" /> Publier</button>}
                      <IconButton title="Supprimer" danger disabled={busy === resource.id} onClick={() => remove(resource)}><Trash2 className="h-3.5 w-3.5" /></IconButton>
                    </div>
                  </td>
                </tr>
              ))}
              {(data.builtIn ?? []).map((resource) => (
                <tr key={resource.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3"><strong className="block text-sm text-slate-800">{resource.fr.title}</strong><small className="text-xs text-slate-400">{resource.en.title} · /ressources/{resource.fr.slug}</small></td>
                  <td className="px-3 py-3 text-xs text-slate-600">{KIND_LABELS[resource.kind]}</td>
                  <td className="px-3 py-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Publiée</span></td>
                  <td className="px-3 py-3 text-xs text-slate-500">Dans le code{resource.gated ? ' · par e-mail' : ''}</td>
                  <td className="px-3 py-3"><a title="Voir sur le site" href={`/fr/ressources/${resource.fr.slug}`} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700"><Eye className="h-3.5 w-3.5" /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
        <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-600"><FolderDown className="h-5 w-5" /></span><span><strong className="block text-sm text-slate-800">Page Ressources</strong><small className="text-xs text-slate-500">Les ressources publiées y apparaissent, avec leur PDF.</small></span></div>
        <a href="/fr/ressources" target="_blank" rel="noreferrer" className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700">Voir la page</a>
      </section>
    </main>
  );
}

function IconButton({ title, onClick, disabled, danger, children }: { title: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return <button type="button" title={title} aria-label={title} onClick={onClick} disabled={disabled} className={`grid h-8 w-8 place-items-center rounded-lg border disabled:opacity-50 ${danger ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700'}`}>{children}</button>;
}

function ResourceEditor({ initial, onClose, onSaved }: { initial: Editor; onClose: () => void; onSaved: (resource: StoredResource) => void }) {
  const [editor, setEditor] = useState(initial);
  const [locale, setLocale] = useState<Locale>('fr');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const parsed = useMemo(() => ({ fr: textToSections(editor.fr.content), en: textToSections(editor.en.content) }), [editor.fr.content, editor.en.content]);
  const fields = editor[locale];
  const setField = (key: keyof TextFields, value: string) => setEditor((current) => ({ ...current, [locale]: { ...current[locale], [key]: value } }));

  const save = async () => {
    const errors = [...parsed.fr.errors.map((message) => `FR · ${message}`), ...parsed.en.errors.map((message) => `EN · ${message}`)];
    if (errors.length) {
      setError(errors.join('\n'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const text = (key: Locale) => {
        const { content: _content, ...rest } = editor[key];
        return { ...rest, sections: parsed[key].sections };
      };
      const { resource } = await send(`${URL_LIST}/${editor.id}`, 'PATCH', { resource: { kind: editor.kind, code: editor.code, fr: text('fr'), en: text('en') } });
      if (resource) onSaved(resource);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const preview = parsed[locale].sections;
  return (
    <section className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">Relire et modifier : {initial.fr.title}</h2>
        <button type="button" onClick={onClose} aria-label="Fermer" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><X className="h-4 w-4" /></button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
        <div className="inline-flex rounded-xl border border-slate-200 p-1">
          {(['fr', 'en'] as const).map((value) => <button key={value} type="button" onClick={() => setLocale(value)} className={`rounded-lg px-4 py-1.5 font-bold ${locale === value ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{value === 'fr' ? 'Français' : 'Anglais'}</button>)}
        </div>
        <label className="flex items-center gap-2">Type
          <select value={editor.kind} onChange={(event) => setEditor({ ...editor, kind: event.target.value as Editor['kind'] })} className="rounded-lg border border-slate-200 px-2 py-1.5">
            <option value="cheatsheet">Aide-mémoire</option>
            <option value="checklist">Checklist</option>
          </select>
        </label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={editor.code} onChange={(event) => setEditor({ ...editor, code: event.target.checked })} className="accent-blue-600" /> Les termes sont du code</label>
      </div>

      <div className="mt-4 grid gap-5 xl:grid-cols-2">
        <div className="space-y-3">
          {FIELDS.map(({ key, label, max, long }) => (
            <label key={key} className="block text-xs font-semibold text-slate-600">
              <span className="flex justify-between"><span>{label}</span><span className={fields[key].length > max ? 'text-red-600' : 'text-slate-400'}>{fields[key].length}/{max}</span></span>
              {long
                ? <textarea value={fields[key]} onChange={(event) => setField(key, event.target.value)} rows={2} className={`${input} mt-1`} />
                : <input value={fields[key]} onChange={(event) => setField(key, event.target.value)} className={`${input} mt-1`} />}
            </label>
          ))}
          <label className="block text-xs font-semibold text-slate-600">Contenu <span className="font-normal text-slate-400">: « ## Titre de partie », puis une ligne par entrée « terme | explication »</span>
            <textarea value={fields.content} onChange={(event) => setField('content', event.target.value)} rows={18} spellCheck={false} className={`${input} mt-1 font-mono text-xs leading-5`} />
          </label>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-600">Aperçu ({locale === 'fr' ? 'français' : 'anglais'})</p>
          <div className="mt-1 max-h-[720px] space-y-4 overflow-y-auto rounded-xl bg-[#eff6ff] p-4">
            <div><p className="text-lg font-black text-slate-900">{fields.title}</p><p className="text-sm text-slate-600">{fields.summary}</p></div>
            {preview.map((section, index) => (
              <div key={`${section.title}-${index}`}>
                <p className="text-sm font-bold text-blue-800">{section.title}</p>
                <ul className="mt-1 divide-y divide-blue-50 rounded-lg bg-white px-3">
                  {section.rows.map((row, rowIndex) => <li key={rowIndex} className="grid gap-1 py-2 text-xs sm:grid-cols-[2fr_3fr] sm:gap-3"><span className={editor.code ? 'font-mono text-blue-950' : 'font-bold text-slate-800'}>{row.term}</span><span className="text-slate-600">{row.text}</span></li>)}
                </ul>
              </div>
            ))}
            {parsed[locale].errors.length > 0 && <ul className="list-disc pl-5 text-xs text-red-700">{parsed[locale].errors.map((message) => <li key={message}>{message}</li>)}</ul>}
          </div>
          <p className="mt-2 text-xs text-slate-500">Vérifie chaque commande et chaque chiffre : l’IA peut se tromper. Les deux langues doivent garder les mêmes parties et le même nombre de lignes.</p>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 whitespace-pre-line rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50">Fermer</button>
        <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer</button>
      </div>
    </section>
  );
}
