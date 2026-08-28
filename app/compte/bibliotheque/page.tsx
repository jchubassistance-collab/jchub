'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, Headphones, Search } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export default function LibraryPage() {
  return (
    <DashboardShell>
      {(user) => (
        <div className="space-y-6">
          <div className="account-dashboard-hero relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#17324d] via-[#1d4e63] to-teal-600 p-6 text-white shadow-[0_25px_70px_rgba(23,50,77,0.18)] sm:p-8">
            <div className="relative z-10">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-200">Espace personnel</p>
              <h1 className="mt-2 text-3xl font-black">Ma bibliothèque</h1>
              <p className="mt-2 max-w-xl text-sm text-slate-200">Retrouve ici les livres et ressources associés à ton compte.</p>
            </div>
          </div>

          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="flex items-center gap-2 text-xl font-black text-slate-900"><BookOpen className="h-5 w-5 text-orange-600" />Tes ressources</h2><p className="mt-1 text-sm text-slate-500">Les achats apparaîtront automatiquement ici.</p></div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">0 ressource</span>
            </div>
            <div className="grid place-items-center py-14 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-orange-500"><Search className="h-7 w-7" /></div>
              <h3 className="mt-5 text-lg font-black text-slate-900">Ta bibliothèque est encore vide</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Explore les livres PDF et audio pour trouver une ressource à ajouter à ton espace.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/livres/pdf" className="inline-flex items-center gap-2 rounded-xl bg-[#17324d] px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-orange-600"><FileText className="h-4 w-4" />Livres PDF</Link>
                <Link href="/livres/audio" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"><Headphones className="h-4 w-4" />Livres audio</Link>
              </div>
            </div>
          </section>
          <p className="sr-only">Compte connecté : {user.email}</p>
        </div>
      )}
    </DashboardShell>
  );
}
