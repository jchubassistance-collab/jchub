'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, DatabaseBackup, Download, Loader2, RotateCcw, Save, Trash2, X } from 'lucide-react';

type Trigger = 'cron' | 'manual' | 'pre-restore';
type Backup = { id: string; createdAt: string; trigger: Trigger; size: number };
type Contents = { firestore: { name: string; documents: number }[]; turso: { name: string; rows: number }[] };
type Detail = Backup & { by: string; contents: Contents };

const triggerLabels: Record<Trigger, string> = { cron: 'Automatique', manual: 'Manuelle', 'pre-restore': 'Avant restauration' };
const triggerTones: Record<Trigger, string> = { cron: 'bg-slate-100 text-slate-700', manual: 'bg-blue-50 text-blue-700', 'pre-restore': 'bg-amber-50 text-amber-800' };
/** Not restored unless asked: going back in time must not erase who did what. */
const UNCHECKED_BY_DEFAULT = new Set(['activity_log']);

function formatDate(value: string) {
  return new Date(value).toLocaleString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
}

async function readJson<T>(response: Response): Promise<T & { error?: string }> {
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || 'Le serveur n’a pas répondu.');
  return data;
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<Detail | null>(null);
  const [opening, setOpening] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await readJson<{ configured: boolean; backups: Backup[] }>(await fetch('/api/admin/backups', { cache: 'no-store' }));
      setConfigured(data.configured);
      setBackups(data.backups);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Sauvegardes indisponibles.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createNow() {
    setCreating(true); setMessage(''); setError('');
    try {
      const data = await readJson<Backup>(await fetch('/api/admin/backups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create' }) }));
      setMessage(`Sauvegarde faite (${formatSize(data.size)}).`);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'La sauvegarde a échoué.'); }
    finally { setCreating(false); }
  }

  async function openRestore(backup: Backup) {
    setOpening(backup.id); setMessage(''); setError('');
    try {
      setDetail(await readJson<Detail>(await fetch('/api/admin/backups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'contents', id: backup.id }) })));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Sauvegarde illisible.'); }
    finally { setOpening(''); }
  }

  async function remove(backup: Backup) {
    if (!window.confirm(`Supprimer définitivement la sauvegarde du ${formatDate(backup.createdAt)} ?`)) return;
    setMessage(''); setError('');
    try {
      await readJson(await fetch(`/api/admin/backups?id=${encodeURIComponent(backup.id)}`, { method: 'DELETE' }));
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Suppression impossible.'); }
  }

  return <section className="mx-auto max-w-5xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-indigo-600">Sécurité</p>
        <h1 className="mt-2 flex items-center gap-2 text-3xl font-black text-slate-950"><DatabaseBackup className="h-7 w-7 text-slate-400" />Sauvegardes</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Toutes les données Firestore (articles, outils, utilisateurs, messages…) et les tables Turso sont sauvegardées chaque nuit à 4 h (heure de Lagos) et gardées 30 jours. Avant chaque restauration, l’état du moment est sauvegardé : une restauration peut donc toujours être annulée.</p>
      </div>
      <button type="button" disabled={creating || !configured} onClick={() => void createNow()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{creating ? 'Sauvegarde en cours…' : 'Sauvegarder maintenant'}
      </button>
    </header>

    {!configured && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Le stockage Vercel Blob n’est pas configuré (variable BLOB_READ_WRITE_TOKEN) : aucune sauvegarde ne peut être faite.</p>}
    {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {loading ? <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        : !backups.length ? <p className="p-6 text-center text-sm text-slate-500">Aucune sauvegarde pour l’instant. La première sera faite cette nuit, ou maintenant avec le bouton ci-dessus.</p>
          : <ul className="divide-y divide-slate-100">
            {backups.map((backup, index) => <li key={backup.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{formatDate(backup.createdAt)}{index === 0 && <span className="ml-2 text-xs font-medium text-emerald-700">la plus récente</span>}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span className={`rounded-full px-2 py-0.5 font-semibold ${triggerTones[backup.trigger]}`}>{triggerLabels[backup.trigger]}</span>{formatSize(backup.size)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => void openRestore(backup)} disabled={Boolean(opening)} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:border-amber-400 disabled:opacity-60">
                  {opening === backup.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}Restaurer
                </button>
                <a title="Télécharger" href={`/api/admin/backups?download=${encodeURIComponent(backup.id)}`} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700"><Download className="h-4 w-4" /></a>
                {index > 0 && <button type="button" title="Supprimer" onClick={() => void remove(backup)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>}
              </div>
            </li>)}
          </ul>}
    </div>

    {detail && <RestoreDialog detail={detail} onClose={() => setDetail(null)} onDone={(text) => { setDetail(null); setMessage(text); void load(); }} />}
  </section>;
}

function RestoreDialog({ detail, onClose, onDone }: { detail: Detail; onClose: () => void; onDone: (message: string) => void }) {
  const [firestore, setFirestore] = useState<string[]>(detail.contents.firestore.map((item) => item.name).filter((name) => !UNCHECKED_BY_DEFAULT.has(name)));
  const [turso, setTurso] = useState<string[]>(detail.contents.turso.map((item) => item.name));
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const toggle = (list: string[], set: (value: string[]) => void, name: string) => set(list.includes(name) ? list.filter((item) => item !== name) : [...list, name]);
  const allSelected = firestore.length === detail.contents.firestore.length && turso.length === detail.contents.turso.length;

  async function restore() {
    setBusy(true); setError('');
    try {
      const data = await readJson<{ restored: { firestore: string[]; turso: string[] }; safetyBackup: string }>(await fetch('/api/admin/backups', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', id: detail.id, firestore, turso }),
      }));
      const count = data.restored.firestore.length + data.restored.turso.length;
      onDone(`Restauration terminée : ${count} élément(s) remis à l’état du ${formatDate(detail.createdAt)}. L’état d’avant est gardé dans la sauvegarde « Avant restauration ».`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'La restauration a échoué.'); setBusy(false); }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-2 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="restore-title">
    <div className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="restore-title" className="text-xl font-black text-slate-900">Restaurer la sauvegarde</h2>
          <p className="mt-1 text-sm text-slate-600">{formatDate(detail.createdAt)} · {triggerLabels[detail.trigger]}{detail.by && detail.by !== 'cron' ? ` · par ${detail.by}` : ''}</p>
        </div>
        <button type="button" onClick={onClose} disabled={busy} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Fermer"><X className="h-4 w-4" /></button>
      </div>

      <p className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />Les éléments cochés reviennent exactement à leur état de cette date : ce qui a été créé depuis est supprimé, ce qui a été modifié reprend son ancienne version.</p>

      <div className="mt-4 flex justify-end">
        <button type="button" onClick={() => { if (allSelected) { setFirestore([]); setTurso([]); } else { setFirestore(detail.contents.firestore.map((item) => item.name)); setTurso(detail.contents.turso.map((item) => item.name)); } }} className="text-xs font-semibold text-blue-700 hover:underline">{allSelected ? 'Tout décocher' : 'Tout cocher'}</button>
      </div>
      <fieldset className="mt-2">
        <legend className="text-xs font-bold uppercase tracking-wide text-slate-500">Firestore</legend>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {detail.contents.firestore.map((item) => <label key={item.name} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800">
            <input type="checkbox" checked={firestore.includes(item.name)} onChange={() => toggle(firestore, setFirestore, item.name)} className="rounded border-slate-300" />
            <span className="min-w-0 flex-1 truncate font-mono text-xs">{item.name}</span><span className="text-xs text-slate-500">{item.documents}</span>
          </label>)}
        </div>
      </fieldset>
      {detail.contents.turso.length > 0 && <fieldset className="mt-4">
        <legend className="text-xs font-bold uppercase tracking-wide text-slate-500">Turso</legend>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {detail.contents.turso.map((item) => <label key={item.name} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800">
            <input type="checkbox" checked={turso.includes(item.name)} onChange={() => toggle(turso, setTurso, item.name)} className="rounded border-slate-300" />
            <span className="min-w-0 flex-1 truncate font-mono text-xs">{item.name}</span><span className="text-xs text-slate-500">{item.rows}</span>
          </label>)}
        </div>
      </fieldset>}

      <label className="mt-5 flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 rounded border-slate-300" />Je comprends que les données cochées seront remplacées par cette sauvegarde.</label>
      {error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">Annuler</button>
        <button type="button" onClick={() => void restore()} disabled={busy || !confirmed || (!firestore.length && !turso.length)} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}{busy ? 'Restauration en cours…' : 'Restaurer'}
        </button>
      </div>
    </div>
  </div>;
}
