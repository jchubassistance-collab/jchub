'use client';

import Link from 'next/link';
import { ExternalLink, FileText, Loader2, MailCheck, RefreshCw, ShieldCheck, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

type Guide = {
  slug: string;
  title: string;
  description: string;
  category: string;
  level: string;
  format: string;
  size: string;
  downloadUrl: string;
};

type Lead = {
  guideSlug: string;
  email: string;
  guideEmailStatus: string;
  newsletterOptIn: boolean;
  downloadedAt: string | null;
};

type Data = { guides: Guide[]; leads: Lead[] };

export default function AdminGuidesPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/guides', { cache: 'no-store' });
      const result = await response.json() as Data & { error?: string };
      if (!response.ok) throw new Error(result.error || 'Chargement impossible.');
      setData(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function addGuide(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setUploading(true);
    setUploadMessage('');
    try {
      const response = await fetch('/api/admin/guides/upload', { method: 'POST', body: new FormData(form) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Ajout impossible.');
      form.reset();
      setUploadMessage('Guide ajouté dans Cloudinary et Firebase.');
      await load();
    } catch (cause) {
      setUploadMessage(cause instanceof Error ? cause.message : 'Ajout impossible.');
    } finally {
      setUploading(false);
    }
  }

  const totalLeads = data?.leads.length || 0;
  const sentEmails = data?.leads.filter((lead) => lead.guideEmailStatus === 'sent').length || 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Ressources</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Guides gratuits</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Teste le formulaire, l’enregistrement de l’adresse e-mail et l’envoi du lien par Brevo.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/guides" target="_blank" className="inline-flex items-center gap-2 rounded-lg bg-[#2d67f6] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200"><ExternalLink className="h-4 w-4" /> Ouvrir les guides</Link>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser</button>
        </div>
      </header>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={<FileText className="h-5 w-5" />} label="Guides disponibles" value={data?.guides.length || 0} />
        <Stat icon={<MailCheck className="h-5 w-5" />} label="Demandes enregistrées" value={totalLeads} />
        <Stat icon={<ShieldCheck className="h-5 w-5" />} label="E-mails envoyés" value={sentEmails} />
      </div>

      <section className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-5 shadow-sm">
        <div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-600 text-white"><Upload className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Nouveau guide</p><h2 className="mt-1 text-xl font-black text-slate-950">Ajouter un guide PDF</h2><p className="mt-1 text-sm text-slate-600">Le PDF sera envoyé dans Cloudinary, puis ses informations seront enregistrées dans Firebase.</p></div></div>
        <form onSubmit={addGuide} className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-indigo-100 bg-white px-3 py-2.5 text-sm text-slate-600 md:col-span-2">Le titre et la catégorie seront générés automatiquement à partir du nom du PDF.</div>
          <textarea name="description" placeholder="Description courte (optionnelle)" rows={3} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 md:col-span-2" />
          <select name="level" defaultValue="Débutant" className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"><option>Débutant</option><option>Intermédiaire</option><option>Avancé</option></select>
          <input name="file" required type="file" accept="application/pdf,.pdf" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-bold" />
          <div className="flex flex-wrap items-center gap-3 md:col-span-2"><button type="submit" disabled={uploading} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {uploading ? 'Ajout en cours...' : 'Ajouter le guide'}</button>{uploadMessage && <p className={`text-sm font-semibold ${uploadMessage.includes('ajouté') ? 'text-emerald-700' : 'text-red-700'}`} role="status">{uploadMessage}</p>}</div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Catalogue local</p><h2 className="mt-1 text-xl font-black text-slate-950">Tester chaque guide</h2></div><span className="text-xs text-slate-500">Le clic ouvre le site public</span></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {data?.guides.map((guide) => (
            <article key={guide.slug} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">{guide.category}</span><h3 className="mt-1 font-bold text-slate-950">{guide.title}</h3></div><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">{guide.format}</span></div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{guide.description}</p>
              <div className="mt-4 flex flex-wrap gap-2"><Link href={`/guides#${guide.slug}`} target="_blank" className="inline-flex items-center gap-2 rounded-lg bg-[#07142b] px-3 py-2 text-xs font-bold text-white"><ExternalLink className="h-3.5 w-3.5" /> Tester le formulaire</Link><a href={guide.downloadUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"><ExternalLink className="h-3.5 w-3.5" /> Tester le fichier</a></div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Journal des tests</p><h2 className="mt-1 text-xl font-black text-slate-950">Dernières demandes</h2></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400"><tr><th className="pb-3 pr-4">E-mail</th><th className="pb-3 pr-4">Guide</th><th className="pb-3 pr-4">Envoi</th><th className="pb-3">Date</th></tr></thead><tbody>{data?.leads.slice(-10).reverse().map((lead, index) => <tr key={`${lead.email}-${lead.guideSlug}-${index}`} className="border-b border-slate-50"><td className="py-3 pr-4 font-medium text-slate-700">{lead.email}</td><td className="py-3 pr-4 text-slate-500">{data.guides.find((guide) => guide.slug === lead.guideSlug)?.title || lead.guideSlug}</td><td className="py-3 pr-4"><span className={`rounded-full px-2 py-1 text-xs font-bold ${lead.guideEmailStatus === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{lead.guideEmailStatus}</span></td><td className="py-3 text-slate-500">{lead.downloadedAt ? new Date(lead.downloadedAt).toLocaleString('fr-FR') : 'Date inconnue'}</td></tr>)}</tbody></table>{!data?.leads.length && <p className="py-8 text-center text-sm text-slate-500">Aucune demande pour le moment.</p>}</div></section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600">{icon}</div><div className="text-2xl font-black text-slate-950">{value}</div><div className="text-xs text-slate-500">{label}</div></div>;
}
