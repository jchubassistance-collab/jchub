'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Download, FileImage, FileText, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';

const copy = bilingual({
  onlyJpgPng: 'Seuls les fichiers JPG, JPEG et PNG sont acceptés.',
  tooLarge: (name: string) => `${name} dépasse la limite de 15 Mo.`,
  maxFiles: (max: number) => `Tu peux ajouter jusqu'à ${max} images.`,
  failed: 'La création du PDF a échoué. Vérifie les images puis réessaie.',
  add: 'Ajouter des images',
  limits: (max: number) => `JPG, JPEG ou PNG · 15 Mo maximum par image · 50 Mo au total · jusqu'à ${max} images`,
  megabytes: 'Mo',
  remove: (name: string) => `Retirer ${name}`,
  pageSize: 'Taille des pages',
  fitPage: 'Taille adaptée à chaque image',
  orientation: 'Orientation',
  portrait: 'Portrait',
  landscape: 'Paysage',
  placement: 'Placement de l’image',
  contain: 'Tout afficher (sans recadrage)',
  cover: 'Remplir la page (peut recadrer)',
  order: 'L’ordre des images dans la liste détermine celui des pages. Chaque image occupe une page.',
  creating: 'Création du PDF…',
  convert: 'Convertir en PDF',
  download: 'Télécharger le PDF',
  quota: '5 conversions par jour et par adresse IP. Les images sont traitées sur le serveur depuis un stockage privé temporaire, puis supprimées.',
}, {
  onlyJpgPng: 'Only JPG, JPEG and PNG files are accepted.',
  tooLarge: (name: string) => `${name} exceeds the 15 MB limit.`,
  maxFiles: (max: number) => `You can add up to ${max} images.`,
  failed: 'Creating the PDF failed. Check the images and try again.',
  add: 'Add images',
  limits: (max: number) => `JPG, JPEG or PNG · 15 MB maximum per image · 50 MB in total · up to ${max} images`,
  megabytes: 'MB',
  remove: (name: string) => `Remove ${name}`,
  pageSize: 'Page size',
  fitPage: 'Size matched to each image',
  orientation: 'Orientation',
  portrait: 'Portrait',
  landscape: 'Landscape',
  placement: 'Image placement',
  contain: 'Show everything (no cropping)',
  cover: 'Fill the page (may crop)',
  order: 'The order of the images in the list sets the order of the pages. Each image fills one page.',
  creating: 'Creating the PDF…',
  convert: 'Convert to PDF',
  download: 'Download the PDF',
  quota: '5 conversions per day per IP address. The images are processed on the server from temporary private storage, then deleted.',
});
import { cleanUpConversionFiles, postConversion, uploadConversionFile } from '@/lib/conversion-upload-client';

type ImageItem = { file: File; url: string };
const MAX_FILES = 20;
const MAX_FILE_SIZE = 15 * 1024 * 1024;

export function ImagesToPdf() {
  const t = copy[useLocale()];
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'image'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [fit, setFit] = useState<'contain' | 'cover'>('contain');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    setError(''); setDownloadUrl('');
    const accepted: ImageItem[] = [];
    for (const file of Array.from(event.target.files ?? [])) {
      if (!/^image\/(jpeg|png)$/.test(file.type)) { setError(t.onlyJpgPng); continue; }
      if (file.size > MAX_FILE_SIZE) { setError(t.tooLarge(file.name)); continue; }
      if (images.length + accepted.length >= MAX_FILES) { setError(t.maxFiles(MAX_FILES)); break; }
      accepted.push({ file, url: URL.createObjectURL(file) });
    }
    setImages((current) => [...current, ...accepted]);
    event.target.value = '';
  };

  const remove = (index: number) => {
    setImages((current) => { const item = current[index]; URL.revokeObjectURL(item.url); return current.filter((_, i) => i !== index); });
    setDownloadUrl('');
  };

  const convert = async () => {
    if (!images.length) return;
    setBusy(true); setError(''); setDownloadUrl('');
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
      });
      setDownloadUrl(URL.createObjectURL(await response.blob()));
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

    {images.length > 0 && <ol className="max-h-64 space-y-2 overflow-auto rounded-2xl border border-[#9ccbff]/20 bg-[#071526] p-3">
      {images.map(({ file, url }, index) => <li key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-xl bg-[#0c1d31] p-2">
        <img src={url} alt="" className="h-12 w-12 rounded-lg object-cover" />
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-white">{index + 1}. {file.name}</span><span className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} {t.megabytes}</span></span>
        <button type="button" onClick={() => remove(index)} aria-label={t.remove(file.name)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
      </li>)}
    </ol>}

    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm text-slate-300">{t.pageSize}<select value={pageSize} onChange={(e) => setPageSize(e.target.value as typeof pageSize)} className="mt-1 w-full rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-3 py-2.5 text-white"><option value="a4">A4</option><option value="letter">Letter</option><option value="image">{t.fitPage}</option></select></label>
      <label className="text-sm text-slate-300">{t.orientation}<select value={orientation} onChange={(e) => setOrientation(e.target.value as typeof orientation)} className="mt-1 w-full rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-3 py-2.5 text-white"><option value="portrait">{t.portrait}</option><option value="landscape">{t.landscape}</option></select></label>
    </div>
    {pageSize !== 'image' && <label className="block text-sm text-slate-300">{t.placement}<select value={fit} onChange={(e) => setFit(e.target.value as typeof fit)} className="mt-1 w-full rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-3 py-2.5 text-white"><option value="contain">{t.contain}</option><option value="cover">{t.cover}</option></select></label>}
    <p className="flex items-center gap-2 rounded-xl border border-[#9ccbff]/20 bg-[#071526] p-3 text-xs text-slate-300"><FileImage className="h-4 w-4 shrink-0 text-blue-300" />{t.order}</p>
    <button type="button" disabled={!images.length || busy} onClick={convert} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4a74d6] to-[#7a5cf7] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}{busy ? t.creating : t.convert}</button>
    {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}
    {downloadUrl && <a href={downloadUrl} download="images.pdf" className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 font-bold text-emerald-200"><Download className="h-5 w-5" /> {t.download}</a>}
    <p className="text-center text-xs text-slate-400">{t.quota}</p>
  </div>;
}
