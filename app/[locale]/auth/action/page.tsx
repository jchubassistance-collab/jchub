'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole } from 'lucide-react';
import { applyPasswordReset, checkPasswordResetCode } from '@/lib/firebase-auth';
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';

const copy = bilingual({
  incomplete: 'Ce lien de réinitialisation est incomplet ou invalide.',
  expired: 'Ce lien a expiré ou a déjà été utilisé. Demande un nouvel e-mail de réinitialisation.',
  tooShort: 'Le mot de passe doit contenir au moins 6 caractères.',
  failed: 'Impossible de modifier le mot de passe. Le lien a peut-être expiré : demande-en un nouveau.',
  checking: 'Vérification du lien…',
  changedTitle: 'Mot de passe modifié',
  changedText: (email: string) => `Tu peux maintenant te connecter à ton compte${email ? ` (${email})` : ''} avec ton nouveau mot de passe.`,
  signIn: 'Se connecter',
  invalidTitle: 'Lien invalide',
  backToLogin: 'Retour à la connexion',
  chooseTitle: 'Choisis un nouveau mot de passe',
  forEmail: (email: string) => `Pour ${email}`,
  newPassword: 'Nouveau mot de passe',
  placeholder: '6 caractères minimum',
  submit: 'Modifier le mot de passe',
}, {
  incomplete: 'This reset link is incomplete or invalid.',
  expired: 'This link has expired or has already been used. Request a new reset email.',
  tooShort: 'The password must contain at least 6 characters.',
  failed: 'Could not change the password. The link may have expired: request a new one.',
  checking: 'Checking the link…',
  changedTitle: 'Password changed',
  changedText: (email: string) => `You can now sign in to your account${email ? ` (${email})` : ''} with your new password.`,
  signIn: 'Sign in',
  invalidTitle: 'Invalid link',
  backToLogin: 'Back to sign in',
  chooseTitle: 'Choose a new password',
  forEmail: (email: string) => `For ${email}`,
  newPassword: 'New password',
  placeholder: 'At least 6 characters',
  submit: 'Change password',
});

export default function FirebaseAuthActionPage() {
  const locale = useLocale();
  const t = copy[locale];
  const params = useSearchParams();
  const mode = params?.get('mode') || '';
  const code = params?.get('oobCode') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Firebase sends every reset link to /auth/action with the email's language in ?lang=.
  const emailLanguage = params?.get('lang')?.slice(0, 2).toLowerCase();
  useEffect(() => {
    if (emailLanguage === 'en' && locale !== 'en') {
      window.location.replace(`/en/auth/action${window.location.search}`);
    }
  }, [emailLanguage, locale]);

  useEffect(() => {
    let active = true;
    if (mode !== 'resetPassword' || !code) {
      setError(t.incomplete);
      setChecking(false);
      return;
    }

    checkPasswordResetCode(code)
      .then((address) => { if (active) setEmail(address); })
      .catch(() => { if (active) setError(t.expired); })
      .finally(() => { if (active) setChecking(false); });

    return () => { active = false; };
  }, [mode, code, t]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(t.tooShort);
      return;
    }
    setSaving(true);
    try {
      await applyPasswordReset(code, password);
      setConfirmed(true);
    } catch {
      setError(t.failed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-[#f5f7f5] px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
        <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-600"><LockKeyhole className="h-6 w-6" /></div>
        {checking ? (
          <div className="flex items-center gap-3 py-8 text-slate-600"><Loader2 className="h-5 w-5 animate-spin" /> {t.checking}</div>
        ) : confirmed ? (
          <>
            <CheckCircle2 className="mb-4 h-8 w-8 text-emerald-600" />
            <h1 className="text-2xl font-black text-slate-900">{t.changedTitle}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t.changedText(email)}</p>
            <Link href="/compte" className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600">{t.signIn}</Link>
          </>
        ) : error ? (
          <>
            <AlertCircle className="mb-4 h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-black text-slate-900">{t.invalidTitle}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
            <Link href="/compte" className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600">{t.backToLogin}</Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black text-slate-900">{t.chooseTitle}</h1>
            <p className="mt-2 text-sm text-slate-600">{t.forEmail(email)}</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-slate-700" htmlFor="new-password">{t.newPassword}</label>
              <input id="new-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.placeholder} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} {t.submit}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
