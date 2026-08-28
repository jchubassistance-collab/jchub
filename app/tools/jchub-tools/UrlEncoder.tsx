'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function UrlEncoder() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode' | 'componentEncode' | 'componentDecode'>('encode');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const process = () => {
    setError('');
    try {
      if (mode === 'encode') {
        setOutput(encodeURI(input));
      } else if (mode === 'decode') {
        setOutput(decodeURI(input));
      } else if (mode === 'componentEncode') {
        setOutput(encodeURIComponent(input));
      } else {
        setOutput(decodeURIComponent(input));
      }
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  };

  const copy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: 'encode', label: 'encodeURI()' },
          { id: 'decode', label: 'decodeURI()' },
          { id: 'componentEncode', label: 'encodeURIComponent' },
          { id: 'componentDecode', label: 'decodeURIComponent' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id as any)}
            className={`py-2.5 rounded-xl text-xs font-semibold transition ${
              mode === m.id ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          {mode === 'decode' ? 'URL encodée' : 'Texte à encoder'}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          placeholder={mode === 'encode' || mode === 'componentEncode' ? 'https://example.com/chemin avec espaces & accents' : 'https%3A%2F%2Fexample.com'}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:border-brand-500 resize-y"
        />
      </div>

      <button onClick={process} className="w-full py-3 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition">
        Convertir
      </button>

      {error && (
        <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      {output && (
        <div>
          <label className="block text-sm font-semibold mb-2">Résultat</label>
          <textarea
            readOnly
            value={output}
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-mono text-sm bg-gray-50"
          />
          <button onClick={copy} className="mt-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-1.5 text-sm">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié !' : 'Copier'}
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500 text-center">
        💡 <strong>encodeURI</strong> : encode une URL complète (préserve :, /, ?, &).<br />
        <strong>encodeURIComponent</strong> : encode un paramètre (encode tout).
      </p>
    </div>
  );
}
