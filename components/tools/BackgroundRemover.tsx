'use client';

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Download, ImagePlus, Loader2, RefreshCw, UploadCloud } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import { downloadName } from '@/lib/download-name';
import { MODEL_SIZE, outputSize, type WorkerRequest, type WorkerResponse } from '@/lib/background-removal';

const copy = bilingual({
  choose: 'Choisir une image',
  dropHint: 'ou glisse-la ici, ou colle-la avec Ctrl + V',
  limits: 'JPG, PNG ou WebP · 20 Mo maximum. Ton image reste sur ton appareil.',
  firstUse: (megabytes: number) => `Au premier détourage, ton navigateur télécharge le modèle d’IA (${megabytes} Mo), puis le garde en cache pour les fois suivantes.`,
  notImage: 'Choisis une image JPG, PNG ou WebP.',
  tooLarge: 'Cette image dépasse 20 Mo.',
  unreadable: 'Impossible de lire cette image. Essaie un autre fichier.',
  failed: 'Le détourage a échoué. Vérifie ta connexion puis réessaie.',
  downloading: (percent: number, loaded: number, total: number) => `Téléchargement du modèle d’IA… ${percent} % (${loaded} / ${total} Mo)`,
  processing: 'Détourage en cours…',
  cpuNotice: 'Ton navigateur n’a pas WebGPU : ton processeur fait le calcul, compte une à deux minutes.',
  view: 'Affichage',
  before: 'Avant',
  after: 'Après',
  background: 'Fond',
  transparent: 'Transparent',
  white: 'Blanc',
  color: 'Couleur',
  pickColor: 'Choisir la couleur du fond',
  size: (width: number, height: number) => `${width} × ${height} px`,
  download: 'Télécharger en PNG',
  another: 'Autre image',
  suffix: 'sans-fond',
  privacy: 'Tout se passe dans ton navigateur : ton image n’est envoyée à aucun serveur.',
}, {
  choose: 'Choose an image',
  dropHint: 'or drop it here, or paste it with Ctrl + V',
  limits: 'JPG, PNG or WebP · 20 MB maximum. Your image stays on your device.',
  firstUse: (megabytes: number) => `On the first removal, your browser downloads the AI model (${megabytes} MB), then keeps it cached for next time.`,
  notImage: 'Choose a JPG, PNG or WebP image.',
  tooLarge: 'This image is larger than 20 MB.',
  unreadable: 'Could not read this image. Try another file.',
  failed: 'Removing the background failed. Check your connection and try again.',
  downloading: (percent: number, loaded: number, total: number) => `Downloading the AI model… ${percent}% (${loaded} / ${total} MB)`,
  processing: 'Removing the background…',
  cpuNotice: 'Your browser has no WebGPU: your processor does the work, allow one to two minutes.',
  view: 'View',
  before: 'Before',
  after: 'After',
  background: 'Background',
  transparent: 'Transparent',
  white: 'White',
  color: 'Color',
  pickColor: 'Choose the background color',
  size: (width: number, height: number) => `${width} × ${height} px`,
  download: 'Download as PNG',
  another: 'Another image',
  suffix: 'no-background',
  privacy: 'Everything happens in your browser: your image is not sent to any server.',
});

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MODEL_MEGABYTES = 98;
const CHECKERBOARD = { backgroundImage: 'conic-gradient(#e2e8f0 25%, #fff 0 50%, #e2e8f0 0 75%, #fff 0)', backgroundSize: '20px 20px' };

type Background = 'transparent' | 'white' | 'color';
type Pending = { resolve: (mask: Uint8ClampedArray) => void; reject: (error: Error) => void };

const megabytes = (bytes: number) => Math.round(bytes / 1_000_000);
const canvasOf = (width: number, height: number) => Object.assign(document.createElement('canvas'), { width, height });
const toBlob = (canvas: HTMLCanvasElement) => new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('png'))), 'image/png'));

