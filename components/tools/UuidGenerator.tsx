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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold mb-1.5">Version UUID</label>
          <select
            value={version}
            onChange={(e) => setVersion(e.target.value as any)}
            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl font-medium focus:outline-none focus:border-brand-500"
          >
            <option value="v4">v4 (aléatoire)</option>
            <option value="v1">v1 (timestamp)</option>
            <option value="v7">v7 (moderne)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5">Nombre</label>
          <input
            type="number"
            min="1"
            max="100"
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl font-medium focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <button onClick={generate} className="w-full py-3 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Générer {count} UUID{count > 1 ? 's' : ''}
      </button>

      {uuids.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" />
              UUIDs générés
            </label>
            <button onClick={copyAll} className="text-sm text-brand-600 font-semibold hover:underline flex items-center gap-1">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copié !' : 'Tout copier'}
            </button>
          </div>
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {uuids.map((u, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-brand-300 transition group">
                <span className="flex-1 font-mono text-sm break-all">{u}</span>
                <button
                  onClick={() => copyOne(u)}
                  className="text-gray-400 hover:text-brand-600 transition opacity-0 group-hover:opacity-100"
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
