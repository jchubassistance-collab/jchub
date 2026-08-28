'use client';

import { useState } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';

export function Base64Tool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const process = () => {
    try {
      if (mode === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(input))));
      } 
       else {
          setOutput(decodeURIComponent(escape(atob(input))));
      
      }
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => { setMode('encode'); setOutput(''); setError(''); }}
          className={`py-3 rounded-xl font-semibold transition ${mode === 'encode' ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          🔒 Encoder
        </button>
        <button
          onClick={() => { setMode('decode'); setOutput(''); setError(''); }}
          className={`py-3 rounded-xl font-semibold transition ${mode === 'decode' ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          🔓 Décoder
        </button>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">
          {mode === 'encode' ? 'Texte à encoder' : 'Base64 à décoder'}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          placeholder={mode === 'encode' ? 'Tape ton texte ici...' : 'Colle ton Base64 ici...'}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:border-brand-500 resize-y"
        />
      </div>

      <button onClick={process} className="w-full py-3 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition">
        {mode === 'encode' ? '🔒 Encoder en Base64' : '🔓 Décoder le Base64'}
      </button>

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
            rows={6}
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
