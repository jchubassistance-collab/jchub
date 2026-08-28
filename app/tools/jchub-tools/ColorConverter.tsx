'use client';

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };

export function ColorConverter() {
  const [hex, setHex] = useState('#6366f1');
  const [rgb, setRgb] = useState<RGB>({ r: 99, g: 102, b: 241 });
  const [hsl, setHsl] = useState<HSL>({ h: 239, s: 84, l: 67 });
  const [copied, setCopied] = useState<string | null>(null);

  const hexToRgb = (h: string): RGB | null => {
    const clean = h.replace('#', '').trim();
    if (clean.length !== 6 && clean.length !== 3) return null;
    if (!/^[0-9a-fA-F]+$/.test(clean)) return null;
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const num = parseInt(full, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  const rgbToHsl = ({ r, g, b }: RGB): HSL => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const hslToRgb = ({ h, s, l }: HSL): RGB => {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  };

  // Sync conversions when hex changes
  useEffect(() => {
    const r = hexToRgb(hex);
    if (r) {
      setRgb(r);
      setHsl(rgbToHsl(r));
    }
  }, [hex]);

  const updateRgb = (key: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...rgb, [key]: Math.max(0, Math.min(255, value)) };
    setRgb(newRgb);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    setHsl(rgbToHsl(newRgb));
  };

  const updateHsl = (key: 'h' | 's' | 'l', value: number) => {
    const newHsl = { ...hsl, [key]: Math.max(0, key === 'h' ? Math.min(360, value) : Math.min(100, value)) };
    setHsl(newHsl);
    const newRgb = hslToRgb(newHsl);
    setRgb(newRgb);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Aperçu visuel */}
      <div className="flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-2xl">
        <div
          className="w-20 h-20 rounded-2xl shadow-lg border-2 border-white flex-shrink-0"
          style={{ background: hex }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 mb-1">Aperçu</div>
          <div className="font-mono text-2xl font-black">{hex}</div>
        </div>
        <input
          type="color"
          value={hex}
          onChange={(e) => setHex(e.target.value.toUpperCase())}
          className="w-12 h-12 rounded-xl cursor-pointer border-2 border-gray-200"
        />
      </div>

      {/* HEX */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-gray-500 uppercase">HEX</label>
          <button onClick={() => copy(hex, 'hex')} className="text-xs text-brand-600 font-semibold flex items-center gap-1">
            {copied === 'hex' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied === 'hex' ? 'Copié' : 'Copier'}
          </button>
        </div>
        <input
          type="text"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg font-mono text-lg focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* RGB */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-gray-500 uppercase">RGB</label>
          <button onClick={() => copy(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'rgb')} className="text-xs text-brand-600 font-semibold flex items-center gap-1">
            {copied === 'rgb' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied === 'rgb' ? 'Copié' : 'Copier'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['r', 'g', 'b'] as const).map((k) => (
            <div key={k}>
              <label className="text-xs font-bold text-red-500 uppercase mb-1 block">{k}</label>
              <input
                type="number"
                min="0"
                max="255"
                value={rgb[k]}
                onChange={(e) => updateRgb(k, Number(e.target.value))}
                className="w-full px-2 py-2 border-2 border-gray-200 rounded-lg font-mono text-center focus:outline-none focus:border-brand-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* HSL */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-gray-500 uppercase">HSL</label>
          <button onClick={() => copy(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'hsl')} className="text-xs text-brand-600 font-semibold flex items-center gap-1">
            {copied === 'hsl' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied === 'hsl' ? 'Copié' : 'Copier'}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['h', 's', 'l'] as const).map((k) => (
            <div key={k}>
              <label className="text-xs font-bold text-blue-500 uppercase mb-1 block">{k}</label>
              <input
                type="number"
                min="0"
                max={k === 'h' ? 360 : 100}
                value={hsl[k]}
                onChange={(e) => updateHsl(k, Number(e.target.value))}
                className="w-full px-2 py-2 border-2 border-gray-200 rounded-lg font-mono text-center focus:outline-none focus:border-brand-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
