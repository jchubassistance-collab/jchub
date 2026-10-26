'use client';

import { useRef, useState, type ChangeEvent, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, CopyCheck, Download, FileImage, FileText, Loader2, Move, RectangleHorizontal, RectangleVertical, RotateCcw, RotateCw, Trash2, Undo2, UploadCloud, ZoomIn, ZoomOut } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';

const copy = bilingual({
  onlyJpgPng: 'Seuls les fichiers JPG, JPEG et PNG sont acceptés.',
  tooLarge: (name: string) => `${name} dépasse la limite de 15 Mo.`,
  maxFiles: (max: number) => `Tu peux ajouter jusqu'à ${max} images.`,
  unreadable: (name: string) => `Impossible de lire ${name}. Essaie un autre fichier.`,
  failed: 'La création du PDF a échoué. Vérifie les images puis réessaie.',
  add: 'Ajouter des images',
  limits: (max: number) => `JPG, JPEG ou PNG · 15 Mo maximum par image · 50 Mo au total · jusqu'à ${max} images`,
  megabytes: 'Mo',
  adjusted: 'ajustée',
  remove: (name: string) => `Retirer ${name}`,
  moveUp: (name: string) => `Remonter ${name}`,
  moveDown: (name: string) => `Descendre ${name}`,
  preview: 'Aperçu de la page',
  pageOf: (page: number, total: number) => `Page ${page} sur ${total}`,
  previous: 'Page précédente',
  next: 'Page suivante',
  stage: 'Position de l’image dans la page : fais-la glisser, ou utilise les flèches du clavier et les touches + et −.',
  drag: 'Fais glisser l’image pour la placer',
  zoom: 'Zoom',
  zoomOut: 'Dézoomer',
  zoomIn: 'Zoomer',
  rotateLeft: 'Pivoter vers la gauche',
  rotateRight: 'Pivoter vers la droite',
  position: 'Position',
  align: (row: number, column: number) => row === 1 && column === 1 ? 'Centrer' : `Aligner ${['en haut', 'au milieu', 'en bas'][row]} ${['à gauche', 'au centre', 'à droite'][column]}`,
  reset: 'Réinitialiser',
  applyAll: 'Appliquer à toutes les pages',
  pageSize: 'Taille des pages',
  a4: 'A4 (210 × 297 mm)',
  letter: 'Lettre US (216 × 279 mm)',
  fitPage: 'Taille adaptée à chaque image',
  orientation: 'Orientation',
  portrait: 'Portrait',
  landscape: 'Paysage',
  margin: 'Marge',
  margins: { none: 'Aucune marge', small: 'Petite', large: 'Grande' },
  placement: 'Placement de l’image',
  contain: 'Tout afficher (sans recadrage)',
  cover: 'Remplir la page (peut recadrer)',
  order: 'Chaque image occupe une page, dans l’ordre de la liste. Choisis une image pour la régler dans l’aperçu, et change l’ordre avec les flèches.',
  creating: 'Création du PDF…',
  convert: 'Convertir en PDF',
  download: 'Télécharger le PDF',
  quota: '5 conversions par jour et par adresse IP. Les images sont traitées sur le serveur depuis un stockage privé temporaire, puis supprimées.',
}, {
  onlyJpgPng: 'Only JPG, JPEG and PNG files are accepted.',
  tooLarge: (name: string) => `${name} exceeds the 15 MB limit.`,
  maxFiles: (max: number) => `You can add up to ${max} images.`,
  unreadable: (name: string) => `Could not read ${name}. Try another file.`,
  failed: 'Creating the PDF failed. Check the images and try again.',
  add: 'Add images',
  limits: (max: number) => `JPG, JPEG or PNG · 15 MB maximum per image · 50 MB in total · up to ${max} images`,
  megabytes: 'MB',
  adjusted: 'adjusted',
  remove: (name: string) => `Remove ${name}`,
  moveUp: (name: string) => `Move ${name} up`,
  moveDown: (name: string) => `Move ${name} down`,
  preview: 'Page preview',
  pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
  previous: 'Previous page',
  next: 'Next page',
  stage: 'Position of the image on the page: drag it, or use the arrow keys and the + and − keys.',
  drag: 'Drag the image to place it',
  zoom: 'Zoom',
  zoomOut: 'Zoom out',
  zoomIn: 'Zoom in',
  rotateLeft: 'Rotate left',
  rotateRight: 'Rotate right',
  position: 'Position',
  align: (row: number, column: number) => row === 1 && column === 1 ? 'Center' : `Align ${['top', 'middle', 'bottom'][row]} ${['left', 'center', 'right'][column]}`,
  reset: 'Reset',
  applyAll: 'Apply to all pages',
  pageSize: 'Page size',
  a4: 'A4 (210 × 297 mm)',
  letter: 'US Letter (216 × 279 mm)',
  fitPage: 'Size matched to each image',
  orientation: 'Orientation',
  portrait: 'Portrait',
  landscape: 'Landscape',
  margin: 'Margin',
  margins: { none: 'No margin', small: 'Small', large: 'Large' },
  placement: 'Image placement',
  contain: 'Show everything (no cropping)',
  cover: 'Fill the page (may crop)',
  order: 'Each image fills one page, in the order of the list. Pick an image to adjust it in the preview, and change the order with the arrows.',
  creating: 'Creating the PDF…',
  convert: 'Convert to PDF',
  download: 'Download the PDF',
  quota: '5 conversions per day per IP address. The images are processed on the server from temporary private storage, then deleted.',
});
import { cleanUpConversionFiles, postConversion, uploadConversionFile } from '@/lib/conversion-upload-client';
import { downloadName } from '@/lib/download-name';
import { DEFAULT_ADJUSTMENT, MARGINS_MM, ZOOM_RANGE, layoutImagePage, type Adjustment, type Box, type Fit, type Margin, type Orientation, type PageSize, type Rotation } from '@/lib/images-to-pdf';

