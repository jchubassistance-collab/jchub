'use client';

import { useId, useRef, useState } from 'react';
import { Brush, ImageIcon, Package, type LucideIcon } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import { IconPack, type IconPackHandle } from './IconPack';
import { LogoEditor, type LogoEditorHandle } from './LogoEditor';
import { PhotoEditor } from './PhotoEditor';

const copy = bilingual({
  modes: 'Espaces du studio',
  pack: ['Pack d’icônes', 'Bibliothèque, vectorisation, SVG, sprite, police et favicon'],
  editor: ['Éditeur de logo', 'Couleurs, fond, ombre, contour, dégradé et recadrage'],
  photo: ['Retouche photo', 'Filtres, lumière, couleurs, recadrage et fond transparent'],
} as Record<'modes', string> & Record<Mode, [string, string]>, {
  modes: 'Studio spaces',
  pack: ['Icon pack', 'Library, vectorization, SVG, sprite, font and favicon'],
  editor: ['Logo editor', 'Colors, background, shadow, outline, gradient and crop'],
  photo: ['Photo editor', 'Filters, light, colors, crop and transparent background'],
});

type Mode = 'pack' | 'editor' | 'photo';

const MODES: { id: Mode; icon: LucideIcon }[] = [
  { id: 'pack', icon: Package },
  { id: 'editor', icon: Brush },
  { id: 'photo', icon: ImageIcon },
];

/**
 * JcHub Logo Studio: the icon pack, the logo editor and the photo editor side by side, each
 * keeping its work when another is shown. An icon can be sent to the logo editor, and the edited
 * logo back to the pack.
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
    {/* On a phone the three spaces fit on one line: icon and name only. */}
    <div role="tablist" aria-label={t.modes} className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
      {MODES.map(({ id, icon: Icon }) => <button
        key={id}
        id={`${baseId}-${id}-tab`}
        type="button"
        role="tab"
        aria-selected={mode === id}
        aria-controls={`${baseId}-${id}`}
        onClick={() => setMode(id)}
        title={t[id][1]}
        className={`flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1.5 py-2.5 text-center transition sm:flex-row sm:gap-3 sm:px-4 sm:py-3 sm:text-left ${mode === id ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-white/60'}`}
      >
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-10 sm:w-10 ${mode === id ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
        <span className="min-w-0">
          <span className={`block text-xs font-bold leading-tight sm:text-base ${mode === id ? 'text-slate-900' : 'text-slate-600'}`}>{t[id][0]}</span>
          <span className="hidden text-xs text-slate-500 lg:block">{t[id][1]}</span>
        </span>
      </button>)}
    </div>

    {/* Every space stays mounted: switching keeps the icon set, the logo and the photo in progress. */}
    <div role="tabpanel" id={`${baseId}-pack`} aria-labelledby={`${baseId}-pack-tab`} hidden={mode !== 'pack'}>
      <IconPack ref={packRef} onEdit={editInEditor} />
    </div>
    <div role="tabpanel" id={`${baseId}-editor`} aria-labelledby={`${baseId}-editor-tab`} hidden={mode !== 'editor'}>
      <LogoEditor ref={editorRef} active={mode === 'editor'} onAddToPack={addToPack} />
    </div>
    <div role="tabpanel" id={`${baseId}-photo`} aria-labelledby={`${baseId}-photo-tab`} hidden={mode !== 'photo'}>
      <PhotoEditor active={mode === 'photo'} />
    </div>
  </div>;
}
