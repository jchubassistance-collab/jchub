'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Check, Copy, Loader2, MoreVertical, RefreshCw, Search, UserPlus, X } from 'lucide-react';
import { cachedJson, fetchJson } from '@/lib/admin-cache';

type User = { uid: string; email: string; displayName: string; role: string; provider: string; createdAt: string | null; disabled: boolean; lastSignIn: string | null; articles: { total: number; published: number } | null };
type ManagedRole = 'writer' | 'cm';
type AccountAction = 'disable' | 'enable' | 'revoke' | 'remove-role';

const roleLabels: Record<string, string> = { admin: 'Administrateur', writer: 'Rédaction', cm: 'Community manager', user: 'Utilisateur' };
const roleTones: Record<string, string> = { admin: 'bg-slate-900 text-white', writer: 'bg-blue-50 text-blue-700', cm: 'bg-violet-50 text-violet-700', user: 'bg-slate-100 text-slate-600' };
const roleChoices: { value: ManagedRole; label: string; description: string }[] = [
  { value: 'writer', label: 'Rédacteur ou rédactrice', description: 'Écrit et publie ses propres articles depuis l’espace rédaction, signés de son nom.' },
  { value: 'cm', label: 'Community manager', description: 'Prépare et publie les posts Facebook et Instagram depuis l’espace CM.' },
];
const isManaged = (role: string) => role === 'writer' || role === 'cm';
const confirmations: Partial<Record<AccountAction, string>> = {
  disable: 'Désactiver ce compte ? Il est déconnecté tout de suite et ne peut plus se connecter.',
  revoke: 'Déconnecter ce compte de tous ses appareils ?',
  'remove-role': 'Retirer sa fonction à ce compte ? Il perd l’accès à son espace ; ses articles restent en ligne.',
};
const notices: Record<AccountAction, string> = {
  disable: 'Compte désactivé.',
  enable: 'Compte réactivé.',
  revoke: 'Compte déconnecté de tous ses appareils.',
  'remove-role': 'Fonction retirée.',
};

async function postUsers(body: Record<string, unknown>) {
  const response = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({})) as { error?: string; passwordResetLink?: string };
  if (!response.ok) throw new Error(data.error || 'Opération impossible.');
  return data;
}