/** `size` is the upright size the browser reads once the image has loaded. */
type ImageItem = { id: number; file: File; url: string; adjustment: Adjustment; size?: { width: number; height: number } };
type Layout = ReturnType<typeof layoutImagePage>;
const MAX_FILES = 20;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ZOOM_STEP = 0.1;
/** Largest height of the page in the preview, in pixels. */
const PREVIEW_HEIGHT = 440;
/** Inset of the picture in the margin icons, in pixels. */
const MARGIN_ICON_INSET: Record<Margin, number> = { none: 0, small: 3, large: 6 };

const choiceClass = (active: boolean) => `flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-sm font-semibold transition ${active ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-[#9ccbff]/20 bg-[#071526] text-slate-300 hover:border-[#9ccbff]/40'}`;
const toolButtonClass = 'rounded-lg border border-slate-300 bg-white p-1.5 text-slate-700 hover:border-slate-400 disabled:opacity-40';
const textButtonClass = 'inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-40';
const listButtonClass = 'rounded-lg p-2 text-slate-400 hover:bg-blue-500/10 hover:text-blue-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400';

const clampZoom = (zoom: number) => Math.min(ZOOM_RANGE.max, Math.max(ZOOM_RANGE.min, Math.round(zoom * 100) / 100));
const isAdjusted = ({ zoom, x, y, rotation }: Adjustment) => zoom !== 1 || x !== 0 || y !== 0 || rotation !== 0;

/** `box` placed in `area`, both in millimetres, as CSS percentages of the area. */
const place = (box: Box, area: Box): CSSProperties => ({
  left: `${((box.x - area.x) / area.width) * 100}%`,
  top: `${((box.y - area.y) / area.height) * 100}%`,
  width: `${(box.width / area.width) * 100}%`,
  height: `${(box.height / area.height) * 100}%`,
});

