import { MAX_FILE_SIZE, MAX_SIDE, MAX_SOURCE_PIXELS, UNSUPPORTED_FORMATS, fitWithin, sniffFormat, type SniffedFormat } from '@/lib/logo-editor';
import {
  applyDetail, applyTones, exportDimensions, fillBehind, hexToRgb, orientedSize, removePlainBackground, straightenZoom,
  type ExportSize, type PhotoSettings,
} from '@/lib/photo-editor';
import { floodSelect, maskDimensions } from '@/lib/photo-segmentation';
import { LogoExportError, LogoLoadError } from './editor-render';

/**
 * Browser side of the photo retouching: reads the photo into a working copy (and a smaller copy
 * for a fluid preview), draws the edit and exports it. Nothing leaves the browser.
 */

/** Longest side of the copy the preview is drawn from: slider moves stay fluid on a phone. */
export const PREVIEW_SIDE = 1600;

export type LoadedPhoto = {
  /** Changes with each file, so that cached images of the previous photo are never reused. */
  id: number;
  name: string;
  format: SniffedFormat;
  /** Working copy, `width` × `height` pixels: the export is drawn from it. */
  source: HTMLCanvasElement;
  /** The same photo at most PREVIEW_SIDE pixels long. */
  preview: HTMLCanvasElement;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  downscaled: boolean;
};

let nextPhotoId = 1;

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function context2d(canvas: HTMLCanvasElement, willReadFrequently = false): CanvasRenderingContext2D {
  const context = canvas.getContext('2d', { willReadFrequently });
  if (!context) throw new LogoLoadError('browser');
  return context;
}

function decodeImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('decode'));
    image.src = url;
  });
}

function scaledCopy(image: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const canvas = createCanvas(width, height);
  const context = context2d(canvas);
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);
  return canvas;
}

