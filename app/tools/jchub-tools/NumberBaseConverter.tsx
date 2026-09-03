'use client';

import { useState } from 'react';
import { Copy, Check, Hash } from 'lucide-react';

type Base = 2 | 8 | 10 | 16;

export function NumberBaseConverter() {
  const [value, setValue] = useState('42');
  const [base, setBase] = useState<Base>(10);
  const [copied, setCopied] = useState<string | null>(null);

  const isValid = (val: string, b: Base): boolean => {
    if (!val.trim()) return false;
    if (b === 10) return /^-?\d+$/.test(val.trim());
    const regex = b === 2 ? /^-?[01]+$/ : b === 8 ? /^-?[0-7]+$/ : /^-?[0-9a-fA-F]+$/;
    return regex.test(val.trim());
  };

  const toDecimal = (val: string, b: Base): bigint | null => {
    if (!isValid(val, b)) return null;
    const clean = val.trim();
    const negative = clean.startsWith('-');
    const digits = negative ? clean.slice(1) : clean;
    const prefix = b === 2 ? '0b' : b === 8 ? '0o' : b === 16 ? '0x' : '';
    const parsed = BigInt(prefix + digits);
    return negative ? -parsed : parsed;
  };

  const decimalValue = toDecimal(value, base);

  const conversions: { base: Base; label: string; prefix: string; value: string; example: string }[] = [
    { base: 2, label: 'Binaire (BIN)', prefix: '0b', value: decimalValue !== null ? decimalValue.toString(2) : '', example: '101010' },
    { base: 8, label: 'Octal (OCT)', prefix: '0o', value: decimalValue !== null ? decimalValue.toString(8) : '', example: '52' },
    { base: 10, label: 'Décimal (DEC)', prefix: '', value: decimalValue !== null ? decimalValue.toString(10) : '', example: '42' },
    { base: 16, label: 'Hexadécimal (HEX)', prefix: '0x', value: decimalValue !== null ? decimalValue.toString(16).toUpperCase() : '', example: '2A' },
  ];

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const presets = [
    { label: '255 (max octet)', dec: 255 },
    { label: '1024 (1 Ko)', dec: 1024 },
    { label: '65535 (max u16)', dec: 65535 },
    { label: '16777215 (RGB max)', dec: 16777215 },
    { label: '2147483647 (max i32)', dec: 2147483647 },
  ];

  return (
    <div className="space-y-4 text-slate-100">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">Nombre à convertir</label>
        <div className="flex gap-2">
          <select
            value={base}
            onChange={(e) => setBase(Number(e.target.value) as Base)}
            className="rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-3 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-[#9ccbff]/60"
          >
            <option value={2}>BIN (base 2)</option>
            <option value={8}>OCT (base 8)</option>
            <option value={10}>DEC (base 10)</option>
            <option value={16}>HEX (base 16)</option>
          </select>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={base === 2 ? '101010' : base === 8 ? '52' : base === 16 ? '2A' : '42'}
            className="flex-1 rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-4 py-2.5 font-mono text-white focus:outline-none focus:border-[#9ccbff]/60"
          />
        </div>
        {!isValid(value, base) && value && (
          <p className="mt-1.5 text-xs text-red-300">
            ❌ Format invalide pour la base {base}. Exemple : {base === 2 ? '1010' : base === 8 ? '52' : base === 16 ? '2A' : '42'}
          </p>
        )}
      </div>

      {/* Conversions */}
      <div className="space-y-2">
        {conversions.map((c) => (
          <div
            key={c.base}
            className={`rounded-xl border p-3 ${
              c.base === base ? 'border-[#9ccbff]/60 bg-[#9ccbff]/10' : 'border-[#9ccbff]/20 bg-[#0b1830]/80'
            }`}
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-[#9ccbff]" />
                <span className="text-sm font-bold text-white">{c.label}</span>
                {c.base === base && <span className="rounded-full bg-[#9ccbff] px-2 py-0.5 text-[10px] font-semibold text-slate-900">Source</span>}
              </div>
              <button
                onClick={() => copy(c.value, `b${c.base}`)}
                disabled={!c.value}
                className="flex items-center gap-1 text-xs font-semibold text-[#9ccbff] disabled:opacity-30 hover:text-white transition"
              >
                {copied === `b${c.base}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === `b${c.base}` ? 'Copié' : 'Copier'}
              </button>
            </div>
            <div className="break-all font-mono text-lg font-bold text-white">
              {c.value || <span className="text-slate-400">—</span>}
            </div>
            {c.value && (
              <div className="mt-1 font-mono text-xs text-slate-400">
                {c.prefix}{c.value}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Presets */}
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Valeurs courantes</div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => { setValue(String(p.dec)); setBase(10); }}
              className="rounded-full border border-[#9ccbff]/20 bg-[#0b1830]/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-[#9ccbff]/50 hover:text-white"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