/** The picture turned clockwise inside a box that already has the turned proportions. */
function turnedImageStyle(rotation: Rotation, box: Box): CSSProperties {
  const quarter = rotation % 180 !== 0;
  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    maxWidth: 'none',
    width: quarter ? `${(box.height / box.width) * 100}%` : '100%',
    height: quarter ? `${(box.width / box.height) * 100}%` : '100%',
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
  };
}

/** The image moved by a distance in millimetres, as far as its alignment in the frame allows. */
function moved(adjustment: Adjustment, { frame, image }: Layout, dx: number, dy: number): Adjustment {
  // An image as wide as the frame has nowhere to go on that axis.
  const shift = (value: number, distance: number, slack: number) => Math.abs(slack) < 0.01 ? value : Math.min(1, Math.max(-1, value + (2 * distance) / slack));
  return { ...adjustment, x: shift(adjustment.x, dx, frame.width - image.width), y: shift(adjustment.y, dy, frame.height - image.height) };
}

export function ImagesToPdf() {
  const t = copy[useLocale()];
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);
  const drag = useRef<{ pointerX: number; pointerY: number; start: Adjustment; mmPerPixel: number } | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<number>();
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [fit, setFit] = useState<Fit>('contain');
  const [margin, setMargin] = useState<Margin>('none');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  /** The PDF is offered only while the settings it was made with are still the ones shown. */
  const [result, setResult] = useState<{ url: string; key: string } | null>(null);

  const requestKey = JSON.stringify({ pageSize, orientation, fit, margin, pages: images.map(({ id, adjustment }) => [id, adjustment]) });
  const selectedIndex = Math.max(0, images.findIndex(({ id }) => id === selectedId));
  const selected = images.at(selectedIndex);
  const layout = selected?.size ? layoutImagePage(selected.size.width, selected.size.height, { pageSize, orientation, fit, margin }, selected.adjustment) : null;

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    setError('');
    const accepted: ImageItem[] = [];
    for (const file of Array.from(event.target.files ?? [])) {
      if (!/^image\/(jpeg|png)$/.test(file.type)) { setError(t.onlyJpgPng); continue; }
      if (file.size > MAX_FILE_SIZE) { setError(t.tooLarge(file.name)); continue; }
      if (images.length + accepted.length >= MAX_FILES) { setError(t.maxFiles(MAX_FILES)); break; }
      accepted.push({ id: nextId.current++, file, url: URL.createObjectURL(file), adjustment: DEFAULT_ADJUSTMENT });
    }
    setImages((current) => [...current, ...accepted]);
    // The first new image goes to the preview.
    if (accepted.length) setSelectedId(accepted[0].id);
    event.target.value = '';
  };

  const measure = (id: number, image: HTMLImageElement) => {
    setImages((current) => current.map((item) => item.id === id ? { ...item, size: { width: image.naturalWidth, height: image.naturalHeight } } : item));
  };

  const remove = (id: number) => {
    const index = images.findIndex((item) => item.id === id);
    if (index < 0) return;
    URL.revokeObjectURL(images[index].url);
    if (id === selected?.id) setSelectedId((images[index + 1] ?? images[index - 1])?.id);
    setImages((current) => current.filter((item) => item.id !== id));
  };

  const move = (index: number, offset: -1 | 1) => {
    setImages((current) => {
      const next = [...current];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });
  };

  const adjust = (change: (adjustment: Adjustment) => Adjustment) => {
    if (!selected) return;
    setImages((current) => current.map((item) => item.id === selected.id ? { ...item, adjustment: change(item.adjustment) } : item));
  };
  const zoomTo = (zoom: number) => adjust((current) => ({ ...current, zoom: clampZoom(zoom) }));
  const rotate = (quarterTurns: 1 | 3) => adjust((current) => ({ ...current, rotation: ((current.rotation + quarterTurns * 90) % 360) as Rotation }));
  const applyToAll = () => {
    if (selected) setImages((current) => current.map((item) => ({ ...item, adjustment: selected.adjustment })));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!selected || !layout) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerX: event.clientX, pointerY: event.clientY, start: selected.adjustment, mmPerPixel: layout.page.width / event.currentTarget.getBoundingClientRect().width };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const from = drag.current;
    if (!from || !layout) return;
    // Measured from where the drag started, so the image never drifts from the pointer.
    adjust(() => moved(from.start, layout, (event.clientX - from.pointerX) * from.mmPerPixel, (event.clientY - from.pointerY) * from.mmPerPixel));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!selected || !layout) return;
    const step = event.shiftKey ? 10 : 1;
    const arrow = ({ ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] } as Record<string, [number, number]>)[event.key];
    if (arrow) adjust((current) => moved(current, layout, ...arrow));
    else if (event.key === '+' || event.key === '=') zoomTo(selected.adjustment.zoom + ZOOM_STEP);
    else if (event.key === '-') zoomTo(selected.adjustment.zoom - ZOOM_STEP);
    else return;
    event.preventDefault();
  };

  const convert = async () => {
    if (!images.length) return;
    const key = requestKey;
    setBusy(true); setError('');
    const uploadedUrls: string[] = [];
    try {
      for (const image of images) {
        uploadedUrls.push(await uploadConversionFile('images-to-pdf', image.file));
      }
      const response = await postConversion('/api/tools/images-to-pdf', {
        urls: uploadedUrls,
        pageSize,
        orientation,
        fit,
        margin,
        adjustments: images.map(({ adjustment }) => adjustment),
      });
      const url = URL.createObjectURL(await response.blob());
      if (result) URL.revokeObjectURL(result.url);
      setResult({ url, key });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.failed);
    } finally {
      await cleanUpConversionFiles('images-to-pdf', uploadedUrls);
      setBusy(false);
    }
  };

  return <div className="space-y-5 text-slate-100">
    <div className="rounded-2xl border border-dashed border-[#9ccbff]/40 bg-[#071526] p-6 text-center">
      <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,.jpg,.jpeg,.png" className="hidden" onChange={addFiles} />
      <button type="button" onClick={() => inputRef.current?.click()} className="mx-auto flex items-center gap-2 rounded-xl border border-[#9ccbff]/30 bg-[#0c1d31] px-4 py-3 font-semibold text-[#dfeeff] hover:border-[#9ccbff]/50"><UploadCloud className="h-5 w-5" /> {t.add}</button>
      <p className="mt-3 text-xs text-slate-400">{t.limits(MAX_FILES)}</p>
    </div>

    <div className={selected ? 'grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)]' : ''}>
      {selected && <section aria-label={t.preview} className="min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0"><h2 className="text-sm font-semibold text-white">{t.pageOf(selectedIndex + 1, images.length)}</h2><p className="truncate text-xs text-slate-400">{selected.file.name}</p></div>
          <div className="flex shrink-0 gap-1">
            <button type="button" aria-label={t.previous} title={t.previous} disabled={selectedIndex === 0} onClick={() => setSelectedId(images[selectedIndex - 1].id)} className={toolButtonClass}><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" aria-label={t.next} title={t.next} disabled={selectedIndex === images.length - 1} onClick={() => setSelectedId(images[selectedIndex + 1].id)} className={toolButtonClass}><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-2xl border border-[#9ccbff]/20 bg-slate-100 p-6 sm:p-8">
          {layout ? <div tabIndex={0} aria-label={t.stage} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onKeyDown={onKeyDown} className="relative cursor-move touch-none select-none bg-white shadow-xl ring-1 ring-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500" style={{ aspectRatio: `${layout.page.width} / ${layout.page.height}`, width: `min(100%, ${(PREVIEW_HEIGHT * layout.page.width) / layout.page.height}px)` }}>
            {/* What the frame cuts off stays faintly visible around it. */}
            <div aria-hidden="true" className="pointer-events-none absolute opacity-25" style={place(layout.image, { x: 0, y: 0, ...layout.page })}>
              <img src={selected.url} alt="" draggable={false} style={turnedImageStyle(selected.adjustment.rotation, layout.image)} />
            </div>
            <div className="pointer-events-none absolute overflow-hidden" style={place(layout.frame, { x: 0, y: 0, ...layout.page })}>
              <div className="absolute" style={place(layout.image, layout.frame)}>
                <img src={selected.url} alt="" draggable={false} style={turnedImageStyle(selected.adjustment.rotation, layout.image)} />
              </div>
            </div>
            {margin !== 'none' && <div aria-hidden="true" className="pointer-events-none absolute border border-dashed border-blue-400/70" style={place(layout.frame, { x: 0, y: 0, ...layout.page })} />}
          </div> : <Loader2 className="h-6 w-6 animate-spin text-slate-400" />}
          <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-slate-50"><Move className="mr-1 inline h-3 w-3" />{t.drag}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-400">
          <div className="inline-flex items-center gap-2">
            <span>{t.zoom}</span>
            <button type="button" aria-label={t.zoomOut} title={t.zoomOut} disabled={selected.adjustment.zoom <= ZOOM_RANGE.min} onClick={() => zoomTo(selected.adjustment.zoom - ZOOM_STEP)} className={toolButtonClass}><ZoomOut className="h-4 w-4" /></button>
            <input aria-label={t.zoom} type="range" min={ZOOM_RANGE.min} max={ZOOM_RANGE.max} step="0.05" value={selected.adjustment.zoom} onChange={(event) => zoomTo(Number(event.target.value))} className="w-24 accent-blue-500 sm:w-32" />
            <button type="button" aria-label={t.zoomIn} title={t.zoomIn} disabled={selected.adjustment.zoom >= ZOOM_RANGE.max} onClick={() => zoomTo(selected.adjustment.zoom + ZOOM_STEP)} className={toolButtonClass}><ZoomIn className="h-4 w-4" /></button>
            <span className="w-10 text-right">{Math.round(selected.adjustment.zoom * 100)}%</span>
          </div>
          <div className="inline-flex items-center gap-1">
            <button type="button" aria-label={t.rotateLeft} title={t.rotateLeft} onClick={() => rotate(3)} className={toolButtonClass}><RotateCcw className="h-4 w-4" /></button>
            <button type="button" aria-label={t.rotateRight} title={t.rotateRight} onClick={() => rotate(1)} className={toolButtonClass}><RotateCw className="h-4 w-4" /></button>
          </div>
          <div className="inline-flex items-center gap-2">
            <span>{t.position}</span>
            <div role="group" aria-label={t.position} className="grid grid-cols-3 gap-0.5 rounded-lg border border-slate-300 bg-white p-1">
              {([-1, 0, 1] as const).flatMap((y, row) => ([-1, 0, 1] as const).map((x, column) => {
                const active = selected.adjustment.x === x && selected.adjustment.y === y;
                return <button key={`${row}-${column}`} type="button" aria-label={t.align(row, column)} title={t.align(row, column)} aria-pressed={active} onClick={() => adjust((current) => ({ ...current, x, y }))} className={`flex h-5 w-5 items-center justify-center rounded-sm ${active ? 'bg-blue-600' : 'hover:bg-slate-200'}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-white' : 'bg-slate-400'}`} /></button>;
              }))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!isAdjusted(selected.adjustment)} onClick={() => adjust(() => DEFAULT_ADJUSTMENT)} className={textButtonClass}><Undo2 className="h-3.5 w-3.5" />{t.reset}</button>
            {images.length > 1 && <button type="button" onClick={applyToAll} className={textButtonClass}><CopyCheck className="h-3.5 w-3.5" />{t.applyAll}</button>}
          </div>
        </div>
      </section>}

      <div className="min-w-0 space-y-5">
        {images.length > 0 && <ol className="max-h-72 space-y-2 overflow-auto rounded-2xl border border-[#9ccbff]/20 bg-[#071526] p-3">
          {images.map(({ id, file, url, adjustment }, index) => <li key={id} className={`flex items-center gap-1 rounded-xl border p-2 ${id === selected?.id ? 'border-blue-500 bg-blue-500/10' : 'border-transparent bg-[#0c1d31]'}`}>
            <button type="button" aria-pressed={id === selected?.id} onClick={() => setSelectedId(id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100"><img src={url} alt="" onLoad={(event) => measure(id, event.currentTarget)} onError={() => { remove(id); setError(t.unreadable(file.name)); }} className="h-full w-full object-cover" style={{ transform: `rotate(${adjustment.rotation}deg)` }} /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-white">{index + 1}. {file.name}</span><span className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} {t.megabytes}{isAdjusted(adjustment) && ` · ${t.adjusted}`}</span></span>
            </button>
            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={t.moveUp(file.name)} title={t.moveUp(file.name)} className={listButtonClass}><ArrowUp className="h-4 w-4" /></button>
            <button type="button" onClick={() => move(index, 1)} disabled={index === images.length - 1} aria-label={t.moveDown(file.name)} title={t.moveDown(file.name)} className={listButtonClass}><ArrowDown className="h-4 w-4" /></button>
            <button type="button" onClick={() => remove(id)} aria-label={t.remove(file.name)} title={t.remove(file.name)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
          </li>)}
        </ol>}

        {/* A page matched to the image takes the image's own orientation. */}
        {pageSize !== 'image' && <fieldset><legend className="mb-1 text-sm text-slate-300">{t.orientation}</legend><div className="grid grid-cols-2 gap-2">
          {(['portrait', 'landscape'] as const).map((value) => {
            const Icon = value === 'portrait' ? RectangleVertical : RectangleHorizontal;
            return <button key={value} type="button" aria-pressed={orientation === value} onClick={() => setOrientation(value)} className={choiceClass(orientation === value)}><Icon className="h-6 w-6" />{t[value]}</button>;
          })}
        </div></fieldset>}
        <label className="block text-sm text-slate-300">{t.pageSize}<select value={pageSize} onChange={(e) => setPageSize(e.target.value as PageSize)} className="mt-1 w-full rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-3 py-2.5 text-white"><option value="a4">{t.a4}</option><option value="letter">{t.letter}</option><option value="image">{t.fitPage}</option></select></label>
        <fieldset><legend className="mb-1 text-sm text-slate-300">{t.margin}</legend><div className="grid grid-cols-3 gap-2">
          {(['none', 'small', 'large'] as const).map((value) => <button key={value} type="button" aria-pressed={margin === value} onClick={() => setMargin(value)} className={choiceClass(margin === value)}>
            <span aria-hidden="true" className="relative h-7 w-5 rounded-[3px] border-2 border-current"><span className="absolute rounded-[1px] bg-current opacity-60" style={{ inset: MARGIN_ICON_INSET[value] }} /></span>
            {t.margins[value]}
            {value !== 'none' && <span className="text-xs font-normal text-slate-400">{MARGINS_MM[value]} mm</span>}
          </button>)}
        </div></fieldset>
        {pageSize !== 'image' && <label className="block text-sm text-slate-300">{t.placement}<select value={fit} onChange={(e) => setFit(e.target.value as typeof fit)} className="mt-1 w-full rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-3 py-2.5 text-white"><option value="contain">{t.contain}</option><option value="cover">{t.cover}</option></select></label>}
        <p className="flex items-center gap-2 rounded-xl border border-[#9ccbff]/20 bg-[#071526] p-3 text-xs text-slate-300"><FileImage className="h-4 w-4 shrink-0 text-blue-300" />{t.order}</p>
        <button type="button" disabled={!images.length || busy} onClick={convert} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4a74d6] to-[#7a5cf7] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}{busy ? t.creating : t.convert}</button>
        {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}
        {result?.key === requestKey && <a href={result.url} download={downloadName(images[0]?.file.name ?? 'images', 'pdf', '', 'images')} className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 font-bold text-emerald-200"><Download className="h-5 w-5" /> {t.download}</a>}
        <p className="text-center text-xs text-slate-400">{t.quota}</p>
      </div>
    </div>
  </div>;
}
