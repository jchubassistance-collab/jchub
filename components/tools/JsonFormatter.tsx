'use client';

import { useState } from 'react';
import { Copy, Check, Trash2, AlertCircle } from 'lucide-react';

export function JsonFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [indent, setIndent] = useState(2);
  const [copied, setCopied] = useState(false);

  const format = (minify = false) => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError('');
        return;
      }
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, minify ? 0 : indent));
      setError('');
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Coller ton JSON</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='{"exemple": "coller ton JSON ici"}'
          rows={8}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:border-brand-500 resize-y"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-sm font-semibold">Indentation :</label>
        <select
          value={indent}
          onChange={(e) => setIndent(Number(e.target.value))}
          className="px-3 py-1.5 border-2 border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-brand-500"
        >
          <option value={2}>2 espaces</option>
          <option value={4}>4 espaces</option>
          <option value={0}>Tabulation</option>
        </select>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => format(false)} className="flex-1 min-w-[120px] py-2.5 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition">
          ✨ Formater
        </button>
        <button onClick={() => format(true)} className="flex-1 min-w-[120px] py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition">
          📦 Minifier
        </button>
        <button onClick={clear} className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-semibold transition flex items-center gap-1.5">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {output && (
        <div>
          <label className="block text-sm font-semibold mb-2">Résultat</label>
          <textarea
            readOnly
            value={output}
            rows={8}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-mono text-sm bg-gray-50"
          />
          <button
            onClick={copy}
            className="mt-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-1.5 text-sm"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié !' : 'Copier'}
          </button>
        </div>
      )}
    </div>
  );
}
