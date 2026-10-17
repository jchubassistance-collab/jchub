'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Download, FileImage, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { cleanUpConversionFiles, postConversion, uploadConversionFile } from '@/lib/conversion-upload-client';

type OutputFormat = 'webp' | 'png';
type ImageTask = { id: string; file: File; result?: Blob; keptOriginal?: boolean; error?: string };

const MAX_FILES = 20;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function ImageOptimizer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ImageTask[]>([]);
  const [format, setFormat] = useState<OutputFormat>('webp');
  const [quality, setQuality] = useState(80);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    setError('');
    const accepted: ImageTask[] = [];
    const rejected: string[] = [];
    for (const file of Array.from(event.target.files ?? [])) {
      if (!SUPPORTED_TYPES.has(file.type)) {
        rejected.push(`${file.name} : format non pris en charge.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name} : dépasse la limite de 15 Mo.`);
        continue;
      }
      if (images.length + accepted.length >= MAX_FILES) {
        rejected.push(`Tu peux ajouter jusqu'à ${MAX_FILES} images.`);
        break;
      }
      accepted.push({ id: crypto.randomUUID(), file });
    }
    setImages((current) => [...current, ...accepted]);
    if (rejected.length) setError(rejected.join(' '));
    event.target.value = '';
  };

  const updateOptions = (nextFormat: OutputFormat, nextQuality: number) => {
    setFormat(nextFormat);
    setQuality(nextQuality);
    setImages((current) => current.map(({ id, file }) => ({ id, file })));
  };

  const convert = async () => {
    if (!images.length) return;
    setBusy(true);
    setError('');
    setProgress(0);
    setImages((current) => current.map(({ id, file }) => ({ id, file })));

    for (let index = 0; index < images.length; index++) {
      const image = images[index];
      try {
        const { blob, keptOriginal } = await convertImage(image.file, format, quality / 100);
        setImages((current) => current.map((item) => item.id === image.id ? { ...item, result: blob, keptOriginal } : item));
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Conversion impossible.';
        setImages((current) => current.map((item) => item.id === image.id ? { ...item, error: message } : item));
        if (message.startsWith('Limite atteinte :')) {
          setError(message);
          break;
        }
      } finally {
        setProgress(index + 1);
      }
    }

    setBusy(false);
  };

  const removeImage = (id: string) => {
    setImages((current) => current.filter((image) => image.id !== id));
  };

  const successful = images.filter((image) => image.result);
  const totalOriginal = successful.reduce((sum, image) => sum + image.file.size, 0);
  const totalResult = successful.reduce((sum, image) => sum + (image.result?.size ?? 0), 0);
  const savedPercent = totalOriginal ? Math.round((1 - totalResult / totalOriginal) * 100) : 0;

  return <div className="space-y-5 text-slate-100">
    <div className="rounded-2xl border border-dashed border-[#9ccbff]/40 bg-[#071526] p-6 text-center">
      <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="hidden" onChange={addFiles} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy || images.length >= MAX_FILES} className="mx-auto flex items-center gap-2 rounded-xl border border-[#9ccbff]/30 bg-[#0c1d31] px-4 py-3 font-semibold text-[#dfeeff] hover:border-[#9ccbff]/50 disabled:opacity-50"><UploadCloud className="h-5 w-5" /> Ajouter des images</button>
      <p className="mt-3 text-xs text-slate-400">JPG, PNG ou WebP · 15 Mo maximum par image · jusqu&apos;à {MAX_FILES} images</p>
    </div>

    {images.length > 0 && <ol className="max-h-72 space-y-2 overflow-auto rounded-2xl border border-[#9ccbff]/20 bg-[#071526] p-3">
      {images.map(({ id, file, result, keptOriginal, error: imageError }) => <li key={id} className="flex flex-wrap items-center gap-3 rounded-xl bg-[#0c1d31] p-3">
        <FileImage className="h-5 w-5 shrink-0 text-blue-300" />
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-white">{file.name}</span><span className="text-xs text-slate-400">{formatBytes(file.size)}{result ? ` → ${formatBytes(result.size)} (${result.size <= file.size ? `${Math.round((1 - result.size / file.size) * 100)} % économisés` : `${Math.round((result.size / file.size - 1) * 100)} % de plus`})` : ''}</span>{keptOriginal && <span className="mt-1 block text-xs text-amber-200">Le WebP aurait été plus lourd ; le fichier original est conservé sans perte.</span>}{imageError && <span role="alert" className="mt-1 block text-xs text-rose-300">{imageError}</span>}</span>
        {result && <button type="button" onClick={() => downloadImage(file, result)} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/10"><Download className="h-4 w-4" /> Télécharger</button>}
        <button type="button" onClick={() => removeImage(id)} disabled={busy} aria-label={`Retirer ${file.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
      </li>)}
    </ol>}

    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm text-slate-300">Format de sortie<select value={format} disabled={busy} onChange={(event) => updateOptions(event.target.value as OutputFormat, quality)} className="mt-1 w-full rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-3 py-2.5 text-white"><option value="webp">WebP (léger)</option><option value="png">PNG (sans perte)</option></select></label>
      <label className={`text-sm ${format === 'png' ? 'text-slate-500' : 'text-slate-300'}`}>Qualité WebP : {quality} %<input type="range" min="10" max="100" step="5" value={quality} disabled={busy || format === 'png'} onChange={(event) => updateOptions(format, Number(event.target.value))} className="mt-3 block w-full accent-blue-400 disabled:opacity-40" /><span className="mt-1 block text-xs text-slate-400">{format === 'png' ? 'Le PNG conserve la qualité d’origine.' : 'La qualité baisse automatiquement si nécessaire pour éviter un fichier plus lourd. Si aucun gain n’est possible, le fichier original est conservé.'}</span></label>
    </div>

    {successful.length > 0 && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">Gain total : {formatBytes(totalOriginal - totalResult)}{savedPercent >= 0 ? ` (${savedPercent} % plus léger)` : ` (${Math.abs(savedPercent)} % plus volumineux)`} sur {successful.length} image{successful.length > 1 ? 's' : ''} convertie{successful.length > 1 ? 's' : ''}.</p>}

    <button type="button" disabled={!images.length || busy} onClick={() => void convert()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4a74d6] to-[#7a5cf7] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileImage className="h-5 w-5" />}{busy ? `Conversion… ${progress}/${images.length}` : 'Convertir et optimiser'}</button>
    {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}
    <p className="text-center text-xs text-slate-400">5 images converties par jour et par adresse IP. Chaque fichier est traité sur le serveur depuis un stockage privé temporaire, puis supprimé.</p>
  </div>;
}

async function convertImage(file: File, format: OutputFormat, quality: number): Promise<{ blob: Blob; keptOriginal: boolean }> {
  const url = await uploadConversionFile('image-optimizer', file);
  try {
    const response = await postConversion('/api/tools/image-optimizer', { url, format, quality: Math.round(quality * 100) });
    return {
      blob: await response.blob(),
      keptOriginal: response.headers.get('X-Image-Original-Kept') === 'true',
    };
  } finally {
    await cleanUpConversionFiles('image-optimizer', [url]);
  }
}

function downloadImage(file: File, blob: Blob) {
  const extension = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
  const filename = getDownloadFilename(file.name, extension);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getDownloadFilename(originalName: string, extension: string): string {
  const originalBaseName = originalName.replace(/\.[^.]+$/, '');
  const safeBaseName = (originalBaseName || 'image')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/[. ]+$/g, '') || 'image';
  const prefix = 'jchub.dev_';
  const suffix = `.${extension}`;
  const maxFilenameLength = 120;
  const maxBaseNameLength = maxFilenameLength - prefix.length - suffix.length;
  const truncatedBaseName = Array.from(safeBaseName).length > maxBaseNameLength
    ? `${Array.from(safeBaseName).slice(0, maxBaseNameLength - 3).join('')}---`
    : safeBaseName;

  return `${prefix}${truncatedBaseName}${suffix}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  const units = ['Ko', 'Mo', 'Go'];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  return `${size.toFixed(1)} ${units[unit]}`;
}
