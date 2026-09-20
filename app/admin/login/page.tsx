'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { getCurrentIdToken, resetPassword, signInWithEmail } from '@/lib/firebase-auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email.trim().toLowerCase(), password);
      const idToken = await getCurrentIdToken();
      const response = await fetch('/api/admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
      const responseText = await response.text();
      let data: { error?: string } = {};
      try {
        data = JSON.parse(responseText) as { error?: string };
      } catch {
        throw new Error('Le serveur admin a renvoyé une réponse invalide. Réessaie dans quelques instants.');
      }
      if (!response.ok) throw new Error(data.error || 'Accès administrateur refusé.');
      router.replace('/admin');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentification impossible.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResetSent(false);
    try {
      await resetPassword(email.trim().toLowerCase());
      setResetSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible d’envoyer le lien de récupération.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-4 py-10 text-slate-900">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-600 text-white"><ShieldCheck className="h-7 w-7" /></div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">JcHub Admin</p>
          <h1 className="mt-2 text-2xl font-black">Connexion sécurisée</h1>
          <p className="mt-2 text-sm text-slate-500">Firebase Auth, accès par e-mail et session sécurisée.</p>
        </div>
        {resetMode ? <form className="space-y-5" onSubmit={handleResetPassword}>
              <p className="text-sm text-slate-600">Saisis ton adresse e-mail. Tu recevras un lien sécurisé pour choisir un nouveau mot de passe.</p>
              <label className="block text-sm font-semibold text-slate-700">Adresse e-mail<span className="relative mt-1.5 block"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="admin@jchub.dev" /></span></label>
              {resetSent && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Si cette adresse est associée à un compte, un e-mail de récupération vient d’être envoyé.</p>}
              {error && <ErrorMessage text={error} />}
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{loading ? 'Envoi...' : 'Envoyer le lien'}</button>
              <button type="button" onClick={() => { setResetMode(false); setError(''); setResetSent(false); }} className="w-full text-sm font-semibold text-slate-500 hover:text-indigo-600">Retour à la connexion</button>
            </form> : <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-slate-700">Adresse e-mail<span className="relative mt-1.5 block"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="admin@jchub.dev" /></span></label>
              <label className="block text-sm font-semibold text-slate-700">Mot de passe<span className="relative mt-1.5 block"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></span></label>
            {error && <ErrorMessage text={error} />}
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{loading ? 'Connexion...' : 'Accéder au dashboard'}</button>
              <button type="button" onClick={() => { setResetMode(true); setError(''); }} className="w-full text-sm font-semibold text-indigo-600 hover:text-indigo-800">Mot de passe oublié ?</button>
            </form>}
      </div>
    </div>
  );
}

function ErrorMessage({ text }: { text: string }) {
  return <p className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{text}</p>;
}
