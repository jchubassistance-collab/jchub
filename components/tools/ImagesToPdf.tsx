'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { ArrowDown, ArrowUp, Download, FileImage, GripVertical, Loader2, Plus, Trash2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

type ImageItem = {
  id: string;
  file: File;
  url: string;
};

type PageFormat = 'a4' | 'a3' | 'letter';
type Orientation = 'portrait' | 'landscape';
type ImageFit = 'contain' | 'cover';
type ConversionMode = 'faithful' | 'ocr' | 'editable';
type OcrWord = { text: string; bbox: { x0: number; y0: number; x1: number; y1: number } };
type OcrLine = { text: string; bbox: OcrWord['bbox'] };
type OcrRecognition = { text: string; words: OcrWord[]; lines: OcrLine[]; width?: number; height?: number };

const pageFormats: Record<PageFormat, [number, number]> = {
  a4: [210, 297],
  a3: [297, 420],
  letter: [215.9, 279.4],
};

export function ImagesToPdf() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [format, setFormat] = useState<PageFormat>('a4');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [fit, setFit] = useState<ImageFit>('contain');
  const [mode, setMode] = useState<ConversionMode>('faithful');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  const addFiles = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (validFiles.length === 0) {
      setError('Ajoute au moins une image JPG, PNG, WebP ou GIF.');
      return;
    }
    setError('');
    setImages((current) => [
      ...current,
      ...validFiles.map((file) => ({ id: `${file.name}-${file.lastModified}-${Math.random()}`, file, url: URL.createObjectURL(file) })),
    ]);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDraggedId(null);
    if (event.dataTransfer.files.length > 0) addFiles(event.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    setImages((current) => {
      const image = current.find((item) => item.id === id);
      if (image) URL.revokeObjectURL(image.url);
      return current.filter((item) => item.id !== id);
    });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    setImages((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const reorderImage = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    setImages((current) => {
      const fromIndex = current.findIndex((image) => image.id === draggedId);
      const toIndex = current.findIndex((image) => image.id === targetId);
      if (fromIndex < 0 || toIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setDraggedId(null);
  };

  const generatePdf = async () => {
    if (images.length === 0) {
      setError('Ajoute au moins une image avant de générer le PDF.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setProgress(mode === 'faithful' ? 'Préparation des pages...' : 'Analyse OCR.space...');
    try {
      const [baseWidth, baseHeight] = pageFormats[format];
      const pageWidth = orientation === 'portrait' ? baseWidth : baseHeight;
      const pageHeight = orientation === 'portrait' ? baseHeight : baseWidth;
      const pdf = new jsPDF({ orientation, unit: 'mm', format });
      const margin = 10;

      if (mode === 'faithful' && images.length === 1 && ['image/jpeg', 'image/png'].includes(images[0].file.type)) {
        setProgress('Conversion Adobe en cours...');
        const formData = new FormData();
          formData.append('file', images[0].file);
        const adobeResponse = await fetch('/api/tools/image-to-pdf', { method: 'POST', body: formData });
        if (adobeResponse.ok) {
          const adobeBlobUrl = URL.createObjectURL(await adobeResponse.blob());
          if (downloadUrl) URL.revokeObjectURL(downloadUrl);
          setDownloadUrl(adobeBlobUrl);
          return;
        }
      }

      for (let index = 0; index < images.length; index += 1) {
        const image = images[index];
        if (index > 0) pdf.addPage([pageWidth, pageHeight], orientation);
        setProgress(mode === 'faithful' ? `Préparation de la page ${index + 1}/${images.length}...` : `Analyse OCR de la page ${index + 1}/${images.length}...`);
        const contentWidth = pageWidth - margin * 2;
        const contentHeight = pageHeight - margin * 2;

        if (mode === 'faithful') {
          const prepared = await prepareImage(image.url, fit, contentWidth / contentHeight);
          let width = contentWidth;
          let height = fit === 'cover' ? contentHeight : width / prepared.ratio;
          if (fit === 'contain' && height > contentHeight) {
            height = contentHeight;
            width = height * prepared.ratio;
          }
          const x = (pageWidth - width) / 2;
          const y = (pageHeight - height) / 2;
          pdf.addImage(prepared.dataUrl, 'JPEG', x, y, width, height, undefined, 'FAST');
          continue;
        }

        const loadedImage = await loadImage(image.url);
        const recognition = await recognizeWithOcrSpace(image.file, 'ocrspace');
        const imageRatio = loadedImage.width / loadedImage.height;
        const width = contentWidth;
        const height = Math.min(contentHeight, width / imageRatio);
        const renderedWidth = height * imageRatio;
        const imageX = (pageWidth - renderedWidth) / 2;
        const imageY = (pageHeight - height) / 2;
        const scaleX = renderedWidth / (recognition.width || loadedImage.width);
        const scaleY = height / (recognition.height || loadedImage.height);

        if (mode === 'ocr') {
          const prepared = await prepareImage(image.url, 'contain', contentWidth / contentHeight);
          pdf.addImage(prepared.dataUrl, 'JPEG', imageX, imageY, renderedWidth, height, undefined, 'FAST');
        }

        if (mode === 'editable') {
          const logo = await prepareRegionImage(image.url, 0.08, 0.015, 0.42, 0.12);
          pdf.addImage(
            logo.dataUrl,
            'JPEG',
            imageX + renderedWidth * 0.08,
            imageY + height * 0.015,
            renderedWidth * 0.42,
            height * 0.12,
            undefined,
            'FAST',
          );
        }

        const recognizedLines = mergeHyphenatedLines(
          recognition.lines.length > 0 ? recognition.lines : groupWordsIntoLines(recognition.words),
        ).filter((line) => mode !== 'editable' || line.bbox.y0 > (recognition.height || loadedImage.height) * 0.15 || line.bbox.x0 > (recognition.width || loadedImage.width) * 0.55);
        const pointsPerMillimetre = 72 / 25.4;
        const addText = (text: string, x: number, y: number, fontSize: number, maxWidth?: number) => {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(fontSize);
          if (maxWidth && pdf.getTextWidth(text) > maxWidth) {
            fontSize = Math.max(4.5, fontSize * (maxWidth / pdf.getTextWidth(text)));
            pdf.setFontSize(fontSize);
          }
          if (mode === 'ocr') {
            pdf.text(text, x, y, { renderingMode: 'invisible' } as never);
          } else {
            pdf.text(text, x, y);
          }
        };

        recognizedLines
          .slice()
          .sort((first, second) => first.bbox.y0 - second.bbox.y0)
          .forEach((line) => {
          const text = normalizeOcrText(line.text);
          if (!text) return;
          const lineHeightInMillimetres = (line.bbox.y1 - line.bbox.y0) * scaleY;
          const fontSize = Math.max(6, Math.min(16, lineHeightInMillimetres * pointsPerMillimetre * 0.78));
          const x = imageX + line.bbox.x0 * scaleX;
          const rawY = imageY + line.bbox.y1 * scaleY;
          addText(text, x, rawY, fontSize, (line.bbox.x1 - line.bbox.x0) * scaleX);
          });

        if (recognizedLines.length === 0) {
          const fallbackLines = (recognition?.text ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
          const fallbackFontSize = Math.max(7, Math.min(13, 13 * scaleY * 2.8));
          fallbackLines.forEach((line, lineIndex) => {
            addText(line, margin, margin + 8 + lineIndex * (fallbackFontSize * 1.25), fallbackFontSize);
          });
        }
      }

      const blobUrl = URL.createObjectURL(pdf.output('blob'));
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(blobUrl);
    } catch {
      setError('Impossible d’analyser cette image avec l’OCR local.');
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  return (
    <div className="space-y-5 text-slate-100">
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="rounded-2xl border border-dashed border-[#9ccbff]/40 bg-[#071526] p-6 text-center"
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
        <FileImage className="mx-auto h-8 w-8 text-[#9ccbff]" />
        <p className="mt-3 font-bold text-white">Déposer vos images ici</p>
        <p className="mt-1 text-xs text-slate-400">JPG, PNG, WebP ou GIF</p>
        <button type="button" onClick={() => inputRef.current?.click()} className="mx-auto mt-4 inline-flex items-center gap-2 rounded-xl bg-[#4a74d6] px-4 py-3 font-bold text-white transition hover:bg-[#6fa3ff]">
          <Plus className="h-5 w-5" /> Ajouter des images
        </button>
      </div>

      {images.length > 0 && (
        <div className="space-y-2">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => setDraggedId(image.id)}
              onDragEnd={() => setDraggedId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => reorderImage(image.id)}
              className={`flex items-center gap-3 rounded-xl border bg-[#071526] p-2.5 ${draggedId === image.id ? 'border-[#9ccbff] opacity-60' : 'border-white/10'}`}
            >
              <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-slate-500" aria-label="Réorganiser" />
              <img src={image.url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{image.file.name}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30" aria-label="Monter la page"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30" aria-label="Descendre la page"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => removeImage(image.id)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10" aria-label={`Supprimer ${image.file.name}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Mode de conversion</div>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { value: 'faithful', label: 'PDF fidèle', detail: 'Apparence originale' },
            { value: 'ocr', label: 'PDF OCR', detail: 'Image + texte sélectionnable' },
            { value: 'editable', label: 'PDF éditable', detail: 'Rendu fidèle + texte sélectionnable' },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setMode(item.value as ConversionMode)}
              className={`rounded-xl border p-3 text-left transition ${mode === item.value ? 'border-[#9ccbff]/70 bg-[#9ccbff]/15' : 'border-white/10 bg-[#071526] hover:border-[#9ccbff]/40'}`}
            >
              <span className="block text-sm font-bold text-white">{item.label}</span>
              <span className="mt-1 block text-xs text-slate-400">{item.detail}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Format
          <select value={format} onChange={(event) => setFormat(event.target.value as PageFormat)} className="mt-2 w-full rounded-lg border border-[#9ccbff]/20 bg-[#071526] px-3 py-2 text-sm font-normal normal-case tracking-normal text-white">
            <option value="a4">A4</option><option value="a3">A3</option><option value="letter">Lettre</option>
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Orientation
          <select value={orientation} onChange={(event) => setOrientation(event.target.value as Orientation)} className="mt-2 w-full rounded-lg border border-[#9ccbff]/20 bg-[#071526] px-3 py-2 text-sm font-normal normal-case tracking-normal text-white">
            <option value="portrait">Portrait</option><option value="landscape">Paysage</option>
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Ajustement
          <select value={fit} onChange={(event) => setFit(event.target.value as ImageFit)} className="mt-2 w-full rounded-lg border border-[#9ccbff]/20 bg-[#071526] px-3 py-2 text-sm font-normal normal-case tracking-normal text-white">
            <option value="contain">Image entière</option><option value="cover">Remplir la page</option>
          </select>
        </label>
      </div>

      {progress && <p className="rounded-xl border border-[#9ccbff]/20 bg-[#071526] px-3 py-2 text-center text-sm text-[#dfeeff]">{progress}</p>}
      {error && <p className="text-sm text-rose-300" role="alert">{error}</p>}
      <button type="button" onClick={generatePdf} disabled={images.length === 0 || isGenerating} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4a74d6] to-[#7a5cf7] px-4 py-3 font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50">
        {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
        {isGenerating ? 'Génération en cours...' : 'Générer le PDF'}
      </button>
      {downloadUrl && <a href={downloadUrl} download="images-en-pdf.pdf" className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 font-bold text-emerald-200 transition hover:bg-emerald-500/20"><Download className="h-5 w-5" /> Télécharger le PDF</a>}
      <p className="text-center text-xs text-slate-400">Le mode fidèle reste local. Les modes OCR utilisent OCR.space via une connexion sécurisée.</p>
    </div>
  );
}

async function recognizeWithOcrSpace(file: File, provider: 'adobe' | 'ocrspace' = 'adobe'): Promise<OcrRecognition> {
  const ocrFile = await prepareOcrFile(file);
  const formData = new FormData();
  formData.append('file', ocrFile);
  const response = await fetch(`/api/tools/ocr?provider=${provider}`, { method: 'POST', body: formData });
  const payload = await response.json() as { text?: string; words?: OcrWord[]; lines?: OcrLine[]; width?: number; height?: number; error?: string };
  if (!response.ok) throw new Error(payload.error || 'OCR.space indisponible.');
  return { text: payload.text ?? '', words: payload.words ?? [], lines: payload.lines ?? [], width: payload.width, height: payload.height };
}

async function prepareOcrFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  const image = await loadImage(URL.createObjectURL(file));
  const maxDimension = 2400;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return file;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const luminance = 0.299 * pixels.data[index] + 0.587 * pixels.data[index + 1] + 0.114 * pixels.data[index + 2];
    const contrast = Math.max(0, Math.min(255, (luminance - 128) * 1.18 + 128));
    pixels.data[index] = contrast;
    pixels.data[index + 1] = contrast;
    pixels.data[index + 2] = contrast;
  }
  context.putImageData(pixels, 0, 0);
  URL.revokeObjectURL(image.src);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.94));
  return blob ? new File([blob], `${file.name.replace(/\.[^.]+$/, '')}-ocr.jpg`, { type: 'image/jpeg' }) : file;
}

async function prepareRegionImage(url: string, leftRatio: number, topRatio: number, widthRatio: number, heightRatio: number) {
  const image = await loadImage(url);
  const sourceX = Math.round(image.width * leftRatio);
  const sourceY = Math.round(image.height * topRatio);
  const sourceWidth = Math.max(1, Math.round(image.width * widthRatio));
  const sourceHeight = Math.max(1, Math.round(image.height * heightRatio));
  const canvas = document.createElement('canvas');
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas indisponible');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, sourceWidth, sourceHeight);
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.94) };
}

function groupWordsIntoLines(words: OcrWord[]) {
  const lines: Array<{ words: OcrWord[]; y: number }> = [];
  words
    .slice()
    .sort((first, second) => first.bbox.y0 - second.bbox.y0 || first.bbox.x0 - second.bbox.x0)
    .forEach((word) => {
      const centerY = (word.bbox.y0 + word.bbox.y1) / 2;
      const line = lines.find((candidate) => Math.abs(candidate.y - centerY) <= Math.max(8, (word.bbox.y1 - word.bbox.y0) * 0.7));
      if (line) {
        line.words.push(word);
        line.y = (line.y + centerY) / 2;
      } else {
        lines.push({ words: [word], y: centerY });
      }
    });

  return lines
    .sort((first, second) => first.y - second.y)
    .map((line) => {
      const orderedWords = line.words.sort((first, second) => first.bbox.x0 - second.bbox.x0);
      return {
        text: orderedWords.map((word) => word.text).join(' '),
        bbox: {
          x0: Math.min(...orderedWords.map((word) => word.bbox.x0)),
          y0: Math.min(...orderedWords.map((word) => word.bbox.y0)),
          x1: Math.max(...orderedWords.map((word) => word.bbox.x1)),
          y1: Math.max(...orderedWords.map((word) => word.bbox.y1)),
        },
      };
    });
}

function mergeHyphenatedLines(lines: OcrLine[]): OcrLine[] {
  const merged: OcrLine[] = [];
  lines.slice().sort((first, second) => first.bbox.y0 - second.bbox.y0 || first.bbox.x0 - second.bbox.x0).forEach((line) => {
    const previous = merged[merged.length - 1];
    if (previous && /[-\u2010\u2011\u2012\u2013]$/.test(previous.text.trim()) && /^[a-zà-ÿ]/.test(line.text.trim())) {
      const previousText = previous.text.trim();
      const isEmailContinuation = /@[^\s]*-$/.test(previousText);
      previous.text = `${isEmailContinuation ? previousText : previousText.slice(0, -1)}${line.text.trimStart()}`;
      previous.bbox = {
        x0: Math.min(previous.bbox.x0, line.bbox.x0),
        y0: Math.min(previous.bbox.y0, line.bbox.y0),
        x1: Math.max(previous.bbox.x1, line.bbox.x1),
        y1: Math.max(previous.bbox.y1, line.bbox.y1),
      };
      return;
    }
    merged.push({ text: line.text, bbox: { ...line.bbox } });
  });
  return merged;
}

function normalizeOcrText(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F\u00AD\uFFFE\uFFFF]/g, '')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/\s+»$/g, '')
    .replace(/\bpar mail a:/gi, 'par mail à:')
    .trim();
}

async function prepareImage(url: string, fit: ImageFit, pageRatio: number) {
  const image = await loadImage(url);
  const imageRatio = image.width / image.height;
  const maxWidth = 2400;
  const canvas = document.createElement('canvas');

  if (fit === 'cover') {
    canvas.width = maxWidth;
    canvas.height = Math.round(maxWidth / pageRatio);
    const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
    const drawnWidth = image.width * scale;
    const drawnHeight = image.height * scale;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas indisponible');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, (canvas.width - drawnWidth) / 2, (canvas.height - drawnHeight) / 2, drawnWidth, drawnHeight);
    return { dataUrl: canvas.toDataURL('image/jpeg', 0.94), ratio: pageRatio };
  }

  const width = Math.min(image.width, maxWidth);
  const height = Math.round(width / imageRatio);
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas indisponible');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.94), ratio: imageRatio };
}


function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}
