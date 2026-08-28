'use client';

import { useEffect, useState } from 'react';
import { onAuthChange, signOut, getUserProfile, UserProfile } from '@/lib/firebase-auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { LogOut, BookOpen, Wrench, CreditCard, Settings, User, Bell, Search } from 'lucide-react';
import Link from 'next/link';

export function DashboardShell({ children }: { children: (user: UserProfile) => React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/compte');
        return;
      }
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile) setUser(profile);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="account-page min-h-[calc(100vh-200px)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#17324d] via-[#1d4e63] to-orange-500 text-lg font-black text-white shadow-lg shadow-slate-900/20">
              {user.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Bonjour 👋</div>
              <div className="text-lg font-black text-slate-900">{user.displayName}</div>
            </div>
            {user.subscription?.status === 'active' && user.subscription.tier !== 'free' && (
              <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-sm">
                ⭐ JcHub+ {user.subscription.tier}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-200 hover:text-orange-600">
              Accueil
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <aside className="md:col-span-1">
            <div className="sticky top-24 overflow-hidden rounded-[26px] border border-slate-200 bg-gradient-to-b from-slate-900 via-[#13283a] to-[#17324d] p-3 text-white shadow-[0_20px_60px_rgba(15,23,42,0.22)]">
              <div className="mb-3 px-2 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Navigation</div>
              {[
                { href: '/compte/dashboard', label: 'Tableau de bord', icon: User },
                { href: '/compte/bibliotheque', label: 'Ma bibliothèque', icon: BookOpen },
                { href: '/compte/abonnement', label: 'Abonnement', icon: CreditCard },
                { href: '/compte/parametres', label: 'Paramètres', icon: Settings },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/8 hover:text-white"
                >
                  <item.icon className="h-4 w-4 text-orange-300 transition group-hover:scale-110" />
                  {item.label}
                </Link>
              ))}
            </div>
          </aside>

          <main className="md:col-span-3">
            {children(user)}
          </main>
        </div>
      </div>
    </div>
  );
}
