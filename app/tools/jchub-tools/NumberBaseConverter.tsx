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
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Nombre à convertir</label>
        <div className="flex gap-2">
          <select
            value={base}
            onChange={(e) => setBase(Number(e.target.value) as Base)}
            className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-brand-500"
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
            className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl font-mono focus:outline-none focus:border-brand-500"
          />
        </div>
        {!isValid(value, base) && value && (
          <p className="text-xs text-red-600 mt-1.5">
            ❌ Format invalide pour la base {base}. Exemple : {base === 2 ? '1010' : base === 8 ? '52' : base === 16 ? '2A' : '42'}
          </p>
        )}
      </div>

      {/* Conversions */}
      <div className="space-y-2">
        {conversions.map((c) => (
          <div
            key={c.base}
            className={`bg-white border-2 rounded-xl p-3 ${
              c.base === base ? 'border-brand-500 bg-brand-50/30' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-brand-600" />
                <span className="font-bold text-sm">{c.label}</span>
                {c.base === base && <span className="text-xs px-2 py-0.5 bg-brand-500 text-white rounded-full">Source</span>}
              </div>
              <button
                onClick={() => copy(c.value, `b${c.base}`)}
                disabled={!c.value}
                className="text-xs text-brand-600 font-semibold flex items-center gap-1 disabled:opacity-30"
              >
                {copied === `b${c.base}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === `b${c.base}` ? 'Copié' : 'Copier'}
              </button>
            </div>
            <div className="font-mono text-lg font-bold break-all">
              {c.value || <span className="text-gray-300">—</span>}
            </div>
            {c.value && (
              <div className="text-xs text-gray-500 mt-1 font-mono">
                {c.prefix}{c.value}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Presets */}
      <div>
        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Valeurs courantes</div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => { setValue(String(p.dec)); setBase(10); }}
              className="px-3 py-1.5 border-2 border-gray-200 rounded-full text-xs font-semibold hover:border-brand-300 hover:bg-brand-50 transition"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
