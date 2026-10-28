'use client';

import Link from 'next/link';
import { FormEvent, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Lightbulb, Loader2, Plus } from 'lucide-react';
import { Card, Notice, statusLabels, useWriterArticles, type WriterArticleSummary } from '@/components/redaction/shared';
import { WRITER_CATEGORIES } from '@/lib/writer-rules';

const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const dotTones: Record<string, string> = { published: 'bg-emerald-500', draft: 'bg-blue-500', archived: 'bg-slate-400', scheduled: 'bg-violet-500' };
const chipTones: Record<string, string> = { published: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100', draft: 'bg-blue-50 text-blue-800 hover:bg-blue-100', archived: 'bg-slate-100 text-slate-600 hover:bg-slate-200', scheduled: 'bg-violet-50 text-violet-800 hover:bg-violet-100' };

/** Local calendar day of a date, as YYYY-MM-DD. */
function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** The day an article sits on: its publication once online, otherwise the day planned for it. */
function calendarDay(article: WriterArticleSummary) {
  if (article.publishedAt && article.status !== 'draft') return dayKey(new Date(article.publishedAt));
  return article.plannedFor;
}

export default function WriterCalendarPage() {
  const { articles, loaded, error, reload } = useWriterArticles();
  const today = dayKey(new Date());
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const [idea, setIdea] = useState({ title: '', category: 'Technologie', plannedFor: today });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const byDay = new Map<string, WriterArticleSummary[]>();
  articles.forEach((article) => { const day = calendarDay(article); if (day) byDay.set(day, [...(byDay.get(day) || []), article]); });
  const undated = articles.filter((article) => article.status === 'draft' && !article.plannedFor);

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(1 - ((first.getDay() + 6) % 7));
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((((first.getDay() + 6) % 7) + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: cellCount }, (_, index) => { const date = new Date(gridStart); date.setDate(gridStart.getDate() + index); return date; });
  const monthDays = cells.filter((date) => date.getMonth() === month.getMonth()).map(dayKey).filter((day) => byDay.has(day));
  const monthLabel = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const shiftMonth = (offset: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));

  const pickDay = (day: string) => { setIdea((current) => ({ ...current, plannedFor: day })); titleRef.current?.focus(); };

  const addIdea = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMessage(null);
    try {
      const response = await fetch('/api/redaction/articles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: idea.title.trim(), category: idea.category, plannedFor: idea.plannedFor || null }) });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Ajout impossible.');
      setIdea((current) => ({ ...current, title: '' }));
      setMessage({ tone: 'success', text: 'Idée ajoutée : elle est dans vos brouillons.' });
      await reload();
    } catch (cause) { setMessage({ tone: 'error', text: cause instanceof Error ? cause.message : 'Ajout impossible.' }); }
    finally { setBusy(false); }
  };

  const chip = (article: WriterArticleSummary) => <Link key={article.id} href={`/admin/redaction/articles/${encodeURIComponent(article.id)}`} title={`${article.title} — ${statusLabels[article.status] || article.status}`} className={`flex items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-[11px] font-medium ${chipTones[article.status] || chipTones.archived}`}><i className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotTones[article.status] || dotTones.archived}`} /><span className="truncate">{article.title}</span></Link>;

  return <div className="mx-auto max-w-[1240px] space-y-6">
    <header>
      <h1 className="text-[28px] font-extrabold tracking-tight text-[#0f1c3f]">Calendrier éditorial</h1>
      <p className="mt-1.5 text-[15px] text-slate-600">Notez vos idées, donnez-leur une date et retrouvez vos articles publiés.</p>
    </header>
    {error && <Notice>{error}</Notice>}

    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold capitalize text-[#0f1c3f]">{monthLabel}</h2>
          <div className="flex items-center gap-1.5">
            <button onClick={() => shiftMonth(-1)} aria-label="Mois précédent" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); }} className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:border-blue-300">Aujourd’hui</button>
            <button onClick={() => shiftMonth(1)} aria-label="Mois suivant" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        <>
          <div className="hidden lg:block">
            <div className="grid grid-cols-7 border-b border-slate-200 pb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">{weekDays.map((day) => <span key={day}>{day}</span>)}</div>
            <div className="grid grid-cols-7">
              {cells.map((date) => {
                const day = dayKey(date);
                const items = byDay.get(day) || [];
                const inMonth = date.getMonth() === month.getMonth();
                return <div key={day} className={`group min-h-[112px] border-b border-r border-slate-100 p-1.5 [&:nth-child(7n+1)]:border-l ${inMonth ? 'bg-white' : 'bg-slate-50/70'}`}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs font-semibold ${day === today ? 'bg-[#1f6feb] text-white' : inMonth ? 'text-slate-700' : 'text-slate-400'}`}>{date.getDate()}</span>
                    <button onClick={() => pickDay(day)} aria-label={`Ajouter une idée le ${date.toLocaleDateString('fr-FR')}`} className="grid h-6 w-6 place-items-center rounded-md text-slate-400 opacity-0 hover:bg-blue-50 hover:text-blue-700 focus:opacity-100 group-hover:opacity-100"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <div className="space-y-1">{items.slice(0, 3).map(chip)}{items.length > 3 && <p className="px-1.5 text-[11px] text-slate-500">+ {items.length - 3} autre(s)</p>}</div>
                </div>;
              })}
            </div>
          </div>
          <div className="space-y-4 lg:hidden">
            {monthDays.length ? monthDays.map((day) => <div key={day}><p className={`mb-1.5 text-sm font-semibold capitalize ${day === today ? 'text-blue-700' : 'text-slate-700'}`}>{new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p><div className="space-y-1.5">{(byDay.get(day) || []).map(chip)}</div></div>)
              : loaded && <p className="py-8 text-center text-sm text-slate-500">Rien de prévu ce mois-ci.</p>}
          </div>
          <p className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" />Publié</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-blue-500" />Brouillon prévu</span></p>
        </>
      </Card>

      <div className="space-y-5">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#0f1c3f]"><Lightbulb className="h-5 w-5 text-amber-500" />Nouvelle idée</h2>
          <form onSubmit={addIdea} className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-slate-700">Sujet<input ref={titleRef} required maxLength={140} value={idea.title} onChange={(event) => setIdea({ ...idea, title: event.target.value })} placeholder="Ex. : Installer Windows 11 sur un ancien PC" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="block text-sm font-medium text-slate-700">Catégorie<select value={idea.category} onChange={(event) => setIdea({ ...idea, category: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400">{WRITER_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label className="block text-sm font-medium text-slate-700">Date prévue<input type="date" value={idea.plannedFor} onChange={(event) => setIdea({ ...idea, plannedFor: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-400" /></label>
            {message && <Notice tone={message.tone}>{message.text}</Notice>}
            <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f6feb] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Ajouter au calendrier</button>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-bold text-[#0f1c3f]">Idées sans date</h2>
          {undated.length ? <ul className="mt-3 space-y-1.5">{undated.map((article) => <li key={article.id}><Link href={`/admin/redaction/articles/${encodeURIComponent(article.id)}`} className="block truncate rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-700">{article.title}</Link></li>)}</ul>
            : loaded && <p className="mt-2 text-sm text-slate-500">Toutes vos idées ont une date.</p>}
        </Card>
      </div>
    </div>
  </div>;
}
