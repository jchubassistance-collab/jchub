'use client';

import { useLocale } from 'next-intl';
import { ArrowRight, Heart, Sparkles } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Link } from '@/i18n/navigation';
import { bilingual } from '@/i18n/copy';

const copy = bilingual({
  eyebrow: 'Sélection personnelle',
  title: 'Mes favoris',
  intro: 'Garde sous la main les outils que tu veux retrouver rapidement.',
  emptyTitle: 'Aucun favori pour le moment',
  emptyText: 'Quand tu trouveras un outil qui te plaît, ajoute-le à tes favoris pour le retrouver ici.',
  discover: 'Découvrir les outils',
  private: 'Tes favoris sont privés et liés à ton compte.',
}, {
  eyebrow: 'Personal selection',
  title: 'My favorites',
  intro: 'Keep the tools you want to find quickly close at hand.',
  emptyTitle: 'No favorites yet',
  emptyText: 'When you find a tool you like, add it to your favorites to find it here.',
  discover: 'Discover the tools',
  private: 'Your favorites are private and linked to your account.',
});

export default function FavoritesPage() {
  const t = copy[useLocale()];
  return (
    <DashboardShell>
      {() => (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-rose-600 via-pink-600 to-orange-500 p-6 text-white shadow-[0_25px_70px_rgba(225,29,72,0.18)] sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-100">{t.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-black">{t.title}</h1>
            <p className="mt-2 max-w-xl text-sm text-rose-100">{t.intro}</p>
          </div>
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 text-center shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-10">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 text-rose-500"><Heart className="h-7 w-7" /></div>
            <h2 className="mt-5 text-xl font-black text-slate-900">{t.emptyTitle}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{t.emptyText}</p>
            <Link href="/outils" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#17324d] to-orange-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5">{t.discover} <ArrowRight className="h-4 w-4" /></Link>
          </section>
          <div className="flex items-center gap-2 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-800"><Sparkles className="h-4 w-4 shrink-0" />{t.private}</div>
        </div>
      )}
    </DashboardShell>
  );
}
