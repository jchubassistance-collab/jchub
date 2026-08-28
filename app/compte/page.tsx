'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Github, KeyRound, Loader2, Lock, Mail, User } from 'lucide-react';
import { resetPassword, signInWithEmail, signInWithGithub, signInWithGoogle, signUpWithEmail } from '@/lib/firebase-auth';

type Screen = 'login' | 'register' | 'forgot';

export default function AccountPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const changeScreen = (next: Screen) => {
    setScreen(next);
    setError('');
    setMessage('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (screen === 'forgot') {
      if (!email.trim()) return setError('Entre ton adresse e-mail.');
      setLoading(true);
      try {
        await resetPassword(email.trim());
        setMessage('Un e-mail de réinitialisation vient de t’être envoyé.');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Impossible d’envoyer l’e-mail.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || password.length < 6 || (screen === 'register' && !name.trim())) {
      setError(screen === 'register' ? 'Indique ton nom, ton e-mail et un mot de passe de 6 caractères minimum.' : 'Indique ton e-mail et ton mot de passe.');
      return;
    }

    setLoading(true);
    try {
      if (screen === 'login') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password, name.trim());
      }
      router.replace('/compte/dashboard');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = async (provider: 'google' | 'github') => {
    setError('');
    setLoading(true);
    try {
      await (provider === 'google' ? signInWithGoogle() : signInWithGithub());
      router.replace('/compte/dashboard');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  };

  const title = screen === 'login' ? 'Bon retour' : screen === 'register' ? 'Créer un compte' : 'Mot de passe oublié';
  const subtitle = screen === 'login' ? 'Connecte-toi pour retrouver ton espace.' : screen === 'register' ? 'Commence à apprendre à ton rythme.' : 'Nous t’enverrons un lien sécurisé par e-mail.';

  return (
    <div className="account-page min-h-screen bg-[#f5f7f5] px-4 py-8 sm:py-12">
      <div className="account-shell mx-auto grid max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.08)] lg:grid-cols-[1.1fr_0.9fr]">
        <aside className="account-visual relative hidden overflow-hidden border-r border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-[#1b2d3a] p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="account-visual-glow account-visual-glow-one" />
          <div className="account-visual-glow account-visual-glow-two" />
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-2 font-extrabold tracking-tight text-white">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-lg shadow-lg shadow-orange-500/30">J</span>
              JcHub
            </Link>
            <div className="mt-10 max-w-sm">
              <p className="mb-3 inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">
                Espace membre
              </p>
              <h1 className="text-4xl font-black leading-tight tracking-tight">Accède à ta roadmap de croissance.</h1>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Apprends, progresse et retrouve tes outils favoris en un seul endroit.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-4">
            {[
              'Accès à la bibliothèque',
              'Suivi des achats et abonnements',
              'Progression personnalisée',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-sm font-black text-white">
                  ✓
                </span>
                <span className="text-sm font-medium text-slate-100">{item}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="account-panel relative p-6 sm:p-8 lg:p-10">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-2 font-extrabold text-slate-900">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25">J</span>
              JcHub
            </Link>
            <Link href="/" className="text-xs font-bold text-slate-400 transition hover:text-orange-600">Retour au site</Link>
          </div>

          {screen === 'forgot' && (
            <button onClick={() => changeScreen('login')} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-orange-600">
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </button>
          )}

          <div className="mb-6">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 text-orange-600 shadow-inner shadow-orange-200/70">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          </div>

          {error && <div className="mb-5 flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
          {message && <div className="mb-5 flex gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4 shrink-0" />{message}</div>}

          {screen !== 'forgot' && <>
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" disabled={loading} onClick={() => socialLogin('google')} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md disabled:opacity-50"><GoogleIcon /> Google</button>
              <button type="button" disabled={loading} onClick={() => socialLogin('github')} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md disabled:opacity-50"><Github className="h-4 w-4" /> GitHub</button>
            </div>
            <div className="my-4 flex items-center gap-3 text-xs text-slate-400 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200">ou par e-mail</div>
          </>}

          <form onSubmit={submit} className="space-y-3">
            {screen === 'register' && <Field label="Nom complet" icon={<User className="h-4 w-4" />}><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Ton nom" className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" /></Field>}
            <Field label="Adresse e-mail" icon={<Mail className="h-4 w-4" />}><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="toi@exemple.com" className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" /></Field>
            {screen !== 'forgot' && <Field label="Mot de passe" icon={<Lock className="h-4 w-4" />}><input required type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6 caractères minimum" className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-3 text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" /></Field>}
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#17324d] to-[#1d3d5f] px-4 py-2.5 font-bold text-white transition hover:translate-y-[-1px] hover:shadow-lg hover:shadow-slate-900/15 disabled:cursor-wait disabled:opacity-60">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : screen === 'login' ? 'Se connecter' : screen === 'register' ? 'Créer mon compte' : 'Envoyer le lien'}</button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {screen === 'login' && <><button onClick={() => changeScreen('forgot')} className="font-semibold text-orange-600 hover:underline">Mot de passe oublié ?</button><p className="mt-3">Pas encore de compte ? <button onClick={() => changeScreen('register')} className="font-bold text-orange-600 hover:underline">Créer un compte</button></p></>}
            {screen === 'register' && <>Déjà inscrit ? <button onClick={() => changeScreen('login')} className="font-bold text-orange-600 hover:underline">Se connecter</button></>}
          </div>
        </main>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-700"><span className="mb-1.5 block">{label}</span><span className="relative block"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>{children}</span></label>;
}

function GoogleIcon() {
  return <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.05 5.05 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18V16.94A11 11 0 0 0 12 23Z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" /></svg>;
}
