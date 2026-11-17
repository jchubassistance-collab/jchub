'use client';

import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

export const nf = new Intl.NumberFormat('fr-FR');
export const formatNumber = (value: number | null | undefined) => (value === null || value === undefined ? '—' : nf.format(value));

/** A dashboard block: title, optional action on the right, content. */
export function Panel({ title, subtitle, action, children, className = '' }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

/** Change against the previous period: green up, red down; `inverse` when a rise is bad (errors). */
export function Change({ value, inverse = false, label = 'vs période préc.' }: { value: number | null | undefined; inverse?: boolean; label?: string }) {
  if (value === null || value === undefined) return <span className="text-[11px] text-slate-400">pas de comparaison</span>;
  const good = inverse ? value < 0 : value > 0;
  const Icon = value === 0 ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  const tone = value === 0 ? 'text-slate-500' : good ? 'text-emerald-600' : 'text-red-600';
  return <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${tone}`}><Icon className="h-3 w-3" />{Math.abs(value).toLocaleString('fr-FR')} % <span className="font-normal text-slate-400">{label}</span></span>;
}

export function KpiCard({ label, value, icon, tone, footer }: { label: string; value: string; icon: ReactNode; tone: string; footer: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold text-slate-500">{label}</p>
        <p className="mt-0.5 text-xl font-black leading-tight text-slate-950">{value}</p>
        <div className="mt-0.5 truncate">{footer}</div>
      </div>
    </div>
  );
}

/** Half-circle gauge, value between 0 and max. */
export function Gauge({ value, max = 100, label, color, suffix = '' }: { value: number | null; max?: number; label: string; color: string; suffix?: string }) {
  const ratio = value === null ? 0 : Math.max(0, Math.min(1, value / max));
  const radius = 70;
  const length = Math.PI * radius;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 180 100" className="w-full max-w-[200px]" role="img" aria-label={`${label} : ${value ?? '—'}${suffix}`}>
        <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="#e2e8f0" strokeWidth="16" strokeLinecap="round" />
        <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" strokeDasharray={`${length * ratio} ${length}`} />
        <text x="90" y="80" textAnchor="middle" className="fill-slate-900" style={{ fontSize: 26, fontWeight: 900 }}>{value === null ? '—' : `${value.toLocaleString('fr-FR')}${suffix}`}</text>
      </svg>
      <p className="-mt-1 text-[11px] font-semibold text-slate-500">{label}</p>
    </div>
  );
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const SLOTS = ['0-3h', '3-6h', '6-9h', '9-12h', '12-15h', '15-18h', '18-21h', '21-24h'];

/** Page views by weekday and 3-hour slot. GA4 counts days from Sunday (0). */
export function TrafficHeatmap({ cells }: { cells: { day: number; hour: number; views: number }[] }) {
  const grid = DAYS.map(() => SLOTS.map(() => 0));
  for (const cell of cells) grid[(cell.day + 6) % 7][Math.floor(cell.hour / 3)] += cell.views;
  const max = Math.max(1, ...grid.flat());
  const color = (value: number) => {
    if (!value) return '#f1f5f9';
    const ratio = value / max;
    return ratio > 0.75 ? '#1d4ed8' : ratio > 0.5 ? '#3b82f6' : ratio > 0.25 ? '#93c5fd' : '#dbeafe';
  };
  return (
    <div>
      <div className="grid grid-cols-[34px_repeat(8,minmax(0,1fr))] gap-1 text-[10px]">
        <span />
        {SLOTS.map((slot) => <span key={slot} className="truncate text-center text-slate-400">{slot}</span>)}
        {DAYS.map((day, row) => (
          <div key={day} className="contents">
            <span className="self-center font-semibold text-slate-500">{day}</span>
            {grid[row].map((value, column) => <span key={column} title={`${day} ${SLOTS[column]} : ${nf.format(value)} page(s) vue(s)`} className="h-6 rounded" style={{ background: color(value) }} />)}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-400">Moins {['#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8'].map((value) => <span key={value} className="h-2.5 w-4 rounded-sm" style={{ background: value }} />)} Plus</div>
    </div>
  );
}

export type CalendarItem = { at: number; type: 'article' | 'tool' | 'agent'; title: string; category: string; status: string };
const TYPE_COLORS: Record<CalendarItem['type'], string> = { article: '#2563eb', tool: '#16a34a', agent: '#9333ea' };
const DAY_MS = 86400_000;

/**
 * Gantt-like editorial calendar: one row per blog section, then tools and agents, with a mark on
 * each date. Filled mark = published or done, outlined = scheduled. The red line is today.
 */
export function EditorialTimeline({ items, filter }: { items: CalendarItem[]; filter: 'all' | CalendarItem['type'] }) {
  const now = Date.now();
  const from = now - 14 * DAY_MS;
  const to = now + 70 * DAY_MS;
  const position = (at: number) => `${((at - from) / (to - from)) * 100}%`;
  const shown = items.filter((item) => filter === 'all' || item.type === filter);
  const rows = new Map<string, CalendarItem[]>();
  for (const item of shown) {
    const key = item.type === 'article' ? item.category : item.type === 'tool' ? 'Outils' : item.title;
    rows.set(key, [...(rows.get(key) ?? []), item]);
  }
  const weeks = Array.from({ length: 12 }, (_, index) => from + index * 7 * DAY_MS);
  return (
    <div className="min-w-0">
      <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-x-3">
        <span />
        <div className="relative h-5 border-b border-slate-200 text-[10px] text-slate-400">
          {weeks.map((week) => <span key={week} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: position(week) }}>{new Date(week).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>)}
        </div>
        {Array.from(rows.entries()).map(([label, rowItems]) => (
          <div key={label} className="contents">
            <span className="truncate py-1.5 text-[11px] font-semibold text-slate-600" title={label}>{label}</span>
            <div className="relative h-7 border-b border-slate-100">
              {weeks.map((week) => <span key={week} className="absolute inset-y-0 w-px bg-slate-100" style={{ left: position(week) }} />)}
              <span className="absolute inset-y-0 w-0.5 bg-red-400" style={{ left: position(now) }} />
              {rowItems.map((item, index) => {
                const done = item.status === 'published' || item.at < now;
                return (
                  <span
                    key={`${item.at}-${index}`}
                    title={`${new Date(item.at).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })} · ${item.title}${item.type === 'agent' ? '' : ` (${done ? 'publié' : 'programmé'})`}`}
                    className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                    style={{ left: position(item.at), borderColor: TYPE_COLORS[item.type], background: done ? TYPE_COLORS[item.type] : '#fff' }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {!rows.size && <p className="py-6 text-center text-xs text-slate-400">Rien de prévu sur cette période.</p>}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" />Article</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-green-600" />Outil</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-purple-600" />Agent IA</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full border-2 border-slate-400 bg-white" />Programmé</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-0.5 bg-red-400" />Aujourd’hui</span>
      </div>
    </div>
  );
}
