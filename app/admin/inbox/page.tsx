'use client';

import { useEffect, useMemo, useState } from 'react';
import { Mail, MailCheck, MessageSquare, RefreshCw, Send, Users, Sparkles } from 'lucide-react';

type Reply = { body: string; sentAt: string | null; adminEmail: string };
type ContactMessage = { id: string; name: string; email: string; subject: string; message: string; status: string; createdAt: string | null; replies: Reply[] };
type Subscriber = { email: string; status: string; subscribedAt: string | null; brevoStatus: string };
type InboxData = { messages: ContactMessage[]; subscribers: Subscriber[] };

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Date inconnue';
}

export default function AdminInboxPage() {
  const [data, setData] = useState<InboxData>({ messages: [], subscribers: [] });
  const [tab, setTab] = useState<'contact' | 'newsletter'>('contact');
  const [selectedId, setSelectedId] = useState('');
  const [reply, setReply] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);

  async function load() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/inbox', { cache: 'no-store' });
      const result = await response.json() as InboxData & { error?: string };
      if (!response.ok) throw new Error(result.error || 'Chargement impossible.');
      setData(result);
      setSelectedId((current) => result.messages.some((message) => message.id === current) ? current : result.messages[0]?.id || '');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chargement impossible.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);
  const selected = useMemo(() => data.messages.find((message) => message.id === selectedId), [data.messages, selectedId]);

  async function sendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !reply.trim()) return;
    setSending(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/admin/inbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId: selected.id, body: reply }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Envoi impossible.');
      setReply(''); setNotice(`Réponse envoyée à ${selected.email}.`); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Envoi impossible.'); }
    finally { setSending(false); }
  }

  async function draftPartnershipReply() {
    if (!selected) return;
    setDrafting(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/admin/inbox/draft-reply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId: selected.id }) });
      const result = await response.json() as { error?: string; draft?: string };
      if (!response.ok || !result.draft) throw new Error(result.error || 'Rédaction impossible.');
      setReply(result.draft);
      setNotice('Proposition préparée. Relis-la et modifie-la si besoin avant de cliquer sur « Envoyer la réponse ».');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Rédaction impossible.'); }
    finally { setDrafting(false); }
  }

  const activeSubscribers = data.subscribers.filter((subscriber) => subscriber.status === 'active').length;
  const newMessages = data.messages.filter((message) => message.status !== 'replied').length;

  return <div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">Communication</p><h1 className="mt-2 text-3xl font-black text-slate-950">Messages et newsletter</h1><p className="mt-2 text-sm text-slate-600">Consulte les demandes reçues, réponds par e-mail et suis les inscriptions.</p></div>
      <button type="button" onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser</button>
    </header>

    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</p>}

    <div className="grid gap-4 sm:grid-cols-3">
      <Stat icon={<MessageSquare className="h-5 w-5" />} label="Messages reçus" value={data.messages.length} />
      <Stat icon={<Mail className="h-5 w-5" />} label="À traiter" value={newMessages} />
      <Stat icon={<Users className="h-5 w-5" />} label="Abonnés actifs" value={activeSubscribers} />
    </div>

    <div className="flex gap-2 border-b border-slate-200">
      <TabButton active={tab === 'contact'} onClick={() => setTab('contact')} icon={<MessageSquare className="h-4 w-4" />}>Messages de contact ({data.messages.length})</TabButton>
      <TabButton active={tab === 'newsletter'} onClick={() => setTab('newsletter')} icon={<MailCheck className="h-4 w-4" />}>Abonnés newsletter ({data.subscribers.length})</TabButton>
    </div>

    {tab === 'contact' ? <div className="grid min-h-[460px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[minmax(250px,.75fr)_minmax(0,1.5fr)]">
      <section className="border-b border-slate-200 lg:border-b-0 lg:border-r" aria-label="Liste des messages">
        {loading && !data.messages.length ? <p className="p-6 text-sm text-slate-500">Chargement des messages…</p> : data.messages.length ? <ul className="max-h-[620px] divide-y divide-slate-100 overflow-y-auto">{data.messages.map((message) => <li key={message.id}><button type="button" onClick={() => { setSelectedId(message.id); setNotice(''); }} className={`w-full p-4 text-left transition hover:bg-blue-50/70 ${selectedId === message.id ? 'bg-blue-50' : ''}`}><span className="flex items-center justify-between gap-2"><strong className="truncate text-sm text-slate-900">{message.name || message.email}</strong><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${message.status === 'replied' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>{message.status === 'replied' ? 'Répondu' : 'À traiter'}</span></span><span className="mt-1 block truncate text-xs text-slate-500">{message.subject}</span><span className="mt-2 block text-[11px] text-slate-400">{formatDate(message.createdAt)}</span></button></li>)}</ul> : <Empty text="Aucun message de contact pour le moment." />}
      </section>

      <section className="flex min-w-0 flex-col p-5 sm:p-6" aria-label="Détail du message">
        {selected ? <>
          <div className="border-b border-slate-100 pb-4"><p className="text-xs font-bold uppercase tracking-wider text-blue-600">{selected.subject || 'Message de contact'}</p><h2 className="mt-2 text-xl font-black text-slate-950">{selected.name}</h2><a className="mt-1 inline-block text-sm text-blue-700 hover:underline" href={`mailto:${selected.email}`}>{selected.email}</a><p className="mt-2 text-xs text-slate-400">Reçu le {formatDate(selected.createdAt)}</p></div>
          <div className="flex-1 space-y-4 py-5"><div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{selected.message}</div>{selected.replies.map((item, index) => <div key={`${item.sentAt}-${index}`} className="ml-5 rounded-xl border border-blue-100 bg-blue-50/70 p-4"><p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-blue-700">Ta réponse · {formatDate(item.sentAt)}</p><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.body}</p></div>)}</div>
          <form onSubmit={sendReply} className="border-t border-slate-100 pt-4"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><label htmlFor="reply" className="text-sm font-bold text-slate-800">Répondre par e-mail</label>{/parten|partnership|sponsor|collab|affiliat/i.test(`${selected.subject} ${selected.message}`) && <button type="button" onClick={() => void draftPartnershipReply()} disabled={drafting} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-50 disabled:opacity-50"><Sparkles className="h-3.5 w-3.5" />{drafting ? 'Préparation…' : 'Préparer une réponse avec l’agent'}</button>}</div><textarea id="reply" required maxLength={5000} rows={4} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Écris ta réponse…" className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-400">La proposition de l’agent n’est jamais envoyée automatiquement. Envoi via Brevo après ton clic.</span><button type="submit" disabled={sending || !reply.trim()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" />{sending ? 'Envoi…' : 'Envoyer la réponse'}</button></div></form>
        </> : <Empty text={loading ? 'Chargement…' : 'Sélectionne un message pour le lire et y répondre.'} />}
      </section>
    </div> : <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {loading && !data.subscribers.length ? <p className="p-6 text-sm text-slate-500">Chargement des abonnés…</p> : data.subscribers.length ? <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Adresse e-mail</th><th className="px-5 py-3">Inscription</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3">Synchronisation Brevo</th></tr></thead><tbody className="divide-y divide-slate-100">{data.subscribers.map((subscriber) => <tr key={subscriber.email}><td className="px-5 py-4 font-semibold text-slate-800">{subscriber.email}</td><td className="px-5 py-4 text-slate-500">{formatDate(subscriber.subscribedAt)}</td><td className="px-5 py-4"><Status value={subscriber.status} /></td><td className="px-5 py-4 text-slate-500">{subscriber.brevoStatus}</td></tr>)}</tbody></table></div> : <Empty text="Aucun abonné newsletter pour le moment." />}
      <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">Les abonnements et désabonnements restent gérés par le formulaire et Brevo.</p>
    </section>}
  </div>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700">{icon}</span><span><span className="block text-2xl font-black text-slate-950">{value}</span><span className="text-xs font-medium text-slate-500">{label}</span></span></div>; }
function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-bold ${active ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{icon}{children}</button>; }
function Empty({ text }: { text: string }) { return <p className="m-auto p-8 text-center text-sm text-slate-500">{text}</p>; }
function Status({ value }: { value: string }) { const active = value === 'active'; return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>{active ? 'Actif' : value === 'unsubscribed' ? 'Désabonné' : 'En attente'}</span>; }
