'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';

const strings = bilingual({
  dateLocale: 'fr-FR',
  units: [[31536000, 'an', 'ans'], [2592000, 'mois', 'mois'], [86400, 'jour', 'jours'], [3600, 'heure', 'heures'], [60, 'minute', 'minutes']] as [number, string, string][],
  future: (value: string) => `dans ${value}`,
  past: (value: string) => `il y a ${value}`,
  futureSeconds: 'dans quelques secondes',
  pastSeconds: 'il y a quelques secondes',
  current: 'Timestamp actuel (Unix)',
  useValue: 'Utiliser cette valeur',
  local: 'Local (FR)',
  copy: 'Copier',
}, {
  dateLocale: 'en-US',
  units: [[31536000, 'year', 'years'], [2592000, 'month', 'months'], [86400, 'day', 'days'], [3600, 'hour', 'hours'], [60, 'minute', 'minutes']],
  future: (value: string) => `in ${value}`,
  past: (value: string) => `${value} ago`,
  futureSeconds: 'in a few seconds',
  pastSeconds: 'a few seconds ago',
  current: 'Current timestamp (Unix)',
  useValue: 'Use this value',
  local: 'Local (EN)',
  copy: 'Copy',
});

export function TimestampConverter() {
  const t = strings[useLocale()];
  const [timestamp, setTimestamp] = useState('');
  const [date, setDate] = useState('');
  // Starts empty so the server render and the first browser render match; the clock begins after hydration.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Math.floor(Date.now() / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const tsToDate = (ts: string) => {
    const num = Number(ts);
    if (!Number.isFinite(num)) return null;
    // Si le timestamp est en millisecondes (> 10^12)
    const ms = Math.abs(num) > 1e11 ? num : num * 1000;
    const result = new Date(ms);
    return Number.isNaN(result.getTime()) ? null : result;
  };

  const dateToTs = (dateStr: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return Math.floor(d.getTime() / 1000);
  };

  const currentDate = tsToDate(timestamp);
  const currentTs = dateToTs(date);

  const formatDate = (d: Date | null) => {
    if (!d) return '';
    return d.toLocaleString(t.dateLocale, { dateStyle: 'full', timeStyle: 'long' });
  };
  const formatISO = (d: Date | null) => d ? d.toISOString() : '';
  const formatUTC = (d: Date | null) => d ? d.toUTCString() : '';
  const formatRelative = (ts: number) => {
    const diff = (now ?? ts) - ts;
    const abs = Math.abs(diff);
    const future = diff < 0;
    for (const [sec, singular, plural] of t.units) {
      if (abs >= sec) {
        const val = Math.floor(abs / sec);
        const amount = `${val} ${val > 1 ? plural : singular}`;
        return future ? t.future(amount) : t.past(amount);
      }
    }
    return future ? t.futureSeconds : t.pastSeconds;
  };

  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div className="space-y-5 text-slate-100">
      {/* Now display */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-purple-600 p-4 text-center text-white">
        <div className="mb-1 text-xs uppercase tracking-wide opacity-80">{t.current}</div>
        <div className="mb-1 font-mono text-3xl font-black">{now ?? '—'}</div>
        <div className="text-xs opacity-80">{now === null ? ' ' : formatDate(new Date(now * 1000))}</div>
        <button onClick={() => now !== null && setTimestamp(String(now))} className="mt-2 text-xs underline opacity-80 hover:opacity-100">
          {t.useValue}
        </button>
      </div>

      {/* Timestamp → Date */}
      <div className="rounded-2xl border border-[#9ccbff]/20 bg-[#0b1830]/80 p-4 shadow-[0_12px_28px_rgba(7,19,40,0.28)]">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
          <Clock className="h-4 w-4 text-[#9ccbff]" />
          Timestamp → Date
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            placeholder="1724678400"
            className="w-full rounded-lg border border-[#9ccbff]/20 bg-[#071526] px-3 py-2 font-mono text-white focus:outline-none focus:border-[#9ccbff]/60"
          />
          {currentDate && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-[#071526]/90 p-2.5">
                <div>
                  <div className="text-xs text-slate-400">{t.local}</div>
                  <div className="font-medium text-white">{formatDate(currentDate)}</div>
                </div>
                <button onClick={() => copy(formatDate(currentDate))} className="text-xs font-semibold text-[#9ccbff] hover:text-white">{t.copy}</button>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#071526]/90 p-2.5">
                <div>
                  <div className="text-xs text-slate-400">ISO 8601</div>
                  <div className="font-mono text-xs text-slate-100">{formatISO(currentDate)}</div>
                </div>
                <button onClick={() => copy(formatISO(currentDate))} className="text-xs font-semibold text-[#9ccbff] hover:text-white">{t.copy}</button>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#071526]/90 p-2.5">
                <div>
                  <div className="text-xs text-slate-400">UTC</div>
                  <div className="font-mono text-xs text-slate-100">{formatUTC(currentDate)}</div>
                </div>
                <button onClick={() => copy(formatUTC(currentDate))} className="text-xs font-semibold text-[#9ccbff] hover:text-white">{t.copy}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date → Timestamp */}
      <div className="rounded-2xl border border-[#9ccbff]/20 bg-[#0b1830]/80 p-4 shadow-[0_12px_28px_rgba(7,19,40,0.28)]">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
          <Calendar className="h-4 w-4 text-[#9ccbff]" />
          Date → Timestamp
        </h3>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-[#9ccbff]/20 bg-[#071526] px-3 py-2 text-white focus:outline-none focus:border-[#9ccbff]/60"
        />
        {currentTs !== null && date && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-2.5">
              <div>
                <div className="text-xs text-emerald-200">Unix timestamp</div>
                <div className="font-mono font-bold text-white">{currentTs}</div>
              </div>
              <button onClick={() => copy(String(currentTs))} className="text-xs font-semibold text-emerald-200 hover:text-white">{t.copy}</button>
            </div>
            <div className="rounded-lg bg-[#071526]/90 p-2.5 text-xs text-slate-300">
              ⏱ {formatRelative(currentTs)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
