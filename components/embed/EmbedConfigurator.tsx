'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';

const copy = bilingual({
  content: 'Contenu',
  tools: 'Outils',
  articles: 'Articles',
  language: 'Langue',
  count: 'Nombre de cartes',
  columns: 'Colonnes',
  theme: 'Thème',
  light: 'Clair',
  dark: 'Sombre',
  auto: 'Auto',
  category: 'Catégorie',
  allCategories: 'Toutes',
  code: 'Code à coller sur ton site',
  copy: 'Copier le code',
  copied: 'Copié',
  preview: 'Aperçu',
}, {
  content: 'Content',
  tools: 'Tools',
  articles: 'Articles',
  language: 'Language',
  count: 'Number of cards',
  columns: 'Columns',
  theme: 'Theme',
  light: 'Light',
  dark: 'Dark',
  auto: 'Auto',
  category: 'Category',
  allCategories: 'All',
  code: 'Code to paste on your site',
  copy: 'Copy code',
  copied: 'Copied',
  preview: 'Preview',
});

type Kind = 'tools' | 'articles';
type Theme = 'light' | 'dark' | 'auto';
export type EmbedCategories = Record<Locale, Record<Kind, string[]>>;

declare global {
  interface Window { JcHubEmbed?: { refresh: () => void } }
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** Builds the embed snippet, shows it and renders the real widget with the same settings. */
export function EmbedConfigurator({ origin, categories }: { origin: string; categories: EmbedCategories }) {
  const locale = useLocale() as Locale;
  const t = copy[locale];
  const [kind, setKind] = useState<Kind>('tools');
  const [lang, setLang] = useState<Locale>(locale);
  const [limit, setLimit] = useState(6);
  const [columns, setColumns] = useState(3);
  const [theme, setTheme] = useState<Theme>('light');
  const [category, setCategory] = useState('');
  const [copied, setCopied] = useState(false);
  const preview = useRef<HTMLDivElement>(null);

  const options = categories[lang][kind];
  const activeCategory = options.includes(category) ? category : '';

  const attributes = useMemo(() => {
    const list: [string, string][] = [['data-jchub', kind], ['data-lang', lang], ['data-limit', String(limit)]];
    if (columns !== 3) list.push(['data-columns', String(columns)]);
    if (theme !== 'light') list.push(['data-theme', theme]);
    if (activeCategory) list.push(['data-category', activeCategory]);
    return list;
  }, [kind, lang, limit, columns, theme, activeCategory]);

  const snippet = `<div ${attributes.map(([name, value]) => `${name}="${escapeAttribute(value)}"`).join(' ')}></div>\n<script src="${origin}/embed.js" async></script>`;

  // The preview is the real widget: a fresh host for each setting, drawn by /embed.js.
  useEffect(() => {
    const container = preview.current;
    if (!container) return;
    container.replaceChildren();
    const host = document.createElement('div');
    for (const [name, value] of attributes) host.setAttribute(name, value);
    container.appendChild(host);
    if (window.JcHubEmbed) {
      window.JcHubEmbed.refresh();
      return;
    }
    if (!document.querySelector('script[data-jchub-embed]')) {
      const script = document.createElement('script');
      script.src = '/embed.js';
      script.async = true;
      script.dataset.jchubEmbed = '';
      document.body.appendChild(script);
    }
  }, [attributes]);

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const field = 'flex flex-col gap-2 text-sm font-semibold text-slate-700';
  const select = 'min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-5 rounded-[20px] border border-blue-100 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,.035)]">
        <Segmented label={t.content} value={kind} onChange={setKind} options={[['tools', t.tools], ['articles', t.articles]]} />
        <Segmented label={t.language} value={lang} onChange={setLang} options={[['fr', 'Français'], ['en', 'English']]} />
        <Segmented label={t.theme} value={theme} onChange={setTheme} options={[['light', t.light], ['dark', t.dark], ['auto', t.auto]]} />
        <label className={field}>
          {t.category}
          <select className={select} value={activeCategory} onChange={(event) => setCategory(event.target.value)}>
            <option value="">{t.allCategories}</option>
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={field}>
            {t.count}
            <select className={select} value={limit} onChange={(event) => setLimit(Number(event.target.value))}>
              {[3, 4, 6, 8, 9, 12].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className={field}>
            {t.columns}
            <select className={select} value={columns} onChange={(event) => setColumns(Number(event.target.value))}>
              {[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="min-w-0 space-y-6">
        <div className="overflow-hidden rounded-[20px] border border-slate-800 bg-[#0f172a] shadow-[0_2px_8px_rgba(15,23,42,.08)]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
            <span className="text-sm font-semibold text-slate-300">{t.code}</span>
            <button type="button" onClick={copySnippet} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-900 transition hover:bg-blue-100">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />} {copied ? t.copied : t.copy}
            </button>
          </div>
          <pre className="overflow-x-auto p-5 text-[13px] leading-6 text-blue-100"><code>{snippet}</code></pre>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700">{t.preview}</p>
          <div ref={preview} className={`rounded-[20px] border p-5 ${theme === 'dark' ? 'border-slate-800 bg-[#020617]' : 'border-blue-100 bg-white'}`} />
        </div>
      </div>
    </div>
  );
}

function Segmented<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (value: T) => void; options: [T, string][] }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-slate-700">{label}</legend>
      <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
        {options.map(([option, text]) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={`min-h-9 flex-1 rounded-lg px-3 text-sm font-semibold transition ${value === option ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
