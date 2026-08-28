'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, Mail, Save, User } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { auth } from '@/lib/firebase';
import { saveOnboarding } from '@/lib/firebase-auth';

export default function SettingsPage() {
  return (
    <DashboardShell>
      {(user) => <SettingsForm user={user} />}
    </DashboardShell>
  );
}

function SettingsForm({ user }: { user: { uid: string; displayName: string; email: string; level?: string; languages?: string[]; interests?: string[]; goal?: string } }) {
  const [name, setName] = useState(user.displayName || '');
  const [level, setLevel] = useState(user.level || '');
  const [goal, setGoal] = useState(user.goal || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      if (auth.currentUser && name.trim()) await updateProfile(auth.currentUser, { displayName: name.trim() });
      await saveOnboarding(user.uid, { level, languages: user.languages ?? [], interests: user.interests ?? [], goal });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return <div className="space-y-6"><div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#17324d] via-[#1d4e63] to-orange-500 p-6 text-white shadow-[0_25px_70px_rgba(23,50,77,0.18)] sm:p-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-orange-200">Préférences</p><h1 className="mt-2 text-3xl font-black">Paramètres du compte</h1><p className="mt-2 text-sm text-slate-200">Personnalise ton profil et tes objectifs d’apprentissage.</p></div><form onSubmit={submit} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700"><span className="mb-2 block">Nom complet</span><span className="relative block"><User className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100" /></span></label><label className="block text-sm font-semibold text-slate-700"><span className="mb-2 block">Adresse e-mail</span><span className="relative block"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={user.email} disabled className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 py-2.5 pl-10 pr-3 text-slate-500" /></span></label><label className="block text-sm font-semibold text-slate-700"><span className="mb-2 block">Niveau</span><select value={level} onChange={(event) => setLevel(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"><option value="">Sélectionner</option><option value="debutant">Débutant</option><option value="intermediaire">Intermédiaire</option><option value="avance">Avancé</option></select></label><label className="block text-sm font-semibold text-slate-700"><span className="mb-2 block">Objectif principal</span><select value={goal} onChange={(event) => setGoal(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"><option value="">Sélectionner</option><option value="apprendre">Apprendre</option><option value="projet">Construire un projet</option><option value="carriere">Faire évoluer ma carrière</option></select></label></div><div className="mt-6 flex flex-wrap items-center gap-3"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#17324d] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}</button>{saved && <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600"><CheckCircle2 className="h-4 w-4" />Modifications enregistrées</span>}</div></form></div>;
}
