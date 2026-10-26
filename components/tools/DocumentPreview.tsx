'use client';

// Pieces shared by the resume builder and the invoice generator: jsPDF loading, the page
// preview, the draft kept in the browser and the form fields.
import { useEffect, useRef, useState, useSyncExternalStore, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { jsPDF } from 'jspdf';
import { A4, drawCanvas, drawPdf, jsPdfMeasure, type Measure, type Page } from '@/lib/document-painter';

export type PdfKit = { JsPdf: typeof jsPDF; measure: Measure };

/** jsPDF, loaded once the tool is shown: the layout needs its font metrics. */
export function usePdfKit(): PdfKit | null {
  const [kit, setKit] = useState<PdfKit | null>(null);
  useEffect(() => {
    let alive = true;
    void import('jspdf').then(({ jsPDF: JsPdf }) => {
      if (alive) setKit({ JsPdf, measure: jsPdfMeasure(new JsPdf({ unit: 'mm' })) });
    });
    return () => { alive = false; };
  }, []);
  return kit;
}

export function savePdf(kit: PdfKit, pages: Page[], fileName: string): void {
  drawPdf(kit.JsPdf, pages).save(fileName);
}

const noSubscription = () => () => undefined;

/** False while rendered on the server and during hydration, true in the browser afterwards. */
export function useIsClient(): boolean {
  return useSyncExternalStore(noSubscription, () => true, () => false);
}

/** The draft saved in this browser, or null; storage can be refused (private browsing). */
export function readDraft<T>(key: string, isValid: (value: unknown) => value is T): T | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    return isValid(value) ? value : null;
  } catch {
    return null;
  }
}

/** Keeps `value` in this browser, a moment after the last change. */
export function useDraftSaving(key: string, value: unknown): void {
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // A full or refused storage only loses the draft, not the document.
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [key, value]);
}

export function forgetDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing was saved.
  }
}

type PreviewLabels = { preview: string; page: (current: number, total: number) => string; previous: string; next: string };

/** One page at a time, drawn exactly as in the PDF, at the width of its container. */
export function DocumentPreview({ pages, labels }: { pages: Page[] | null; labels: PreviewLabels }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const images = useRef(new Map<string, HTMLImageElement>());
  const [requested, setRequested] = useState(0);
  const [width, setWidth] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const total = pages?.length ?? 0;
  const index = Math.min(requested, Math.max(0, total - 1));

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const page = pages?.[index];
    if (!canvas || !page || !width) return;
    for (const shape of page) {
      if (shape.kind !== 'image' || images.current.has(shape.src)) continue;
      const image = new Image();
      image.onload = () => setImagesLoaded((count) => count + 1);
      image.src = shape.src;
      images.current.set(shape.src, image);
    }
    const scale = (width / A4.width) * (window.devicePixelRatio || 1);
    canvas.width = Math.round(A4.width * scale);
    canvas.height = Math.round(A4.height * scale);
    const context = canvas.getContext('2d');
    if (context) drawCanvas(context, page, scale, images.current);
  }, [pages, index, width, imagesLoaded]);

  return <div className="space-y-2">
    <div ref={frameRef} className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" style={{ aspectRatio: `${A4.width} / ${A4.height}` }}>
      <canvas ref={canvasRef} role="img" aria-label={labels.preview} className="block h-full w-full" />
      {!pages && <div className="absolute inset-0 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden="true" /></div>}
    </div>
    {total > 1 && <div className="flex items-center justify-center gap-3 text-sm text-slate-600">
      <button type="button" aria-label={labels.previous} disabled={index === 0} onClick={() => setRequested(index - 1)} className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-700 hover:border-slate-400 disabled:opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
      <span aria-live="polite">{labels.page(index + 1, total)}</span>
      <button type="button" aria-label={labels.next} disabled={index >= total - 1} onClick={() => setRequested(index + 1)} className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-700 hover:border-slate-400 disabled:opacity-40"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
    </div>}
  </div>;
}

const fieldClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none';

export function Field({ label, className = '', ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <label className={`block text-xs font-semibold text-slate-600 ${className}`}>{label}<input {...input} className={fieldClass} /></label>;
}

export function TextArea({ label, className = '', ...textarea }: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <label className={`block text-xs font-semibold text-slate-600 ${className}`}>{label}<textarea {...textarea} className={`${fieldClass} resize-y leading-5`} /></label>;
}

/** A titled group of fields that can be folded away. */
export function FormSection({ title, children, open = true }: { title: string; children: ReactNode; open?: boolean }) {
  return <details open={open} className="group rounded-xl border border-slate-200 bg-white">
    <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-bold text-slate-900">
      {title}
      <ChevronRight className="h-4 w-4 text-slate-400 transition group-open:rotate-90" aria-hidden="true" />
    </summary>
    <div className="space-y-3 border-t border-slate-100 px-4 py-4">{children}</div>
  </details>;
}

/** Turns an image file into a data URL fitted within `size` pixels, as JPEG or PNG. */
export async function imageToDataUrl(file: File, size: number, options: { square?: boolean; type?: 'image/jpeg' | 'image/png' } = {}): Promise<{ src: string; ratio: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const source = options.square
      ? { x: (bitmap.width - side) / 2, y: (bitmap.height - side) / 2, width: side, height: side }
      : { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
    const scale = Math.min(1, size / Math.max(source.width, source.height));
    const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(source.width * scale), height: Math.round(source.height * scale) });
    const context = canvas.getContext('2d')!;
    const type = options.type ?? 'image/jpeg';
    if (type === 'image/jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, source.x, source.y, source.width, source.height, 0, 0, canvas.width, canvas.height);
    return { src: canvas.toDataURL(type, 0.88), ratio: canvas.width / canvas.height };
  } finally {
    bitmap.close();
  }
}
