'use client';

import { useId, useRef, useState } from 'react';
import { Brush, Package, type LucideIcon } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import { IconPack, type IconPackHandle } from './IconPack';
import { LogoEditor, type LogoEditorHandle } from './LogoEditor';

const copy = bilingual({
  modes: 'Espaces du studio',
  pack: ['Pack d’icônes', 'Bibliothèque, vectorisation, SVG, sprite, police et favicon'],
  editor: ['Éditeur de logo', 'Couleurs, fond, ombre, contour, dégradé et recadrage'],
} as Record<'modes', string> & Record<Mode, [string, string]>, {
  modes: 'Studio spaces',
  pack: ['Icon pack', 'Library, vectorization, SVG, sprite, font and favicon'],
  editor: ['Logo editor', 'Colors, background, shadow, outline, gradient and crop'],
});

type Mode = 'pack' | 'editor';

const MODES: { id: Mode; icon: LucideIcon }[] = [
  { id: 'pack', icon: Package },
  { id: 'editor', icon: Brush },
];

/**
 * JcHub Logo Studio: the icon pack and the logo editor side by side, each keeping its work when
 * the other is shown. An icon can be sent to the editor, and the edited logo back to the pack.
 */
export function LogoStudio() {
  const t = copy[useLocale()];
  const baseId = useId();
  const [mode, setMode] = useState<Mode>('pack');
  const packRef = useRef<IconPackHandle>(null);
  const editorRef = useRef<LogoEditorHandle>(null);

  const editInEditor = (file: File) => {
    setMode('editor');
    void editorRef.current?.openFile(file);
  };

  const addToPack = (file: File) => {
    setMode('pack');
    void packRef.current?.addFiles([file]);
  };

  return <div className="space-y-5">
    <div role="tablist" aria-label={t.modes} className="grid gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 sm:grid-cols-2">
      {MODES.map(({ id, icon: Icon }) => <button
        key={id}
        id={`${baseId}-${id}-tab`}
        type="button"
        role="tab"
        aria-selected={mode === id}
        aria-controls={`${baseId}-${id}`}
        onClick={() => setMode(id)}
        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${mode === id ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-white/60'}`}
      >
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${mode === id ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
        <span className="min-w-0">
          <span className={`block text-base font-bold ${mode === id ? 'text-slate-900' : 'text-slate-600'}`}>{t[id][0]}</span>
          <span className="block text-xs text-slate-500">{t[id][1]}</span>
        </span>
      </button>)}
    </div>

    {/* Both spaces stay mounted: switching keeps the icon set and the edit in progress. */}
    <div role="tabpanel" id={`${baseId}-pack`} aria-labelledby={`${baseId}-pack-tab`} hidden={mode !== 'pack'}>
      <IconPack ref={packRef} onEdit={editInEditor} />
    </div>
    <div role="tabpanel" id={`${baseId}-editor`} aria-labelledby={`${baseId}-editor-tab`} hidden={mode !== 'editor'}>
      <LogoEditor ref={editorRef} active={mode === 'editor'} onAddToPack={addToPack} />
    </div>
  </div>;
}