/** Reads a photo. The browser applies the orientation saved by the camera (EXIF) while decoding. */
export async function loadPhoto(file: File): Promise<LoadedPhoto> {
  if (file.size > MAX_FILE_SIZE) throw new LogoLoadError('too-large');
  if (file.size === 0) throw new LogoLoadError('empty');
  const head = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
  const format = sniffFormat(head, file.name, file.type);
  if (UNSUPPORTED_FORMATS.has(format)) throw new LogoLoadError('unsupported', format);
  const url = URL.createObjectURL(file);
  try {
    let image: HTMLImageElement;
    try {
      image = await decodeImage(url);
    } catch {
      throw new LogoLoadError(format === 'heic' || format === 'tiff' || format === 'avif' ? 'browser' : format === 'svg' ? 'invalid-svg' : 'unreadable', format);
    }
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!width || !height) throw new LogoLoadError('unreadable', format);
    if (width * height > MAX_SOURCE_PIXELS) throw new LogoLoadError('too-many-pixels', format, width * height);
    const size = fitWithin(width, height, MAX_SIDE);
    const source = scaledCopy(image, size.width, size.height);
    try {
      // A browser that forbids reading these pixels could not apply any edit.
      context2d(source).getImageData(0, 0, 1, 1);
    } catch {
      throw new LogoLoadError('browser');
    }
    const previewSize = fitWithin(size.width, size.height, PREVIEW_SIDE);
    const preview = previewSize.width === size.width ? source : scaledCopy(source, previewSize.width, previewSize.height);
    return {
      id: nextPhotoId++,
      name: file.name,
      format,
      source,
      preview,
      width: size.width,
      height: size.height,
      originalWidth: width,
      originalHeight: height,
      downscaled: size.width !== width || size.height !== height,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** The last turned and straightened copy: changing a color does not turn the photo again. */
export type GeometryCache = { key?: string; canvas?: HTMLCanvasElement };

/**
 * `base` (the working copy or the preview copy) turned, flipped and straightened, at its own
 * scale. Its size is the turned size of the photo: the crop is in its pixels (times the scale).
 */
function geometry(photo: LoadedPhoto, base: HTMLCanvasElement, settings: PhotoSettings, cache?: GeometryCache, version = ''): HTMLCanvasElement {
  const key = JSON.stringify([photo.id, version, base.width, settings.turns, settings.flipX, settings.flipY, settings.straighten]);
  if (cache?.key === key && cache.canvas) return cache.canvas;
  const turned = orientedSize(base.width, base.height, settings.turns);
  let canvas = base;
  if (settings.turns || settings.flipX || settings.flipY || settings.straighten) {
    canvas = createCanvas(turned.width, turned.height);
    const context = context2d(canvas);
    context.imageSmoothingQuality = 'high';
    context.translate(turned.width / 2, turned.height / 2);
    if (settings.straighten) {
      const zoom = straightenZoom(turned.width, turned.height, settings.straighten);
      context.rotate((settings.straighten * Math.PI) / 180);
      context.scale(zoom, zoom);
    }
    // The flips apply to the turned photo, as the visitor sees it.
    context.scale(settings.flipX ? -1 : 1, settings.flipY ? -1 : 1);
    context.rotate((settings.turns * Math.PI) / 2);
    context.drawImage(base, -base.width / 2, -base.height / 2);
  }
  if (cache) {
    cache.key = key;
    cache.canvas = canvas;
  }
  return canvas;
}

/** Size of the photo once turned: the frame the crop lives in. */
export function frameSize(photo: LoadedPhoto, settings: Pick<PhotoSettings, 'turns'>): { width: number; height: number } {
  return orientedSize(photo.width, photo.height, settings.turns);
}

/** The working copy for a drawing `scale` pixels per pixel of the photo: the preview copy when it is enough. */
function baseFor(photo: LoadedPhoto, scale: number): HTMLCanvasElement {
  return scale <= photo.preview.width / photo.width ? photo.preview : photo.source;
}

/** The whole turned and straightened photo, without the colors: what the crop is drawn on. */
export function drawFrame(target: HTMLCanvasElement, photo: LoadedPhoto, settings: PhotoSettings, scale: number, cache?: GeometryCache): void {
  const frame = frameSize(photo, settings);
  const width = Math.max(1, Math.round(frame.width * scale));
  const height = Math.max(1, Math.round(frame.height * scale));
  if (target.width !== width) target.width = width;
  if (target.height !== height) target.height = height;
  const context = context2d(target);
  context.clearRect(0, 0, width, height);
  context.imageSmoothingQuality = 'high';
  context.drawImage(geometry(photo, baseFor(photo, scale), settings, cache), 0, 0, width, height);
}

/**
 * The cut-out mask: a canvas the size of maskDimensions(), white, its opacity the subject's.
 * `key` changes with each touch-up, so that its turned copy is drawn again.
 */
export type CutoutMask = { canvas: HTMLCanvasElement; key: string; cache: GeometryCache };

/**
 * Draws the edit on `target`, `scale` pixels per pixel of the crop (1 for the export at the size
 * of the working copy, less for the preview or a smaller export). `mask` cuts the subject out;
 * `fallbackBackground` fills what is transparent, for JPG.
 */
export function renderPhoto(target: HTMLCanvasElement, photo: LoadedPhoto, settings: PhotoSettings, scale: number, cache?: GeometryCache, fallbackBackground?: string, mask?: CutoutMask | null): void {
  const { crop } = settings;
  const width = Math.max(1, Math.round(crop.width * scale));
  const height = Math.max(1, Math.round(crop.height * scale));
  if (target.width !== width) target.width = width;
  if (target.height !== height) target.height = height;
  const base = baseFor(photo, scale);
  const ratio = base.width / photo.width;
  const context = context2d(target, true);
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalCompositeOperation = 'source-over';
  context.clearRect(0, 0, width, height);
  context.imageSmoothingQuality = 'high';
  context.drawImage(geometry(photo, base, settings, cache), crop.x * ratio, crop.y * ratio, crop.width * ratio, crop.height * ratio, 0, 0, width, height);
  const cutout = settings.maskVersion !== null && mask ? mask : null;
  if (cutout) {
    // The mask goes through the same turn, flip, straightening and crop as the photo, then keeps
    // only the subject's pixels (destination-in).
    const maskRatio = cutout.canvas.width / photo.width;
    const turnedMask = geometry(photo, cutout.canvas, settings, cutout.cache, `mask:${cutout.key}`);
    context.globalCompositeOperation = 'destination-in';
    context.drawImage(turnedMask, crop.x * maskRatio, crop.y * maskRatio, crop.width * maskRatio, crop.height * maskRatio, 0, 0, width, height);
    context.globalCompositeOperation = 'source-over';
  }

  const background = cutout && settings.backgroundColor ? hexToRgb(settings.backgroundColor) : null;
  const fallback = fallbackBackground ? hexToRgb(fallbackBackground) : null;
  const pixelWork = Boolean(background) || settings.blur > 0 || settings.sharpness > 0
    || ['exposure', 'contrast', 'highlights', 'shadows', 'fade', 'temperature', 'tint', 'vibrance', 'saturation', 'mono', 'sepia', 'vignette']
      .some((key) => settings[key as keyof PhotoSettings] !== 0);
  if (!pixelWork && !fallback) return;
  const image = context.getImageData(0, 0, width, height);
  applyTones(image.data, width, height, settings);
  applyDetail(image.data, width, height, settings);
  if (background) fillBehind(image.data, background);
  else if (fallback) fillBehind(image.data, fallback);
  context.putImageData(image, 0, 0);
}

/** The edited photo as a file. `quality` (0 to 1) applies to JPG and WebP. */
export async function exportPhoto(photo: LoadedPhoto, settings: PhotoSettings, type: 'image/jpeg' | 'image/png' | 'image/webp', quality: number, size: ExportSize, mask?: CutoutMask | null): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const { scale } = exportDimensions(settings.crop, size);
  // JPG has no transparency: a transparent background becomes white rather than black.
  renderPhoto(canvas, photo, settings, scale, undefined, type === 'image/jpeg' ? '#ffffff' : undefined, mask && { ...mask, cache: {} });
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, type === 'image/png' ? undefined : quality));
  if (!blob) throw new LogoExportError('failed');
  // A browser that cannot encode the format silently returns a PNG instead.
  if (blob.type !== type) throw new LogoExportError('format');
  return blob;
}