const USERS_URL = '/api/admin/users';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>(() => cachedJson<{ users?: User[] }>(USERS_URL)?.users || []);
  const [loaded, setLoaded] = useState(() => cachedJson(USERS_URL) !== undefined);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState<User | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(''); try { setUsers((await fetchJson<{ users?: User[] }>(USERS_URL)).users || []); setLoaded(true); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chargement impossible.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const visible = users.filter((user) => (roleFilter === 'all' || user.role === roleFilter) && `${user.displayName} ${user.email} ${user.role} ${roleLabels[user.role] || ''} ${user.provider}`.toLowerCase().includes(query.toLowerCase()));

  const act = async (user: User, action: AccountAction) => {
    setMenuId(null);
    const question = confirmations[action];
    if (question && !window.confirm(question)) return;
    setWorking(user.uid); setNotice(''); setError('');
    try { await postUsers({ action, uid: user.uid }); setNotice(`${user.displayName || user.email} : ${notices[action]}`); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Opération impossible.'); }
    finally { setWorking(null); }
  };

  return <AdminSection title="Utilisateurs" description="Comptes et rôles d’accès enregistrés dans Firestore. Ajoute ici les personnes qui travaillent sur JcHub et choisis leur fonction.">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un utilisateur..." className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-400" /></label>
      <select aria-label="Filtrer par fonction" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-blue-400"><option value="all">Toutes les fonctions</option>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <button onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Actualiser</button>
      <button onClick={() => setAdding(true)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700"><UserPlus className="h-4 w-4" />Ajouter un utilisateur</button>
      <span className="w-full text-xs text-slate-500 sm:w-auto">{users.length} compte(s)</span>
    </div>
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}
    {error ? <Notice text={error} /> : <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="p-4">Utilisateur</th><th className="p-4">Fonction</th><th className="p-4">État</th><th className="p-4">Connexion</th><th className="p-4">Inscription</th><th className="p-4"><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map((user) => <tr key={user.uid} className="border-b border-slate-100 last:border-0">
      <td className="p-4"><strong>{user.displayName || 'Sans nom'}</strong><span className="block text-xs text-slate-500">{user.email}</span></td>
      <td className="p-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${roleTones[user.role] || roleTones.user}`}>{roleLabels[user.role] || user.role}</span>{user.role === 'writer' && <span className="mt-1.5 block text-[11px] text-slate-500">{user.articles ? `${user.articles.total} article(s) · ${user.articles.published} publié(s)` : 'Aucun article'}</span>}</td>
      <td className="p-4">{isManaged(user.role) ? <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${user.disabled ? 'text-red-600' : 'text-emerald-700'}`}><i className="h-1.5 w-1.5 rounded-full bg-current" />{user.disabled ? 'Désactivé' : 'Actif'}</span> : <span className="text-xs text-slate-400">—</span>}</td>
      <td className="p-4 text-slate-600">{user.provider || 'email'}{user.lastSignIn && <span className="block text-[11px] text-slate-400">Dernière : {new Date(user.lastSignIn).toLocaleDateString('fr-FR')}</span>}</td>
      <td className="p-4 text-slate-600">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-'}</td>
      <td className="p-4 text-right">{isManaged(user.role) && <div className="relative inline-block"><button aria-label={`Actions pour ${user.displayName || user.email}`} aria-expanded={menuId === user.uid} disabled={working === user.uid} onClick={() => setMenuId(menuId === user.uid ? null : user.uid)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 disabled:opacity-50">{working === user.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}</button>{menuId === user.uid && <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">
        <MenuButton onClick={() => { setMenuId(null); setRenaming(user); }}>Renommer</MenuButton>
        <MenuButton onClick={() => void act(user, 'revoke')}>Déconnecter partout</MenuButton>
        {user.disabled ? <MenuButton onClick={() => void act(user, 'enable')}>Réactiver le compte</MenuButton> : <MenuButton tone="amber" onClick={() => void act(user, 'disable')}>Désactiver le compte</MenuButton>}
        <MenuButton tone="red" onClick={() => void act(user, 'remove-role')}>Retirer la fonction</MenuButton>
      </div>}</div>}</td>
    </tr>)}</tbody></table>{loaded && !visible.length && <p className="p-8 text-center text-sm text-slate-500">{users.length ? 'Aucun résultat pour cette recherche.' : 'Aucun utilisateur.'}</p>}</div>}
    {adding && <AddUserDialog onClose={() => setAdding(false)} onSaved={() => void load()} />}
    {renaming && <RenameDialog user={renaming} onClose={() => setRenaming(null)} onSaved={(name) => { setRenaming(null); setNotice(renaming.role === 'writer' ? `Nom changé en « ${name} ». Il s’applique à sa prochaine connexion ; ses articles publiés sont re-signés dans quelques minutes.` : `Nom changé en « ${name} ».`); void load(); }} />}
  </AdminSection>;
}

function AddUserDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ displayName: '', email: '', role: 'writer' as ManagedRole, existing: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ link?: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const name = form.displayName.trim();
      const data = await postUsers(form.existing
        ? { action: 'grant-role', email: form.email.trim(), role: form.role, ...(name ? { displayName: name } : {}) }
        : { action: 'create', email: form.email.trim(), displayName: name, role: form.role });
      setResult({ link: data.passwordResetLink, name: name || form.email.trim() });
      onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Opération impossible.'); }
    finally { setBusy(false); }
  };
  const copy = async () => {
    if (!result?.link) return;
    try { await navigator.clipboard.writeText(result.link); setCopied(true); } catch { setError('Copie impossible : sélectionne le lien et copie-le à la main.'); }
  };

  return <Dialog title="Ajouter un utilisateur" onClose={onClose}>
    {result ? <div className="space-y-4">
      <p className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><Check className="mt-0.5 h-4 w-4 shrink-0" />{result.link ? `Le compte de ${result.name} est créé.` : `${result.name} a maintenant sa fonction. Le compte doit se déconnecter puis se reconnecter pour l’obtenir.`}</p>
      {result.link && <>
        <p className="text-sm text-slate-600">Envoie ce lien à {result.name} par un canal privé (SMS, WhatsApp…). Il sert à choisir son mot de passe. Ensuite, la connexion se fait sur <strong className="break-all text-slate-800">{typeof window === 'undefined' ? '' : `${window.location.origin}/admin/login`}</strong>.</p>
        <div className="flex gap-2"><input readOnly value={result.link} onFocus={(event) => event.target.select()} aria-label="Lien pour choisir le mot de passe" className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700" /><button type="button" onClick={() => void copy()} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Copié' : 'Copier'}</button></div>
        <p className="text-xs text-slate-500">Le lien expire au bout d’une heure environ. S’il a expiré, « Forgot Password » sur la page de connexion en envoie un nouveau par e-mail.</p>
      </>}
      {error && <Notice text={error} />}
      <div className="flex justify-end"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">Fermer</button></div>
    </div> : <form onSubmit={submit} className="space-y-4">
      <fieldset><legend className="text-xs font-semibold text-slate-600">Fonction</legend><div className="mt-1.5 grid gap-2 sm:grid-cols-2">{roleChoices.map((choice) => <label key={choice.value} className={`cursor-pointer rounded-xl border p-3 ${form.role === choice.value ? 'border-blue-400 bg-blue-50/60 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}`}><input type="radio" name="role" value={choice.value} checked={form.role === choice.value} onChange={() => setForm({ ...form, role: choice.value })} className="sr-only" /><strong className="block text-sm text-slate-800">{choice.label}</strong><span className="mt-1 block text-xs leading-5 text-slate-500">{choice.description}</span></label>)}</div></fieldset>
      <label className="block text-xs font-semibold text-slate-600">{form.role === 'writer' ? 'Nom et prénom (signés sur ses articles)' : 'Nom et prénom'}<input required={!form.existing} minLength={2} maxLength={80} value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} placeholder={form.existing ? 'Laisser vide pour garder le nom du compte' : 'Prénom Nom'} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-400" /></label>
      <label className="block text-xs font-semibold text-slate-600">Adresse e-mail<input required type="email" autoComplete="off" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="prenom@exemple.com" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-400" /></label>
      <label className="flex items-start gap-2 text-xs text-slate-600"><input type="checkbox" checked={form.existing} onChange={(event) => setForm({ ...form, existing: event.target.checked })} className="mt-0.5 rounded border-slate-300" /><span>Ce compte existe déjà : lui donner seulement la fonction, sans créer de compte.</span></label>
      {error && <Notice text={error} />}
      <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">Annuler</button><button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{form.existing ? 'Donner la fonction' : 'Créer le compte'}</button></div>
    </form>}
  </Dialog>;
}

function RenameDialog({ user, onClose, onSaved }: { user: User; onClose: () => void; onSaved: (name: string) => void }) {
  const [name, setName] = useState(user.displayName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await postUsers({ action: 'rename', uid: user.uid, displayName: name.trim() }); onSaved(name.trim()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Opération impossible.'); setBusy(false); }
  };
  return <Dialog title="Renommer le compte" onClose={onClose}><form onSubmit={submit} className="space-y-4">
    <label className="block text-xs font-semibold text-slate-600">{user.role === 'writer' ? 'Nom et prénom (signés sur ses articles)' : 'Nom et prénom'}<input required minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none focus:border-blue-400" /></label>
    {error && <Notice text={error} />}
    <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">Annuler</button><button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Enregistrer</button></div>
  </form></Dialog>;
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [onClose]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-2 sm:p-4" role="dialog" aria-modal="true" aria-label={title}><div className="max-h-[96dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"><div className="mb-5 flex items-start justify-between gap-3"><h2 className="text-xl font-black text-slate-900">{title}</h2><button type="button" onClick={onClose} aria-label="Fermer" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button></div>{children}</div></div>;
}

function MenuButton({ onClick, tone, children }: { onClick: () => void; tone?: 'amber' | 'red'; children: React.ReactNode }) {
  const color = tone === 'red' ? 'text-red-600 hover:bg-red-50' : tone === 'amber' ? 'text-amber-700 hover:bg-amber-50' : 'text-slate-700 hover:bg-slate-50';
  return <button type="button" onClick={onClick} className={`w-full rounded-lg px-3 py-2 text-left text-xs ${color}`}>{children}</button>;
}

function AdminSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <div className="mx-auto max-w-6xl space-y-6"><header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Administration</p><h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1><p className="mt-2 text-sm text-slate-600">{description}</p></header>{children}</div>; }
function Notice({ text }: { text: string }) { return <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{text}</p>; }
