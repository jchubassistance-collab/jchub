'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Search } from 'lucide-react';

type User = { uid: string; email: string; displayName: string; role: string; provider: string; createdAt: string | null };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { const response = await fetch('/api/admin/users', { cache: 'no-store' }); const data = await response.json() as { users?: User[]; error?: string }; if (!response.ok) throw new Error(data.error || 'Chargement impossible.'); setUsers(data.users || []); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chargement impossible.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const visible = users.filter((user) => `${user.displayName} ${user.email} ${user.role} ${user.provider}`.toLowerCase().includes(query.toLowerCase()));
  return <AdminSection title="Utilisateurs" description="Comptes et rôles d’accès enregistrés dans Firestore."><div className="flex flex-wrap items-center justify-between gap-3"><label className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un utilisateur..." className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-400" /></label><button onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Actualiser</button><span className="text-xs text-slate-500">{users.length} compte(s)</span></div>{error ? <Notice text={error} /> : <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="p-4">Utilisateur</th><th className="p-4">Rôle</th><th className="p-4">Connexion</th><th className="p-4">Inscription</th></tr></thead><tbody>{visible.map((user) => <tr key={user.uid} className="border-b border-slate-100"><td className="p-4"><strong>{user.displayName || 'Sans nom'}</strong><span className="block text-xs text-slate-500">{user.email}</span></td><td className="p-4"><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">{user.role}</span></td><td className="p-4 text-slate-600">{user.provider || 'email'}</td><td className="p-4 text-slate-600">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-'}</td></tr>)}</tbody></table>{loading ? <p className="p-8 text-center text-sm text-slate-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Chargement des comptes…</p> : !visible.length && <p className="p-8 text-center text-sm text-slate-500">{users.length ? 'Aucun résultat pour cette recherche.' : 'Aucun utilisateur.'}</p>}</div>}</AdminSection>;
}

function AdminSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <div className="mx-auto max-w-6xl space-y-6"><header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Administration</p><h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1><p className="mt-2 text-sm text-slate-600">{description}</p></header>{children}</div>; }
function Notice({ text }: { text: string }) { return <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{text}</p>; }
