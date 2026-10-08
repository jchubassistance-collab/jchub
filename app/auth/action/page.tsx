'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole } from 'lucide-react';
import { applyPasswordReset, checkPasswordResetCode } from '@/lib/firebase-auth';

export default function FirebaseAuthActionPage() {
  const params = useSearchParams();
  const mode = params?.get('mode') || '';
  const code = params?.get('oobCode') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (mode !== 'resetPassword' || !code) {
      setError('Ce lien de réinitialisation est incomplet ou invalide.');
      setChecking(false);
      return;
    }

    checkPasswordResetCode(code)
      .then((address) => { if (active) setEmail(address); })
      .catch(() => { if (active) setError('Ce lien a expiré ou a déjà été utilisé. Demande un nouvel e-mail de réinitialisation.'); })
      .finally(() => { if (active) setChecking(false); });

    return () => { active = false; };
  }, [mode, code]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setSaving(true);
    try {
      await applyPasswordReset(code, password);
      setConfirmed(true);
    } catch {
      setError('Impossible de modifier le mot de passe. Le lien a peut-être expiré : demande-en un nouveau.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-[#f5f7f5] px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
        <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-600"><LockKeyhole className="h-6 w-6" /></div>
        {checking ? (
          <div className="flex items-center gap-3 py-8 text-slate-600"><Loader2 className="h-5 w-5 animate-spin" /> Vérification du lien…</div>
        ) : confirmed ? (
          <>
            <CheckCircle2 className="mb-4 h-8 w-8 text-emerald-600" />
            <h1 className="text-2xl font-black text-slate-900">Mot de passe modifié</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Tu peux maintenant te connecter à ton compte{email ? ` (${email})` : ''} avec ton nouveau mot de passe.</p>
            <Link href="/compte" className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600">Se connecter</Link>
          </>
        ) : error ? (
          <>
            <AlertCircle className="mb-4 h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-black text-slate-900">Lien invalide</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
            <Link href="/compte" className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600">Retour à la connexion</Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black text-slate-900">Choisis un nouveau mot de passe</h1>
            <p className="mt-2 text-sm text-slate-600">Pour {email}</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-slate-700" htmlFor="new-password">Nouveau mot de passe</label>
              <input id="new-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6 caractères minimum" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Modifier le mot de passe
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
