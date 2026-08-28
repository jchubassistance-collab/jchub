'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Users,
  BookOpen,
  CreditCard,
  Wrench,
  TrendingUp,
  DollarSign,
  Activity,
  AlertCircle,
  Upload,
  Eye,
  Download,
} from 'lucide-react';

import Link from 'next/link';

type AdminStats = {
  totalUsers: number;
  totalBooks: number;
  totalTransactions: number;
  totalRevenue: number;
  totalViews: number;
  totalDownloads: number;
  recentUsers: {
    uid: string;
    email: string;
    createdAt: string | null;
  }[];
};

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);

  /**
   * Charge les statistiques avec un token Firebase frais.
   */
  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await response.json().catch(() => null);

      console.log('Réponse /api/admin/stats:', {
        status: response.status,
        ok: response.ok,
        data,
      });

      if (response.status === 401) {
        console.error(
          '401 Unauthorized : le serveur refuse le token Firebase.'
        );

        throw new Error(
          'Session administrateur invalide. Veuillez vous reconnecter.'
        );
      }

      if (response.status === 403) {
        throw new Error(
          'Ton compte Firebase existe, mais il ne possède pas le rôle admin.'
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error || 'Impossible de charger les statistiques.'
        );
      }

      setStats(data as AdminStats);
    } catch (error) {
      console.error('Erreur chargement stats:', error);

      if (error instanceof Error) {
        console.error('Message:', error.message);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const response = await fetch('/api/admin/stats', { credentials: 'include', cache: 'no-store' });
        if (!response.ok) {
          router.replace('/admin/login');
          return;
        }
        if (cancelled) return;
        setIsAdmin(true);
        await loadStats();
      } catch (error) {
        console.error('Erreur vérification session admin:', error);
        if (!cancelled) setIsAdmin(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // ================================================================
  // CHARGEMENT
  // ================================================================

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  // ================================================================
  // ACCÈS REFUSÉ
  // ================================================================

  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />

          <h1 className="text-2xl font-black mb-2">
            Accès refusé
          </h1>

          <p className="text-gray-600 mb-4">
            Tu n&apos;as pas les droits pour accéder à cette page.
          </p>

          <Link
            href="/"
            className="text-brand-600 hover:underline"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  // ================================================================
  // DASHBOARD
  // ================================================================

  return (
    <div>
      <div className="max-w-7xl mx-auto">

        {/* En-tête */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-3 py-1 text-xs font-semibold text-red-700 mb-2">
            <Activity className="w-3.5 h-3.5" />
            Admin Dashboard
          </div>

          <h1 className="text-3xl md:text-4xl font-black">
            Tableau de bord JcHub
          </h1>

          <p className="text-gray-600">
            Vue d&apos;ensemble de la plateforme
          </p>
        </div>

        {/* Erreur de chargement des statistiques */}
        {!stats && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500" />

              <div>
                <div className="font-bold text-red-700">
                  Impossible de charger les statistiques
                </div>

                <p className="text-sm text-red-600">
                  Vérifie la session administrateur et recharge la page.
                </p>
              </div>
            </div>
          </div>
        )}

        {stats && (
          <>
            {/* Statistiques principales */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
              {[
                {
                  label: 'Utilisateurs',
                  value: stats.totalUsers,
                  icon: Users,
                  color: 'from-blue-500 to-cyan-500',
                },
                {
                  label: 'Livres',
                  value: stats.totalBooks,
                  icon: BookOpen,
                  color: 'from-purple-500 to-pink-500',
                },
                {
                  label: 'Transactions',
                  value: stats.totalTransactions,
                  icon: CreditCard,
                  color: 'from-emerald-500 to-teal-500',
                },
                {
                  label: 'Revenus (XAF)',
                  value: stats.totalRevenue.toLocaleString('fr-FR'),
                  icon: DollarSign,
                  color: 'from-amber-500 to-orange-500',
                },
                {
                  label: 'Vues des livres',
                  value: stats.totalViews.toLocaleString('fr-FR'),
                  icon: Eye,
                  color: 'from-violet-500 to-fuchsia-500',
                },
                {
                  label: 'Téléchargements PDF',
                  value: stats.totalDownloads.toLocaleString('fr-FR'),
                  icon: Download,
                  color: 'from-sky-500 to-blue-600',
                },
              ].map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="bg-white border border-gray-200 rounded-2xl p-5"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-md`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    <div className="text-2xl font-black">
                      {stat.value}
                    </div>

                    <div className="text-xs text-gray-500">
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions administrateur */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

              <Link
                href="/admin/upload"
                className="bg-gradient-to-br from-brand-500 to-purple-600 text-white rounded-2xl p-5 hover:shadow-xl hover:scale-105 transition group"
              >
                <Upload className="w-6 h-6 mb-2 group-hover:scale-110 transition" />

                <div className="font-bold">
                  Upload livre IA
                </div>

                <div className="text-xs text-brand-100">
                  PDF → métadonnées auto
                </div>
              </Link>

              <Link
                href="/admin/users"
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition group"
              >
                <Users className="w-6 h-6 text-brand-600 mb-2 group-hover:scale-110 transition" />

                <div className="font-bold">
                  Utilisateurs
                </div>

                <div className="text-xs text-gray-500">
                  Voir, modifier, supprimer
                </div>
              </Link>

              <Link
                href="/admin/books"
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition group"
              >
                <BookOpen className="w-6 h-6 text-brand-600 mb-2 group-hover:scale-110 transition" />

                <div className="font-bold">
                  Livres
                </div>

                <div className="text-xs text-gray-500">
                  Ajouter, modifier, publier
                </div>
              </Link>

              <Link
                href="/admin/tools"
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition group"
              >
                <Wrench className="w-6 h-6 text-brand-600 mb-2 group-hover:scale-110 transition" />

                <div className="font-bold">
                  Outils
                </div>

                <div className="text-xs text-gray-500">
                  Activer, désactiver
                </div>
              </Link>

            </div>

            {/* Derniers utilisateurs */}
            <section className="bg-white border border-gray-200 rounded-2xl p-6">

              <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-600" />
                Derniers inscrits
              </h2>

              {stats.recentUsers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Aucun utilisateur pour l&apos;instant
                </p>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full text-sm">

                    <thead className="text-left text-xs text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="pb-2 font-semibold">
                          Email
                        </th>

                        <th className="pb-2 font-semibold">
                          UID
                        </th>

                        <th className="pb-2 font-semibold">
                          Date
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {stats.recentUsers.map((user) => (
                        <tr
                          key={user.uid}
                          className="border-b border-gray-100"
                        >
                          <td className="py-2.5 font-medium">
                            {user.email}
                          </td>

                          <td className="py-2.5 font-mono text-xs text-gray-500">
                            {user.uid.slice(0, 8)}...
                          </td>

                          <td className="py-2.5 text-gray-500">
                            {user.createdAt
                              ? new Date(
                                  user.createdAt
                                ).toLocaleDateString('fr-FR')
                              : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                  </table>

                </div>
              )}

            </section>
          </>
        )}

      </div>
    </div>
  );
}