'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, LockKeyhole, Mail, QrCode, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

type Step = 'credentials' | 'totp' | 'enrollment';

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [qr, setQr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createSupabaseBrowserClient();
    try {
      if (step === 'totp') {
        const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
        if (verifyError) throw verifyError;
        router.replace('/admin');
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (signInError) throw signInError;
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;
      const verifiedFactor = factors.totp.find((factor) => factor.status === 'verified');
      if (verifiedFactor) {
        const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: verifiedFactor.id });
        if (challengeError) throw challengeError;
        setFactorId(verifiedFactor.id);
        setChallengeId(challenge.id);
        setStep('totp');
        return;
      }
      const { data: enrollment, error: enrollmentError } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'JcHub Admin' });
      if (enrollmentError) throw enrollmentError;
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: enrollment.id });
      if (challengeError) throw challengeError;
      setFactorId(enrollment.id);
      setChallengeId(challenge.id);
      setQr(await QRCode.toDataURL(enrollment.totp.uri));
      setStep('enrollment');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentification impossible.');
    } finally {
      setLoading(false);
    }
  };

  const confirmEnrollment = async () => {
    setLoading(true);
    setError('');
    try {
      const { error: verifyError } = await createSupabaseBrowserClient().auth.mfa.verify({ factorId, challengeId, code });
      if (verifyError) throw verifyError;
      router.replace('/admin');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Code invalide.');
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
          <p className="mt-2 text-sm text-slate-500">Supabase Auth, mot de passe et authentification à deux facteurs.</p>
        </div>
        {step === 'enrollment' ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900"><div className="flex items-center gap-2 font-bold"><QrCode className="h-5 w-5" /> Enrôlement initial</div><p className="mt-2 leading-relaxed">Scanne ce QR avec Google Authenticator ou Microsoft Authenticator, puis confirme avec le code.</p></div>
            <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-lg ring-1 ring-slate-200"><img src={qr} alt="QR code TOTP" className="h-56 w-56" /></div>
            <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} className="w-full rounded-xl border border-slate-200 py-3 text-center text-lg font-bold tracking-[0.4em] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="000000" aria-label="Code TOTP" />
            {error && <ErrorMessage text={error} />}
            <button type="button" onClick={confirmEnrollment} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-60"><CheckCircle2 className="h-4 w-4" />{loading ? 'Vérification...' : 'Confirmer le code'}</button>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            {step === 'credentials' ? <>
              <label className="block text-sm font-semibold text-slate-700">Adresse e-mail<span className="relative mt-1.5 block"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="admin@jchub.dev" /></span></label>
              <label className="block text-sm font-semibold text-slate-700">Mot de passe<span className="relative mt-1.5 block"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></span></label>
            </> : <label className="block text-sm font-semibold text-slate-700">Code Authenticator<input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} className="mt-1.5 w-full rounded-xl border border-slate-200 py-3 text-center text-lg font-bold tracking-[0.4em] outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" placeholder="000000" /></label>}
            {error && <ErrorMessage text={error} />}
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{loading ? 'Vérification...' : step === 'totp' ? 'Confirmer le code' : 'Accéder au dashboard'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

function ErrorMessage({ text }: { text: string }) {
  return <p className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{text}</p>;
}
