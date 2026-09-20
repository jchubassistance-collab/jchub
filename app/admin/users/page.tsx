'use client';

import { useEffect, useState } from 'react';

type User = { uid: string; email: string; displayName: string; role: string; provider: string; createdAt: string | null };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { fetch('/api/admin/users', { cache: 'no-store' }).then(async (response) => { const data = await response.json() as { users?: User[]; error?: string }; if (!response.ok) throw new Error(data.error); setUsers(data.users || []); }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Chargement impossible.')); }, []);
  return <AdminSection title="Utilisateurs" description="Consulte les comptes et leur rôle d’accès.">{error ? <Notice text={error} /> : <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="p-4">Utilisateur</th><th className="p-4">Rôle</th><th className="p-4">Connexion</th><th className="p-4">Inscription</th></tr></thead><tbody>{users.map((user) => <tr key={user.uid} className="border-b border-slate-100"><td className="p-4"><strong>{user.displayName || 'Sans nom'}</strong><span className="block text-xs text-slate-500">{user.email}</span></td><td className="p-4"><span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">{user.role}</span></td><td className="p-4 text-slate-600">{user.provider || 'email'}</td><td className="p-4 text-slate-600">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-'}</td></tr>)}</tbody></table>{users.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Aucun utilisateur.</p>}</div>}</AdminSection>;
}

function AdminSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <div className="mx-auto max-w-6xl space-y-6"><header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Administration</p><h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1><p className="mt-2 text-sm text-slate-600">{description}</p></header>{children}</div>; }
function Notice({ text }: { text: string }) { return <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{text}</p>; }