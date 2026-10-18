'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Download, FileImage, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { useLocale } from 'next-intl';
import { cleanUpConversionFiles, ConversionError, postConversion, uploadConversionFile } from '@/lib/conversion-upload-client';
import { bilingual } from '@/i18n/copy';
import type { Locale } from '@/i18n/routing';

const copy = bilingual({
  unsupported: (name: string) => `${name} : format non pris en charge.`,
  tooLarge: (name: string) => `${name} : dépasse la limite de 15 Mo.`,
  maxFiles: (max: number) => `Tu peux ajouter jusqu'à ${max} images.`,
  failed: 'Conversion impossible.',
  add: 'Ajouter des images',
  limits: (max: number) => `JPG, PNG ou WebP · 15 Mo maximum par image · jusqu'à ${max} images`,
  saved: (percent: number) => `${percent} % économisés`,
  heavier: (percent: number) => `${percent} % de plus`,
  keptOriginal: 'Le WebP aurait été plus lourd ; le fichier original est conservé sans perte.',
  download: 'Télécharger',
  remove: (name: string) => `Retirer ${name}`,
  outputFormat: 'Format de sortie',
  webp: 'WebP (léger)',
  png: 'PNG (sans perte)',
  quality: (value: number) => `Qualité WebP : ${value} %`,
  pngNote: 'Le PNG conserve la qualité d’origine.',
  webpNote: 'La qualité baisse automatiquement si nécessaire pour éviter un fichier plus lourd. Si aucun gain n’est possible, le fichier original est conservé.',
  total: (saved: string, percent: number, count: number) => `Gain total : ${saved}${percent >= 0 ? ` (${percent} % plus léger)` : ` (${Math.abs(percent)} % plus volumineux)`} sur ${count} image${count > 1 ? 's' : ''} convertie${count > 1 ? 's' : ''}.`,
  converting: (done: number, total: number) => `Conversion… ${done}/${total}`,
  convert: 'Convertir et optimiser',
  quota: '5 images converties par jour et par adresse IP. Chaque fichier est traité sur le serveur depuis un stockage privé temporaire, puis supprimé.',
}, {
  unsupported: (name: string) => `${name}: unsupported format.`,
  tooLarge: (name: string) => `${name}: exceeds the 15 MB limit.`,
  maxFiles: (max: number) => `You can add up to ${max} images.`,
  failed: 'Conversion failed.',
  add: 'Add images',
  limits: (max: number) => `JPG, PNG or WebP · 15 MB maximum per image · up to ${max} images`,
  saved: (percent: number) => `${percent}% saved`,
  heavier: (percent: number) => `${percent}% larger`,
  keptOriginal: 'The WebP would have been larger; the original file is kept with no loss.',
  download: 'Download',
  remove: (name: string) => `Remove ${name}`,
  outputFormat: 'Output format',
  webp: 'WebP (light)',
  png: 'PNG (lossless)',
  quality: (value: number) => `WebP quality: ${value}%`,
  pngNote: 'PNG keeps the original quality.',
  webpNote: 'Quality drops automatically if needed to avoid a larger file. If no saving is possible, the original file is kept.',
  total: (saved: string, percent: number, count: number) => `Total saving: ${saved}${percent >= 0 ? ` (${percent}% lighter)` : ` (${Math.abs(percent)}% larger)`} across ${count} converted image${count > 1 ? 's' : ''}.`,
  converting: (done: number, total: number) => `Converting… ${done}/${total}`,
  convert: 'Convert and optimize',
  quota: '5 images converted per day per IP address. Each file is processed on the server from temporary private storage, then deleted.',
});

type OutputFormat = 'webp' | 'png';
type ImageTask = { id: string; file: File; result?: Blob; keptOriginal?: boolean; error?: string };

