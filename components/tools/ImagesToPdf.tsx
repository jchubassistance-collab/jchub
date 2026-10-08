'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Download, FileImage, FileText, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { jsPDF } from 'jspdf';

type ImageItem = { file: File; url: string };
const MAX_FILES = 20;
const MAX_FILE_SIZE = 15 * 1024 * 1024;

export function ImagesToPdf() {
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
      if (!/^image\/(jpeg|png)$/.test(file.type)) { setError('Seuls les fichiers JPG, JPEG et PNG sont acceptés.'); continue; }
      if (file.size > MAX_FILE_SIZE) { setError(`${file.name} dépasse la limite de 15 Mo.`); continue; }
      if (images.length + accepted.length >= MAX_FILES) { setError(`Tu peux ajouter jusqu'à ${MAX_FILES} images.`); break; }
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
    try {
      const pdf = new jsPDF({ orientation, unit: 'mm', format: pageSize === 'image' ? 'a4' : pageSize, compress: true });
      for (let i = 0; i < images.length; i++) {
        const image = await loadImage(images[i].url);
        let width: number; let height: number;
        if (pageSize === 'image') {
          width = image.naturalWidth * 25.4 / 96; height = image.naturalHeight * 25.4 / 96;
          if (orientation === 'landscape' && height > width) [width, height] = [height, width];
          if (orientation === 'portrait' && width > height) [width, height] = [height, width];
          if (i === 0) pdf.deletePage(1);
          pdf.addPage([width, height], orientation);
        } else {
          if (i > 0) pdf.addPage(pageSize, orientation);
          const pageW = pdf.internal.pageSize.getWidth(); const pageH = pdf.internal.pageSize.getHeight();
          const ratio = image.naturalWidth / image.naturalHeight;
          const boxRatio = pageW / pageH;
          if ((fit === 'contain' && ratio > boxRatio) || (fit === 'cover' && ratio < boxRatio)) { width = pageW; height = pageW / ratio; }
          else { height = pageH; width = pageH * ratio; }
          if (fit === 'contain') { width = Math.min(width, pageW); height = Math.min(height, pageH); }
        }
        const x = (pdf.internal.pageSize.getWidth() - width) / 2;
        const y = (pdf.internal.pageSize.getHeight() - height) / 2;
        pdf.addImage(image, images[i].file.type === 'image/png' ? 'PNG' : 'JPEG', x, y, width, height, undefined, 'FAST');
      }
      setDownloadUrl(URL.createObjectURL(pdf.output('blob')));
    } catch { setError('La création du PDF a échoué. Vérifie les images puis réessaie.'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-5 text-slate-100">
    <div className="rounded-2xl border border-dashed border-[#9ccbff]/40 bg-[#071526] p-6 text-center">
      <input ref={inputRef} type="file" multiple accept="image/jpeg,image/png,.jpg,.jpeg,.png" className="hidden" onChange={addFiles} />
      <button type="button" onClick={() => inputRef.current?.click()} className="mx-auto flex items-center gap-2 rounded-xl border border-[#9ccbff]/30 bg-[#0c1d31] px-4 py-3 font-semibold text-[#dfeeff] hover:border-[#9ccbff]/50"><UploadCloud className="h-5 w-5" /> Ajouter des images</button>
      <p className="mt-3 text-xs text-slate-400">JPG, JPEG ou PNG · 15 Mo maximum par image · jusqu&apos;à {MAX_FILES} images</p>
    </div>

    {images.length > 0 && <ol className="max-h-64 space-y-2 overflow-auto rounded-2xl border border-[#9ccbff]/20 bg-[#071526] p-3">
      {images.map(({ file, url }, index) => <li key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-xl bg-[#0c1d31] p-2">
        <img src={url} alt="" className="h-12 w-12 rounded-lg object-cover" />
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-white">{index + 1}. {file.name}</span><span className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} Mo</span></span>
        <button type="button" onClick={() => remove(index)} aria-label={`Retirer ${file.name}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
      </li>)}
    </ol>}

    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm text-slate-300">Taille des pages<select value={pageSize} onChange={(e) => setPageSize(e.target.value as typeof pageSize)} className="mt-1 w-full rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-3 py-2.5 text-white"><option value="a4">A4</option><option value="letter">Letter</option><option value="image">Taille adaptée à chaque image</option></select></label>
      <label className="text-sm text-slate-300">Orientation<select value={orientation} onChange={(e) => setOrientation(e.target.value as typeof orientation)} className="mt-1 w-full rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-3 py-2.5 text-white"><option value="portrait">Portrait</option><option value="landscape">Paysage</option></select></label>
    </div>
    {pageSize !== 'image' && <label className="block text-sm text-slate-300">Placement de l’image<select value={fit} onChange={(e) => setFit(e.target.value as typeof fit)} className="mt-1 w-full rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-3 py-2.5 text-white"><option value="contain">Tout afficher (sans recadrage)</option><option value="cover">Remplir la page (peut recadrer)</option></select></label>}
    <p className="flex items-center gap-2 rounded-xl border border-[#9ccbff]/20 bg-[#071526] p-3 text-xs text-slate-300"><FileImage className="h-4 w-4 shrink-0 text-blue-300" />L’ordre des images dans la liste détermine celui des pages. Chaque image occupe une page.</p>
    <button type="button" disabled={!images.length || busy} onClick={convert} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4a74d6] to-[#7a5cf7] px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}{busy ? 'Création du PDF…' : 'Convertir en PDF'}</button>
    {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</div>}
    {downloadUrl && <a href={downloadUrl} download="images.pdf" className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 font-bold text-emerald-200"><Download className="h-5 w-5" /> Télécharger le PDF</a>}
    <p className="text-center text-xs text-slate-400">La conversion se fait dans ton navigateur ; tes images ne sont pas envoyées au serveur.</p>
  </div>;
}
function loadImage(url: string): Promise<HTMLImageElement> { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = url; }); }
