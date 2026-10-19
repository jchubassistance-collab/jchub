'use client';

import { useEffect, useId, useImperativeHandle, useRef, useState, type ChangeEvent, type CSSProperties, type DragEvent, type ReactNode, type Ref } from 'react';
import { Brush, ChevronUp, Copy, Download, Loader2, Package, Trash2, UploadCloud } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import { downloadBaseName } from '@/lib/download-name';
import {
  DEFAULT_ICON_COLOR,
  DEFAULT_PNG_SIZES,
  LIBRARY,
  MAX_FILES,
  MAX_FILE_SIZE,
  PNG_SIZES,
  libraryItem,
  safeHex,
  slugify,
  svgFile,
  svgMarkup,
  uniqueSlugs,
  usageCode,
  vectorKey,
  type LibraryIcon,
  type StudioItem,
  type UsageTab,
} from '@/lib/icon-pack';
import { buildPack, downloadBlob, importRaster, importSvg, itemFile, neededVectors, renderPng, svgDataUrl, withVector, type PackStep } from './icon-pack';

const copy = bilingual({
  importTitle: 'Importer',
  dropTitle: 'Dépose tes fichiers ici',
  dropFormats: 'SVG, PNG, JPG ou WebP',
  choose: 'Choisir des fichiers',
  libraryTitle: 'Bibliothèque',
  search: 'Rechercher une icône',
  searchPlaceholder: 'Rechercher : lien, panier, horloge…',
  libraryLabel: 'Icônes de la bibliothèque',
  noMatch: 'Aucune icône ne correspond.',
  libraryNote: (count: number) => `${count} icônes prêtes à l’emploi. Clique pour ajouter ou retirer une icône de ton jeu.`,
  add: (name: string) => `Ajouter ${name}`,
  remove: (name: string) => `Retirer ${name}`,
  setTitle: 'Mon jeu d’icônes',
  clear: 'Tout vider',
  confirmClear: 'Confirmer ?',
  previewSize: 'Taille de l’aperçu',
  empty: 'Aucune icône pour l’instant. Ajoute-en depuis la bibliothèque ou importe tes propres fichiers.',
  tags: { lib: 'Trait', svg: 'SVG', image: 'Image', vector: 'Vectorisée' },
  inspectorTitle: 'Retouches',
  noSelection: 'Sélectionne une icône de ton jeu pour la modifier.',
  name: 'Nom',
  color: 'Couleur',
  strokeWidth: 'Épaisseur du trait',
  imageMode: 'Mode de l’image',
  modeImage: 'Image',
  modeVector: 'Vectorisée',
  colorCount: 'Nombre de couleurs',
  auto: 'Auto',
  palette: 'Couleurs détectées (modifiables)',
  paletteColor: (number: number) => `Couleur ${number}`,
  threshold: 'Seuil de détection',
  invert: 'Inverser',
  invertHint: 'Garde le clair au lieu du foncé',
  info: {
    lib: 'Icône en traits : change la couleur et l’épaisseur. À l’export, elle est convertie en formes pleines pour la police.',
    svg: 'SVG importé. Les couleurs d’origine sont remplacées par ta couleur.',
    image: 'Image conservée telle quelle pour les PNG et le favicon. Passe en « Vectorisée » pour changer sa couleur et l’utiliser en SVG, sprite ou police.',
    multi: (count: number) => `Image vectorisée en ${count} couleurs. Tu peux changer chaque couleur, ou choisir un autre nombre de couleurs.`,
    mono: 'Image vectorisée en une seule couleur. Choisis plus de couleurs pour garder les détails intérieurs.',
  },
  downloadSvg: 'Télécharger le SVG',
  downloadPng: 'PNG 256 px',
  removeItem: 'Retirer du jeu',
  editInEditor: 'Retoucher dans l’éditeur',
  exportTitle: 'Exporter',
  openExport: (count: number) => `Exporter mon jeu (${count} icône${count > 1 ? 's' : ''})`,
  hideExport: 'Masquer',
  formats: {
    svg: ['SVG individuels', 'Un fichier par icône, avec ta couleur'],
    sprite: ['Sprite SVG', 'Toutes les icônes dans un seul fichier'],
    font: ['Police d’icônes', 'Fichier de police (OTF), CSS et page de démo'],
    png: ['Images PNG', 'Une image par taille choisie'],
    favicon: ['Pack favicon', 'ICO, PNG et balises HTML, à partir de l’icône sélectionnée'],
  } as Record<'svg' | 'sprite' | 'font' | 'png' | 'favicon', [string, string]>,
  pngSizes: 'Tailles PNG',
  pixels: (size: number) => `${size} pixels`,
  faviconBackground: 'Fond coloré',
  faviconBackgroundColor: 'Couleur du fond du favicon',
  prefix: 'Préfixe des noms',
  prefixPlaceholder: 'ex. : monsite',
  prefixHint: 'Utilisé dans les noms des fichiers et les classes CSS.',
  family: 'Nom de la police',
  familyFromPrefix: (name: string) => `${name} (d’après le préfixe)`,
  familyCustom: 'Autre nom…',
  familyCustomLabel: 'Nom personnalisé de la police',
  downloadZip: 'Télécharger le pack ZIP',
  progress: { vectorizing: 'Vectorisation des icônes…', png: 'Création des images PNG…', font: 'Construction de la police…', favicon: 'Création du favicon…', zip: 'Compression du ZIP…' } as Record<'vectorizing' | PackStep, string>,
  packReady: (count: number) => `Pack prêt : ${count} fichiers.`,
  packEmpty: 'Ajoute d’abord au moins une icône à ton jeu.',
  packNoFormat: 'Coche au moins un format à exporter.',
  packFailed: 'L’export a échoué. Réessaie avec moins d’icônes ou de tailles.',
  exportNote: 'Les images PNG, JPG et WebP sont vectorisées automatiquement pour le sprite, les SVG et la police. Les SVG, le sprite et les PNG gardent les couleurs. La police d’icônes est monochrome : elle garde la silhouette entière, sans les détails intérieurs. Le résultat est très bon sur des logos et pictogrammes simples, moins sur des photos.',
  usageTitle: 'Code d’utilisation',
  usageLabel: 'Type de code',
  usageTabs: { sprite: 'Sprite SVG', font: 'Police', favicon: 'Favicon' } as Record<UsageTab, string>,
  copyCode: 'Copier le code',
  copied: 'Code copié.',
  copyFallback: 'Code sélectionné : copie-le avec Ctrl+C.',
  added: (count: number, skipped: number) => `${count} fichier${count > 1 ? 's' : ''} importé${count > 1 ? 's' : ''}${skipped ? ` (${skipped} ignoré${skipped > 1 ? 's' : ''})` : ''}.`,
  noneImported: 'Aucun fichier importé : formats acceptés SVG, PNG, JPG et WebP, 10 Mo maximum.',
  tooMany: (max: number) => `Seuls les ${max} premiers fichiers ont été pris.`,
  libAdded: (name: string) => `${name} ajoutée au jeu.`,
  libRemoved: (name: string) => `${name} retirée du jeu.`,
  cleared: 'Le jeu est vide.',
  vectorizing: 'Vectorisation en cours…',
  vectorized: 'Image vectorisée.',
  vectorFailed: 'La vectorisation a échoué pour cette image.',
  svgFailed: 'Impossible de créer ce SVG.',
  pngFailed: 'Impossible de créer ce PNG.',
  downloaded: (name: string) => `Fichier téléchargé : ${name}.`,
  privacy: 'Tout se passe dans ton navigateur : tes fichiers ne sont envoyés à aucun serveur.',
  fallbackName: 'icone',
  imageFallbackName: 'image',
  zipName: 'icones',
}, {
  importTitle: 'Import',
  dropTitle: 'Drop your files here',
  dropFormats: 'SVG, PNG, JPG or WebP',
  choose: 'Choose files',
  libraryTitle: 'Library',
  search: 'Search an icon',
  searchPlaceholder: 'Search: link, cart, clock…',
  libraryLabel: 'Library icons',
  noMatch: 'No icon matches.',
  libraryNote: (count: number) => `${count} ready-to-use icons. Click to add an icon to your set or remove it.`,
  add: (name: string) => `Add ${name}`,
  remove: (name: string) => `Remove ${name}`,
  setTitle: 'My icon set',
  clear: 'Clear all',
  confirmClear: 'Confirm?',
  previewSize: 'Preview size',
  empty: 'No icon yet. Add some from the library or import your own files.',
  tags: { lib: 'Stroke', svg: 'SVG', image: 'Image', vector: 'Vectorized' },
  inspectorTitle: 'Edit',
  noSelection: 'Select an icon of your set to edit it.',
  name: 'Name',
  color: 'Color',
  strokeWidth: 'Stroke width',
  imageMode: 'Image mode',
  modeImage: 'Image',
  modeVector: 'Vectorized',
  colorCount: 'Number of colors',
  auto: 'Auto',
  palette: 'Detected colors (editable)',
  paletteColor: (number: number) => `Color ${number}`,
  threshold: 'Detection threshold',
  invert: 'Invert',
  invertHint: 'Keeps the light parts instead of the dark ones',
  info: {
    lib: 'Stroke icon: change its color and width. On export it becomes filled shapes for the font.',
    svg: 'Imported SVG. Its original colors are replaced by your color.',
    image: 'Image kept as it is for the PNG files and the favicon. Switch to “Vectorized” to change its color and use it as SVG, sprite or font.',
    multi: (count: number) => `Image vectorized in ${count} colors. You can change each color, or choose another number of colors.`,
    mono: 'Image vectorized in a single color. Choose more colors to keep the inner details.',
  },
  downloadSvg: 'Download the SVG',
  downloadPng: 'PNG 256 px',
  removeItem: 'Remove from the set',
  editInEditor: 'Edit in the logo editor',
  exportTitle: 'Export',
  openExport: (count: number) => `Export my set (${count} icon${count > 1 ? 's' : ''})`,
  hideExport: 'Hide',
  formats: {
    svg: ['Individual SVG files', 'One file per icon, in your color'],
    sprite: ['SVG sprite', 'Every icon in a single file'],
    font: ['Icon font', 'Font file (OTF), CSS and demo page'],
    png: ['PNG images', 'One image per chosen size'],
    favicon: ['Favicon pack', 'ICO, PNG and HTML tags, from the selected icon'],
  },
  pngSizes: 'PNG sizes',
  pixels: (size: number) => `${size} pixels`,
  faviconBackground: 'Colored background',
  faviconBackgroundColor: 'Favicon background color',
  prefix: 'Name prefix',
  prefixPlaceholder: 'e.g. mysite',
  prefixHint: 'Used in the file names and the CSS classes.',
  family: 'Font name',
  familyFromPrefix: (name: string) => `${name} (from the prefix)`,
  familyCustom: 'Other name…',
  familyCustomLabel: 'Custom font name',
  downloadZip: 'Download the ZIP pack',
  progress: { vectorizing: 'Vectorizing the icons…', png: 'Creating the PNG images…', font: 'Building the font…', favicon: 'Creating the favicon…', zip: 'Compressing the ZIP…' },
  packReady: (count: number) => `Pack ready: ${count} files.`,
  packEmpty: 'Add at least one icon to your set first.',
  packNoFormat: 'Check at least one format to export.',
  packFailed: 'The export failed. Try again with fewer icons or sizes.',
  exportNote: 'PNG, JPG and WebP images are vectorized automatically for the sprite, the SVG files and the font. The SVG files, the sprite and the PNG images keep the colors. The icon font is monochrome: it keeps the whole silhouette, without the inner details. The result is very good on simple logos and pictograms, less so on photos.',
  usageTitle: 'Usage code',
  usageLabel: 'Code type',
  usageTabs: { sprite: 'SVG sprite', font: 'Font', favicon: 'Favicon' },
  copyCode: 'Copy the code',
  copied: 'Code copied.',
  copyFallback: 'Code selected: copy it with Ctrl+C.',
  added: (count: number, skipped: number) => `${count} file${count > 1 ? 's' : ''} imported${skipped ? ` (${skipped} skipped)` : ''}.`,
  noneImported: 'No file imported: accepted formats are SVG, PNG, JPG and WebP, 10 MB maximum.',
  tooMany: (max: number) => `Only the first ${max} files were taken.`,
  libAdded: (name: string) => `${name} added to the set.`,
  libRemoved: (name: string) => `${name} removed from the set.`,
  cleared: 'The set is empty.',
  vectorizing: 'Vectorizing…',
  vectorized: 'Image vectorized.',
  vectorFailed: 'Vectorization failed for this image.',
  svgFailed: 'This SVG could not be created.',
  pngFailed: 'This PNG could not be created.',
  downloaded: (name: string) => `File downloaded: ${name}.`,
  privacy: 'Everything happens in your browser: your files are never sent to a server.',
  fallbackName: 'icon',
  imageFallbackName: 'image',
  zipName: 'icons',
});