const MAX_FILES = 20;
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function ImageOptimizer() {
  const locale = useLocale();
  const t = copy[locale];
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
        rejected.push(t.unsupported(file.name));
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(t.tooLarge(file.name));
        continue;
      }
      if (images.length + accepted.length >= MAX_FILES) {
        rejected.push(t.maxFiles(MAX_FILES));
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
        const message = cause instanceof Error ? cause.message : t.failed;
        setImages((current) => current.map((item) => item.id === image.id ? { ...item, error: message } : item));
        // The daily quota is reached: the next images would fail the same way.
        if (cause instanceof ConversionError && cause.status === 429) {
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
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy || images.length >= MAX_FILES} className="mx-auto flex items-center gap-2 rounded-xl border border-[#9ccbff]/30 bg-[#0c1d31] px-4 py-3 font-semibold text-[#dfeeff] hover:border-[#9ccbff]/50 disabled:opacity-50"><UploadCloud className="h-5 w-5" /> {t.add}</button>
      <p className="mt-3 text-xs text-slate-400">{t.limits(MAX_FILES)}</p>
    </div>

    {images.length > 0 && <ol className="max-h-72 space-y-2 overflow-auto rounded-2xl border border-[#9ccbff]/20 bg-[#071526] p-3">
      {images.map(({ id, file, result, keptOriginal, error: imageError }) => <li key={id} className="flex flex-wrap items-center gap-3 rounded-xl bg-[#0c1d31] p-3">
        <FileImage className="h-5 w-5 shrink-0 text-blue-300" />
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-white">{file.name}</span><span className="text-xs text-slate-400">{formatBytes(file.size, locale)}{result ? ` → ${formatBytes(result.size, locale)} (${result.size <= file.size ? t.saved(Math.round((1 - result.size / file.size) * 100)) : t.heavier(Math.round((result.size / file.size - 1) * 100))})` : ''}</span>{keptOriginal && <span className="mt-1 block text-xs text-amber-200">{t.keptOriginal}</span>}{imageError && <span role="alert" className="mt-1 block text-xs text-rose-300">{imageError}</span>}</span>
        {result && <button type="button" onClick={() => downloadImage(file, result)} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/10"><Download className="h-4 w-4" /> {t.download}</button>}
        <button type="button" onClick={() => removeImage(id)} disabled={busy} aria-label={t.remove(file.name)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
      </li>)}
    </ol>}

    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm text-slate-300">{t.outputFormat}<select value={format} disabled={busy} onChange={(event) => updateOptions(event.target.value as OutputFormat, quality)} className="mt-1 w-full rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-3 py-2.5 text-white"><option value="webp">{t.webp}</option><option value="png">{t.png}</option></select></label>
      <label className={`text-sm ${format === 'png' ? 'text-slate-500' : 'text-slate-300'}`}>{t.quality(quality)}<input type="range" min="10" max="100" step="5" value={quality} disabled={busy || format === 'png'} onChange={(event) => updateOptions(format, Number(event.target.value))} className="mt-3 block w-full accent-blue-400 disabled:opacity-40" /><span className="mt-1 block text-xs text-slate-400">{format === 'png' ? t.pngNote : t.webpNote}</span></label>
    </div>

    {successful.length > 0 && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">{t.total(formatBytes(totalOriginal - totalResult, locale), savedPercent, successful.length)}</p>}

    <button type="button" disabled={!images.length || busy} onClick={() => void convert()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4a74d6] to-[#7a5cf7] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileImage className="h-5 w-5" />}{busy ? t.converting(progress, images.length) : t.convert}</button>
    {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}
    <p className="text-center text-xs text-slate-400">{t.quota}</p>
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

function formatBytes(bytes: number, locale: Locale): string {
  if (bytes < 1024) return `${bytes} ${locale === 'en' ? 'B' : 'o'}`;
  const units = locale === 'en' ? ['KB', 'MB', 'GB'] : ['Ko', 'Mo', 'Go'];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  return `${size.toFixed(1)} ${units[unit]}`;
}
