'use client';

import { useState } from 'react';
import { Copy, Check, Trash2, AlertCircle } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';

const strings = bilingual({
  paste: 'Coller ton JSON',
  placeholder: '{"exemple": "coller ton JSON ici"}',
  indentation: 'Indentation :',
  spaces: (count: number) => `${count} espaces`,
  tab: 'Tabulation',
  format: '✨ Formater',
  minify: '📦 Minifier',
  clear: 'Effacer',
  result: 'Résultat',
  copied: 'Copié !',
  copy: 'Copier',
}, {
  paste: 'Paste your JSON',
  placeholder: '{"example": "paste your JSON here"}',
  indentation: 'Indentation:',
  spaces: (count: number) => `${count} spaces`,
  tab: 'Tab',
  format: '✨ Format',
  minify: '📦 Minify',
  clear: 'Clear',
  result: 'Result',
  copied: 'Copied!',
  copy: 'Copy',
});

export function JsonFormatter() {
  const t = strings[useLocale()];
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
    <div className="space-y-4 text-slate-100">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">{t.paste}</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          rows={8}
          className="w-full resize-y rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#9ccbff]/60"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-semibold text-slate-200">{t.indentation}</label>
        <select
          value={indent}
          onChange={(e) => setIndent(Number(e.target.value))}
          className="rounded-lg border border-[#9ccbff]/20 bg-[#071526] px-3 py-1.5 text-sm font-medium text-white focus:outline-none focus:border-[#9ccbff]/60"
        >
          <option value={2}>{t.spaces(2)}</option>
          <option value={4}>{t.spaces(4)}</option>
          <option value={0}>{t.tab}</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => format(false)} className="min-w-[120px] flex-1 rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 py-2.5 font-semibold text-white transition hover:shadow-lg">
          {t.format}
        </button>
        <button onClick={() => format(true)} className="min-w-[120px] flex-1 rounded-xl border border-[#9ccbff]/20 bg-[#0b1830]/80 py-2.5 font-semibold text-slate-200 transition hover:border-[#9ccbff]/40">
          {t.minify}
        </button>
        <button onClick={clear} aria-label={t.clear} className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-4 py-2.5 font-semibold text-red-200 transition hover:bg-red-500/20">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

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
            rows={8}
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
