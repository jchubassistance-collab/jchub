'use client';

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Check, Copy, Download, Loader2, RefreshCw, ScanText, UploadCloud } from 'lucide-react';
import { useLocale } from 'next-intl';
import { bilingual } from '@/i18n/copy';
import { LOCALE_HEADER } from '@/i18n/request-locale';
import { downloadName } from '@/lib/download-name';

const copy = bilingual({
  choose: 'Choisir une image',
  dropHint: 'ou glisse-la ici, ou colle-la avec Ctrl + V',
  limits: 'JPG, PNG ou WebP · 20 Mo maximum · photo, capture d’écran ou scan',
  notImage: 'Choisis une image JPG, PNG ou WebP.',
  tooLarge: 'Cette image dépasse 20 Mo.',
  unreadable: 'Impossible de lire cette image. Essaie un autre fichier.',
  failed: 'L’analyse a échoué. Réessaie dans un instant.',
  reading: 'Lecture du texte…',
  empty: 'Aucun texte n’a été trouvé dans cette image. Essaie une photo plus nette ou mieux éclairée.',
  result: 'Texte extrait',
  editable: 'Tu peux corriger le texte avant de le copier.',
  counts: (words: number, characters: number) => `${words} mot${words > 1 ? 's' : ''} · ${characters} caractère${characters > 1 ? 's' : ''}`,
  copy: 'Copier',
  copied: 'Copié',
  download: 'Télécharger (.txt)',
  another: 'Autre image',
  tips: 'Pour un meilleur résultat : texte net, bien éclairé et photographié bien droit.',
  quota: '5 analyses par jour et par adresse IP. L’image est envoyée en HTTPS à notre serveur puis à notre prestataire OCR, qui la supprime après l’analyse.',
}, {
  choose: 'Choose an image',
  dropHint: 'or drop it here, or paste it with Ctrl + V',
  limits: 'JPG, PNG or WebP · 20 MB maximum · photo, screenshot or scan',
  notImage: 'Choose a JPG, PNG or WebP image.',
  tooLarge: 'This image is larger than 20 MB.',
  unreadable: 'Could not read this image. Try another file.',
  failed: 'The analysis failed. Try again in a moment.',
  reading: 'Reading the text…',
  empty: 'No text was found in this image. Try a sharper or better-lit photo.',
  result: 'Extracted text',
  editable: 'You can correct the text before copying it.',
  counts: (words: number, characters: number) => `${words} word${words > 1 ? 's' : ''} · ${characters} character${characters > 1 ? 's' : ''}`,
  copy: 'Copy',
  copied: 'Copied',
  download: 'Download (.txt)',
  another: 'Another image',
  tips: 'For the best result: sharp, well-lit text, photographed straight on.',
  quota: '5 analyses per day per IP address. The image is sent over HTTPS to our server, then to our OCR provider, which deletes it after the analysis.',
});

const MAX_FILE_SIZE = 20 * 1024 * 1024;
/** The OCR service refuses files over 1 MB: images are resized and recompressed to fit. */
const MAX_UPLOAD_BYTES = 950_000;
const MAX_SIDE = 2600;

const canvasOf = (width: number, height: number) => Object.assign(document.createElement('canvas'), { width, height });
const toJpeg = (canvas: HTMLCanvasElement, quality: number) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

/** The image upright, as a JPEG small enough for the OCR service, keeping as much detail as it can. */
async function prepareImage(bitmap: ImageBitmap): Promise<Blob> {
  let scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const canvas = canvasOf(Math.max(1, Math.round(bitmap.width * scale)), Math.max(1, Math.round(bitmap.height * scale)));
    const context = canvas.getContext('2d')!;
    // Transparent areas of a PNG become white, not black, in the JPEG.
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.9, 0.8, 0.7]) {
      const blob = await toJpeg(canvas, quality);
      if (blob && blob.size <= MAX_UPLOAD_BYTES) return blob;
    }
    scale *= 0.8;
  }
  throw new Error('image');
}

export function OcrTool() {
  const locale = useLocale();
  const t = copy[locale];
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const recognize = async (chosen: File) => {
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
    setPreviewUrl(URL.createObjectURL(chosen));
    setText(null);
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', await prepareImage(bitmap), 'image.jpg');
      const response = await fetch('/api/tools/ocr', { method: 'POST', headers: { [LOCALE_HEADER]: locale }, body: form });
      const payload = await response.json().catch(() => ({})) as { text?: unknown; error?: unknown };
      if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : t.failed);
      setText(typeof payload.text === 'string' ? payload.text.trim() : '');
    } catch (cause) {
      setError(cause instanceof Error && cause.message !== 'image' ? cause.message : t.failed);
    } finally {
      bitmap.close();
      setBusy(false);
    }
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0];
    event.target.value = '';
    if (chosen) void recognize(chosen);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const chosen = event.dataTransfer.files?.[0];
    if (chosen && !busy) void recognize(chosen);
  };

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const pasted = Array.from(event.clipboardData?.files ?? []).find((item) => item.type.startsWith('image/'));
      if (pasted && !busy) void recognize(pasted);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  const copyText = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const downloadText = () => {
    if (!text || !file) return;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    Object.assign(document.createElement('a'), { href: url, download: downloadName(file.name, 'txt', '', 'texte') }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-900 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50';

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

    {file && <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="space-y-3">
        <div className="flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
          {previewUrl && <img src={previewUrl} alt="" className={`max-h-[420px] w-auto max-w-full object-contain ${busy ? 'opacity-50' : ''}`} />}
        </div>
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className={`${secondaryButton} w-full`}><RefreshCw className="h-4 w-4" aria-hidden="true" />{t.another}</button>
      </div>

      <div className="flex min-h-[220px] flex-col gap-3">
        {busy && <p role="status" className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-6 font-semibold text-slate-900"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />{t.reading}</p>}
        {!busy && text === '' && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{t.empty}</p>}
        {!busy && text && <>
          <label className="flex flex-1 flex-col text-sm font-semibold text-slate-700">
            <span className="flex items-center gap-2"><ScanText className="h-4 w-4" aria-hidden="true" />{t.result}</span>
            <textarea value={text} onChange={(event) => setText(event.target.value)} rows={14} spellCheck className="mt-2 w-full flex-1 resize-y rounded-xl border border-slate-300 bg-white p-3 font-normal leading-6 text-slate-900 focus:border-slate-500 focus:outline-none" />
          </label>
          <p className="text-xs text-slate-500">{t.counts(words, text.length)} · {t.editable}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={copyText} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white transition hover:bg-slate-800">{copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}{copied ? t.copied : t.copy}</button>
            <button type="button" onClick={downloadText} className="btn-download inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5"><Download className="h-4 w-4" aria-hidden="true" />{t.download}</button>
          </div>
        </>}
      </div>
    </div>}

    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
    <p className="text-xs text-slate-500">{t.tips} {t.quota}</p>
  </div>;
}
