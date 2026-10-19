'use client';

import { useEffect, useId, useImperativeHandle, useRef, useState, type ChangeEvent, type CSSProperties, type DragEvent, type KeyboardEvent, type PointerEvent, type ReactNode, type Ref } from 'react';
import {
  Check, Crop, Download, FlipHorizontal2, FlipVertical2, ImageIcon, Loader2, Maximize2, Minimize2, Move, PackagePlus, PaintBucket,
  Palette, Redo2, RotateCcw, RotateCw, Scan, Sparkles, Undo2, UploadCloud, X, Crosshair, type LucideIcon,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import { downloadName } from '@/lib/download-name';
import {
  EXPORT_EXTENSIONS, EXPORT_SCALES, MAX_SIDE, exportScaleFor, fitAspect, fitLogoInCanvas, initialSettings, dragCrop, isFullCrop, overflowsCanvas, record, redo,
  settle, startHistory, undo,
  type Background, type CropHandle, type ExportFormat, type ExportScale, type History, type LogoSettings, type Rect, type SniffedFormat,
} from '@/lib/logo-editor';
import {
  LogoExportError, LogoLoadError, drawSourcePreview, exportLogo, loadLogo, renderComposition, trimBounds,
  type LayerCache, type LoadedLogo,
} from './editor-render';
import { downloadBlob } from './icon-pack';

const copy = bilingual({
  dropTitle: 'Importe ton logo',
  choose: 'Choisir un logo',
  dropHint: 'ou glisse ton fichier ici',
  limits: 'PNG, JPG, WebP, SVG, GIF, BMP, AVIF, ICO… · 25 Mo maximum',
  loading: 'Ouverture du logo…',
  privacy: 'Tout se passe dans ton navigateur : ton logo n’est envoyé à aucun serveur.',
  tooLarge: 'Ce fichier dépasse 25 Mo. Choisis une version plus légère de ton logo.',
  empty: 'Ce fichier est vide.',
  unsupported: (format: string) => `Les fichiers ${format} ne sont pas pris en charge. Exporte ton logo en PNG ou en SVG depuis ton logiciel, puis réessaie.`,
  browser: (format: string) => `Ton navigateur ne sait pas lire les images ${format}. Convertis ton logo en PNG ou en JPG, puis réessaie.`,
  unreadable: 'Impossible de lire cette image : elle est peut-être endommagée, ou dans un format que ton navigateur ne prend pas en charge.',
  tooManyPixels: (megapixels: number) => `Cette image fait ${megapixels} mégapixels, la limite est de 50. Réduis-la puis réessaie.`,
  invalidSvg: 'Ce SVG est invalide ou ne peut pas être affiché.',
  renderFailed: 'L’aperçu n’a pas pu être dessiné : ton navigateur manque peut-être de mémoire. Essaie une taille de canevas plus petite.',
  exportFailed: 'L’export a échoué. Réessaie, ou choisis un autre format.',
  webpUnsupported: 'Ton navigateur ne sait pas créer d’images WebP : choisis PNG ou JPG.',
  downscaled: (width: number, height: number, newWidth: number, newHeight: number) => `Ton logo mesurait ${width} × ${height} px : il est édité en ${newWidth} × ${newHeight} px pour rester fluide.`,
  gif: 'Pour un GIF animé, seule la première image est modifiée.',
  svgNotice: 'Logo SVG : tu peux l’exporter en SVG vectoriel, net à toutes les tailles.',
  smoothNotice: 'Logo lissé automatiquement : ses contours restent nets en HD, sans pixels visibles.',
  toolbarLabel: 'Commandes de l’éditeur',
  undo: 'Annuler',
  redo: 'Rétablir',
  reset: 'Réinitialiser',
  replace: 'Changer de logo',
  replaceShort: 'Changer',
  close: 'Fermer le logo',
  closeShort: 'Fermer',
  addToPack: 'Ajouter le logo retouché au pack d’icônes',
  addToPackShort: 'Ajouter au pack',
  download: (format: string) => `Télécharger en ${format}`,
  stageLabel: 'Aperçu du logo. Les flèches du clavier le déplacent, Maj + flèche par pas de 10 pixels.',
  stageHelp: 'Glisse le logo pour le déplacer, tire un coin pour le redimensionner et la poignée du haut pour le faire pivoter (Maj : par pas de 15°).',
  dropToReplace: 'Dépose ton fichier pour remplacer le logo',
  overflow: 'Une partie du logo dépasse du canevas.',
  tabsLabel: 'Réglages du logo',
  tabs: { colors: 'Couleurs', background: 'Fond', effects: 'Effets', layout: 'Cadrage', export: 'Exporter' },
  brightness: 'Luminosité',
  contrast: 'Contraste',
  saturation: 'Saturation',
  hue: 'Teinte',
  opacity: 'Opacité',
  invert: 'Inverser les couleurs',
  recolor: 'Recolorer le logo',
  recolorColor: 'Nouvelle couleur',
  intensity: 'Intensité',
  resetColors: 'Réinitialiser les couleurs',
  backgroundLabel: 'Fond du logo',
  backgrounds: { transparent: 'Transparent', white: 'Blanc', black: 'Noir', custom: 'Couleur' },
  backgroundColor: 'Couleur du fond',
  transparentHint: 'Le damier montre les zones transparentes : il n’apparaît pas dans l’image exportée.',
  shadow: 'Ombre',
  color: 'Couleur',
  blur: 'Flou',
  offsetX: 'Décalage horizontal',
  offsetY: 'Décalage vertical',
  outline: 'Contour',
  thickness: 'Épaisseur',
  gradient: 'Dégradé',
  gradientFrom: 'Couleur de départ',
  gradientTo: 'Couleur d’arrivée',
  angle: 'Angle',
  canvas: 'Canevas',
  canvasAuto: 'Ajusté au logo',
  canvasFit: 'Ajuster le canevas au logo',
  canvasFitShort: 'Ajuster',
  logoFit: 'Ajuster le logo au canevas',
  width: 'Largeur',
  height: 'Hauteur',
  square: (size: number) => `Carré ${size}`,
  banner: 'Bannière 1200 × 630',
  size: 'Taille',
  rotation: 'Rotation',
  rotateLeft: 'Pivoter de 90° vers la gauche',
  rotateRight: 'Pivoter de 90° vers la droite',
  flipX: 'Miroir horizontal',
  flipY: 'Miroir vertical',
  position: 'Position du centre',
  center: 'Centrer',
  crop: 'Recadrer',
  trim: 'Rogner les bords vides',
  uncrop: 'Annuler le recadrage',
  trimEmpty: 'Aucun bord vide à rogner.',
  cropRatio: 'Proportions',
  ratios: { free: 'Libre', square: 'Carré', original: 'D’origine' },
  cropHelp: (width: number, height: number) => `Déplace le cadre ou tire ses poignées, puis applique. Sélection : ${width} × ${height} px.`,
  apply: 'Appliquer',
  cancel: 'Annuler',
  formatLabel: 'Format',
  formatHints: {
    png: 'Idéal pour le web et les documents : garde la transparence.',
    jpeg: 'Le JPG ne gère pas la transparence : les zones transparentes deviennent blanches.',
    webp: 'Plus léger que le PNG, et garde la transparence.',
    svg: 'Vectoriel : net à toutes les tailles, garde la transparence. Les effets sont des filtres SVG.',
  },
  svgUnavailable: 'Le SVG est proposé quand tu importes un logo SVG : une image en pixels ne devient pas vectorielle sans vectorisation.',
  quality: 'Qualité',
  resolutionLabel: 'Résolution',
  resolutions: { 1: 'Standard', 2: 'HD ×2', 4: 'Ultra HD ×4' } as Record<ExportScale, string>,
  resolutionHint: 'Un logo SVG reste net à toutes les tailles. Une image PNG ou JPG agrandie est lissée et ses contours sont accentués, mais elle ne gagne pas de vrais détails : pour le meilleur résultat, importe ton logo en SVG ou en grand format.',
  dimensions: (width: number, height: number) => `Image exportée : ${width} × ${height} px`,
  exporting: 'Export en cours…',
  exported: (name: string, size: string) => `${name} téléchargé (${size}).`,
  kilobytes: 'Ko',
  megabytes: 'Mo',
}, {
  dropTitle: 'Import your logo',
  choose: 'Choose a logo',
  dropHint: 'or drop your file here',
  limits: 'PNG, JPG, WebP, SVG, GIF, BMP, AVIF, ICO… · 25 MB maximum',
  loading: 'Opening the logo…',
  privacy: 'Everything happens in your browser: your logo is never sent to a server.',
  tooLarge: 'This file exceeds 25 MB. Choose a lighter version of your logo.',
  empty: 'This file is empty.',
  unsupported: (format: string) => `${format} files are not supported. Export your logo as PNG or SVG from your design software, then try again.`,
  browser: (format: string) => `Your browser cannot read ${format} images. Convert your logo to PNG or JPG, then try again.`,
  unreadable: 'This image cannot be read: it may be damaged, or in a format your browser does not support.',
  tooManyPixels: (megapixels: number) => `This image is ${megapixels} megapixels, the limit is 50. Shrink it and try again.`,
  invalidSvg: 'This SVG is invalid or cannot be displayed.',
  renderFailed: 'The preview could not be drawn: your browser may be short of memory. Try a smaller canvas size.',
  exportFailed: 'The export failed. Try again, or choose another format.',
  webpUnsupported: 'Your browser cannot create WebP images: choose PNG or JPG.',
  downscaled: (width: number, height: number, newWidth: number, newHeight: number) => `Your logo was ${width} × ${height} px: it is edited at ${newWidth} × ${newHeight} px to stay smooth.`,
  gif: 'For an animated GIF, only the first frame is edited.',
  svgNotice: 'SVG logo: you can export it as a vector SVG, sharp at any size.',
  smoothNotice: 'Logo smoothed automatically: its edges stay sharp in HD, with no visible pixels.',
  toolbarLabel: 'Editor commands',
  undo: 'Undo',
  redo: 'Redo',
  reset: 'Reset',
  replace: 'Change logo',
  replaceShort: 'Change',
  close: 'Close the logo',
  closeShort: 'Close',
  addToPack: 'Add the edited logo to the icon pack',
  addToPackShort: 'Add to pack',
  download: (format: string) => `Download as ${format}`,
  stageLabel: 'Logo preview. The arrow keys move it, Shift + arrow by steps of 10 pixels.',
  stageHelp: 'Drag the logo to move it, pull a corner to resize it and the top handle to rotate it (Shift: by steps of 15°).',
  dropToReplace: 'Drop your file to replace the logo',
  overflow: 'Part of the logo goes beyond the canvas.',
  tabsLabel: 'Logo settings',
  tabs: { colors: 'Colors', background: 'Background', effects: 'Effects', layout: 'Layout', export: 'Export' },
  brightness: 'Brightness',
  contrast: 'Contrast',
  saturation: 'Saturation',
  hue: 'Hue',
  opacity: 'Opacity',
  invert: 'Invert colors',
  recolor: 'Recolor the logo',
  recolorColor: 'New color',
  intensity: 'Intensity',
  resetColors: 'Reset colors',
  backgroundLabel: 'Logo background',
  backgrounds: { transparent: 'Transparent', white: 'White', black: 'Black', custom: 'Color' },
  backgroundColor: 'Background color',
  transparentHint: 'The checkerboard shows transparent areas: it does not appear in the exported image.',
  shadow: 'Shadow',
  color: 'Color',
  blur: 'Blur',
  offsetX: 'Horizontal offset',
  offsetY: 'Vertical offset',
  outline: 'Outline',
  thickness: 'Thickness',
  gradient: 'Gradient',
  gradientFrom: 'Start color',
  gradientTo: 'End color',
  angle: 'Angle',
  canvas: 'Canvas',
  canvasAuto: 'Fitted to the logo',
  canvasFit: 'Fit the canvas to the logo',
  canvasFitShort: 'Fit canvas',
  logoFit: 'Fit the logo to the canvas',
  width: 'Width',
  height: 'Height',
  square: (size: number) => `Square ${size}`,
  banner: 'Banner 1200 × 630',
  size: 'Size',
  rotation: 'Rotation',
  rotateLeft: 'Rotate 90° left',
  rotateRight: 'Rotate 90° right',
  flipX: 'Flip horizontally',
  flipY: 'Flip vertically',
  position: 'Center position',
  center: 'Center',
  crop: 'Crop',
  trim: 'Trim empty edges',
  uncrop: 'Undo the crop',
  trimEmpty: 'No empty edge to trim.',
  cropRatio: 'Proportions',
  ratios: { free: 'Free', square: 'Square', original: 'Original' },
  cropHelp: (width: number, height: number) => `Move the frame or pull its handles, then apply. Selection: ${width} × ${height} px.`,
  apply: 'Apply',
  cancel: 'Cancel',
  formatLabel: 'Format',
  formatHints: {
    png: 'Ideal for the web and documents: keeps transparency.',
    jpeg: 'JPG has no transparency: transparent areas become white.',
    webp: 'Lighter than PNG, and keeps transparency.',
    svg: 'Vector: sharp at any size, keeps transparency. The effects are SVG filters.',
  },
  svgUnavailable: 'SVG is offered when you import an SVG logo: a pixel image does not become a vector without vectorization.',
  quality: 'Quality',
  resolutionLabel: 'Resolution',
  resolutions: { 1: 'Standard', 2: 'HD ×2', 4: 'Ultra HD ×4' } as Record<ExportScale, string>,
  resolutionHint: 'An SVG logo stays sharp at any size. An enlarged PNG or JPG image is smoothed and its edges are sharpened, but it does not gain real detail: for the best result, import your logo as SVG or in a large size.',
  dimensions: (width: number, height: number) => `Exported image: ${width} × ${height} px`,
  exporting: 'Exporting…',
  exported: (name: string, size: string) => `${name} downloaded (${size}).`,
  kilobytes: 'KB',
  megabytes: 'MB',
});

type Copy = (typeof copy)['fr'];
type Tab = keyof Copy['tabs'];
type CropRatio = keyof Copy['ratios'];
type Gesture =
  | { kind: 'move' | 'scale' | 'rotate'; key: string; pointerX: number; pointerY: number; start: LogoSettings; autoFit: boolean }
  | { kind: 'crop'; handle: CropHandle; pointerX: number; pointerY: number; start: Rect };

/** What the studio can ask the editor: open a file sent from the icon pack. */
export type LogoEditorHandle = { openFile: (file: File) => Promise<void> };

const ACCEPT = 'image/*,.svg,.ico,.avif,.bmp,.heic,.heif,.tif,.tiff';
const FORMAT_NAMES: Partial<Record<SniffedFormat, string>> = { pdf: 'PDF / AI', psd: 'PSD', eps: 'EPS', heic: 'HEIC', tiff: 'TIFF', avif: 'AVIF' };
const EXPORT_LABELS: Record<ExportFormat, string> = { png: 'PNG', jpeg: 'JPG', webp: 'WebP', svg: 'SVG' };
const TABS: { id: Tab; icon: LucideIcon }[] = [
  { id: 'colors', icon: Palette },
  { id: 'background', icon: PaintBucket },
  { id: 'effects', icon: Sparkles },
  { id: 'layout', icon: Move },
  { id: 'export', icon: Download },
];
const BACKGROUNDS: Background[] = ['transparent', 'white', 'black', 'custom'];
const SQUARES = [512, 1024, 1080];
const CORNERS: CropHandle[] = ['nw', 'ne', 'sw', 'se'];
const EDGES: CropHandle[] = ['n', 's', 'e', 'w'];
const CURSORS: Record<CropHandle, string> = { move: 'move', n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize' };
const CHECKERBOARD: CSSProperties = {
  backgroundColor: '#ffffff',
  backgroundImage: 'conic-gradient(#e2e8f0 25%, transparent 0 50%, #e2e8f0 0 75%, transparent 0)',
  backgroundSize: '18px 18px',
};
const STAGE_BACKGROUND: CSSProperties = {
  backgroundColor: '#f1f5f9',
  backgroundImage: 'radial-gradient(rgba(100, 116, 139, 0.22) 1px, transparent 1px)',
  backgroundSize: '16px 16px',
};

function handleStyle(handle: CropHandle, cursor = CURSORS[handle]): CSSProperties {
  return {
    left: handle.includes('w') ? '0%' : handle.includes('e') ? '100%' : '50%',
    top: handle.includes('n') ? '0%' : handle.includes('s') ? '100%' : '50%',
    transform: 'translate(-50%, -50%)',
    cursor,
    touchAction: 'none',
  };
}

function loadErrorMessage(cause: unknown, t: Copy): string {
  if (!(cause instanceof LogoLoadError)) return t.unreadable;
  const name = FORMAT_NAMES[cause.format] ?? cause.format.toUpperCase();
  switch (cause.reason) {
    case 'too-large': return t.tooLarge;
    case 'empty': return t.empty;
    case 'unsupported': return t.unsupported(name);
    case 'browser': return FORMAT_NAMES[cause.format] ? t.browser(name) : t.unreadable;
    case 'too-many-pixels': return t.tooManyPixels(Math.round(cause.pixels / 1_000_000));
    case 'invalid-svg': return t.invalidSvg;
    default: return t.unreadable;
  }
}

function formatSize(bytes: number, locale: string, t: Copy): string {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return bytes < 1024 * 1024 ? `${number.format(Math.max(1, Math.round(bytes / 1024)))} ${t.kilobytes}` : `${number.format(bytes / 1024 / 1024)} ${t.megabytes}`;
}

const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

/**
 * Logo editor of the studio: colors, background, effects, layout and crop of one logo.
 * `active` is false while the icon pack tab is shown: the keyboard shortcuts then stay off.
 */
export function LogoEditor({ active, onAddToPack, ref }: { active: boolean; onAddToPack: (file: File) => void; ref?: Ref<LogoEditorHandle> }) {
  const locale = useLocale();
  const t = copy[locale];
  const baseId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheRef = useRef<LayerCache>({});
  const gestureRef = useRef<Gesture | null>(null);
  const [logo, setLogo] = useState<LoadedLogo | null>(null);
  const [history, setHistory] = useState<History<LogoSettings> | null>(null);
  const [baseline, setBaseline] = useState<LogoSettings | null>(null);
  const [tab, setTab] = useState<Tab>('colors');
  const [cropDraft, setCropDraft] = useState<Rect | null>(null);
  const [cropRatio, setCropRatio] = useState<CropRatio>('free');
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState(92);
  const [resolution, setResolution] = useState<ExportScale>(2);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [notices, setNotices] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [box, setBox] = useState({ width: 0, height: 0, ratio: 1 });

  const settings = history?.present ?? null;
  const hasLogo = Boolean(logo);
  const cropping = cropDraft !== null;

  /** Every change goes through here: values kept in range, one undo step per change (or per slider drag). */
  const update = (patch: Partial<LogoSettings> | ((current: LogoSettings) => Partial<LogoSettings>), key?: string) => {
    setStatus('');
    setHistory((current) => {
      if (!current) return current;
      const next = settle({ ...current.present, ...(typeof patch === 'function' ? patch(current.present) : patch) });
      return JSON.stringify(next) === JSON.stringify(current.present) ? current : record(current, next, key);
    });
  };

  const travel = (move: (history: History<LogoSettings>) => History<LogoSettings>) => {
    setStatus('');
    setHistory((current) => current && move(current));
  };

  // The stage fills the room it is given; the canvas is drawn at the size it is shown.
  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height, ratio: window.devicePixelRatio || 1 });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasLogo]);

  const viewWidth = logo && settings ? (cropping ? logo.width : settings.canvasWidth) : 1;
  const viewHeight = logo && settings ? (cropping ? logo.height : settings.canvasHeight) : 1;
  const displayScale = box.width > 0 && box.height > 0 ? Math.min(box.width / viewWidth, box.height / viewHeight) : 0;
  const exportScale = settings ? exportScaleFor(settings.canvasWidth, settings.canvasHeight, resolution) : 1;
  // As many pixels as the screen shows, never more than the export has: the preview shows the real result.
  const renderScale = Math.min(cropping ? 1 : exportScale, displayScale * box.ratio);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !logo || !settings || renderScale <= 0) return;
    const frame = requestAnimationFrame(() => {
      try {
        if (cropping) drawSourcePreview(canvas, logo, renderScale);
        else renderComposition(canvas, logo, settings, renderScale, cacheRef.current);
      } catch {
        setError(t.renderFailed);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [logo, settings, renderScale, cropping, t.renderFailed]);

  useEffect(() => {
    if (!hasLogo || !active) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key !== 'z' && key !== 'y') return;
      // Text and number fields keep their own undo.
      if ((event.target as HTMLElement | null)?.closest('input[type="number"], input[type="text"], textarea, [contenteditable="true"]')) return;
      event.preventDefault();
      setStatus('');
      setHistory((current) => current && (key === 'y' || event.shiftKey ? redo(current) : undo(current)));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasLogo, active]);

  const open = async (file?: File) => {
    if (!file || loading || exporting) return;
    setLoading(true);
    setError('');
    setStatus('');
    try {
      const loaded = await loadLogo(file);
      const start = settle(initialSettings(loaded.width, loaded.height));
      cacheRef.current = {};
      setLogo(loaded);
      setBaseline(start);
      setHistory(startHistory(start));
      setCropDraft(null);
      setNotices([
        loaded.downscaled ? t.downscaled(loaded.originalWidth, loaded.originalHeight, loaded.width, loaded.height) : '',
        loaded.format === 'gif' ? t.gif : '',
        loaded.svg ? t.svgNotice : '',
        loaded.smoothed ? t.smoothNotice : '',
      ].filter(Boolean));
      if (!loaded.svg && format === 'svg') setFormat('png');
    } catch (cause) {
      setError(loadErrorMessage(cause, t));
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({ openFile: (file: File) => open(file) }));

  const close = () => {
    cacheRef.current = {};
    setLogo(null);
    setHistory(null);
    setBaseline(null);
    setCropDraft(null);
    setNotices([]);
    setError('');
    setStatus('');
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    void open(event.target.files?.[0]);
    event.target.value = '';
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!Array.from(event.dataTransfer.types).includes('Files')) return;
    event.preventDefault();
    setDragging(true);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void open(event.dataTransfer.files[0]);
  };

  /** Pointer position in pixels of what the stage shows: the canvas, or the whole logo while cropping. */
  const pointerPosition = (event: PointerEvent<HTMLElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !rect.width) return { x: 0, y: 0 };
    const units = viewWidth / rect.width;
    return { x: (event.clientX - rect.left) * units, y: (event.clientY - rect.top) * units };
  };

  const startGesture = (kind: 'move' | 'scale' | 'rotate', event: PointerEvent<HTMLElement>) => {
    if (!settings || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointerPosition(event);
    const key = `${kind}-${event.timeStamp}`;
    gestureRef.current = { kind, key, pointerX: point.x, pointerY: point.y, start: settings, autoFit: settings.autoFit };
    // The canvas stays still while the logo is handled, so that the handles follow the pointer.
    if (settings.autoFit) update({ autoFit: false }, key);
  };

  const startCropGesture = (handle: CropHandle, event: PointerEvent<HTMLElement>) => {
    if (!cropDraft || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointerPosition(event);
    gestureRef.current = { kind: 'crop', handle, pointerX: point.x, pointerY: point.y, start: cropDraft };
  };

  const cropAspect = !logo ? null : cropRatio === 'square' ? 1 : cropRatio === 'original' ? logo.width / logo.height : null;

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || !logo) return;
    const point = pointerPosition(event);
    const dx = point.x - gesture.pointerX;
    const dy = point.y - gesture.pointerY;
    if (gesture.kind === 'crop') {
      setCropDraft(dragCrop(gesture.start, gesture.handle, dx, dy, logo.width, logo.height, cropAspect));
      return;
    }
    const { start, key } = gesture;
    if (gesture.kind === 'move') {
      update({ x: Math.round(start.x + dx), y: Math.round(start.y + dy) }, key);
    } else if (gesture.kind === 'scale') {
      const before = Math.hypot(gesture.pointerX - start.x, gesture.pointerY - start.y);
      if (before > 0) update({ scale: (start.scale * Math.hypot(point.x - start.x, point.y - start.y)) / before }, key);
    } else {
      const angle = (Math.atan2(point.y - start.y, point.x - start.x) * 180) / Math.PI + 90;
      update({ rotation: event.shiftKey ? Math.round(angle / 15) * 15 : Math.round(angle) }, key);
    }
  };

  const endGesture = () => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    // A canvas fitted to the logo follows it again once resized or rotated, within the same undo step.
    if (gesture && (gesture.kind === 'scale' || gesture.kind === 'rotate') && gesture.autoFit) {
      setHistory((current) => current && { ...current, present: settle({ ...current.present, autoFit: true }) });
    }
  };

  const onStageKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (cropping || !settings) return;
    const step = event.shiftKey ? 10 : 1;
    const offsets: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    update((current) => ({ x: current.x + offset[0], y: current.y + offset[1], autoFit: false }), 'nudge');
  };

  const startCropping = () => {
    if (!settings) return;
    setCropRatio('free');
    setCropDraft(settings.crop);
  };

  const chooseRatio = (ratio: CropRatio) => {
    setCropRatio(ratio);
    const aspect = !logo ? null : ratio === 'square' ? 1 : ratio === 'original' ? logo.width / logo.height : null;
    if (aspect && cropDraft) setCropDraft(fitAspect(cropDraft, aspect));
  };

  const applyCrop = () => {
    if (cropDraft) update({ crop: cropDraft });
    setCropDraft(null);
  };

  const trim = () => {
    if (!logo || !settings) return;
    const bounds = trimBounds(logo);
    if (!bounds || isFullCrop(bounds, logo.width, logo.height)) {
      setStatus(t.trimEmpty);
      return;
    }
    if (cropping) {
      setCropRatio('free');
      setCropDraft(bounds);
    } else {
      update({ crop: bounds });
    }
  };

  const setCanvasSide = (side: 'canvasWidth' | 'canvasHeight', value: number) => {
    const length = Math.min(MAX_SIDE, Math.round(value));
    if (length < 1) return;
    // The logo keeps its place relative to the canvas.
    update((current) => side === 'canvasWidth'
      ? { canvasWidth: length, x: (current.x * length) / current.canvasWidth, autoFit: false }
      : { canvasHeight: length, y: (current.y * length) / current.canvasHeight, autoFit: false }, side);
  };

  const download = async () => {
    if (!logo || !settings || exporting) return;
    setExporting(true);
    setError('');
    setStatus('');
    try {
      // Lets the button show its spinner before the full-size rendering.
      await new Promise((resolve) => window.setTimeout(resolve, 30));
      const blob = await exportLogo(logo, settings, format, quality / 100, exportScale);
      const name = downloadName(logo.name, EXPORT_EXTENSIONS[format], '', 'logo');
      downloadBlob(blob, name);
      setStatus(t.exported(name, formatSize(blob.size, locale, t)));
    } catch (cause) {
      setError(cause instanceof LogoExportError && cause.reason === 'format' && format === 'webp' ? t.webpUnsupported : t.exportFailed);
    } finally {
      setExporting(false);
    }
  };

  /** The edit as a PNG at full size: the pack keeps it as an image, which can be vectorized there. */
  const addToPack = async () => {
    if (!logo || !settings || exporting) return;
    setExporting(true);
    setError('');
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 30));
      const blob = await exportLogo(logo, settings, 'png', 1, exportScale);
      onAddToPack(new File([blob], downloadName(logo.name, 'png', '', 'logo'), { type: 'image/png' }));
    } catch {
      setError(t.exportFailed);
    } finally {
      setExporting(false);
    }
  };

  if (!logo || !settings || !history || !baseline) {
    return <div className="space-y-4 text-slate-700">
      <div
        onDragOver={onDragOver}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center transition sm:py-14 ${dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white'}`}
      >
        <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onInput} />
        <span aria-hidden="true" className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100"><ImageIcon className="h-7 w-7" /></span>
        <p className="mt-4 text-xl font-bold text-slate-900">{t.dropTitle}</p>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={loading} className="mx-auto mt-5 flex items-center gap-3 rounded-xl bg-slate-900 px-5 py-3.5 text-lg font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <UploadCloud className="h-5 w-5" aria-hidden="true" />}
          {loading ? t.loading : t.choose}
        </button>
        <p className="mt-3 text-sm text-slate-500">{t.dropHint} · {t.limits}</p>
      </div>
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <p className="text-center text-sm text-slate-500">{t.privacy}</p>
    </div>;
  }

  const s = settings;
  const pristine = JSON.stringify(s) === JSON.stringify(baseline);
  const colorsPristine = !s.brightness && !s.contrast && !s.saturation && !s.hue && !s.invert && !s.tintEnabled && s.opacity === 100;
  const overflow = !s.autoFit && overflowsCanvas(s);
  const logoSize = Math.max(s.crop.width, s.crop.height) * s.scale;
  const effectRange = Math.max(20, Math.round(logoSize * 0.25), Math.abs(s.shadowX), Math.abs(s.shadowY), s.shadowBlur);
  const outlineRange = Math.max(10, Math.round(logoSize * 0.1), s.outlineWidth);
  const svgAvailable = Boolean(logo.svg);
  const cssWidth = viewWidth * displayScale;
  const cssHeight = viewHeight * displayScale;

  const transformOverlay = <div
    aria-hidden="true"
    className="pointer-events-none absolute"
    style={{
      left: s.x * displayScale,
      top: s.y * displayScale,
      width: s.crop.width * s.scale * displayScale,
      height: s.crop.height * s.scale * displayScale,
      transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
    }}
  >
    <div onPointerDown={(event) => startGesture('move', event)} className="pointer-events-auto absolute inset-0 cursor-move outline outline-1 outline-blue-500" style={{ touchAction: 'none' }} />
    {CORNERS.map((corner) => <span key={corner} onPointerDown={(event) => startGesture('scale', event)} className="pointer-events-auto absolute h-5 w-5 rounded-full border-2 border-blue-600 bg-white shadow sm:h-3.5 sm:w-3.5" style={handleStyle(corner)} />)}
    <span className="absolute bottom-full left-1/2 h-6 w-px bg-blue-500" />
    <span onPointerDown={(event) => startGesture('rotate', event)} className="pointer-events-auto absolute bottom-full left-1/2 mb-6 h-5 w-5 cursor-grab rounded-full border-2 border-blue-600 bg-white shadow sm:h-4 sm:w-4" style={{ transform: 'translate(-50%, 50%)', touchAction: 'none' }} />
  </div>;

  const crop = cropDraft;
  const cropBox = crop && { left: crop.x * displayScale, top: crop.y * displayScale, width: crop.width * displayScale, height: crop.height * displayScale };
  const cropOverlay = cropBox && <>
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 bg-slate-900/55" style={{ height: cropBox.top }} />
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 bg-slate-900/55" style={{ top: cropBox.top + cropBox.height }} />
    <div aria-hidden="true" className="pointer-events-none absolute left-0 bg-slate-900/55" style={{ top: cropBox.top, height: cropBox.height, width: cropBox.left }} />
    <div aria-hidden="true" className="pointer-events-none absolute right-0 bg-slate-900/55" style={{ top: cropBox.top, height: cropBox.height, left: cropBox.left + cropBox.width }} />
    <div aria-hidden="true" onPointerDown={(event) => startCropGesture('move', event)} className="absolute cursor-move border-2 border-white shadow-[0_0_0_1px_rgba(15,23,42,.45)]" style={{ ...cropBox, touchAction: 'none' }}>
      <span className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-white/60" />
      <span className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-white/60" />
      <span className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/60" />
      <span className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-white/60" />
      {(cropAspect ? CORNERS : CORNERS.concat(EDGES)).map((handle) => <span key={handle} onPointerDown={(event) => startCropGesture(handle, event)} className="absolute h-5 w-5 rounded-sm border-2 border-blue-600 bg-white shadow sm:h-3.5 sm:w-3.5" style={handleStyle(handle)} />)}
    </div>
  </>;

  return <div
    className="space-y-4 text-slate-700"
    onDragOver={onDragOver}
    onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
    onDrop={onDrop}
  >
    <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onInput} />

    {notices.length > 0 && <ul className="space-y-1 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
      {notices.map((notice) => <li key={notice}>{notice}</li>)}
    </ul>}

    <div role="toolbar" aria-label={t.toolbarLabel} className="flex flex-wrap items-center gap-2">
      <ToolButton icon={Undo2} label={t.undo} title={`${t.undo} (Ctrl+Z)`} onClick={() => travel(undo)} disabled={!history.past.length || cropping} />
      <ToolButton icon={Redo2} label={t.redo} title={`${t.redo} (Ctrl+Y)`} onClick={() => travel(redo)} disabled={!history.future.length || cropping} />
      <ToolButton icon={RotateCcw} label={t.reset} onClick={() => update(baseline)} disabled={pristine || cropping} />
      <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
      <ToolButton icon={Crop} label={t.crop} onClick={startCropping} disabled={cropping} />
      <ToolButton icon={Maximize2} label={t.canvasFit} text={t.canvasFitShort} onClick={() => update({ autoFit: true })} disabled={s.autoFit || cropping} />
      <span className="ml-auto flex flex-wrap gap-2">
        <ToolButton icon={UploadCloud} label={t.replace} text={t.replaceShort} onClick={() => inputRef.current?.click()} disabled={loading || exporting} />
        <ToolButton icon={X} label={t.close} text={t.closeShort} onClick={close} disabled={exporting} />
        <ToolButton icon={PackagePlus} label={t.addToPack} text={t.addToPackShort} onClick={() => void addToPack()} disabled={exporting || cropping} />
        <button type="button" onClick={() => void download()} disabled={exporting || cropping} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
          {exporting ? t.exporting : t.download(EXPORT_LABELS[format])}
        </button>
      </span>
    </div>

    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
      <div className="min-w-0 space-y-3">
        <div
          ref={stageRef}
          tabIndex={0}
          role="group"
          aria-label={t.stageLabel}
          onKeyDown={onStageKeyDown}
          className={`relative flex h-[20rem] items-center justify-center overflow-hidden rounded-2xl border p-8 outline-none transition focus-visible:ring-4 focus-visible:ring-blue-200 sm:h-[26rem] lg:h-[34rem] ${dragging ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-200'}`}
          style={STAGE_BACKGROUND}
        >
          {displayScale > 0 && <div className="relative shrink-0" style={{ width: cssWidth, height: cssHeight }} onPointerMove={onPointerMove} onPointerUp={endGesture} onPointerCancel={endGesture}>
            <canvas
              ref={canvasRef}
              onPointerDown={cropping ? undefined : (event) => startGesture('move', event)}
              className={`block h-full w-full shadow-[0_10px_30px_rgba(15,23,42,.14)] ${cropping ? '' : 'cursor-move'}`}
              style={{ ...(cropping || s.background === 'transparent' ? CHECKERBOARD : {}), touchAction: 'none' }}
            />
            {cropping ? cropOverlay : transformOverlay}
          </div>}
          {(loading || dragging) && <div className="absolute inset-0 grid place-items-center bg-white/75 p-6 text-center text-sm font-semibold text-slate-700">
            {loading ? <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-label={t.loading} /> : t.dropToReplace}
          </div>}
        </div>

        {cropping && crop ? <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-blue-950">{t.cropRatio}</span>
            {(Object.keys(t.ratios) as CropRatio[]).map((ratio) => <button key={ratio} type="button" aria-pressed={cropRatio === ratio} onClick={() => chooseRatio(ratio)} className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${cropRatio === ratio ? 'border-blue-600 bg-blue-600 text-white' : 'border-blue-200 bg-white text-blue-900 hover:border-blue-400'}`}>{t.ratios[ratio]}</button>)}
            <button type="button" onClick={trim} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm font-semibold text-blue-900 hover:border-blue-400"><Scan className="h-4 w-4" aria-hidden="true" /> {t.trim}</button>
          </div>
          <p className="text-xs text-blue-950/80">{t.cropHelp(crop.width, crop.height)}</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCropDraft(null)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">{t.cancel}</button>
            <button type="button" onClick={applyCrop} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Check className="h-4 w-4" aria-hidden="true" /> {t.apply}</button>
          </div>
        </div> : <p className="text-xs leading-5 text-slate-500">{t.stageHelp}</p>}

        {overflow && !cropping && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <span>{t.overflow}</span>
          <button type="button" onClick={() => update({ autoFit: true })} className="font-semibold underline underline-offset-2 hover:no-underline">{t.canvasFit}</button>
        </div>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div role="tablist" aria-label={t.tabsLabel} className="grid grid-cols-5 gap-1 border-b border-slate-200 bg-slate-50 p-1.5">
          {TABS.map(({ id, icon: Icon }) => <button
            key={id}
            id={`${baseId}-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`${baseId}-panel`}
            onClick={() => setTab(id)}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-lg px-0.5 py-2 text-[10px] font-semibold transition sm:text-xs lg:text-[11px] ${tab === id ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="max-w-full truncate">{t.tabs[id]}</span>
          </button>)}
        </div>

        <fieldset id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${tab}`} disabled={cropping} className="min-w-0 space-y-5 p-4 disabled:opacity-50 lg:max-h-[33rem] lg:overflow-y-auto">
          {tab === 'colors' && <>
            <Slider label={t.brightness} value={s.brightness} min={-100} max={100} display={signed} onChange={(value) => update({ brightness: value }, 'brightness')} />
            <Slider label={t.contrast} value={s.contrast} min={-100} max={100} display={signed} onChange={(value) => update({ contrast: value }, 'contrast')} />
            <Slider label={t.saturation} value={s.saturation} min={-100} max={100} display={signed} onChange={(value) => update({ saturation: value }, 'saturation')} />
            <Slider label={t.hue} value={s.hue} min={-180} max={180} display={(value) => `${signed(value)}°`} onChange={(value) => update({ hue: value }, 'hue')} />
            <Slider label={t.opacity} value={s.opacity} min={0} max={100} display={(value) => `${value} %`} onChange={(value) => update({ opacity: value }, 'opacity')} />
            <Switch label={t.invert} checked={s.invert} onChange={(value) => update({ invert: value })} />
            <Section>
              <Switch label={t.recolor} checked={s.tintEnabled} onChange={(value) => update({ tintEnabled: value })} />
              {s.tintEnabled && <>
                <ColorField label={t.recolorColor} value={s.tintColor} onChange={(value) => update({ tintColor: value }, 'tintColor')} />
                <Slider label={t.intensity} value={s.tintAmount} min={0} max={100} display={(value) => `${value} %`} onChange={(value) => update({ tintAmount: value }, 'tintAmount')} />
              </>}
            </Section>
            <button type="button" onClick={() => update({ brightness: 0, contrast: 0, saturation: 0, hue: 0, invert: false, tintEnabled: false, opacity: 100 })} disabled={colorsPristine} className="text-sm font-semibold text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:no-underline">{t.resetColors}</button>
          </>}

          {tab === 'background' && <>
            <div role="radiogroup" aria-label={t.backgroundLabel} className="grid grid-cols-2 gap-2">
              {BACKGROUNDS.map((background) => <button
                key={background}
                type="button"
                role="radio"
                aria-checked={s.background === background}
                onClick={() => update({ background })}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${s.background === background ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-100' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
              >
                <span aria-hidden="true" className="h-5 w-5 shrink-0 rounded-md border border-slate-300" style={background === 'transparent' ? { ...CHECKERBOARD, backgroundSize: '8px 8px' } : { backgroundColor: background === 'white' ? '#ffffff' : background === 'black' ? '#000000' : s.backgroundColor }} />
                {t.backgrounds[background]}
              </button>)}
            </div>
            {s.background === 'custom' && <ColorField label={t.backgroundColor} value={s.backgroundColor} onChange={(value) => update({ backgroundColor: value }, 'backgroundColor')} />}
            {s.background === 'transparent' && <p className="text-xs leading-5 text-slate-500">{t.transparentHint}</p>}
          </>}

          {tab === 'effects' && <>
            <Section>
              <Switch label={t.shadow} checked={s.shadowEnabled} onChange={(value) => update({ shadowEnabled: value })} />
              {s.shadowEnabled && <>
                <ColorField label={t.color} value={s.shadowColor} onChange={(value) => update({ shadowColor: value }, 'shadowColor')} />
                <Slider label={t.opacity} value={s.shadowOpacity} min={0} max={100} display={(value) => `${value} %`} onChange={(value) => update({ shadowOpacity: value }, 'shadowOpacity')} />
                <Slider label={t.blur} value={s.shadowBlur} min={0} max={effectRange} display={(value) => `${value} px`} onChange={(value) => update({ shadowBlur: value }, 'shadowBlur')} />
                <Slider label={t.offsetX} value={s.shadowX} min={-effectRange} max={effectRange} display={(value) => `${signed(value)} px`} onChange={(value) => update({ shadowX: value }, 'shadowX')} />
                <Slider label={t.offsetY} value={s.shadowY} min={-effectRange} max={effectRange} display={(value) => `${signed(value)} px`} onChange={(value) => update({ shadowY: value }, 'shadowY')} />
              </>}
            </Section>
            <Section>
              <Switch label={t.outline} checked={s.outlineEnabled} onChange={(value) => update({ outlineEnabled: value })} />
              {s.outlineEnabled && <>
                <ColorField label={t.color} value={s.outlineColor} onChange={(value) => update({ outlineColor: value }, 'outlineColor')} />
                <Slider label={t.thickness} value={s.outlineWidth} min={1} max={outlineRange} display={(value) => `${value} px`} onChange={(value) => update({ outlineWidth: value }, 'outlineWidth')} />
              </>}
            </Section>
            <Section>
              <Switch label={t.gradient} checked={s.gradientEnabled} onChange={(value) => update({ gradientEnabled: value })} />
              {s.gradientEnabled && <>
                <ColorField label={t.gradientFrom} value={s.gradientFrom} onChange={(value) => update({ gradientFrom: value }, 'gradientFrom')} />
                <ColorField label={t.gradientTo} value={s.gradientTo} onChange={(value) => update({ gradientTo: value }, 'gradientTo')} />
                <Slider label={t.angle} value={s.gradientAngle} min={0} max={360} display={(value) => `${value}°`} onChange={(value) => update({ gradientAngle: value }, 'gradientAngle')} />
                <Slider label={t.intensity} value={s.gradientStrength} min={0} max={100} display={(value) => `${value} %`} onChange={(value) => update({ gradientStrength: value }, 'gradientStrength')} />
              </>}
            </Section>
          </>}

          {tab === 'layout' && <>
            <Section>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-800">{t.canvas}</span>
                {s.autoFit && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">{t.canvasAuto}</span>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <NumberField label={t.width} value={s.canvasWidth} min={1} max={MAX_SIDE} suffix="px" onChange={(value) => setCanvasSide('canvasWidth', value)} />
                <NumberField label={t.height} value={s.canvasHeight} min={1} max={MAX_SIDE} suffix="px" onChange={(value) => setCanvasSide('canvasHeight', value)} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <ChipButton onClick={() => update({ autoFit: true })} pressed={s.autoFit}>{t.canvasAuto}</ChipButton>
                {SQUARES.map((size) => <ChipButton key={size} onClick={() => update((current) => fitLogoInCanvas(current, size, size))}>{t.square(size)}</ChipButton>)}
                <ChipButton onClick={() => update((current) => fitLogoInCanvas(current, 1200, 630))}>{t.banner}</ChipButton>
              </div>
              {!s.autoFit && <button type="button" onClick={() => update((current) => fitLogoInCanvas(current, current.canvasWidth, current.canvasHeight))} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:underline"><Minimize2 className="h-4 w-4" aria-hidden="true" /> {t.logoFit}</button>}
            </Section>
            <Slider label={t.size} value={Math.round(s.scale * 100)} min={2} max={Math.max(400, Math.round(s.scale * 100))} display={(value) => `${value} %`} onChange={(value) => update({ scale: value / 100 }, 'scale')} />
            <div className="space-y-2">
              <Slider label={t.rotation} value={Math.round(s.rotation)} min={-180} max={180} display={(value) => `${value}°`} onChange={(value) => update({ rotation: value }, 'rotation')} />
              <div className="grid grid-cols-2 gap-2">
                <IconButton icon={RotateCcw} label={t.rotateLeft} onClick={() => update((current) => ({ rotation: current.rotation - 90 }))}>-90°</IconButton>
                <IconButton icon={RotateCw} label={t.rotateRight} onClick={() => update((current) => ({ rotation: current.rotation + 90 }))}>+90°</IconButton>
                <IconButton icon={FlipHorizontal2} label={t.flipX} pressed={s.flipX} onClick={() => update((current) => ({ flipX: !current.flipX }))}>{t.flipX}</IconButton>
                <IconButton icon={FlipVertical2} label={t.flipY} pressed={s.flipY} onClick={() => update((current) => ({ flipY: !current.flipY }))}>{t.flipY}</IconButton>
              </div>
            </div>
            <Section>
              <span className="text-sm font-semibold text-slate-800">{t.position}</span>
              <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                <NumberField label="X" value={s.x} min={-MAX_SIDE} max={2 * MAX_SIDE} suffix="px" onChange={(value) => update({ x: value, autoFit: false }, 'x')} />
                <NumberField label="Y" value={s.y} min={-MAX_SIDE} max={2 * MAX_SIDE} suffix="px" onChange={(value) => update({ y: value, autoFit: false }, 'y')} />
                <IconButton icon={Crosshair} label={t.center} onClick={() => update((current) => ({ x: current.canvasWidth / 2, y: current.canvasHeight / 2 }))}>{t.center}</IconButton>
              </div>
            </Section>
            <div className="grid gap-2">
              <IconButton icon={Crop} label={t.crop} onClick={startCropping}>{t.crop}</IconButton>
              <IconButton icon={Scan} label={t.trim} onClick={trim}>{t.trim}</IconButton>
              {!isFullCrop(s.crop, logo.width, logo.height) && <IconButton icon={RotateCcw} label={t.uncrop} onClick={() => update({ crop: { x: 0, y: 0, width: logo.width, height: logo.height } })}>{t.uncrop}</IconButton>}
            </div>
          </>}

          {tab === 'export' && <>
            <div role="radiogroup" aria-label={t.formatLabel} className="grid grid-cols-4 gap-1.5">
              {(Object.keys(EXPORT_LABELS) as ExportFormat[]).map((value) => <button
                key={value}
                type="button"
                role="radio"
                aria-checked={format === value}
                disabled={value === 'svg' && !svgAvailable}
                onClick={() => { setFormat(value); setStatus(''); }}
                className={`rounded-lg border px-2 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${format === value ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
              >{EXPORT_LABELS[value]}</button>)}
            </div>
            <p className="text-sm leading-6 text-slate-600">{t.formatHints[format]}</p>
            {!svgAvailable && <p className="text-xs leading-5 text-slate-500">{t.svgUnavailable}</p>}
            {(format === 'jpeg' || format === 'webp') && <Slider label={t.quality} value={quality} min={40} max={100} display={(value) => `${value} %`} onChange={setQuality} />}
            {format !== 'svg' && <>
              <div role="radiogroup" aria-label={t.resolutionLabel} className="grid grid-cols-3 gap-1.5">
                {EXPORT_SCALES.map((value) => <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={exportScale === value}
                  disabled={exportScaleFor(s.canvasWidth, s.canvasHeight, value) !== value}
                  onClick={() => { setResolution(value); setStatus(''); }}
                  className={`rounded-lg border px-2 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${exportScale === value ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
                >{t.resolutions[value]}</button>)}
              </div>
              {!logo.vector && <p className="text-xs leading-5 text-slate-500">{t.resolutionHint}</p>}
            </>}
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">{format === 'svg' ? t.dimensions(s.canvasWidth, s.canvasHeight) : t.dimensions(s.canvasWidth * exportScale, s.canvasHeight * exportScale)}</p>
            <button type="button" onClick={() => void download()} disabled={exporting} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {exporting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Download className="h-5 w-5" aria-hidden="true" />}
              {exporting ? t.exporting : t.download(EXPORT_LABELS[format])}
            </button>
            <button type="button" onClick={() => void addToPack()} disabled={exporting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
              <PackagePlus className="h-5 w-5" aria-hidden="true" /> {t.addToPack}
            </button>
          </>}
        </fieldset>
      </div>
    </div>

    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
    {status && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{status}</p>}
    <p className="text-center text-sm text-slate-500">{t.privacy}</p>
  </div>;
}

function Section({ children }: { children: ReactNode }) {
  return <div className="space-y-3 rounded-xl border border-slate-200 p-3.5">{children}</div>;
}

function Slider({ label, value, min, max, step = 1, display, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return <div>
    <div className="flex items-center justify-between gap-2 text-sm">
      <label htmlFor={id} className="font-medium text-slate-700">{label}</label>
      <span className="tabular-nums text-slate-500">{display(value)}</span>
    </div>
    <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1.5 w-full cursor-pointer accent-blue-600" />
  </div>;
}

function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-slate-800">
    <span>{label}</span>
    <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[1.375rem]' : 'left-0.5'}`} />
    </span>
  </button>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = useId();
  return <div className="flex items-center justify-between gap-3">
    <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
    <span className="flex items-center gap-2">
      <span className="font-mono text-xs uppercase text-slate-500">{value}</span>
      <input id={id} type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />
    </span>
  </div>;
}

/** A number typed freely: the value applies once it is a number, the field shows the real value again on blur. */
function NumberField({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix?: string; onChange: (value: number) => void }) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  return <div className="min-w-0">
    <label htmlFor={id} className="block text-xs font-semibold text-slate-600">{label}</label>
    <span className="mt-1 flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={draft ?? String(Math.round(value))}
        onChange={(event) => {
          setDraft(event.target.value);
          const number = event.target.valueAsNumber;
          if (Number.isFinite(number)) onChange(Math.min(max, Math.max(min, number)));
        }}
        onBlur={() => setDraft(null)}
        className="w-full min-w-0 rounded-lg border-0 bg-transparent px-2.5 py-2 text-sm tabular-nums text-slate-900 focus:outline-none"
      />
      {suffix && <span className="pr-2.5 text-xs text-slate-400">{suffix}</span>}
    </span>
  </div>;
}

/** `label` names the button for screen readers and tooltips; `text`, shorter, is what wide screens show. */
function ToolButton({ icon: Icon, label, text = label, title, onClick, disabled }: { icon: LucideIcon; label: string; text?: string; title?: string; onClick: () => void; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={title ?? label} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">
    <Icon className="h-4 w-4" aria-hidden="true" />
    <span className="hidden xl:inline">{text}</span>
  </button>;
}

function IconButton({ icon: Icon, label, pressed, onClick, children }: { icon: LucideIcon; label: string; pressed?: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} aria-label={label} aria-pressed={pressed} title={label} className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition ${pressed ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}>
    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
    <span className="truncate">{children}</span>
  </button>;
}

function ChipButton({ onClick, pressed, children }: { onClick: () => void; pressed?: boolean; children: ReactNode }) {
  return <button type="button" onClick={onClick} aria-pressed={pressed} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${pressed ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'}`}>{children}</button>;
}
