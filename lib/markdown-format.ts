/**
 * Formatting buttons of the article editor (components/redaction/ArticleEditor.tsx): the Markdown
 * each one puts around the selection or before the selected lines.
 *
 * This module has no React import so that the tests can use it.
 */

export type Format = 'h2' | 'h3' | 'h4' | 'bold' | 'italic' | 'list' | 'ordered' | 'quote' | 'code' | 'codeblock' | 'link' | 'image' | 'rule';

/** One edit of the text: `text` replaces from..to, then `selectStart`..`selectEnd` is selected. */
export type Edit = { from: number; to: number; text: string; selectStart: number; selectEnd: number };

/** Markdown syntax put around the selection, or before each selected line. */
export function formatEdit(value: string, start: number, end: number, kind: Format): Edit {
  const selected = value.slice(start, end);
  const wrap = (before: string, after: string, placeholder: string): Edit => {
    const text = selected || placeholder;
    return { from: start, to: end, text: before + text + after, selectStart: start + before.length, selectEnd: start + before.length + text.length };
  };
  // A block (code, separator) sits alone between blank lines.
  const block = (text: string, selectFrom: number, selectLength: number): Edit => {
    const before = start === 0 || value.slice(0, start).endsWith('\n\n') ? '' : value.slice(0, start).endsWith('\n') ? '\n' : '\n\n';
    const after = value.slice(end).startsWith('\n\n') ? '' : value.slice(end).startsWith('\n') ? '\n' : '\n\n';
    return { from: start, to: end, text: before + text + after, selectStart: start + before.length + selectFrom, selectEnd: start + before.length + selectFrom + selectLength };
  };
  if (kind === 'bold') return wrap('**', '**', 'texte en gras');
  if (kind === 'italic') return wrap('*', '*', 'texte en italique');
  if (kind === 'code') return wrap('`', '`', 'code');
  if (kind === 'codeblock') { const code = selected || 'votre code'; return block('```\n' + code + '\n```', 4, code.length); }
  if (kind === 'rule') return block('---', 3, 0);
  if (kind === 'link' || kind === 'image') {
    const text = selected || (kind === 'link' ? 'texte du lien' : 'description de l’image');
    const opening = `${kind === 'image' ? '!' : ''}[${text}](`;
    return { from: start, to: end, text: `${opening}https://)`, selectStart: start + opening.length, selectEnd: start + opening.length + 'https://'.length };
  }
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = value.indexOf('\n', end) === -1 ? value.length : value.indexOf('\n', end);
  const lines = value.slice(lineStart, lineEnd).split('\n');
  const prefix = (index: number) => ({ h2: '## ', h3: '### ', h4: '#### ', list: '- ', ordered: `${index + 1}. `, quote: '> ' } as Record<string, string>)[kind];
  // Clicking the same button again on a formatted line removes its sign.
  const already = lines.every((line, index) => line.startsWith(prefix(index)));
  const text = lines.map((line, index) => {
    const bare = line.replace(/^(#{1,6}\s|[-*]\s|\d+\.\s|>\s)/, '');
    return already ? bare : prefix(index) + bare;
  }).join('\n');
  return { from: lineStart, to: lineEnd, text, selectStart: lineStart, selectEnd: lineStart + text.length };
}

