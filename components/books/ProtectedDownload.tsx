'use client';

import { Download, FileText } from 'lucide-react';
import { auth } from '@/lib/firebase';

export function ProtectedDownload({ slug, isFree, totalPages }: { slug: string; isFree: boolean; totalPages: number }) {
  const download = async () => {
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
    const response = await fetch(`/api/books/${encodeURIComponent(slug)}/download`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    if (response.status === 401) { window.location.href = `/compte?redirect=/livres/${slug}`; return; }
    if (!response.ok) { window.alert('Ce téléchargement nécessite un abonnement actif.'); return; }
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${slug}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return <button type="button" onClick={download} className="group relative w-full overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-4 text-left transition-all hover:border-brand-500 hover:shadow-xl"><div className="relative flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-pink-600 shadow-lg"><FileText className="h-6 w-6 text-white" /></div><div className="flex-1"><div className="font-bold text-gray-900">Télécharger PDF</div><div className="text-xs text-gray-500">{totalPages} pages · {isFree ? 'Gratuit' : 'Abonnement requis'}</div></div><Download className="h-5 w-5 text-gray-400 transition group-hover:translate-y-1 group-hover:text-brand-600" /></div></button>;
}
