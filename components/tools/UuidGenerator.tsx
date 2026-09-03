'use client';

import { useState } from 'react';
import { Copy, Check, RefreshCw, Hash } from 'lucide-react';

function uuidV4(): string {
  return crypto.randomUUID();
}

function uuidV1(): string {
  const hex = (n: number, len: number) => n.toString(16).padStart(len, '0');
  const time = Date.now();
  const timeLow = hex(time & 0xffffffff, 8);
  const timeMid = hex((time >>> 16) & 0xffff, 4);
  const timeHi = hex(((time >>> 32) & 0x0fff) | 0x1000, 4);
  const clock = hex(Math.floor(Math.random() * 0x3fff + 0x8000), 4);
  const node = Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');
  return `${timeLow}-${timeMid}-${timeHi}-${clock}-${node}`;
}

function uuidV7(): string {
  const time = Date.now().toString(16).padStart(12, '0');
  const rand = Array.from({ length: 18 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return `${time.slice(0, 8)}-${time.slice(8, 12)}-7${rand.slice(0, 3)}-${rand.slice(3, 7)}-${rand.slice(7, 18)}`;
}

export function UuidGenerator() {
  const [version, setVersion] = useState<'v1' | 'v4' | 'v7'>('v4');
  const [count, setCount] = useState(5);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const gen = version === 'v1' ? uuidV1 : version === 'v4' ? uuidV4 : uuidV7;
    setUuids(Array.from({ length: count }, () => gen()));
  };

  const copyAll = async () => {
    if (!uuids.length) return;
    await navigator.clipboard.writeText(uuids.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyOne = async (u: string) => {
    await navigator.clipboard.writeText(u);
  };

  return (
    <div className="space-y-4 text-slate-100">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-200">Version UUID</label>
          <select
            value={version}
            onChange={(e) => setVersion(e.target.value as any)}
            className="w-full rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-3 py-2.5 font-medium text-white focus:outline-none focus:border-[#9ccbff]/60"
          >
            <option value="v4">v4 (aléatoire)</option>
            <option value="v1">v1 (timestamp)</option>
            <option value="v7">v7 (moderne)</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-200">Nombre</label>
          <input
            type="number"
            min="1"
            max="100"
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
            className="w-full rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-3 py-2.5 font-medium text-white focus:outline-none focus:border-[#9ccbff]/60"
          />
        </div>
      </div>

      <button onClick={generate} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 py-3 font-semibold text-white transition hover:shadow-lg">
        <RefreshCw className="w-4 h-4" />
        Générer {count} UUID{count > 1 ? 's' : ''}
      </button>

      {uuids.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
              <Hash className="h-3.5 w-3.5 text-[#9ccbff]" />
              UUIDs générés
            </label>
            <button onClick={copyAll} className="flex items-center gap-1 text-sm font-semibold text-[#9ccbff] hover:text-white transition">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copié !' : 'Tout copier'}
            </button>
          </div>
          <div className="max-h-96 space-y-1.5 overflow-y-auto">
            {uuids.map((u, i) => (
              <div key={i} className="group flex items-center gap-2 rounded-lg border border-[#9ccbff]/20 bg-[#071526] p-3 transition hover:border-[#9ccbff]/40">
                <span className="flex-1 break-all font-mono text-sm text-slate-100">{u}</span>
                <button
                  onClick={() => copyOne(u)}
                  className="text-slate-400 opacity-0 transition hover:text-[#9ccbff] group-hover:opacity-100"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
