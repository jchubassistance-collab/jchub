'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, Shield } from 'lucide-react';

export function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState(0);

  const generate = () => {
    let charset = '';
    if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.numbers) charset += '0123456789';
    if (options.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) {
      setPassword('');
      return;
    }

    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    let pwd = '';
    for (let i = 0; i < length; i++) {
      pwd += charset[array[i] % charset.length];
    }
    setPassword(pwd);
  };

  useEffect(() => {
    generate();
  }, []);

  useEffect(() => {
    let s = 0;
    if (length >= 12) s++;
    if (length >= 16) s++;
    if (Object.values(options).filter(Boolean).length >= 3) s++;
    if (Object.values(options).filter(Boolean).length === 4) s++;
    setStrength(s);
  }, [length, options]);

  const copy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const strengthLabels = ['Faible', 'Moyen', 'Bon', 'Fort', 'Très fort'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-600'];

  return (
    <div className="space-y-5 text-slate-100">
      <div>
        <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-200">
          <span>Longueur</span>
          <span className="text-2xl font-black text-[#9ccbff]">{length}</span>
        </label>
        <input
          type="range"
          min="6"
          max="64"
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-[#9ccbff]"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>6</span><span>16</span><span>32</span><span>48</span><span>64</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'uppercase', label: 'Majuscules (A-Z)' },
          { key: 'lowercase', label: 'Minuscules (a-z)' },
          { key: 'numbers', label: 'Chiffres (0-9)' },
          { key: 'symbols', label: 'Symboles (!@#)' },
        ].map(({ key, label }) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent p-3 transition hover:border-[#9ccbff]/30 hover:bg-[#0b1830]/80">
            <input
              type="checkbox"
              checked={options[key as keyof typeof options]}
              onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
              className="h-4 w-4 accent-[#9ccbff]"
            />
            <span className="text-sm font-medium text-slate-200">{label}</span>
          </label>
        ))}
      </div>

      <button
        onClick={generate}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 py-3 font-semibold text-white transition hover:shadow-lg"
      >
        <RefreshCw className="w-4 h-4" />
        Régénérer
      </button>

      {password && (
        <>
          <div className="flex gap-2">
            <input
              readOnly
              value={password}
              className="flex-1 rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-4 py-3 font-mono text-sm text-white focus:outline-none"
            />
            <button
              onClick={copy}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 px-4 py-3 font-semibold text-white transition hover:shadow-lg"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1 text-sm font-semibold text-slate-200">
                <Shield className="w-3.5 h-3.5 text-[#9ccbff]" />
                Force
              </span>
              <span className="text-sm font-bold text-slate-100">{strengthLabels[strength]}</span>
            </div>
            <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-slate-700">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex-1 transition-all ${i < strength ? strengthColors[strength] : 'bg-transparent'}`}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <p className="text-center text-xs text-slate-400">
        🔒 Génération 100% locale (Web Crypto API). Aucun mot de passe n'est envoyé sur internet.
      </p>
    </div>
  );
}
