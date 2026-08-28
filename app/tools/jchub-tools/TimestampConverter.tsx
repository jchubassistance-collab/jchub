'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

export function TimestampConverter() {
  const [timestamp, setTimestamp] = useState('');
  const [date, setDate] = useState('');
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
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
    return d.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'long' });
  };
  const formatISO = (d: Date | null) => d ? d.toISOString() : '';
  const formatUTC = (d: Date | null) => d ? d.toUTCString() : '';
  const formatRelative = (ts: number) => {
    const diff = now - ts;
    const abs = Math.abs(diff);
    const future = diff < 0;
    const units: [number, string][] = [
      [31536000, 'an'], [2592000, 'mois'], [86400, 'jour'], [3600, 'heure'], [60, 'minute'],
    ];
    for (const [sec, label] of units) {
      if (abs >= sec) {
        const val = Math.floor(abs / sec);
        return future ? `dans ${val} ${label}${val > 1 ? 's' : ''}` : `il y a ${val} ${label}${val > 1 ? 's' : ''}`;
      }
    }
    return future ? 'dans quelques secondes' : 'il y a quelques secondes';
  };

  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div className="space-y-5">
      {/* Now display */}
      <div className="bg-gradient-to-r from-brand-500 to-purple-600 text-white rounded-2xl p-4 text-center">
        <div className="text-xs uppercase tracking-wide opacity-80 mb-1">Timestamp actuel (Unix)</div>
        <div className="text-3xl font-black font-mono mb-1">{now}</div>
        <div className="text-xs opacity-80">{formatDate(new Date(now * 1000))}</div>
        <button onClick={() => setTimestamp(String(now))} className="mt-2 text-xs underline opacity-80 hover:opacity-100">
          Utiliser cette valeur
        </button>
      </div>

      {/* Timestamp → Date */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-4">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-600" />
          Timestamp → Date
        </h3>
        <div className="space-y-3">
          <input
            type="text"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            placeholder="1724678400"
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg font-mono focus:outline-none focus:border-brand-500"
          />
          {currentDate && (
            <div className="space-y-2 text-sm">
              <div className="p-2.5 bg-gray-50 rounded-lg flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-500">Local (FR)</div>
                  <div className="font-medium">{formatDate(currentDate)}</div>
                </div>
                <button onClick={() => copy(formatDate(currentDate))} className="text-xs text-brand-600 font-semibold">Copier</button>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-500">ISO 8601</div>
                  <div className="font-mono text-xs">{formatISO(currentDate)}</div>
                </div>
                <button onClick={() => copy(formatISO(currentDate))} className="text-xs text-brand-600 font-semibold">Copier</button>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-500">UTC</div>
                  <div className="font-mono text-xs">{formatUTC(currentDate)}</div>
                </div>
                <button onClick={() => copy(formatUTC(currentDate))} className="text-xs text-brand-600 font-semibold">Copier</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date → Timestamp */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-4">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-600" />
          Date → Timestamp
        </h3>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-brand-500"
        />
        {currentTs !== null && date && (
          <div className="mt-3 space-y-2">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between items-center">
              <div>
                <div className="text-xs text-emerald-700">Unix timestamp</div>
                <div className="font-mono font-bold">{currentTs}</div>
              </div>
              <button onClick={() => copy(String(currentTs))} className="text-xs text-emerald-700 font-semibold">Copier</button>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-lg text-xs text-gray-600">
              ⏱ {formatRelative(currentTs)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