type Copy = (typeof copy)['fr'];
type Formats = { svg: boolean; sprite: boolean; font: boolean; png: boolean; favicon: boolean };
type Tone = 'info' | 'ok' | 'error';

const ACCEPT = '.svg,image/svg+xml,image/png,image/jpeg,image/webp';
const COLOR_COUNTS = [0, 1, 2, 3, 4, 5, 6];
const CHECKERBOARD: CSSProperties = {
  backgroundColor: '#ffffff',
  backgroundImage: 'conic-gradient(#e7ecf6 25%, transparent 0 50%, #e7ecf6 0 75%, transparent 0)',
  backgroundSize: '16px 16px',
};

/** Names offered for the icon font: generic on purpose, so they never hide a text font of the site. */
const FONT_NAMES = ['icons', 'brand-icons', 'ui-icons', 'app-icons', 'site-icons', 'social-icons', 'logo-icons', 'pictos'];

let nextItemId = 1;
const newId = () => `i${nextItemId++}`;

/** What the card and the big preview show: the image itself until it is vectorized. */
function previewSrc(item: StudioItem): string {
  if (item.kind === 'raster' && (item.mode === 'image' || !item.vector)) return item.src;
  return svgDataUrl(svgMarkup(item));
}

function tagOf(item: StudioItem, t: Copy): string {
  if (item.kind === 'lib') return t.tags.lib;
  if (item.kind === 'svg') return t.tags.svg;
  return item.mode === 'vector' ? t.tags.vector : t.tags.image;
}

