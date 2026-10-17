'use client';

import { FormEvent, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function CmAccessPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(''); setError('');
    try {
      const response = await fetch('/api/admin/cm-accounts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'grant-role', email: email.trim().toLowerCase() }),
      });
      const data = await response.json() as { error?: string; uid?: string };
      if (!response.ok) throw new Error(data.error || 'Attribution du rôle impossible.');
      setMessage(`Le rôle CM a été attribué au compte ${email.trim()}. Déconnecte ce compte CM, puis reconnecte-le pour actualiser son jeton.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Attribution du rôle impossible.'); }
    finally { setBusy(false); }
  }

  return <section className="mx-auto max-w-3xl space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-[.2em] text-indigo-600">Administration</p><h1 className="mt-2 text-3xl font-black text-slate-950">Accès Community Manager</h1><p className="mt-2 text-sm text-slate-600">Attribue le claim Firebase `cm` à un compte existant. Cette action requiert une session administrateur.</p></header>
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <label className="block text-sm font-semibold text-slate-700">Adresse e-mail du compte Firebase<input required type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="community.manager@example.com" /></label>
      <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"><ShieldCheck className="h-4 w-4"/>{busy?'Attribution…':'Attribuer le rôle CM'}</button>
      {message&&<p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {error&&<p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <p className="text-xs leading-5 text-slate-500">Cette action ne crée pas le compte et n’envoie pas de courriel. Si le compte n’existe pas, crée-le d’abord dans Firebase Authentication. Le CM devra ensuite utiliser son mot de passe habituel.</p>
    </form>
  </section>;
}
