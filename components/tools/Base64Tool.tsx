'use client';

import { useState } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';

const strings = bilingual({
  encode: '🔒 Encoder',
  decode: '🔓 Décoder',
  textToEncode: 'Texte à encoder',
  base64ToDecode: 'Base64 à décoder',
  typeText: 'Tape ton texte ici...',
  pasteBase64: 'Colle ton Base64 ici...',
  encodeAction: '🔒 Encoder en Base64',
  decodeAction: '🔓 Décoder le Base64',
  result: 'Résultat',
  copied: 'Copié !',
  copy: 'Copier',
}, {
  encode: '🔒 Encode',
  decode: '🔓 Decode',
  textToEncode: 'Text to encode',
  base64ToDecode: 'Base64 to decode',
  typeText: 'Type your text here...',
  pasteBase64: 'Paste your Base64 here...',
  encodeAction: '🔒 Encode to Base64',
  decodeAction: '🔓 Decode the Base64',
  result: 'Result',
  copied: 'Copied!',
  copy: 'Copy',
});

export function Base64Tool() {
  const t = strings[useLocale()];
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
    <div className="space-y-4 text-slate-100">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => { setMode('encode'); setOutput(''); setError(''); }}
          className={`rounded-xl py-3 font-semibold transition ${mode === 'encode' ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-lg' : 'border border-[#9ccbff]/20 bg-[#0b1830]/80 text-slate-200 hover:border-[#9ccbff]/40'}`}
        >
          {t.encode}
        </button>
        <button
          onClick={() => { setMode('decode'); setOutput(''); setError(''); }}
          className={`rounded-xl py-3 font-semibold transition ${mode === 'decode' ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-lg' : 'border border-[#9ccbff]/20 bg-[#0b1830]/80 text-slate-200 hover:border-[#9ccbff]/40'}`}
        >
          {t.decode}
        </button>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">
          {mode === 'encode' ? t.textToEncode : t.base64ToDecode}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          placeholder={mode === 'encode' ? t.typeText : t.pasteBase64}
          className="w-full resize-y rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#9ccbff]/60"
        />
      </div>

      <button onClick={process} className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 py-3 font-semibold text-white transition hover:shadow-lg">
        {mode === 'encode' ? t.encodeAction : t.decodeAction}
      </button>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {output && (
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-200">{t.result}</label>
          <textarea
            readOnly
            value={output}
            rows={6}
            className="w-full rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-4 py-3 font-mono text-sm text-white"
          />
          <button
            onClick={copy}
            className="mt-2 flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-lg"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? t.copied : t.copy}
          </button>
        </div>
      )}
    </div>
  );
}