/* ------------------------------------------------------------------ cut-out mask */

/** The photo at the size of its mask: what the plain background and the magic wand read. */
export function photoAtMaskSize(photo: LoadedPhoto): ImageData {
  const size = maskDimensions(photo.width, photo.height);
  const canvas = scaledCopy(photo.source, size.width, size.height);
  return context2d(canvas, true).getImageData(0, 0, size.width, size.height);
}

/** A mask canvas from opacities (`alpha`, `width` × `height`), stretched to the mask size of the photo. */
export function maskFromAlpha(photo: LoadedPhoto, alpha: Uint8ClampedArray, width: number, height: number): HTMLCanvasElement {
  const source = createCanvas(width, height);
  const image = new ImageData(width, height);
  for (let index = 0; index < alpha.length; index += 1) {
    image.data[index * 4] = 255;
    image.data[index * 4 + 1] = 255;
    image.data[index * 4 + 2] = 255;
    image.data[index * 4 + 3] = alpha[index];
  }
  context2d(source).putImageData(image, 0, 0);
  const size = maskDimensions(photo.width, photo.height);
  return width === size.width && height === size.height ? source : scaledCopy(source, size.width, size.height);
}

/** The mask of a plain background: what touches the edges and has its color is removed. */
export function plainMask(pixels: ImageData, tolerance: number): HTMLCanvasElement {
  const data = new Uint8ClampedArray(pixels.data);
  removePlainBackground(data, pixels.width, pixels.height, tolerance);
  const alpha = new Uint8ClampedArray(pixels.width * pixels.height);
  for (let index = 0; index < alpha.length; index += 1) alpha[index] = data[index * 4 + 3];
  const canvas = createCanvas(pixels.width, pixels.height);
  const image = new ImageData(pixels.width, pixels.height);
  for (let index = 0; index < alpha.length; index += 1) image.data.set([255, 255, 255, alpha[index]], index * 4);
  context2d(canvas).putImageData(image, 0, 0);
  return canvas;
}

/** The opacities of the mask: what an undo step keeps (a quarter of the RGBA pixels). */
export function maskSnapshot(canvas: HTMLCanvasElement): Uint8ClampedArray {
  const { data } = context2d(canvas, true).getImageData(0, 0, canvas.width, canvas.height);
  const alpha = new Uint8ClampedArray(canvas.width * canvas.height);
  for (let index = 0; index < alpha.length; index += 1) alpha[index] = data[index * 4 + 3];
  return alpha;
}

/** A mask canvas from a snapshot. */
export function maskFromSnapshot(alpha: Uint8ClampedArray, width: number, height: number): HTMLCanvasElement {
  const canvas = createCanvas(width, height);
  const image = new ImageData(width, height);
  for (let index = 0; index < alpha.length; index += 1) image.data.set([255, 255, 255, alpha[index]], index * 4);
  context2d(canvas, true).putImageData(image, 0, 0);
  return canvas;
}

/**
 * A brush stroke on the mask from `from` to `to` (mask pixels): `erase` hides the photo there,
 * `restore` shows it again. Soft round dabs close enough to draw a continuous line.
 */
export function paintMask(canvas: HTMLCanvasElement, from: { x: number; y: number }, to: { x: number; y: number }, radius: number, mode: 'erase' | 'restore'): void {
  const context = context2d(canvas, true);
  context.save();
  context.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(distance / Math.max(1, radius / 3)));
  for (let step = 0; step <= steps; step += 1) {
    const x = from.x + ((to.x - from.x) * step) / steps;
    const y = from.y + ((to.y - from.y) * step) / steps;
    const dab = context.createRadialGradient(x, y, radius * 0.55, x, y, radius);
    dab.addColorStop(0, 'rgba(255,255,255,1)');
    dab.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = dab;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

/** The magic wand on the mask: the area of the touched color is hidden (`erase`) or shown again. */
export function wandMask(canvas: HTMLCanvasElement, pixels: ImageData, point: { x: number; y: number }, tolerance: number, mode: 'erase' | 'restore'): boolean {
  const x = Math.round(point.x);
  const y = Math.round(point.y);
  if (x < 0 || y < 0 || x >= pixels.width || y >= pixels.height) return false;
  const selected = floodSelect(pixels.data, pixels.width, pixels.height, y * pixels.width + x, tolerance);
  const context = context2d(canvas, true);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < selected.length; index += 1) {
    if (selected[index]) image.data[index * 4 + 3] = mode === 'erase' ? 0 : 255;
  }
  context.putImageData(image, 0, 0);
  return true;
}
