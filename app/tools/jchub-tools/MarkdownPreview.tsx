'use client';

import { useState } from 'react';
import { Eye, Edit3, Copy, Check } from 'lucide-react';

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}

function safeUrl(url: string, allowDataImage = false) {
  const normalized = url.replace(/&amp;/g, '&').trim().toLowerCase();
  const allowed = allowDataImage
    ? /^(https?:|data:image\/)/
    : /^(https?:|mailto:|tel:)/;
  return allowed.test(normalized) ? url : '#';
}

function renderMarkdown(md: string): string {
  let html = escapeHtml(md);

  // Code blocks (```lang\ncode\n```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-3 text-xs font-mono"><code class="language-${lang}">${code}</code></pre>`;
  });

  // Inline code (`code`)
  html = html.replace(/`([^`\n]+)`/g, '<code class="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

  // Headings
  html = html.replace(/^###### (.*$)/gim, '<h6 class="text-sm font-bold mt-3 mb-1">$1</h6>');
  html = html.replace(/^##### (.*$)/gim, '<h5 class="text-base font-bold mt-3 mb-1">$1</h5>');
  html = html.replace(/^#### (.*$)/gim, '<h4 class="text-lg font-bold mt-4 mb-2">$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-5 mb-3 pb-2 border-b border-gray-200">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-black mt-5 mb-3">$1</h1>');

  // Bold **text**
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong class="font-bold">$1</strong>');
  html = html.replace(/__([^_\n]+)__/g, '<strong class="font-bold">$1</strong>');

  // Italic *text*
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em class="italic">$1</em>');
  html = html.replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em class="italic">$1</em>');

  // Strikethrough ~~text~~
  html = html.replace(/~~([^~\n]+)~~/g, '<del class="line-through text-gray-500">$1</del>');

  // Images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => (
    `<img src="${safeUrl(url, true)}" alt="${alt}" class="max-w-full rounded-lg my-2" />`
  ));

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => (
    `<a href="${safeUrl(url)}" class="text-brand-600 hover:underline" target="_blank" rel="noopener">${text}</a>`
  ));

  // Blockquotes (> text)
  html = html.replace(/^&gt; (.*$)/gim, '<blockquote class="border-l-4 border-brand-500 pl-4 py-1 my-2 text-gray-700 italic">$1</blockquote>');

  // Horizontal rule (---)
  html = html.replace(/^---$/gim, '<hr class="my-4 border-gray-200" />');

  // Unordered lists (- item)
  html = html.replace(/^[*\-+] (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
  html = html.replace(/(<li class="ml-4 list-disc">.*<\/li>\n?)+/g, '<ul class="my-2 space-y-1">$&</ul>');

  // Ordered lists (1. item)
  html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>');
  html = html.replace(/(<li class="ml-4 list-decimal">.*<\/li>\n?)+/g, '<ol class="my-2 space-y-1">$&</ol>');

  // Paragraphs (double newline)
  html = html.replace(/\n\n/g, '</p><p class="my-2 leading-relaxed">');
  html = '<p class="my-2 leading-relaxed">' + html + '</p>';

  // Cleanup
  html = html.replace(/<p class="my-2 leading-relaxed"><\/p>/g, '');
  html = html.replace(/<p class="my-2 leading-relaxed">(<h[1-6])/g, '$1');
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  html = html.replace(/<p class="my-2 leading-relaxed">(<pre)/g, '$1');
  html = html.replace(/(<\/pre>)<\/p>/g, '$1');
  html = html.replace(/<p class="my-2 leading-relaxed">(<ul|<ol|<hr|<blockquote)/g, '$1');
  html = html.replace(/(<\/ul>|<\/ol>|<hr \/>|<\/blockquote>)<\/p>/g, '$1');

  return html;
}

const SAMPLE = `# Markdown Preview

Testez votre **Markdown** en temps réel.

## Fonctionnalités

- Gras : **texte** ou __texte__
- Italique : *texte* ou _texte_
- Code inline : \`const x = 42\`
- Liens : [JcHub](https://jchub.dev)

### Code

\`\`\`javascript
function hello(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Listes

1. Premier item
2. Deuxième item
3. Troisième item

> Le Markdown c'est la vie.

[Documentation JcHub →](https://jchub.dev)
`;

export function MarkdownPreview() {
  const [input, setInput] = useState(SAMPLE);
  const [copied, setCopied] = useState(false);

  const html = renderMarkdown(input);

  const copyHtml = async () => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([input], { type: 'text/plain' }),
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      navigator.clipboard.writeText(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{input.length} caractères · {input.split('\n').length} lignes</span>
        <button onClick={copyHtml} className="text-brand-600 font-semibold flex items-center gap-1">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copié !' : 'Copier en HTML'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2 text-sm font-bold text-gray-700">
            <Edit3 className="w-4 h-4" />
            Markdown
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-4 font-mono text-sm focus:outline-none resize-none bg-white"
            rows={20}
          />
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2 text-sm font-bold text-gray-700">
            <Eye className="w-4 h-4" />
            Preview
          </div>
          <div
            className="p-4 prose prose-sm max-w-none overflow-auto"
            style={{ maxHeight: '500px' }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}