function infoOf(item: StudioItem, t: Copy): string {
  if (item.kind === 'lib') return t.info.lib;
  if (item.kind === 'svg') return t.info.svg;
  if (item.mode === 'image') return t.info.image;
  const layers = item.vector?.layers.length ?? 0;
  return layers > 1 ? t.info.multi(layers) : t.info.mono;
}

/** What the studio can ask the icon pack: add files sent from the logo editor. */
export type IconPackHandle = { addFiles: (files: File[]) => Promise<void> };

/** Icon pack of the studio. `onEdit` sends an icon to the logo editor. */
export function IconPack({ onEdit, ref }: { onEdit: (file: File) => void; ref?: Ref<IconPackHandle> }) {
  const locale = useLocale();
  const t = copy[locale];
  const inputId = useId();
  const imagesRef = useRef(new Map<string, HTMLImageElement>());
  const itemsRef = useRef<StudioItem[]>([]);
  const traceTimer = useRef<number | undefined>(undefined);
  const codeRef = useRef<HTMLElement>(null);
  const [items, setItems] = useState<StudioItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(() => items[0]?.id ?? null);
  const [query, setQuery] = useState('');
  const [previewSize, setPreviewSize] = useState(56);
  const [tab, setTab] = useState<UsageTab>('sprite');
  const [pngSizes, setPngSizes] = useState<number[]>(DEFAULT_PNG_SIZES);
  const [formats, setFormats] = useState<Formats>({ svg: true, sprite: true, font: true, png: true, favicon: true });
  const [faviconBackgroundOn, setFaviconBackgroundOn] = useState(true);
  const [faviconBackground, setFaviconBackground] = useState('#1f5fff');
  const [prefix, setPrefix] = useState('');
  const [familyChoice, setFamilyChoice] = useState('auto');
  const [customFamily, setCustomFamily] = useState('');
  const [status, setStatus] = useState('');
  const [packMessage, setPackMessage] = useState<{ text: string; tone: Tone } | null>(null);
  const [building, setBuilding] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [clearArmed, setClearArmed] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => () => window.clearTimeout(traceTimer.current), []);
  useEffect(() => {
    if (!clearArmed) return;
    const timeout = window.setTimeout(() => setClearArmed(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [clearArmed]);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const slugs = uniqueSlugs(items, t.fallbackName);
  // Without a prefix, files keep their plain names and CSS classes get a neutral one.
  const filePrefix = slugify(prefix);
  const safePrefix = filePrefix || 'icon';
  const autoFamily = `${safePrefix}-icons`;
  const safeFamily = familyChoice === 'auto' ? autoFamily : familyChoice === 'custom' ? slugify(customFamily) || autoFamily : familyChoice;
  const fileName = (slug: string) => (filePrefix ? `${filePrefix}-${slug}` : slug);
  const usageItem = selected ?? items[0];

  const updateItem = (id: string, change: (item: StudioItem) => StudioItem) => {
    setPackMessage(null);
    setItems((current) => current.map((item) => (item.id === id ? change(item) : item)));
  };

  /** Keeps the vectors just computed, unless the item changed since. */
  const storeVectors = (vectorized: StudioItem[]) => {
    const byId = new Map(vectorized.map((item) => [item.id, item]));
    setItems((current) => current.map((item) => {
      const ready = byId.get(item.id);
      return ready?.vector && ready.vectorKey === vectorKey(item) && item.vectorKey !== ready.vectorKey ? { ...item, vector: ready.vector, vectorKey: ready.vectorKey } : item;
    }));
  };

  const vectorizeNow = async (id: string): Promise<StudioItem | null> => {
    const item = itemsRef.current.find((candidate) => candidate.id === id);
    if (!item) return null;
    const ready = await withVector(item, imagesRef.current.get(id));
    storeVectors([ready]);
    return ready;
  };

  /** Traces an image again shortly after its settings stop changing. */
  const retrace = (id: string) => {
    window.clearTimeout(traceTimer.current);
    traceTimer.current = window.setTimeout(() => {
      vectorizeNow(id).catch(() => setStatus(t.vectorFailed));
    }, 140);
  };

  const select = (id: string | null) => {
    setSelectedId(id);
    setClearArmed(false);
  };

  const removeItem = (id: string) => {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return;
    const remaining = items.filter((item) => item.id !== id);
    imagesRef.current.delete(id);
    setItems(remaining);
    if (selectedId === id) select(remaining.length ? remaining[Math.min(index, remaining.length - 1)].id : null);
  };

  const toggleLibrary = (icon: LibraryIcon) => {
    const existing = items.find((item) => item.kind === 'lib' && item.libId === icon.id);
    if (existing) {
      removeItem(existing.id);
      setStatus(t.libRemoved(icon[locale]));
      return;
    }
    const item = libraryItem(icon, newId(), locale);
    setItems((current) => [...current, item]);
    select(item.id);
    setStatus(t.libAdded(icon[locale]));
  };

  const clearAll = () => {
    if (!clearArmed) {
      setClearArmed(true);
      return;
    }
    imagesRef.current.clear();
    setItems([]);
    select(null);
    setStatus(t.cleared);
  };

  const importFiles = async (list: FileList | File[]) => {
    const all = Array.from(list);
    const files = all.slice(0, MAX_FILES);
    const added: StudioItem[] = [];
    let skipped = 0;
    for (const file of files) {
      const base = file.name.replace(/\.[^.]+$/, '');
      const extension = (file.name.split('.').pop() ?? '').toLowerCase();
      try {
        if (file.size > MAX_FILE_SIZE) throw new Error('size');
        const id = newId();
        if (extension === 'svg' || file.type === 'image/svg+xml') {
          added.push(importSvg(await file.text(), id, slugify(base) || t.fallbackName, DEFAULT_ICON_COLOR));
        } else if (/^image\/(png|jpeg|webp)$/.test(file.type) || /^(png|jpe?g|webp)$/.test(extension)) {
          const { item, image } = await importRaster(file, id, slugify(base) || t.imageFallbackName);
          imagesRef.current.set(id, image);
          added.push(item);
        } else {
          throw new Error('type');
        }
      } catch {
        skipped += 1;
      }
    }
    if (added.length) {
      setItems((current) => [...current, ...added]);
      select(added[added.length - 1].id);
    }
    const message = added.length ? t.added(added.length, skipped) : t.noneImported;
    setStatus(all.length > MAX_FILES ? `${message} ${t.tooMany(MAX_FILES)}` : message);
  };

  useImperativeHandle(ref, () => ({ addFiles: (files: File[]) => importFiles(files) }));

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) void importFiles(event.target.files);
    event.target.value = '';
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length) void importFiles(event.dataTransfer.files);
  };

  const setRasterMode = (id: string, mode: 'image' | 'vector') => {
    updateItem(id, (item) => (item.kind === 'raster' ? { ...item, mode } : item));
    if (mode !== 'vector') return;
    setStatus(t.vectorizing);
    // The new mode reaches itemsRef after the render: vectorize from the item as it will be.
    const item = itemsRef.current.find((candidate) => candidate.id === id);
    if (!item || item.kind !== 'raster') return;
    withVector({ ...item, mode }, imagesRef.current.get(id))
      .then((ready) => {
        storeVectors([ready]);
        setStatus(t.vectorized);
      })
      .catch(() => {
        updateItem(id, (current) => (current.kind === 'raster' ? { ...current, mode: 'image' } : current));
        setStatus(t.vectorFailed);
      });
  };

  const setRasterSetting = (id: string, change: { colors?: number; threshold?: number; invert?: boolean }) => {
    updateItem(id, (item) => (item.kind === 'raster' ? { ...item, ...change } : item));
    retrace(id);
  };

  const setLayerColor = (id: string, layer: number, color: string) => {
    updateItem(id, (item) => (item.vector
      ? { ...item, vector: { ...item.vector, layers: item.vector.layers.map((entry, index) => (index === layer ? { ...entry, color } : entry)) } }
      : item));
  };

  const downloadOneSvg = async (item: StudioItem) => {
    try {
      const ready = item.kind === 'raster' ? await withVector(item, imagesRef.current.get(item.id)) : item;
      if (ready !== item) storeVectors([ready]);
      const name = `${downloadBaseName(fileName(slugs[item.id] || t.fallbackName))}.svg`;
      downloadBlob(new Blob([svgFile(ready)], { type: 'image/svg+xml' }), name);
      setStatus(t.downloaded(name));
    } catch {
      setStatus(t.svgFailed);
    }
  };

  const downloadOnePng = async (item: StudioItem) => {
    try {
      const ready = item.kind === 'raster' && item.mode === 'vector' ? await withVector(item, imagesRef.current.get(item.id)) : item;
      const name = `${downloadBaseName(fileName(slugs[item.id] || t.fallbackName), '256')}.png`;
      downloadBlob(await renderPng(ready, 256, imagesRef.current.get(item.id)), name);
      setStatus(t.downloaded(name));
    } catch {
      setStatus(t.pngFailed);
    }
  };

  const downloadPack = async () => {
    if (!items.length) {
      setPackMessage({ text: t.packEmpty, tone: 'error' });
      return;
    }
    if (!Object.values(formats).some(Boolean)) {
      setPackMessage({ text: t.packNoFormat, tone: 'error' });
      return;
    }
    setBuilding(true);
    setPackMessage({ text: t.progress.vectorizing, tone: 'info' });
    try {
      const ready: StudioItem[] = [];
      for (const item of items) ready.push(neededVectors(item, formats) ? await withVector(item, imagesRef.current.get(item.id)) : item);
      storeVectors(ready);
      const { blob, count } = await buildPack({
        items: ready,
        images: imagesRef.current,
        locale,
        formats,
        pngSizes,
        prefix: safePrefix,
        filePrefix,
        family: safeFamily,
        faviconItem: ready.find((item) => item.id === selectedId) ?? ready[0],
        faviconBackground: faviconBackgroundOn ? safeHex(faviconBackground, '#1f5fff') : null,
        fallbackName: t.fallbackName,
        onProgress: (step) => setPackMessage({ text: t.progress[step], tone: 'info' }),
      });
      downloadBlob(blob, `${downloadBaseName(fileName(t.zipName))}.zip`);
      setPackMessage({ text: t.packReady(count), tone: 'ok' });
    } catch {
      setPackMessage({ text: t.packFailed, tone: 'error' });
    } finally {
      setBuilding(false);
    }
  };

  const code = usageCode(tab, {
    prefix: safePrefix,
    family: safeFamily,
    name: usageItem ? slugs[usageItem.id] : slugify(LIBRARY[0][locale]),
    color: safeHex(usageItem?.color),
    locale,
  });

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus(t.copied);
    } catch {
      const element = codeRef.current;
      if (!element) return;
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      setStatus(t.copyFallback);
    }
  };

  const search = slugify(query);
  const visibleLibrary = LIBRARY.filter((icon) => !search || slugify(icon[locale]).includes(search) || icon.id.includes(search));
  const vector = selected?.kind === 'raster' && selected.mode === 'vector' ? selected.vector : undefined;
  const multicolor = Boolean(vector && vector.layers.length > 1);

  return <div className="space-y-4 text-slate-700">
    <p role="status" aria-live="polite" className="min-h-5 text-sm text-slate-500">{status}</p>

    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[16.5rem_minmax(0,1fr)_20rem] xl:items-start">
      <Panel title={t.importTitle} className="md:col-span-2 xl:col-span-1 xl:row-span-2">
        <div
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'}`}
        >
          <UploadCloud className="h-6 w-6 text-blue-600" aria-hidden="true" />
          <strong className="text-base text-slate-900">{t.dropTitle}</strong>
          <span className="text-sm text-slate-500">{t.dropFormats}</span>
          <input id={inputId} type="file" accept={ACCEPT} multiple className="peer sr-only" onChange={onInput} />
          <label htmlFor={inputId} className="mt-1 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-100 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600">{t.choose}</label>
        </div>

        <h3 className="mt-6 text-base font-bold text-slate-900">{t.libraryTitle}</h3>
        <label className="sr-only" htmlFor={`${inputId}-search`}>{t.search}</label>
        <input id={`${inputId}-search`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPlaceholder} className="mt-3 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none" />
        <div role="group" aria-label={t.libraryLabel} className="mt-3 grid max-h-[26rem] grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] gap-2 overflow-auto p-0.5">
          {visibleLibrary.map((icon) => {
            const inSet = items.some((item) => item.kind === 'lib' && item.libId === icon.id);
            return <button
              key={icon.id}
              type="button"
              title={icon[locale]}
              aria-label={inSet ? t.remove(icon[locale]) : t.add(icon[locale])}
              aria-pressed={inSet}
              onClick={() => toggleLibrary(icon)}
              className={`grid aspect-square min-h-[3.25rem] place-items-center rounded-xl border transition ${inSet ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              {/* Library drawings are constants of lib/icon-pack.ts, never user content. */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-6 w-6" dangerouslySetInnerHTML={{ __html: icon.body }} />
            </button>;
          })}
          {!visibleLibrary.length && <p className="col-span-full p-2 text-sm text-slate-500">{t.noMatch}</p>}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">{t.libraryNote(LIBRARY.length)}</p>
      </Panel>

      <Panel
        title={<>{t.setTitle} <span className="ml-1 font-semibold tabular-nums text-slate-400">{items.length}</span></>}
        actions={<SmallButton onClick={clearAll} danger>{clearArmed ? t.confirmClear : t.clear}</SmallButton>}
      >
        <Range label={t.previewSize} value={previewSize} min={32} max={96} step={4} display={`${previewSize} px`} onChange={setPreviewSize} className="max-w-xs" />
        {items.length ? <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-3">
          {items.map((item) => <button
            key={item.id}
            type="button"
            aria-pressed={item.id === selectedId}
            onClick={() => select(item.id)}
            className={`flex min-w-0 flex-col items-center gap-2 rounded-xl border px-2 pb-3 pt-4 text-center transition ${item.id === selectedId ? 'border-blue-500 bg-white ring-2 ring-blue-500' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- local data URLs, nothing to optimize */}
            <img src={previewSrc(item)} alt="" style={{ width: previewSize, height: previewSize }} className="object-contain" />
            <span className="w-full truncate text-sm font-bold text-slate-900">{item.name}</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{tagOf(item, t)}</span>
          </button>)}
        </div> : <p className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">{t.empty}</p>}
      </Panel>

      <Panel title={t.inspectorTitle}>
        {!selected ? <p className="text-sm text-slate-500">{t.noSelection}</p> : <div className="space-y-4">
          <div className="grid h-48 place-items-center rounded-xl border border-slate-200" style={CHECKERBOARD}>
            {/* eslint-disable-next-line @next/next/no-img-element -- local data URLs, nothing to optimize */}
            <img src={previewSrc(selected)} alt="" className="h-36 w-36 object-contain" />
          </div>
          <Field label={t.name}>
            {(id) => <input id={id} type="text" maxLength={40} autoComplete="off" value={selected.name} onChange={(event) => updateItem(selected.id, (item) => ({ ...item, name: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none" />}
          </Field>
          {!(selected.kind === 'raster' && (selected.mode === 'image' || multicolor)) && <Field label={t.color}>
            {(id) => <input id={id} type="color" value={safeHex(selected.color)} onChange={(event) => updateItem(selected.id, (item) => ({ ...item, color: event.target.value }))} className="h-11 w-16 cursor-pointer rounded-xl border border-slate-300 bg-white p-1" />}
          </Field>}
          {selected.kind === 'lib' && <Range label={t.strokeWidth} value={selected.strokeWidth} min={1} max={3} step={0.25} display={String(selected.strokeWidth)} onChange={(value) => updateItem(selected.id, (item) => (item.kind === 'lib' ? { ...item, strokeWidth: value } : item))} />}
          {selected.kind === 'raster' && <>
            <Segmented label={t.imageMode} options={[['image', t.modeImage], ['vector', t.modeVector]]} value={selected.mode} onChange={(mode) => setRasterMode(selected.id, mode)} />
            {selected.mode === 'vector' && <>
              <Segmented label={t.colorCount} options={COLOR_COUNTS.map((count) => [count, count ? String(count) : t.auto] as [number, string])} value={selected.colors} onChange={(colors) => setRasterSetting(selected.id, { colors })} compact />
              {multicolor && vector && <div>
                <span className="text-xs font-bold text-slate-600">{t.palette}</span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {vector.layers.map((layer, index) => <input key={index} type="color" aria-label={t.paletteColor(index + 1)} value={safeHex(layer.color)} onChange={(event) => setLayerColor(selected.id, index, event.target.value)} className="h-11 w-12 cursor-pointer rounded-xl border border-slate-300 bg-white p-1" />)}
                </div>
              </div>}
              {vector?.usesThreshold && <>
                <Range label={t.threshold} value={selected.threshold} min={40} max={230} step={1} display={String(selected.threshold)} onChange={(threshold) => setRasterSetting(selected.id, { threshold })} />
                <CheckOption checked={selected.invert} onChange={(invert) => setRasterSetting(selected.id, { invert })} title={t.invert} hint={t.invertHint} />
              </>}
            </>}
          </>}
          <p className="text-xs leading-5 text-slate-500">{infoOf(selected, t)}</p>
          <div className="grid grid-cols-2 gap-2">
            <SmallButton onClick={() => void downloadOneSvg(selected)}>{t.downloadSvg}</SmallButton>
            <SmallButton onClick={() => void downloadOnePng(selected)}>{t.downloadPng}</SmallButton>
            <SmallButton onClick={() => onEdit(itemFile(selected, slugs[selected.id] || t.fallbackName))} className="col-span-2"><Brush className="h-4 w-4" aria-hidden="true" /> {t.editInEditor}</SmallButton>
            <SmallButton onClick={() => removeItem(selected.id)} danger className="col-span-2"><Trash2 className="h-4 w-4" aria-hidden="true" /> {t.removeItem}</SmallButton>
          </div>
        </div>}
      </Panel>

      {items.length > 0 && !exportOpen && <button type="button" onClick={() => setExportOpen(true)} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 md:col-span-2">
        <Download className="h-5 w-5" aria-hidden="true" /> {t.openExport(items.length)}
      </button>}

      {items.length > 0 && exportOpen && <Panel title={t.exportTitle} className="md:col-span-2" actions={<SmallButton onClick={() => setExportOpen(false)}><ChevronUp className="h-4 w-4" aria-hidden="true" /> {t.hideExport}</SmallButton>}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            {(['svg', 'sprite', 'font', 'png'] as const).map((format) => <div key={format}>
              <CheckOption checked={formats[format]} onChange={(checked) => setFormats((current) => ({ ...current, [format]: checked }))} title={t.formats[format][0]} hint={t.formats[format][1]} />
              {format === 'png' && <div role="group" aria-label={t.pngSizes} className="mb-2 ml-8 flex flex-wrap gap-2">
                {PNG_SIZES.map((size) => <button key={size} type="button" aria-label={t.pixels(size)} aria-pressed={pngSizes.includes(size)} onClick={() => setPngSizes((current) => (current.includes(size) ? current.filter((value) => value !== size) : [...current, size].sort((a, b) => a - b)))} className={`min-h-10 min-w-14 rounded-full border px-3 text-sm font-bold tabular-nums transition ${pngSizes.includes(size) ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{size}</button>)}
              </div>}
            </div>)}
            <CheckOption checked={formats.favicon} onChange={(checked) => setFormats((current) => ({ ...current, favicon: checked }))} title={t.formats.favicon[0]} hint={t.formats.favicon[1]} />
            <div className="ml-8 flex items-center gap-3">
              <CheckOption checked={faviconBackgroundOn} onChange={setFaviconBackgroundOn} title={t.faviconBackground} />
              <input type="color" aria-label={t.faviconBackgroundColor} value={faviconBackground} onChange={(event) => setFaviconBackground(event.target.value)} disabled={!faviconBackgroundOn} className="h-11 w-14 cursor-pointer rounded-xl border border-slate-300 bg-white p-1 disabled:opacity-40" />
            </div>
          </div>
          <div className="space-y-4">
            <Field label={t.prefix}>
              {(id) => <>
                <input id={id} type="text" maxLength={12} autoComplete="off" value={prefix} placeholder={t.prefixPlaceholder} aria-describedby={`${id}-hint`} onChange={(event) => setPrefix(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none" />
                <small id={`${id}-hint`} className="text-xs text-slate-500">{t.prefixHint}</small>
              </>}
            </Field>
            <Field label={t.family}>
              {(id) => <select id={id} value={familyChoice} onChange={(event) => setFamilyChoice(event.target.value)} className="min-h-11 w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none">
                <option value="auto">{t.familyFromPrefix(autoFamily)}</option>
                {FONT_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}
                <option value="custom">{t.familyCustom}</option>
              </select>}
            </Field>
            {familyChoice === 'custom' && <Field label={t.familyCustomLabel}>
              {(id) => <input id={id} type="text" maxLength={30} autoComplete="off" value={customFamily} placeholder={autoFamily} onChange={(event) => setCustomFamily(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none" />}
            </Field>}
            <button type="button" onClick={() => void downloadPack()} disabled={building} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-base font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {building ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Package className="h-5 w-5" aria-hidden="true" />} {t.downloadZip}
            </button>
            <p role="status" aria-live="polite" className={`min-h-5 text-sm ${packMessage?.tone === 'ok' ? 'font-semibold text-emerald-700' : packMessage?.tone === 'error' ? 'font-semibold text-rose-700' : 'text-slate-500'}`}>{packMessage?.text}</p>
            <p className="text-xs leading-5 text-slate-500">{t.exportNote}</p>
          </div>
        </div>

        <hr className="my-5 border-slate-200" />
        <h3 className="text-base font-bold text-slate-900">{t.usageTitle}</h3>
        <div role="group" aria-label={t.usageLabel} className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(t.usageTabs) as UsageTab[]).map((value) => <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)} className={`min-h-10 rounded-lg border px-3.5 text-sm font-bold transition ${tab === value ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>{t.usageTabs[value]}</button>)}
        </div>
        <pre className="mt-3 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-800"><code ref={codeRef}>{code}</code></pre>
        <SmallButton onClick={() => void copyCode()} className="mt-3"><Copy className="h-4 w-4" aria-hidden="true" /> {t.copyCode}</SmallButton>
      </Panel>}
    </div>

    <p className="text-center text-sm text-slate-500">{t.privacy}</p>
  </div>;
}

function Panel({ title, actions, className = '', children }: { title: ReactNode; actions?: ReactNode; className?: string; children: ReactNode }) {
  const id = useId();
  return <section aria-labelledby={id} className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-5 ${className}`}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 id={id} className="text-lg font-bold text-slate-900">{title}</h2>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
    {children}
  </section>;
}

function SmallButton({ onClick, danger = false, className = '', children }: { onClick: () => void; danger?: boolean; className?: string; children: ReactNode }) {
  return <button type="button" onClick={onClick} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold transition hover:bg-slate-50 ${danger ? 'text-rose-700' : 'text-slate-800'} ${className}`}>{children}</button>;
}

function Field({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-bold text-slate-600">{label}</label>
    {children(id)}
  </div>;
}

function Range({ label, value, min, max, step, display, onChange, className = '' }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (value: number) => void; className?: string }) {
  const id = useId();
  return <div className={className}>
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className="text-xs font-bold text-slate-600">{label}</label>
      <span className="text-xs tabular-nums text-slate-500">{display}</span>
    </div>
    <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 w-full cursor-pointer accent-blue-600" />
  </div>;
}

function Segmented<T extends string | number>({ label, options, value, onChange, compact = false }: { label: string; options: [T, string][]; value: T; onChange: (value: T) => void; compact?: boolean }) {
  const id = useId();
  return <div>
    <span id={id} className="text-xs font-bold text-slate-600">{label}</span>
    <div role="group" aria-labelledby={id} className="mt-1.5 inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
      {options.map(([option, text]) => <button key={String(option)} type="button" aria-pressed={value === option} onClick={() => onChange(option)} className={`min-h-9 rounded-lg text-sm font-bold transition ${compact ? 'min-w-9 px-2' : 'px-4'} ${value === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>{text}</button>)}
    </div>
  </div>;
}

function CheckOption({ checked, onChange, title, hint }: { checked: boolean; onChange: (checked: boolean) => void; title: string; hint?: string }) {
  return <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1.5">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-blue-600" />
    <span>
      <b className="block text-sm text-slate-900">{title}</b>
      {hint && <small className="text-xs text-slate-500">{hint}</small>}
    </span>
  </label>;
}
