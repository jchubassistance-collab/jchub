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
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold mb-2 flex items-center justify-between">
          <span>Longueur</span>
          <span className="text-2xl font-black text-brand-600">{length}</span>
        </label>
        <input
          type="range"
          min="6"
          max="64"
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-brand-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
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
          <label key={key} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition">
            <input
              type="checkbox"
              checked={options[key as keyof typeof options]}
              onChange={(e) => setOptions({ ...options, [key]: e.target.checked })}
              className="w-4 h-4 accent-brand-600"
            />
            <span className="text-sm font-medium">{label}</span>
          </label>
        ))}
      </div>

      <button
        onClick={generate}
        className="w-full py-3 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
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
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-mono text-sm bg-gray-50 focus:outline-none focus:border-brand-500"
            />
            <button
              onClick={copy}
              className="px-4 py-3 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Force
              </span>
              <span className="text-sm font-bold text-gray-700">{strengthLabels[strength]}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex gap-0.5">
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

      <p className="text-xs text-gray-500 text-center">
        🔒 Génération 100% locale (Web Crypto API). Aucun mot de passe n'est envoyé sur internet.
      </p>
    </div>
  );
}