export function BackgroundRemover() {
  const t = copy[useLocale()];
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef(new Map<number, Pending>());
  const nextId = useRef(0);
  const cutoutRef = useRef<HTMLCanvasElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [cutoutUrl, setCutoutUrl] = useState('');
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [device, setDevice] = useState<'webgpu' | 'wasm' | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [view, setView] = useState<'before' | 'after'>('after');
  const [background, setBackground] = useState<Background>('transparent');
  const [color, setColor] = useState('#2563eb');

  useEffect(() => () => {
    workerRef.current?.terminate();
  }, []);
  useEffect(() => () => { if (sourceUrl) URL.revokeObjectURL(sourceUrl); }, [sourceUrl]);
  useEffect(() => () => { if (cutoutUrl) URL.revokeObjectURL(cutoutUrl); }, [cutoutUrl]);

  const worker = () => {
    if (workerRef.current) return workerRef.current;
    const created = new Worker(new URL('./background-removal.worker.ts', import.meta.url), { type: 'module' });
    created.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      if (data.type === 'download') setProgress({ loaded: data.loaded, total: data.total });
      else if (data.type === 'device') setDevice(data.device);
      else {
        const request = pending.current.get(data.id);
        pending.current.delete(data.id);
        if (data.type === 'mask') request?.resolve(data.mask);
        else request?.reject(new Error(data.message));
      }
    };
    created.onerror = () => {
      pending.current.forEach((request) => request.reject(new Error('worker')));
      pending.current.clear();
      created.terminate();
      workerRef.current = null;
    };
    workerRef.current = created;
    return created;
  };

  const requestMask = (pixels: Uint8ClampedArray) => new Promise<Uint8ClampedArray>((resolve, reject) => {
    const id = nextId.current++;
    pending.current.set(id, { resolve, reject });
    worker().postMessage({ type: 'remove', id, pixels } satisfies WorkerRequest, [pixels.buffer]);
  });

  const removeBackground = async (chosen: File) => {
    setError('');
    if (!/^image\/(jpeg|png|webp)$/.test(chosen.type)) { setError(t.notImage); return; }
    if (chosen.size > MAX_FILE_SIZE) { setError(t.tooLarge); return; }

    let bitmap: ImageBitmap;
    try {
      bitmap = await createImageBitmap(chosen, { imageOrientation: 'from-image' });
    } catch {
      setError(t.unreadable);
      return;
    }
    setFile(chosen);
    setSourceUrl(URL.createObjectURL(chosen));
    setCutoutUrl('');
    setView('after');
    setBusy(true);
    try {
      const { width, height } = outputSize(bitmap.width, bitmap.height);
      const source = canvasOf(width, height);
      const sourceContext = source.getContext('2d')!;
      sourceContext.imageSmoothingQuality = 'high';
      sourceContext.drawImage(bitmap, 0, 0, width, height);

      const small = canvasOf(MODEL_SIZE, MODEL_SIZE);
      const smallContext = small.getContext('2d', { willReadFrequently: true })!;
      smallContext.imageSmoothingQuality = 'high';
      smallContext.drawImage(bitmap, 0, 0, MODEL_SIZE, MODEL_SIZE);
      const mask = await requestMask(smallContext.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE).data);

      // The mask becomes the alpha channel of a small canvas, stretched over the photo.
      const maskCanvas = canvasOf(MODEL_SIZE, MODEL_SIZE);
      const maskContext = maskCanvas.getContext('2d')!;
      const maskImage = maskContext.createImageData(MODEL_SIZE, MODEL_SIZE);
      for (let index = 0; index < mask.length; index += 1) maskImage.data[index * 4 + 3] = mask[index];
      maskContext.putImageData(maskImage, 0, 0);
      const cutout = canvasOf(width, height);
      const cutoutContext = cutout.getContext('2d')!;
      cutoutContext.imageSmoothingQuality = 'high';
      cutoutContext.drawImage(maskCanvas, 0, 0, width, height);
      cutoutContext.globalCompositeOperation = 'source-in';
      cutoutContext.drawImage(source, 0, 0);

      cutoutRef.current = cutout;
      setSize({ width, height });
      setCutoutUrl(URL.createObjectURL(await toBlob(cutout)));
    } catch {
      setError(t.failed);
      setFile(null);
    } finally {
      bitmap.close();
      setBusy(false);
      setProgress(null);
    }
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0];
    event.target.value = '';
    if (chosen) void removeBackground(chosen);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const chosen = event.dataTransfer.files?.[0];
    if (chosen && !busy) void removeBackground(chosen);
  };

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const pasted = Array.from(event.clipboardData?.files ?? []).find((item) => item.type.startsWith('image/'));
      if (pasted && !busy) void removeBackground(pasted);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  const download = async () => {
    const cutout = cutoutRef.current;
    if (!cutout || !file) return;
    let blob: Blob;
    if (background === 'transparent') {
      blob = await toBlob(cutout);
    } else {
      const filled = canvasOf(cutout.width, cutout.height);
      const context = filled.getContext('2d')!;
      context.fillStyle = background === 'white' ? '#ffffff' : color;
      context.fillRect(0, 0, filled.width, filled.height);
      context.drawImage(cutout, 0, 0);
      blob = await toBlob(filled);
    }
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement('a'), { href: url, download: downloadName(file.name, 'png', t.suffix, 'image') });
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const chipClass = (active: boolean) => `inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-2 text-sm font-semibold transition ${active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'}`;
  const previewBackground = view === 'before' || background === 'transparent' ? CHECKERBOARD : { backgroundColor: background === 'white' ? '#ffffff' : color };
  const percent = progress ? Math.min(100, Math.round((progress.loaded / progress.total) * 100)) : 0;

  return <div className="space-y-5 text-slate-700">
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onInput} />

    {!file && <div
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`rounded-xl border-2 border-dashed p-6 text-center transition sm:py-10 ${dragging ? 'border-slate-500 bg-slate-50' : 'border-slate-300 bg-white'}`}
    >
      <button type="button" onClick={() => inputRef.current?.click()} className="btn-upload mx-auto flex items-center gap-3 rounded-xl px-5 py-3.5 text-lg"><UploadCloud className="h-5 w-5" aria-hidden="true" /> {t.choose}</button>
      <p className="mt-3 text-sm text-slate-500">{t.dropHint}</p>
      <p className="mt-1 text-xs text-slate-500">{t.limits}</p>
    </div>}

    {file && <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-3">
        <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 p-3" style={previewBackground}>
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
          {(view === 'before' ? sourceUrl : cutoutUrl || sourceUrl) && <img src={view === 'before' ? sourceUrl : cutoutUrl || sourceUrl} alt="" className={`max-h-[460px] w-auto max-w-full object-contain ${busy ? 'opacity-40' : ''}`} />}
          {busy && <div role="status" className="absolute inset-x-4 bottom-4 rounded-xl border border-slate-200 bg-white/95 p-3 text-sm shadow-sm">
            <p className="flex items-center gap-2 font-semibold text-slate-900"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{progress && percent < 100 ? t.downloading(percent, megabytes(progress.loaded), megabytes(progress.total)) : t.processing}</p>
            {progress && percent < 100 && <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: `${percent}%` }} /></div>}
            {device === 'wasm' && <p className="mt-1 text-xs text-slate-500">{t.cpuNotice}</p>}
          </div>}
        </div>
        {cutoutUrl && <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex gap-1" role="group" aria-label={t.view}>
            <button type="button" aria-pressed={view === 'before'} onClick={() => setView('before')} className={chipClass(view === 'before')}>{t.before}</button>
            <button type="button" aria-pressed={view === 'after'} onClick={() => setView('after')} className={chipClass(view === 'after')}>{t.after}</button>
          </div>
          <span className="text-xs text-slate-500">{t.size(size.width, size.height)}</span>
        </div>}
      </div>

      <div className="space-y-4">
        <fieldset disabled={!cutoutUrl}>
          <legend className="mb-2 text-sm font-semibold text-slate-700">{t.background}</legend>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" aria-pressed={background === 'transparent'} onClick={() => setBackground('transparent')} className={chipClass(background === 'transparent')}>{t.transparent}</button>
            <button type="button" aria-pressed={background === 'white'} onClick={() => setBackground('white')} className={chipClass(background === 'white')}>{t.white}</button>
            <label className={`${chipClass(background === 'color')} relative cursor-pointer`}>
              <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded border border-slate-300" style={{ backgroundColor: color }} />
              {t.color}
              <input type="color" value={color} aria-label={t.pickColor} onChange={(event) => { setColor(event.target.value); setBackground('color'); }} onClick={() => setBackground('color')} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
            </label>
          </div>
        </fieldset>
        <button type="button" disabled={!cutoutUrl || busy} onClick={download} className="btn-download flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3"><Download className="h-5 w-5" aria-hidden="true" />{t.download}</button>
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-900 transition hover:border-slate-400 disabled:opacity-50">{cutoutUrl ? <RefreshCw className="h-4 w-4" aria-hidden="true" /> : <ImagePlus className="h-4 w-4" aria-hidden="true" />}{t.another}</button>
      </div>
    </div>}

    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
    <p className="text-xs text-slate-500">{t.firstUse(MODEL_MEGABYTES)} {t.privacy}</p>
  </div>;
}
