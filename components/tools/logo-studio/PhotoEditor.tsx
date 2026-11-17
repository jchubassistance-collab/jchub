'use client';

import { useEffect, useId, useImperativeHandle, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type DragEvent, type KeyboardEvent, type PointerEvent, type ReactNode, type Ref } from 'react';
import {
  Brush, Check, Crop, Download, Eraser, Eye, FlipHorizontal2, FlipVertical2, ImageIcon, Loader2, RotateCcw, RotateCw, ScanFace, SlidersHorizontal,
  Sparkles, Undo2, Redo2, UploadCloud, Wand2, X, type LucideIcon,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import { downloadName } from '@/lib/download-name';
import { dragCrop, fitAspect, isFullCrop, record, redo, startHistory, undo, type CropHandle, type History, type Rect, type SniffedFormat } from '@/lib/logo-editor';
import {
  CROP_RATIOS, EXPORT_SIZES, FILTER_IDS, NEUTRAL_TONES, RATIO_VALUES, applyFilter, exportDimensions, flipRect, initialPhotoSettings, settlePhoto, turnRect,
  type CropRatio, type ExportSize, type FilterId, type PhotoSettings, type ToneKey,
} from '@/lib/photo-editor';
import { SUBJECT_MODEL, frameToSource, maskDimensions, modelDimensions } from '@/lib/photo-segmentation';
import { straightenZoom } from '@/lib/photo-editor';
import { LogoExportError, LogoLoadError } from './editor-render';
import { downloadBlob } from './icon-pack';
import { ChipButton, ColorField, IconButton, Slider, ToolButton } from './LogoEditor';
import {
  drawFrame, exportPhoto, frameSize, loadPhoto, maskFromAlpha, maskFromSnapshot, maskSnapshot, paintMask, photoAtMaskSize, plainMask, renderPhoto, wandMask,
  type CutoutMask, type GeometryCache, type LoadedPhoto,
} from './photo-render';
import type { SegmentationRequest, SegmentationResponse } from './segmentation.worker';

type Tool = 'filters' | 'adjust' | 'crop' | 'background' | 'export';
type MaskTool = 'erase' | 'restore' | 'wand';
type AiState = { phase: 'idle' } | { phase: 'download'; percent: number } | { phase: 'analyze' } | { phase: 'error' };
/** Undo steps of the cut-out kept in memory (each is the mask's opacities, at most 1 MB). */
const MASK_VERSIONS_KEPT = 60;
type PhotoFormat = 'jpeg' | 'png' | 'webp';
type AdjustKey = ToneKey;

const copy = bilingual({
  dropTitle: 'Importe ta photo',
  choose: 'Choisir une photo',
  dropHint: 'ou glisse ton fichier ici',
  limits: 'JPG, PNG, WebP, HEIC, AVIF… · 25 Mo maximum',
  loading: 'Ouverture de la photo…',
  privacy: 'Tout se passe dans ton navigateur : ta photo n’est envoyée à aucun serveur.',
  tooLarge: 'Ce fichier dépasse 25 Mo. Choisis une version plus légère de ta photo.',
  empty: 'Ce fichier est vide.',
  unsupported: (format: string) => `Les fichiers ${format} ne sont pas pris en charge. Exporte ta photo en JPG ou en PNG, puis réessaie.`,
  browser: (format: string) => `Ton navigateur ne sait pas lire les images ${format}. Convertis ta photo en JPG, puis réessaie.`,
  unreadable: 'Impossible de lire cette image : elle est peut-être endommagée, ou dans un format que ton navigateur ne prend pas en charge.',
  tooManyPixels: (megapixels: number) => `Cette image fait ${megapixels} mégapixels, la limite est de 50. Réduis-la puis réessaie.`,
  renderFailed: 'L’aperçu n’a pas pu être dessiné : ton navigateur manque peut-être de mémoire.',
  exportFailed: 'L’export a échoué. Réessaie, ou choisis un autre format.',
  webpUnsupported: 'Ton navigateur ne sait pas créer d’images WebP : choisis JPG ou PNG.',
  downscaled: (width: number, height: number, newWidth: number, newHeight: number) => `Ta photo mesurait ${width} × ${height} px : elle est retouchée en ${newWidth} × ${newHeight} px pour rester fluide.`,
  gif: 'Pour un GIF animé, seule la première image est retouchée.',
  toolbarLabel: 'Commandes de la retouche',
  undo: 'Annuler',
  redo: 'Rétablir',
  reset: 'Tout réinitialiser',
  compare: 'Maintenir pour voir l’original',
  compareShort: 'Avant',
  original: 'Original',
  replace: 'Changer de photo',
  replaceShort: 'Changer',
  close: 'Fermer la photo',
  closeShort: 'Fermer',
  download: 'Télécharger',
  stageLabel: 'Aperçu de la photo',
  dropToReplace: 'Dépose ton fichier pour remplacer la photo',
  toolsLabel: 'Outils de retouche',
  tools: { filters: 'Filtres', adjust: 'Réglages', crop: 'Recadrer', background: 'Fond', export: 'Exporter' } as Record<Tool, string>,
  done: 'Terminé',
  filters: {
    none: 'Aucun', vivid: 'Éclatant', warm: 'Chaud', cool: 'Froid', mono: 'Noir et blanc', sepia: 'Sépia',
    vintage: 'Vintage', drama: 'Dramatique', soft: 'Doux', cinema: 'Cinéma',
  } as Record<FilterId, string>,
  filterStrength: 'Intensité du filtre',
  groups: { light: 'Lumière', color: 'Couleur', effects: 'Effets' },
  adjust: {
    exposure: 'Exposition', contrast: 'Contraste', highlights: 'Hautes lumières', shadows: 'Ombres', fade: 'Voile',
    temperature: 'Température', tint: 'Teinte', vibrance: 'Vibrance', saturation: 'Saturation', mono: 'Noir et blanc', sepia: 'Sépia',
    sharpness: 'Netteté', blur: 'Flou', vignette: 'Vignette',
  } as Record<AdjustKey, string>,
  adjustHelp: 'Touche un réglage, puis fais glisser le curseur.',
  resetAdjust: 'Réinitialiser les réglages',
  ratioLabel: 'Format',
  ratios: { free: 'Libre', original: 'D’origine', square: 'Carré 1:1', portrait: 'Portrait 4:5', story: 'Story 9:16', landscape: 'Paysage 16:9', link: 'Lien 1,91:1' } as Record<CropRatio, string>,
  ratioHints: { square: 'Profil, publication Instagram', portrait: 'Publication Instagram', story: 'Story, statut WhatsApp, TikTok', landscape: 'YouTube, écran', link: 'Lien partagé sur Facebook, LinkedIn' } as Partial<Record<CropRatio, string>>,
  rotateLeft: 'Pivoter à gauche',
  rotateRight: 'Pivoter à droite',
  flipX: 'Miroir horizontal',
  flipY: 'Miroir vertical',
  straighten: 'Redresser',
  cropHelp: (width: number, height: number) => `Déplace le cadre ou tire ses poignées. Sélection : ${width} × ${height} px.`,
  resetCrop: 'Réinitialiser le cadrage',
  apply: 'Appliquer',
  cancel: 'Annuler',
  cutoutTitle: 'Détourer le sujet',
  redoCutout: 'Refaire le détourage',
  aiCutout: 'Détourer avec l’IA',
  aiHint: (size: string) => `Repère la personne ou le personnage et retire tout le décor. Le modèle (${size}) est téléchargé une seule fois puis gardé par ton navigateur ; ta photo ne quitte pas ton appareil.`,
  aiDownload: (percent: number) => `Téléchargement du modèle… ${percent} %`,
  aiAnalyze: 'Analyse de la photo…',
  aiError: 'Le détourage a échoué : vérifie ta connexion (le modèle doit être téléchargé une première fois), puis réessaie.',
  plainCutout: 'Retirer un fond uni',
  plainHint: 'Pour un logo, un objet ou un document sur fond d’une seule couleur.',
  tolerance: 'Tolérance du fond uni',
  toleranceHint: 'Augmente-la si du fond reste, baisse-la si le sujet est rogné.',
  touchUp: 'Retoucher le détourage',
  touchUpHint: 'Passe sur la photo pour corriger : la gomme retire, le pinceau fait revenir, la baguette retire toute une zone de même couleur en un toucher.',
  maskTools: { erase: 'Gomme', restore: 'Restaurer', wand: 'Baguette' } as Record<MaskTool, string>,
  brushSize: 'Taille du pinceau',
  wandTolerance: 'Tolérance de la baguette',
  removeCutout: 'Annuler le détourage',
  stagePaint: 'Glisse sur la photo pour retoucher le détourage.',
  stageWand: 'Touche une zone de la photo pour la retirer.',
  newBackground: 'Nouveau fond',
  backgrounds: { transparent: 'Transparent', white: 'Blanc', color: 'Couleur' },
  backgroundColor: 'Couleur du fond',
  formatLabel: 'Format',
  formatHints: {
    jpeg: 'Le plus courant pour les photos : léger et lu partout. Pas de transparence.',
    png: 'Sans perte de qualité, garde la transparence. Fichier plus lourd.',
    webp: 'Plus léger que le JPG à qualité égale, garde la transparence. Idéal pour un site web.',
  } as Record<PhotoFormat, string>,
  transparencyLost: 'Le JPG ne garde pas la transparence : le fond sera blanc. Choisis PNG ou WebP pour la garder.',
  quality: 'Qualité',
  sizeLabel: 'Taille',
  sizes: { original: 'D’origine', 2048: 'Grande (2048)', 1080: 'Réseaux (1080)', 720: 'Légère (720)' } as Record<ExportSize, string>,
  dimensions: (width: number, height: number) => `Photo exportée : ${width} × ${height} px`,
  exporting: 'Export en cours…',
  exported: (name: string, size: string) => `${name} téléchargé (${size}).`,
  kilobytes: 'Ko',
  megabytes: 'Mo',
}, {
  dropTitle: 'Import your photo',
  choose: 'Choose a photo',
  dropHint: 'or drop your file here',
  limits: 'JPG, PNG, WebP, HEIC, AVIF… · 25 MB maximum',
  loading: 'Opening the photo…',
  privacy: 'Everything happens in your browser: your photo is never sent to a server.',
  tooLarge: 'This file exceeds 25 MB. Choose a lighter version of your photo.',
  empty: 'This file is empty.',
  unsupported: (format: string) => `${format} files are not supported. Export your photo as JPG or PNG, then try again.`,
  browser: (format: string) => `Your browser cannot read ${format} images. Convert your photo to JPG, then try again.`,
  unreadable: 'This image cannot be read: it may be damaged, or in a format your browser does not support.',
  tooManyPixels: (megapixels: number) => `This image is ${megapixels} megapixels, the limit is 50. Shrink it and try again.`,
  renderFailed: 'The preview could not be drawn: your browser may be short of memory.',
  exportFailed: 'The export failed. Try again, or choose another format.',
  webpUnsupported: 'Your browser cannot create WebP images: choose JPG or PNG.',
  downscaled: (width: number, height: number, newWidth: number, newHeight: number) => `Your photo was ${width} × ${height} px: it is edited at ${newWidth} × ${newHeight} px to stay smooth.`,
  gif: 'For an animated GIF, only the first frame is edited.',
  toolbarLabel: 'Editing commands',
  undo: 'Undo',
  redo: 'Redo',
  reset: 'Reset everything',
  compare: 'Hold to see the original',
  compareShort: 'Before',
  original: 'Original',
  replace: 'Change photo',
  replaceShort: 'Change',
  close: 'Close the photo',
  closeShort: 'Close',
  download: 'Download',
  stageLabel: 'Photo preview',
  dropToReplace: 'Drop your file to replace the photo',
  toolsLabel: 'Editing tools',
  tools: { filters: 'Filters', adjust: 'Adjust', crop: 'Crop', background: 'Background', export: 'Export' } as Record<Tool, string>,
  done: 'Done',
  filters: {
    none: 'None', vivid: 'Vivid', warm: 'Warm', cool: 'Cool', mono: 'Black & white', sepia: 'Sepia',
    vintage: 'Vintage', drama: 'Drama', soft: 'Soft', cinema: 'Cinema',
  } as Record<FilterId, string>,
  filterStrength: 'Filter strength',
  groups: { light: 'Light', color: 'Color', effects: 'Effects' },
  adjust: {
    exposure: 'Exposure', contrast: 'Contrast', highlights: 'Highlights', shadows: 'Shadows', fade: 'Fade',
    temperature: 'Temperature', tint: 'Tint', vibrance: 'Vibrance', saturation: 'Saturation', mono: 'Black & white', sepia: 'Sepia',
    sharpness: 'Sharpness', blur: 'Blur', vignette: 'Vignette',
  } as Record<AdjustKey, string>,
  adjustHelp: 'Tap a setting, then drag the slider.',
  resetAdjust: 'Reset the adjustments',
  ratioLabel: 'Format',
  ratios: { free: 'Free', original: 'Original', square: 'Square 1:1', portrait: 'Portrait 4:5', story: 'Story 9:16', landscape: 'Landscape 16:9', link: 'Link 1.91:1' } as Record<CropRatio, string>,
  ratioHints: { square: 'Profile, Instagram post', portrait: 'Instagram post', story: 'Story, WhatsApp status, TikTok', landscape: 'YouTube, screen', link: 'Link shared on Facebook, LinkedIn' } as Partial<Record<CropRatio, string>>,
  rotateLeft: 'Rotate left',
  rotateRight: 'Rotate right',
  flipX: 'Flip horizontally',
  flipY: 'Flip vertically',
  straighten: 'Straighten',
  cropHelp: (width: number, height: number) => `Move the frame or pull its handles. Selection: ${width} × ${height} px.`,
  resetCrop: 'Reset the framing',
  apply: 'Apply',
  cancel: 'Cancel',
  cutoutTitle: 'Cut out the subject',
  redoCutout: 'Cut out again',
  aiCutout: 'Cut out with AI',
  aiHint: (size: string) => `Finds the person or character and removes the whole background. The model (${size}) is downloaded once and then kept by your browser; your photo never leaves your device.`,
  aiDownload: (percent: number) => `Downloading the model… ${percent}%`,
  aiAnalyze: 'Analyzing the photo…',
  aiError: 'The cut-out failed: check your connection (the model must be downloaded a first time), then try again.',
  plainCutout: 'Remove a plain background',
  plainHint: 'For a logo, an object or a document on a single-color background.',
  tolerance: 'Plain background tolerance',
  toleranceHint: 'Raise it if some background remains, lower it if the subject gets cut.',
  touchUp: 'Touch up the cut-out',
  touchUpHint: 'Go over the photo to fix it: the eraser removes, the brush brings back, the wand removes a whole area of the same color in one tap.',
  maskTools: { erase: 'Eraser', restore: 'Restore', wand: 'Wand' } as Record<MaskTool, string>,
  brushSize: 'Brush size',
  wandTolerance: 'Wand tolerance',
  removeCutout: 'Undo the cut-out',
  stagePaint: 'Drag over the photo to touch up the cut-out.',
  stageWand: 'Tap an area of the photo to remove it.',
  newBackground: 'New background',
  backgrounds: { transparent: 'Transparent', white: 'White', color: 'Color' },
  backgroundColor: 'Background color',
  formatLabel: 'Format',
  formatHints: {
    jpeg: 'The most common for photos: light and read everywhere. No transparency.',
    png: 'No quality loss, keeps transparency. Heavier file.',
    webp: 'Lighter than JPG at the same quality, keeps transparency. Ideal for a website.',
  } as Record<PhotoFormat, string>,
  transparencyLost: 'JPG has no transparency: the background will be white. Choose PNG or WebP to keep it.',
  quality: 'Quality',
  sizeLabel: 'Size',
  sizes: { original: 'Original', 2048: 'Large (2048)', 1080: 'Social (1080)', 720: 'Light (720)' } as Record<ExportSize, string>,
  dimensions: (width: number, height: number) => `Exported photo: ${width} × ${height} px`,
  exporting: 'Exporting…',
  exported: (name: string, size: string) => `${name} downloaded (${size}).`,
  kilobytes: 'KB',
  megabytes: 'MB',
});

type Copy = (typeof copy)['fr'];

/** What the studio can ask the photo editor: open a file. */
export type PhotoEditorHandle = { openFile: (file: File) => Promise<void> };

const ACCEPT = 'image/*,.avif,.bmp,.heic,.heif,.tif,.tiff';
const FORMAT_NAMES: Partial<Record<SniffedFormat, string>> = { pdf: 'PDF', psd: 'PSD', eps: 'EPS', heic: 'HEIC', tiff: 'TIFF', avif: 'AVIF' };
const FORMATS: Record<PhotoFormat, { label: string; type: 'image/jpeg' | 'image/png' | 'image/webp'; extension: string }> = {
  jpeg: { label: 'JPG', type: 'image/jpeg', extension: 'jpg' },
  png: { label: 'PNG', type: 'image/png', extension: 'png' },
  webp: { label: 'WebP', type: 'image/webp', extension: 'webp' },
};
const TOOLS: { id: Tool; icon: LucideIcon }[] = [
  { id: 'filters', icon: Sparkles },
  { id: 'adjust', icon: SlidersHorizontal },
  { id: 'crop', icon: Crop },
  { id: 'background', icon: Eraser },
  { id: 'export', icon: Download },
];
/** The settings of the Adjust tool, by group; the two-sided ones (-100 to 100) show a sign. */
const ADJUST_GROUPS: { id: keyof Copy['groups']; keys: AdjustKey[] }[] = [
  { id: 'light', keys: ['exposure', 'contrast', 'highlights', 'shadows', 'fade'] },
  { id: 'color', keys: ['temperature', 'tint', 'vibrance', 'saturation', 'mono', 'sepia'] },
  { id: 'effects', keys: ['sharpness', 'blur', 'vignette'] },
];
const ONE_SIDED = new Set<AdjustKey>(['fade', 'mono', 'sepia', 'sharpness', 'blur']);
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
const THUMB_SIDE = 96;

function handleStyle(handle: CropHandle): CSSProperties {
  return {
    left: handle.includes('w') ? '0%' : handle.includes('e') ? '100%' : '50%',
    top: handle.includes('n') ? '0%' : handle.includes('s') ? '100%' : '50%',
    transform: 'translate(-50%, -50%)',
    cursor: CURSORS[handle],
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
    default: return t.unreadable;
  }
}

function formatSize(bytes: number, locale: string, t: Copy): string {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return bytes < 1024 * 1024 ? `${number.format(Math.max(1, Math.round(bytes / 1024)))} ${t.kilobytes}` : `${number.format(bytes / 1024 / 1024)} ${t.megabytes}`;
}

const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

/** The crop after `times` quarter turns clockwise of a frame that was `width` × `height`. */
function turnCrop(rect: Rect, width: number, height: number, times: number): Rect {
  let result = rect;
  let [w, h] = [width, height];
  for (let index = 0; index < times; index += 1) {
    result = turnRect(result, w, h);
    [w, h] = [h, w];
  }
  return result;
}

/**
 * Photo retouching of the studio: filters, tones and colors, crop and straightening, plain
 * background removal and export. On a phone only the photo and the tool bar show: a tool's
 * settings appear when it is tapped, and the Adjust tool shows one slider at a time.
 */
export function PhotoEditor({ active, ref }: { active: boolean; ref?: Ref<PhotoEditorHandle> }) {
  const locale = useLocale();
  const t = copy[locale];
  const baseId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheRef = useRef<GeometryCache>({});
  const thumbCacheRef = useRef<GeometryCache>({});
  const gestureRef = useRef<{ handle: CropHandle; pointerX: number; pointerY: number; start: Rect } | null>(null);
  const [photo, setPhoto] = useState<LoadedPhoto | null>(null);
  const [history, setHistory] = useState<History<PhotoSettings> | null>(null);
  const [baseline, setBaseline] = useState<PhotoSettings | null>(null);
  /** The open tool. On a phone none is open at first; wide screens then show the filters. */
  const [tool, setTool] = useState<Tool | null>(null);
  const [adjustKey, setAdjustKey] = useState<AdjustKey>('exposure');
  const [cropDraft, setCropDraft] = useState<Rect | null>(null);
  const [cropRatio, setCropRatio] = useState<CropRatio>('free');
  const [format, setFormat] = useState<PhotoFormat>('jpeg');
  const [quality, setQuality] = useState(88);
  const [size, setSize] = useState<ExportSize>('original');
  const [comparing, setComparing] = useState(false);
  const [thumbs, setThumbs] = useState<Partial<Record<FilterId, string>>>({});
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [notices, setNotices] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [box, setBox] = useState({ width: 0, height: 0, ratio: 1 });
  // Cut-out: the mask shown, its undo steps (opacities by version), the photo at mask size for
  // the plain background and the wand, and the worker that runs the AI.
  const maskRef = useRef<{ version: number; canvas: HTMLCanvasElement; cache: GeometryCache } | null>(null);
  const maskVersionsRef = useRef(new Map<number, Uint8ClampedArray>());
  const nextVersionRef = useRef(1);
  const maskPixelsRef = useRef<ImageData | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const photoIdRef = useRef(0);
  const strokeRef = useRef<{ x: number; y: number } | null>(null);
  const [maskTick, setMaskTick] = useState(0);
  const [ai, setAi] = useState<AiState>({ phase: 'idle' });
  const [usedPlain, setUsedPlain] = useState(false);
  const [maskTool, setMaskTool] = useState<MaskTool | null>(null);
  const [brushSize, setBrushSize] = useState(28);
  const [wandTolerance, setWandTolerance] = useState(25);
  const [brushCursor, setBrushCursor] = useState<{ x: number; y: number } | null>(null);

  const settings = history?.present ?? null;
  const hasPhoto = Boolean(photo);
  const current: Tool = tool ?? 'filters';
  const cropping = cropDraft !== null;
  const frame = photo && settings ? frameSize(photo, settings) : { width: 1, height: 1 };

  const update = (patch: Partial<PhotoSettings> | ((present: PhotoSettings) => Partial<PhotoSettings>), key?: string) => {
    setStatus('');
    setHistory((present) => {
      if (!present) return present;
      const next = settlePhoto({ ...present.present, ...(typeof patch === 'function' ? patch(present.present) : patch) });
      return JSON.stringify(next) === JSON.stringify(present.present) ? present : record(present, next, key);
    });
  };

  const travel = (move: (history: History<PhotoSettings>) => History<PhotoSettings>) => {
    setStatus('');
    setCropDraft(null);
    setHistory((present) => present && move(present));
  };

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height, ratio: window.devicePixelRatio || 1 });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasPhoto]);

  const viewWidth = settings ? (cropping ? frame.width : settings.crop.width) : 1;
  const viewHeight = settings ? (cropping ? frame.height : settings.crop.height) : 1;
  const displayScale = box.width > 0 && box.height > 0 ? Math.min(box.width / viewWidth, box.height / viewHeight) : 0;
  // As many pixels as the screen shows, never more than the photo has.
  const renderScale = Math.min(1, displayScale * box.ratio);
  const shown = useMemo(() => settings && (comparing ? { ...settings, ...NEUTRAL_TONES, maskVersion: null } : settings), [settings, comparing]);

  /** The mask of `version`, rebuilt from its undo step when an undo or redo changed it. */
  const resolveMask = (version: number | null): CutoutMask | null => {
    if (version === null || !photo) return null;
    if (maskRef.current?.version !== version) {
      const snapshot = maskVersionsRef.current.get(version);
      if (!snapshot) return null;
      const size = maskDimensions(photo.width, photo.height);
      maskRef.current = { version, canvas: maskFromSnapshot(snapshot, size.width, size.height), cache: {} };
    }
    return { canvas: maskRef.current.canvas, cache: maskRef.current.cache, key: `${version}:${maskTick}` };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !photo || !shown || renderScale <= 0) return;
    const frameId = requestAnimationFrame(() => {
      try {
        if (cropping) drawFrame(canvas, photo, shown, renderScale, cacheRef.current);
        else renderPhoto(canvas, photo, shown, renderScale, cacheRef.current, undefined, resolveMask(shown.maskVersion));
      } catch {
        setError(t.renderFailed);
      }
    });
    return () => cancelAnimationFrame(frameId);
    // resolveMask reads refs; the mask changes are signalled by maskTick and the settings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, shown, renderScale, cropping, maskTick, t.renderFailed]);

  /** Keeps `canvas` as a new version of the mask: one undo step. */
  const commitMask = (canvas: HTMLCanvasElement, patch: Partial<PhotoSettings> = {}, key?: string) => {
    const version = nextVersionRef.current++;
    const versions = maskVersionsRef.current;
    versions.set(version, maskSnapshot(canvas));
    if (versions.size > MASK_VERSIONS_KEPT) versions.delete(versions.keys().next().value as number);
    maskRef.current = { version, canvas, cache: {} };
    update({ ...patch, maskVersion: version }, key);
    setMaskTick((tick) => tick + 1);
    // A JPG would lose the transparency the cut-out just made.
    if (format === 'jpeg' && !settings?.backgroundColor) setFormat('png');
  };

  const runAi = () => {
    if (!photo || ai.phase === 'download' || ai.phase === 'analyze') return;
    const size = modelDimensions(photo.width, photo.height);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    context.drawImage(photo.source, 0, 0, size.width, size.height);
    const { data } = context.getImageData(0, 0, size.width, size.height);
    const target = photo;
    try {
      workerRef.current ??= new Worker(new URL('./segmentation.worker.ts', import.meta.url), { type: 'module' });
    } catch {
      setAi({ phase: 'error' });
      return;
    }
    const worker = workerRef.current;
    setAi({ phase: 'download', percent: 0 });
    setError('');
    worker.onmessage = (event: MessageEvent<SegmentationResponse>) => {
      const message = event.data;
      if (message.type === 'progress') setAi({ phase: 'download', percent: Math.min(100, Math.round((message.loaded / message.total) * 100)) });
      else if (message.type === 'analyzing') setAi({ phase: 'analyze' });
      else if (message.type === 'error') setAi({ phase: 'error' });
      else {
        setAi({ phase: 'idle' });
        // A photo replaced in the meantime keeps its own cut-out.
        if (photoIdRef.current === target.id) commitMask(maskFromAlpha(target, message.alpha, message.width, message.height));
      }
    };
    worker.onerror = () => setAi({ phase: 'error' });
    const request: SegmentationRequest = { id: target.id, pixels: data, width: size.width, height: size.height };
    worker.postMessage(request, [data.buffer]);
  };

  const runPlain = (tolerance: number, key?: string) => {
    if (!photo) return;
    maskPixelsRef.current ??= photoAtMaskSize(photo);
    setUsedPlain(true);
    commitMask(plainMask(maskPixelsRef.current, tolerance), { backgroundTolerance: tolerance }, key);
  };

  useEffect(() => () => workerRef.current?.terminate(), []);

  // Thumbnails of the filters, on the framed photo; redrawn once the framing settles.
  const framingKey = settings ? JSON.stringify([settings.turns, settings.flipX, settings.flipY, settings.straighten, settings.crop]) : '';
  useEffect(() => {
    if (!photo || !settings) return;
    const timer = window.setTimeout(() => {
      const scale = THUMB_SIDE / Math.max(settings.crop.width, settings.crop.height);
      const canvas = document.createElement('canvas');
      const next: Partial<Record<FilterId, string>> = {};
      try {
        for (const id of FILTER_IDS) {
          renderPhoto(canvas, photo, { ...applyFilter(settings, id), maskVersion: null }, scale, thumbCacheRef.current);
          next[id] = canvas.toDataURL('image/jpeg', 0.75);
        }
        setThumbs(next);
      } catch {
        // Thumbnails are a bonus: the filter names stay.
      }
    }, 200);
    return () => window.clearTimeout(timer);
    // Only the framing changes the thumbnails, not the colors.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, framingKey]);

  useEffect(() => {
    if (!hasPhoto || !active) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key !== 'z' && key !== 'y') return;
      if ((event.target as HTMLElement | null)?.closest('input[type="number"], input[type="text"], textarea, [contenteditable="true"]')) return;
      event.preventDefault();
      setStatus('');
      setCropDraft(null);
      setHistory((present) => present && (key === 'y' || event.shiftKey ? redo(present) : undo(present)));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasPhoto, active]);

  /** A new photo starts without cut-out: its masks and undo steps are dropped. */
  const resetCutout = (photoId: number) => {
    photoIdRef.current = photoId;
    maskRef.current = null;
    maskVersionsRef.current = new Map();
    maskPixelsRef.current = null;
    strokeRef.current = null;
    setMaskTool(null);
    setUsedPlain(false);
    setAi({ phase: 'idle' });
  };

  const open = async (file?: File) => {
    if (!file || loading || exporting) return;
    setLoading(true);
    setError('');
    setStatus('');
    try {
      const loaded = await loadPhoto(file);
      const start = settlePhoto(initialPhotoSettings(loaded.width, loaded.height));
      cacheRef.current = {};
      thumbCacheRef.current = {};
      resetCutout(loaded.id);
      setPhoto(loaded);
      setBaseline(start);
      setHistory(startHistory(start));
      setCropDraft(null);
      setTool(null);
      setThumbs({});
      setNotices([
        loaded.downscaled ? t.downscaled(loaded.originalWidth, loaded.originalHeight, loaded.width, loaded.height) : '',
        loaded.format === 'gif' ? t.gif : '',
      ].filter(Boolean));
      // A PNG often has transparency worth keeping; a camera photo goes to JPG.
      setFormat(loaded.format === 'png' || loaded.format === 'webp' ? 'png' : 'jpeg');
    } catch (cause) {
      setError(loadErrorMessage(cause, t));
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({ openFile: (file: File) => open(file) }));

  const close = () => {
    cacheRef.current = {};
    thumbCacheRef.current = {};
    resetCutout(0);
    setPhoto(null);
    setHistory(null);
    setBaseline(null);
    setCropDraft(null);
    setTool(null);
    setThumbs({});
    setNotices([]);
    setError('');
    setStatus('');
  };

  /** Opens a tool (or closes it when it is tapped again). Leaving the crop keeps the frame drawn. */
  const chooseTool = (next: Tool | null) => {
    if (cropDraft && next !== 'crop') {
      const draft = cropDraft;
      update({ crop: draft });
      setCropDraft(null);
    }
    if (next === 'crop' && settings && !cropDraft) {
      setCropRatio('free');
      setCropDraft(settings.crop);
    }
    setTool(next);
  };

  const cancelCrop = () => {
    setCropDraft(null);
    setTool(null);
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

  const cropAspect = (ratio: CropRatio): number | null => (ratio === 'free' ? null : ratio === 'original' ? frame.width / frame.height : RATIO_VALUES[ratio]);

  const pointerPosition = (event: PointerEvent<HTMLElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !rect.width) return { x: 0, y: 0 };
    const units = viewWidth / rect.width;
    return { x: (event.clientX - rect.left) * units, y: (event.clientY - rect.top) * units };
  };

  const startCropGesture = (handle: CropHandle, event: PointerEvent<HTMLElement>) => {
    if (!cropDraft || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointerPosition(event);
    gestureRef.current = { handle, pointerX: point.x, pointerY: point.y, start: cropDraft };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    const point = pointerPosition(event);
    setCropDraft(dragCrop(gesture.start, gesture.handle, point.x - gesture.pointerX, point.y - gesture.pointerY, frame.width, frame.height, cropAspect(cropRatio)));
  };

  /** Where the pointer is in the mask, and the brush radius there (the photo may be turned and zoomed). */
  const maskPoint = (event: PointerEvent<HTMLElement>) => {
    const mask = maskRef.current;
    if (!photo || !settings || !mask) return null;
    const point = pointerPosition(event);
    const zoom = straightenZoom(frame.width, frame.height, settings.straighten);
    const source = frameToSource(settings.crop.x + point.x, settings.crop.y + point.y, settings, photo.width, photo.height, zoom);
    const ratio = mask.canvas.width / photo.width;
    return { x: source.x * ratio, y: source.y * ratio, radius: Math.max(1, ((brushSize / (displayScale || 1)) / zoom) * ratio) };
  };

  const onPaintDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!painting || event.button !== 0 || !settings) return;
    const mask = resolveMask(settings.maskVersion);
    const point = maskPoint(event);
    if (!mask || !point) return;
    event.preventDefault();
    if (maskTool === 'wand') {
      maskPixelsRef.current ??= photo && photoAtMaskSize(photo);
      if (maskPixelsRef.current && wandMask(mask.canvas, maskPixelsRef.current, point, wandTolerance, 'erase')) commitMask(mask.canvas);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    strokeRef.current = point;
    paintMask(mask.canvas, point, point, point.radius, maskTool === 'restore' ? 'restore' : 'erase');
    setMaskTick((tick) => tick + 1);
  };

  const onPaintMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!painting) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setBrushCursor({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    const last = strokeRef.current;
    const mask = maskRef.current;
    const point = maskPoint(event);
    if (!last || !mask || !point) return;
    paintMask(mask.canvas, last, point, point.radius, maskTool === 'restore' ? 'restore' : 'erase');
    strokeRef.current = point;
    setMaskTick((tick) => tick + 1);
  };

  /** The end of a stroke is one undo step. */
  const onPaintUp = () => {
    if (!strokeRef.current || !maskRef.current) return;
    strokeRef.current = null;
    commitMask(maskRef.current.canvas);
  };

  const chooseRatio = (ratio: CropRatio) => {
    setCropRatio(ratio);
    const aspect = cropAspect(ratio);
    if (aspect) setCropDraft(fitAspect({ x: 0, y: 0, width: frame.width, height: frame.height }, aspect));
  };

  /** A quarter turn: the frame (and the crop being drawn) turn with the photo. */
  const turn = (direction: 1 | -1) => {
    if (!settings) return;
    const times = direction === 1 ? 1 : 3;
    update((present) => ({ turns: present.turns + direction, crop: turnCrop(present.crop, frame.width, frame.height, times) }));
    setCropDraft((draft) => draft && turnCrop(draft, frame.width, frame.height, times));
  };

  /** A mirror flips the straightening too, so that the horizon stays level. */
  const flip = (axis: 'x' | 'y') => {
    update((present) => ({
      ...(axis === 'x' ? { flipX: !present.flipX } : { flipY: !present.flipY }),
      straighten: -present.straighten,
      crop: flipRect(present.crop, frame.width, frame.height, axis),
    }));
    setCropDraft((draft) => draft && flipRect(draft, frame.width, frame.height, axis));
  };

  const download = async () => {
    if (!photo || !settings || exporting) return;
    const final = cropDraft ? { ...settings, crop: cropDraft } : settings;
    setExporting(true);
    setError('');
    setStatus('');
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 30));
      const blob = await exportPhoto(photo, final, FORMATS[format].type, quality / 100, size, resolveMask(final.maskVersion));
      const name = downloadName(photo.name, FORMATS[format].extension, '', 'photo');
      downloadBlob(blob, name);
      setStatus(t.exported(name, formatSize(blob.size, locale, t)));
    } catch (cause) {
      setError(cause instanceof LogoExportError && cause.reason === 'format' && format === 'webp' ? t.webpUnsupported : t.exportFailed);
    } finally {
      setExporting(false);
    }
  };

  const compareKeys = {
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => { event.currentTarget.setPointerCapture(event.pointerId); setComparing(true); },
    onPointerUp: () => setComparing(false),
    onPointerCancel: () => setComparing(false),
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); setComparing(true); } },
    onKeyUp: () => setComparing(false),
    onBlur: () => setComparing(false),
  };

  if (!photo || !settings || !history || !baseline) {
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
        <button type="button" onClick={() => inputRef.current?.click()} disabled={loading} className="btn-upload mx-auto mt-5 flex items-center gap-3 rounded-xl px-5 py-3.5 text-lg">
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
  const adjustPristine = Object.keys(t.adjust).every((key) => !s[key as AdjustKey]);
  const cssWidth = viewWidth * displayScale;
  const cssHeight = viewHeight * displayScale;
  const hasCutout = s.maskVersion !== null;
  const transparent = hasCutout && !s.backgroundColor;
  const busy = ai.phase === 'download' || ai.phase === 'analyze';
  const painting = current === 'background' && hasCutout && maskTool !== null && !cropping && !comparing;
  const dimensions = exportDimensions(cropDraft ?? s.crop, size);

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
      {(cropAspect(cropRatio) ? CORNERS : CORNERS.concat(EDGES)).map((handle) => <span key={handle} onPointerDown={(event) => startCropGesture(handle, event)} className="absolute h-6 w-6 rounded-sm border-2 border-blue-600 bg-white shadow sm:h-3.5 sm:w-3.5" style={handleStyle(handle)} />)}
    </div>
  </>;

  const adjustSlider = (key: AdjustKey) => <Slider
    label={t.adjust[key]}
    value={s[key]}
    min={ONE_SIDED.has(key) ? 0 : -100}
    max={100}
    display={ONE_SIDED.has(key) ? (value) => String(value) : signed}
    onChange={(value) => update({ [key]: value }, key)}
  />;

  const panels: Record<Tool, ReactNode> = {
    filters: <div className="space-y-4">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:grid lg:grid-cols-3 lg:overflow-visible">
        {FILTER_IDS.map((id) => <button
          key={id}
          type="button"
          aria-pressed={s.filter === id}
          onClick={() => update((present) => applyFilter(present, id, id === present.filter ? present.filterStrength : 100))}
          className="w-20 shrink-0 text-center lg:w-auto"
        >
          <span className={`block aspect-square overflow-hidden rounded-xl bg-slate-100 ring-2 transition ${s.filter === id ? 'ring-blue-600' : 'ring-transparent hover:ring-slate-300'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {thumbs[id] && <img src={thumbs[id]} alt="" className="h-full w-full object-cover" />}
          </span>
          <span className={`mt-1 block truncate text-xs font-semibold ${s.filter === id ? 'text-blue-700' : 'text-slate-600'}`}>{t.filters[id]}</span>
        </button>)}
      </div>
      {s.filter !== 'none' && <Slider label={t.filterStrength} value={s.filterStrength} min={0} max={100} display={(value) => `${value} %`} onChange={(value) => update((present) => applyFilter(present, present.filter, value), 'filterStrength')} />}
    </div>,

    adjust: <div className="space-y-4">
      {/* On a phone: one chip per setting and only the chosen slider. Wide screens show them all. */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:hidden">
        {ADJUST_GROUPS.flatMap((group) => group.keys).map((key) => <button
          key={key}
          type="button"
          aria-pressed={adjustKey === key}
          onClick={() => setAdjustKey(key)}
          className={`relative shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${adjustKey === key ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}
        >
          {t.adjust[key]}
          {s[key] !== 0 && <span aria-hidden="true" className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${adjustKey === key ? 'bg-white ring-2 ring-blue-600' : 'bg-blue-600'}`} />}
        </button>)}
      </div>
      <div className="lg:hidden">{adjustSlider(adjustKey)}</div>
      <div className="hidden space-y-5 lg:block">
        {ADJUST_GROUPS.map((group) => <div key={group.id} className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t.groups[group.id]}</p>
          {group.keys.map((key) => <div key={key}>{adjustSlider(key)}</div>)}
        </div>)}
      </div>
      <p className="text-xs text-slate-500 lg:hidden">{t.adjustHelp}</p>
      <button type="button" onClick={() => update({ ...NEUTRAL_TONES, filter: 'none', filterStrength: 100 })} disabled={adjustPristine} className="text-sm font-semibold text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:no-underline">{t.resetAdjust}</button>
    </div>,

    crop: <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-800">{t.ratioLabel}</p>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible">
          {CROP_RATIOS.map((ratio) => <span key={ratio} className="shrink-0"><ChipButton pressed={cropRatio === ratio} onClick={() => chooseRatio(ratio)}>{t.ratios[ratio]}</ChipButton></span>)}
        </div>
        {t.ratioHints[cropRatio] && <p className="mt-1.5 text-xs text-slate-500">{t.ratioHints[cropRatio]}</p>}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <IconButton icon={RotateCcw} label={t.rotateLeft} onClick={() => turn(-1)}><span className="sr-only lg:not-sr-only">-90°</span></IconButton>
        <IconButton icon={RotateCw} label={t.rotateRight} onClick={() => turn(1)}><span className="sr-only lg:not-sr-only">+90°</span></IconButton>
        <IconButton icon={FlipHorizontal2} label={t.flipX} pressed={s.flipX} onClick={() => flip('x')}><span className="sr-only">{t.flipX}</span></IconButton>
        <IconButton icon={FlipVertical2} label={t.flipY} pressed={s.flipY} onClick={() => flip('y')}><span className="sr-only">{t.flipY}</span></IconButton>
      </div>
      <Slider label={t.straighten} value={s.straighten} min={-45} max={45} step={0.5} display={(value) => `${signed(value)}°`} onChange={(value) => update({ straighten: value }, 'straighten')} />
      {crop && <p className="text-xs text-slate-500">{t.cropHelp(crop.width, crop.height)}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => { update({ straighten: 0 }); setCropRatio('free'); setCropDraft({ x: 0, y: 0, width: frame.width, height: frame.height }); }}
          disabled={!s.straighten && (!crop || isFullCrop(crop, frame.width, frame.height))}
          className="text-sm font-semibold text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:no-underline"
        >{t.resetCrop}</button>
        <span className="flex gap-2">
          <button type="button" onClick={cancelCrop} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">{t.cancel}</button>
          <button type="button" onClick={() => chooseTool(null)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Check className="h-4 w-4" aria-hidden="true" /> {t.apply}</button>
        </span>
      </div>
    </div>,

    // Once the subject is cut out, the touch-up tools come first: on a phone they stay right under
    // the photo, and the buttons to cut out again fold away at the bottom.
    background: <div className="flex flex-col gap-4">
      <details key={String(hasCutout)} open={!hasCutout} className={`group space-y-2 ${hasCutout ? 'order-3 rounded-xl border border-slate-200 p-3' : ''}`}>
        <summary className={`cursor-pointer list-none text-sm font-semibold text-slate-800 ${hasCutout ? '' : 'pointer-events-none'}`}>
          {hasCutout ? `${t.redoCutout} ▾` : t.cutoutTitle}
        </summary>
        <button type="button" onClick={runAi} disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-80">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ScanFace className="h-5 w-5" aria-hidden="true" />}
          {ai.phase === 'download' ? t.aiDownload(ai.percent) : ai.phase === 'analyze' ? t.aiAnalyze : t.aiCutout}
        </button>
        {ai.phase === 'download' && <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${ai.percent}%` }} /></div>}
        <p className="text-xs leading-5 text-slate-500">{t.aiHint(`${Math.round(SUBJECT_MODEL.bytes / 1_000_000)} ${t.megabytes}`)}</p>
        {ai.phase === 'error' && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{t.aiError}</p>}
        <button type="button" onClick={() => runPlain(s.backgroundTolerance)} disabled={busy} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50">
          <Eraser className="h-4 w-4" aria-hidden="true" /> {t.plainCutout}
        </button>
        <p className="text-xs leading-5 text-slate-500">{t.plainHint}</p>
        {usedPlain && hasCutout && <div>
          <Slider label={t.tolerance} value={s.backgroundTolerance} min={0} max={100} display={(value) => String(value)} onChange={(value) => runPlain(value, 'plainTolerance')} />
          <p className="mt-1 text-xs text-slate-500">{t.toleranceHint}</p>
        </div>}
      </details>
      {hasCutout && <>
        <div className="order-1 space-y-3 rounded-xl border border-slate-200 p-3">
          <p className="text-sm font-semibold text-slate-800">{t.touchUp}</p>
          <div role="radiogroup" aria-label={t.touchUp} className="grid grid-cols-3 gap-1.5">
            {([['erase', Eraser], ['restore', Brush], ['wand', Wand2]] as const).map(([id, Icon]) => <button
              key={id}
              type="button"
              role="radio"
              aria-checked={maskTool === id}
              onClick={() => { setMaskTool(maskTool === id ? null : id); setBrushCursor(null); }}
              className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs font-semibold transition ${maskTool === id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
            ><Icon className="h-4 w-4" aria-hidden="true" />{t.maskTools[id]}</button>)}
          </div>
          {maskTool && maskTool !== 'wand' && <Slider label={t.brushSize} value={brushSize} min={4} max={120} display={(value) => `${value} px`} onChange={setBrushSize} />}
          {maskTool === 'wand' && <Slider label={t.wandTolerance} value={wandTolerance} min={0} max={100} display={(value) => String(value)} onChange={setWandTolerance} />}
          <p className="text-xs leading-5 text-slate-500">{maskTool ? (maskTool === 'wand' ? t.stageWand : t.stagePaint) : t.touchUpHint}</p>
          <button type="button" onClick={() => { setMaskTool(null); update({ maskVersion: null }); }} className="text-sm font-semibold text-blue-700 hover:underline">{t.removeCutout}</button>
        </div>
        <div className="order-2">
          <p className="mb-2 text-sm font-semibold text-slate-800">{t.newBackground}</p>
          <div role="radiogroup" aria-label={t.newBackground} className="grid grid-cols-3 gap-1.5">
            {(['transparent', 'white', 'color'] as const).map((choice) => {
              const checked = choice === 'transparent' ? !s.backgroundColor : choice === 'white' ? s.backgroundColor === '#ffffff' : Boolean(s.backgroundColor) && s.backgroundColor !== '#ffffff';
              return <button
                key={choice}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => update({ backgroundColor: choice === 'transparent' ? null : choice === 'white' ? '#ffffff' : '#2f6bff' })}
                className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${checked ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
              >{t.backgrounds[choice]}</button>;
            })}
          </div>
        </div>
        {s.backgroundColor && s.backgroundColor !== '#ffffff' && <div className="order-2"><ColorField label={t.backgroundColor} value={s.backgroundColor} onChange={(value) => update({ backgroundColor: value }, 'backgroundColor')} /></div>}
      </>}
    </div>,

    export: <div className="space-y-4">
      <div role="radiogroup" aria-label={t.formatLabel} className="grid grid-cols-3 gap-1.5">
        {(Object.keys(FORMATS) as PhotoFormat[]).map((value) => <button
          key={value}
          type="button"
          role="radio"
          aria-checked={format === value}
          onClick={() => { setFormat(value); setStatus(''); }}
          className={`rounded-lg border px-2 py-2.5 text-sm font-bold transition ${format === value ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
        >{FORMATS[value].label}</button>)}
      </div>
      <p className="text-sm leading-6 text-slate-600">{t.formatHints[format]}</p>
      {transparent && format === 'jpeg' && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{t.transparencyLost}</p>}
      {format !== 'png' && <Slider label={t.quality} value={quality} min={40} max={100} display={(value) => `${value} %`} onChange={setQuality} />}
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-800">{t.sizeLabel}</p>
        <div role="radiogroup" aria-label={t.sizeLabel} className="grid grid-cols-2 gap-1.5">
          {EXPORT_SIZES.map((value) => <button
            key={value}
            type="button"
            role="radio"
            aria-checked={size === value}
            onClick={() => { setSize(value); setStatus(''); }}
            className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${size === value ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
          >{t.sizes[value]}</button>)}
        </div>
      </div>
      <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">{t.dimensions(dimensions.width, dimensions.height)}</p>
      <button type="button" onClick={() => void download()} disabled={exporting} className="btn-download flex min-h-14 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base">
        {exporting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Download className="h-5 w-5" aria-hidden="true" />}
        {exporting ? t.exporting : `${t.download} ${FORMATS[format].label}`}
      </button>
    </div>,
  };

  return <div
    className="space-y-3 text-slate-700 sm:space-y-4"
    onDragOver={onDragOver}
    onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
    onDrop={onDrop}
  >
    <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onInput} />

    {notices.length > 0 && <ul className="space-y-1 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
      {notices.map((notice) => <li key={notice}>{notice}</li>)}
    </ul>}

    {/* One line on a 360 px phone: icons only, tighter gaps. */}
    <div role="toolbar" aria-label={t.toolbarLabel} className="flex items-center gap-1.5 sm:gap-2">
      <ToolButton icon={Undo2} label={t.undo} title={`${t.undo} (Ctrl+Z)`} onClick={() => travel(undo)} disabled={!history.past.length} />
      <ToolButton icon={Redo2} label={t.redo} title={`${t.redo} (Ctrl+Y)`} onClick={() => travel(redo)} disabled={!history.future.length} />
      <ToolButton icon={RotateCcw} label={t.reset} onClick={() => { setCropDraft(null); update(baseline); }} disabled={pristine && !cropping} />
      <span className="ml-auto flex gap-1.5 sm:gap-2">
        <ToolButton icon={UploadCloud} label={t.replace} text={t.replaceShort} onClick={() => inputRef.current?.click()} disabled={loading || exporting} />
        <ToolButton icon={X} label={t.close} text={t.closeShort} onClick={close} disabled={exporting} />
        <button type="button" onClick={() => void download()} disabled={exporting} aria-label={`${t.download} ${FORMATS[format].label}`} className="btn-download inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm sm:px-4">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
          <span>{exporting ? t.exporting : FORMATS[format].label}</span>
        </button>
      </span>
    </div>

    <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
      <div className="min-w-0 space-y-3">
        <div
          ref={stageRef}
          role="group"
          aria-label={t.stageLabel}
          className={`relative flex items-center justify-center overflow-hidden rounded-2xl border p-3 transition sm:p-6 lg:h-[34rem] ${tool ? 'h-[16rem] sm:h-[22rem]' : 'h-[22rem] sm:h-[26rem]'} ${dragging ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-200'}`}
          style={STAGE_BACKGROUND}
        >
          {displayScale > 0 && <div className="relative shrink-0" style={{ width: cssWidth, height: cssHeight }} onPointerMove={onPointerMove} onPointerUp={() => { gestureRef.current = null; }} onPointerCancel={() => { gestureRef.current = null; }}>
            <canvas
              ref={canvasRef}
              onPointerDown={onPaintDown}
              onPointerMove={onPaintMove}
              onPointerUp={onPaintUp}
              onPointerCancel={onPaintUp}
              onPointerLeave={() => setBrushCursor(null)}
              className={`block h-full w-full shadow-[0_10px_30px_rgba(15,23,42,.14)] ${painting ? (maskTool === 'wand' ? 'cursor-crosshair' : 'cursor-none') : ''}`}
              style={{ ...(transparent && !comparing ? CHECKERBOARD : {}), touchAction: 'none' }}
            />
            {cropping && cropOverlay}
            {painting && maskTool !== 'wand' && brushCursor && <span
              aria-hidden="true"
              className="pointer-events-none absolute rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(15,23,42,.6)]"
              style={{ left: brushCursor.x - brushSize, top: brushCursor.y - brushSize, width: brushSize * 2, height: brushSize * 2 }}
            />}
          </div>}
          {!cropping && <button
            type="button"
            aria-label={t.compare}
            title={t.compare}
            aria-pressed={comparing}
            {...compareKeys}
            className="absolute bottom-3 right-3 inline-flex h-10 select-none items-center gap-1.5 rounded-full bg-slate-900/75 px-3.5 text-xs font-bold text-white shadow backdrop-blur transition hover:bg-slate-900/90"
            style={{ touchAction: 'none', WebkitTouchCallout: 'none' }}
          >
            <Eye className="h-4 w-4" aria-hidden="true" /> {comparing ? t.original : t.compareShort}
          </button>}
          {(loading || dragging) && <div className="absolute inset-0 grid place-items-center bg-white/75 p-6 text-center text-sm font-semibold text-slate-700">
            {loading ? <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-label={t.loading} /> : t.dropToReplace}
          </div>}
        </div>

        {/* Phone tool bar: a tool's settings only show once it is tapped. */}
        <div role="toolbar" aria-label={t.toolsLabel} className="grid grid-cols-5 gap-1 rounded-2xl border border-slate-200 bg-white p-1 lg:hidden">
          {TOOLS.map(({ id, icon: Icon }) => <button
            key={id}
            type="button"
            aria-pressed={tool === id}
            aria-controls={`${baseId}-panel`}
            onClick={() => chooseTool(tool === id ? null : id)}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 py-2 text-[11px] font-semibold transition ${tool === id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="max-w-full truncate">{t.tools[id]}</span>
          </button>)}
        </div>
      </div>

      <div className={`${tool ? 'block' : 'hidden'} overflow-hidden rounded-2xl border border-slate-200 bg-white lg:block`}>
        <div role="tablist" aria-label={t.toolsLabel} className="hidden grid-cols-5 gap-1 border-b border-slate-200 bg-slate-50 p-1.5 lg:grid">
          {TOOLS.map(({ id, icon: Icon }) => <button
            key={id}
            id={`${baseId}-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={current === id}
            aria-controls={`${baseId}-panel`}
            onClick={() => chooseTool(id)}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-lg px-0.5 py-2 text-[11px] font-semibold transition ${current === id ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="max-w-full truncate">{t.tools[id]}</span>
          </button>)}
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 lg:hidden">
          <p className="text-sm font-bold text-slate-900">{t.tools[current]}</p>
          {current !== 'crop' && <button type="button" onClick={() => chooseTool(null)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-blue-700 hover:bg-blue-50"><Check className="h-4 w-4" aria-hidden="true" /> {t.done}</button>}
        </div>
        <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${current}`} className="min-w-0 p-4 lg:max-h-[30rem] lg:overflow-y-auto">
          {panels[current]}
        </div>
      </div>
    </div>

    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
    {status && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{status}</p>}
    <p className="text-center text-sm text-slate-500">{t.privacy}</p>
  </div>;
}
