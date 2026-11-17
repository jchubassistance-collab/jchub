'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight } from 'lucide-react';
import QRCode from 'qrcode';
import { getCurrentIdToken, resetPassword, signInWithEmail } from '@/lib/firebase-auth';

const ADMIN_LAST_ACTIVITY_KEY = 'jchub_admin_last_activity';

type SessionResponse = {
  error?: string;
  role?: string;
  mfa?: 'setup' | 'setup-retry' | 'required' | 'locked';
  secret?: string;
  otpauthUri?: string;
  recoveryCodes?: string[];
  remainingRecoveryCodes?: number;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Double authentification : le jeton Firebase est gardé le temps de saisir le code.
  const [step, setStep] = useState<'credentials' | 'code' | 'setup' | 'recovery'>('credentials');
  const [idToken, setIdToken] = useState('');
  const [code, setCode] = useState('');
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [nextPath, setNextPath] = useState('/admin');
  const [notice, setNotice] = useState('');

  const openSession = async (token: string, secondFactor?: string) => {
    const response = await fetch('/api/admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(secondFactor ? { idToken: token, code: secondFactor } : { idToken: token }) });
    const responseText = await response.text();
    let data: SessionResponse = {};
    try { data = JSON.parse(responseText) as SessionResponse; }
    catch { throw new Error('Le serveur admin a renvoyé une réponse invalide. Réessaie dans quelques instants.'); }

    if (data.mfa === 'setup' && data.secret && data.otpauthUri) {
      const qr = await QRCode.toDataURL(data.otpauthUri, { margin: 1, width: 200 });
      setSetup({ secret: data.secret, qr });
      setStep('setup');
      return;
    }
    if (data.mfa === 'required' || data.mfa === 'setup-retry') {
      setStep(data.mfa === 'required' ? 'code' : 'setup');
      if (data.error) throw new Error(data.error);
      return;
    }
    if (!response.ok) throw new Error(data.error || 'Accès administrateur refusé.');

    sessionStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(Date.now()));
    const destination = data.role === 'cm' ? '/admin/cm' : data.role === 'writer' ? '/admin/redaction' : '/admin';
    if (data.recoveryCodes?.length) {
      // Les codes de secours ne sont montrés qu'une fois : on attend que l'admin les ait notés.
      setRecoveryCodes(data.recoveryCodes);
      setNextPath(destination);
      setStep('recovery');
      return;
    }
    if (typeof data.remainingRecoveryCodes === 'number') {
      setNotice(`Code de secours utilisé. Il en reste ${data.remainingRecoveryCodes}.`);
      window.setTimeout(() => router.replace(destination), 2500);
      return;
    }
    router.replace(destination);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email.trim().toLowerCase(), password);
      const token = await getCurrentIdToken();
      if (!token) throw new Error('Authentification impossible.');
      setIdToken(token);
      setPassword('');
      await openSession(token);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentification impossible.');
    } finally { setLoading(false); }
  };

  const handleCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await openSession(idToken, code);
      setCode('');
    } catch (cause) {
      setCode('');
      setError(cause instanceof Error ? cause.message : 'Code refusé.');
    } finally { setLoading(false); }
  };

  const backToCredentials = () => {
    setStep('credentials'); setIdToken(''); setCode(''); setSetup(null); setError(''); setNotice('');
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true); setError(''); setResetSent(false);
    try { await resetPassword(email.trim().toLowerCase()); setResetSent(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Impossible d’envoyer le lien de récupération.'); }
    finally { setLoading(false); }
  };

  return (
    <main className="relative isolate grid min-h-dvh place-items-center overflow-hidden bg-[#064d82] px-5 py-10 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[radial-gradient(ellipse_at_48%_8%,rgba(42,157,225,.62),transparent_56%),radial-gradient(ellipse_at_88%_76%,rgba(5,108,170,.38),transparent_48%),linear-gradient(118deg,#075389_0%,#08639e_46%,#064875_100%)]">
        <div className="absolute -left-[18%] top-[38%] h-52 w-[138%] rotate-[-7deg] rounded-[50%] bg-[#063f70]/55 blur-3xl" />
        <div className="absolute left-[12%] top-[18%] h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-sky-300/15 blur-3xl" />
        <div className="absolute -bottom-36 left-[38%] h-80 w-[60%] rounded-full bg-[#063b69]/45 blur-3xl" />
        <div className="absolute inset-0 opacity-[.075] [background-image:linear-gradient(rgba(255,255,255,.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.2)_1px,transparent_1px)] [background-size:54px_54px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_78%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.045),transparent_42%,rgba(0,20,45,.2))]" />
      </div>

      <div className="grid w-full max-w-[620px] grid-cols-1 items-center gap-8 sm:grid-cols-[minmax(0,1fr)_1px_minmax(0,1.05fr)] sm:gap-12">
        <section className="flex min-h-[180px] flex-col items-center justify-center text-center sm:min-h-[220px] sm:items-start sm:pl-1 sm:text-left">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[.24em] text-sky-100/75">Espace sécurisé</p>
          <div className="relative inline-flex items-center pr-5 text-[42px] font-bold leading-none tracking-[-.065em] text-white drop-shadow-[0_2px_12px_rgba(0,22,54,.2)] sm:text-[48px]">
            JcHub<span className="absolute -right-0.5 -top-2 h-4 w-4 rounded-full border border-dotted border-sky-100/75" />
          </div>
          <p className="mt-6 text-[15px] font-medium tracking-wide text-white/90">Console d’administration</p>
          <p className="mt-2 max-w-[220px] text-[12px] leading-6 text-sky-100/65">Gère tes contenus et tes outils depuis un seul espace.</p>
        </section>

        <div aria-hidden="true" className="hidden h-[270px] w-px bg-gradient-to-b from-transparent via-sky-100/65 to-transparent sm:block" />
        <div aria-hidden="true" className="h-px w-full bg-gradient-to-r from-transparent via-sky-100/50 to-transparent sm:hidden" />

        <section className="w-full sm:pl-0.5">
          <h1 className="mb-4 text-[20px] font-medium text-white">
            {step === 'code' ? 'Code de vérification' : step === 'setup' ? 'Activer la double authentification' : step === 'recovery' ? 'Codes de secours' : resetMode ? 'Reset Password' : 'Sign In'}
          </h1>
          {step === 'recovery' ? (
            <div className="space-y-3">
              <p className="text-sm leading-6 text-sky-100/85">Note ces codes dans un endroit sûr (gestionnaire de mots de passe). Chacun remplace une fois le code de l’appli si tu perds ton téléphone. Ils ne seront plus affichés.</p>
              <ul className="grid grid-cols-2 gap-1.5 rounded bg-white p-3 font-mono text-sm text-slate-800">
                {recoveryCodes.map((value) => <li key={value}>{value}</li>)}
              </ul>
              <div className="flex items-center justify-between pt-1">
                <button type="button" onClick={() => { void navigator.clipboard?.writeText(recoveryCodes.join('\n')).then(() => setNotice('Codes copiés.'), () => setNotice('Copie impossible : recopie-les à la main.')); }} className="text-sm italic text-white/70 transition hover:text-white">Copier les codes</button>
                <button type="button" onClick={() => router.replace(nextPath)} className="group inline-flex items-center gap-1.5 text-[20px] font-medium text-white transition hover:text-sky-100">J’ai noté<ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" /></button>
              </div>
              {notice && <p className="text-sm text-emerald-100">{notice}</p>}
            </div>
          ) : step === 'code' || step === 'setup' ? (
            <form className="space-y-3" onSubmit={handleCode}>
              {step === 'setup' && setup ? (
                <>
                  <p className="text-sm leading-6 text-sky-100/85">Scanne ce QR code avec une appli d’authentification (Google Authenticator, Microsoft Authenticator, Authy…), puis saisis le code à 6 chiffres qu’elle affiche.</p>
                  {/* eslint-disable-next-line @next/next/no-img-element -- QR code généré dans le navigateur (data URL). */}
                  <img src={setup.qr} alt="QR code à scanner avec l’appli d’authentification" width={200} height={200} className="rounded bg-white p-2" />
                  <p className="text-xs leading-5 text-sky-100/70">Sans QR code, saisis cette clé dans l’appli :<br /><span className="select-all break-all font-mono text-white">{setup.secret.match(/.{1,4}/g)?.join(' ')}</span></p>
                </>
              ) : (
                <p className="text-sm leading-6 text-sky-100/85">Saisis le code à 6 chiffres de ton appli d’authentification, ou un code de secours.</p>
              )}
              <label className="sr-only" htmlFor="admin-code">Code</label>
              <input id="admin-code" required autoFocus inputMode={step === 'setup' ? 'numeric' : 'text'} autoComplete="one-time-code" maxLength={20} value={code} onChange={(event) => setCode(event.target.value)} className="h-11 w-full border border-white/15 bg-white px-3.5 font-mono text-base tracking-[.3em] text-slate-700 outline-none placeholder:tracking-normal placeholder:text-slate-400 transition focus:border-sky-300 focus:ring-2 focus:ring-sky-200/40" placeholder={step === 'setup' ? '123456' : '123456 ou ABCD-EFGH'} />
              {error && <ErrorMessage text={error} />}
              {notice && <p className="text-sm text-emerald-100">{notice}</p>}
              <div className="flex items-center justify-between pt-1"><button type="button" onClick={backToCredentials} className="text-sm italic text-white/70 transition hover:text-white">Retour</button><button type="submit" disabled={loading || !code.trim()} className="group inline-flex items-center gap-1.5 text-[20px] font-medium text-white transition hover:text-sky-100 disabled:opacity-60"><span>{loading ? 'Vérification…' : 'Valider'}</span><ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" /></button></div>
            </form>
          ) : resetMode ? (
            <form className="space-y-3" onSubmit={handleResetPassword}>
              <label className="sr-only" htmlFor="admin-email-reset">Email</label>
              <input id="admin-email-reset" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full border border-white/15 bg-white px-3.5 text-base text-slate-700 outline-none placeholder:text-slate-400 transition focus:border-sky-300 focus:ring-2 focus:ring-sky-200/40" placeholder="Email" />
              {resetSent && <p className="text-sm leading-5 text-emerald-100">If this email is linked to an account, a reset link has been sent.</p>}
              {error && <ErrorMessage text={error} />}
              <div className="flex items-center justify-between pt-1"><button type="button" onClick={() => { setResetMode(false); setError(''); setResetSent(false); }} className="text-sm italic text-white/70 transition hover:text-white">Back to Sign In</button><button type="submit" disabled={loading} className="group inline-flex items-center gap-1.5 text-[20px] font-medium text-white transition hover:text-sky-100 disabled:opacity-60">{loading ? 'Sending…' : 'Go'}<ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" /></button></div>
            </form>
          ) : (
            <form className="space-y-3" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="admin-email">Email</label>
              <input id="admin-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full border border-white/15 bg-white px-3.5 text-base text-slate-700 outline-none placeholder:text-slate-400 transition focus:border-sky-300 focus:ring-2 focus:ring-sky-200/40" placeholder="Email" />
              <label className="sr-only" htmlFor="admin-password">Password</label>
              <input id="admin-password" type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full border border-white/15 bg-white px-3.5 text-base text-slate-700 outline-none placeholder:text-slate-400 transition focus:border-sky-300 focus:ring-2 focus:ring-sky-200/40" placeholder="Password" />
              {error && <ErrorMessage text={error} />}
              <div className="flex items-center justify-between pt-1"><button type="button" onClick={() => { setResetMode(true); setError(''); setResetSent(false); }} className="text-sm italic text-white/70 transition hover:text-white">Forgot Password</button><button type="submit" disabled={loading} className="group inline-flex items-center gap-1.5 text-[20px] font-medium text-white transition hover:text-sky-100 disabled:opacity-60"><span>{loading ? 'Signing in…' : 'Go'}</span><ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" /></button></div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function ErrorMessage({ text }: { text: string }) {
  return <p className="flex gap-2 rounded bg-red-950/30 p-2 text-[10px] text-red-100"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{text}</p>;
}
