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
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <input
          type="text"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="[a-z]+"
          className="col-span-2 px-4 py-2.5 border-2 border-gray-200 rounded-xl font-mono focus:outline-none focus:border-brand-500"
        />
        <input
          type="text"
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          placeholder="g"
          className="px-4 py-2.5 border-2 border-gray-200 rounded-xl font-mono focus:outline-none focus:border-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Texte à tester</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Colle ton texte ici..."
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:border-brand-500 resize-y"
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {matches.length > 0 && `${matches.length} match${matches.length > 1 ? 's' : ''} trouvé${matches.length > 1 ? 's' : ''}`}
        </span>
        <button onClick={clear} className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition flex items-center gap-1">
          <Trash2 className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {matches.length > 0 && (
        <>
          <div>
            <label className="block text-sm font-semibold mb-2">Résultat surligné</label>
            <div
              className="p-4 border-2 border-gray-200 rounded-xl bg-gray-50 font-mono text-sm whitespace-pre-wrap break-all min-h-[100px]"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </div>

          <div className="space-y-1.5">
            {matches.slice(0, 10).map((m, i) => (
              <div key={i} className="text-sm p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="font-semibold">#{i + 1} : <span className="font-mono">"{m.match}"</span> à l'index {m.index}</div>
                {m.groups.length > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    Groupes : <span className="font-mono">{m.groups.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}
            {matches.length > 10 && (
              <p className="text-xs text-gray-500 text-center">+ {matches.length - 10} autres matches</p>
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
