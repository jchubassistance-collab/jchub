'use client';

import { useState, useMemo } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';

export function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const matches = useMemo(() => {
    if (!pattern || !text) {
      setError('');
      return [];
    }
    try {
      const regex = new RegExp(pattern, flags);
      const results: { match: string; index: number; groups: string[] }[] = [];
      if (flags.includes('g')) {
        let m;
        while ((m = regex.exec(text)) !== null) {
          results.push({ match: m[0], index: m.index, groups: m.slice(1) });
          if (m.index === regex.lastIndex) regex.lastIndex++;
        }
      } else {
        const m = regex.exec(text);
        if (m) results.push({ match: m[0], index: m.index, groups: m.slice(1) });
      }
      setError('');
      return results;
    } catch (e: any) {
      setError(e.message);
      return [];
    }
  }, [pattern, flags, text]);

  const highlighted = useMemo(() => {
    if (!matches.length) return text;
    let result = '';
    let lastIdx = 0;
    matches.forEach((m) => {
      result += escapeHtml(text.slice(lastIdx, m.index));
      result += `<mark class="bg-yellow-200 px-0.5 rounded">${escapeHtml(m.match)}</mark>`;
      lastIdx = m.index + m.match.length;
    });
    result += escapeHtml(text.slice(lastIdx));
    return result;
  }, [matches, text]);

  const clear = () => {
    setPattern('');
    setText('');
    setError('');
  };

  return (
    <div className="space-y-4 text-slate-100">
      <div className="grid grid-cols-3 gap-2">
        <input
          type="text"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="[a-z]+"
          className="col-span-2 rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-4 py-2.5 font-mono text-white focus:outline-none focus:border-[#9ccbff]/60"
        />
        <input
          type="text"
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          placeholder="g"
          className="rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-4 py-2.5 font-mono text-white focus:outline-none focus:border-[#9ccbff]/60"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">Texte à tester</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Colle ton texte ici..."
          className="w-full resize-y rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#9ccbff]/60"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          {matches.length > 0 && `${matches.length} match${matches.length > 1 ? 's' : ''} trouvé${matches.length > 1 ? 's' : ''}`}
        </span>
        <button onClick={clear} className="flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-200 transition hover:bg-red-500/20">
          <Trash2 className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {matches.length > 0 && (
        <>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">Résultat surligné</label>
            <div
              className="min-h-[100px] whitespace-pre-wrap break-all rounded-xl border border-[#9ccbff]/20 bg-[#071526] p-4 font-mono text-sm text-slate-100"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </div>

          <div className="space-y-1.5">
            {matches.slice(0, 10).map((m, i) => (
              <div key={i} className="rounded-lg border border-yellow-400/30 bg-yellow-500/10 p-2.5 text-sm text-yellow-100">
                <div className="font-semibold">#{i + 1} : <span className="font-mono">"{m.match}"</span> à l'index {m.index}</div>
                {m.groups.length > 0 && (
                  <div className="mt-1 text-xs text-slate-300">
                    Groupes : <span className="font-mono">{m.groups.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
            {matches.length > 10 && (
              <p className="text-center text-xs text-slate-400">+ {matches.length - 10} autres matches</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}
