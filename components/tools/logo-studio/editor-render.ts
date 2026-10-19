import {
  EXPORT_TYPES,
  MAX_FILE_SIZE,
  MAX_EXPORT_PIXELS,
  MAX_SIDE,
  MAX_SOURCE_PIXELS,
  UNSUPPORTED_FORMATS,
  applyColorMatrix,
  backgroundFill,
  buildSvgDocument,
  colorMatrix,
  contentBounds,
  cropViewBox,
  fitWithin,
  gradientLine,
  hexToRgb,
  isIdentityMatrix,
  outlineAlpha,
  rgba,
  safeColor,
  sharpen,
  sniffFormat,
  svgDimensions,
  svgWorkingSize,
  type ExportFormat,
  type ExportScale,
  type LogoSettings,
  type Rect,
  type SniffedFormat,
  type ViewBox,
} from '@/lib/logo-editor';
import { LOGO_SMOOTH_MAX_SIDE, smoothLogo } from '@/lib/icon-pack';

/**
 * Browser side of the Logo Studio editor: reads the logo into a working canvas, draws the edit
 * and exports it. Nothing leaves the browser.
 */

export type LoadedLogo = {
  /** Changes with each file, so that cached layers of the previous logo are never reused. */
  id: number;
  name: string;
  format: SniffedFormat;
  /** Working copy, `width` × `height` pixels. */
  source: HTMLCanvasElement;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  downscaled: boolean;
  /** The SVG root, cleaned and sized to the working copy: the vector export starts from it. */
  svg?: { markup: string; viewBox: ViewBox };
  /** The decoded SVG, same size as the working copy: drawn from it, the logo stays sharp at any size. */
  vector?: HTMLImageElement;
  /** An image of flat colors redrawn as vectors (`vector`), so that it stays smooth in HD. */
  smoothed?: boolean;
};

export type LoadErrorReason = 'too-large' | 'empty' | 'unsupported' | 'browser' | 'unreadable' | 'too-many-pixels' | 'invalid-svg';

export class LogoLoadError extends Error {
  readonly reason: LoadErrorReason;
  readonly format: SniffedFormat;
  readonly pixels: number;

  constructor(reason: LoadErrorReason, format: SniffedFormat = 'unknown', pixels = 0) {
    super(reason);
    this.reason = reason;
    this.format = format;
    this.pixels = pixels;
  }
}

/** `format`: the browser cannot encode this image format (WebP on older Safari). */
export class LogoExportError extends Error {
  readonly reason: 'format' | 'failed';

  constructor(reason: 'format' | 'failed') {
    super(reason);
    this.reason = reason;
  }
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
let nextLogoId = 1;

export async function loadLogo(file: File): Promise<LoadedLogo> {
  if (file.size > MAX_FILE_SIZE) throw new LogoLoadError('too-large');
  if (file.size === 0) throw new LogoLoadError('empty');
  const head = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
  const format = sniffFormat(head, file.name, file.type);
  if (UNSUPPORTED_FORMATS.has(format)) throw new LogoLoadError('unsupported', format);
  return format === 'svg' ? loadSvg(file) : loadRaster(file, format);
}

async function loadRaster(file: File, format: SniffedFormat): Promise<LoadedLogo> {
  const url = URL.createObjectURL(file);
  try {
    let image: HTMLImageElement;
    try {
      image = await decodeImage(url);
    } catch {
      // HEIC, TIFF and AVIF are images, but not every browser can read them.
      throw new LogoLoadError(format === 'heic' || format === 'tiff' || format === 'avif' ? 'browser' : 'unreadable', format);
    }
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!width || !height) throw new LogoLoadError('unreadable', format);
    if (width * height > MAX_SOURCE_PIXELS) throw new LogoLoadError('too-many-pixels', format, width * height);
    const size = fitWithin(width, height, MAX_SIDE);
    const source = drawWorkingCopy(image, size.width, size.height);
    const vector = await smoothVector(source);
    return {
      id: nextLogoId++,
      name: file.name,
      format,
      source,
      width: size.width,
      height: size.height,
      originalWidth: width,
      originalHeight: height,
      downscaled: size.width !== width || size.height !== height,
      vector,
      smoothed: Boolean(vector),
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function loadSvg(file: File): Promise<LoadedLogo> {
  const root = parseSvg(await file.text());
  if (!root) throw new LogoLoadError('invalid-svg', 'svg');
  cleanSvg(root);
  const dimensions = svgDimensions(root.getAttribute('width'), root.getAttribute('height'), root.getAttribute('viewBox'));
  const size = svgWorkingSize(dimensions.width, dimensions.height);
  root.setAttribute('width', String(size.width));
  root.setAttribute('height', String(size.height));
  root.setAttribute('viewBox', dimensions.viewBox.join(' '));
  root.setAttribute('preserveAspectRatio', 'none');
  const markup = new XMLSerializer().serializeToString(root);
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
  try {
    let image: HTMLImageElement;
    try {
      image = await decodeImage(url);
    } catch {
      throw new LogoLoadError('invalid-svg', 'svg');
    }
    return {
      id: nextLogoId++,
      name: file.name,
      format: 'svg',
      source: drawWorkingCopy(image, size.width, size.height),
      width: size.width,
      height: size.height,
      originalWidth: Math.round(dimensions.width),
      originalHeight: Math.round(dimensions.height),
      downscaled: false,
      svg: { markup, viewBox: dimensions.viewBox },
      vector: image,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * A small logo of flat colors redrawn as vectors, at the size of its working copy: enlarged, its
 * edges stay smooth instead of showing its pixels. Undefined for a photo, a gradient or a large
 * image, which keep their pixels.
 */
async function smoothVector(source: HTMLCanvasElement): Promise<HTMLImageElement | undefined> {
  const { width, height } = source;
  if (Math.max(width, height) > LOGO_SMOOTH_MAX_SIDE) return undefined;
  try {
    const data = context2d(source, true).getImageData(0, 0, width, height).data;
    const traced = smoothLogo(data, width, height);
    if (!traced) return undefined;
    const paths = traced.layers.map((layer) => `<path fill="${layer.color}" d="${layer.d}"/>`).join('');
    const markup = `<svg xmlns="${SVG_NAMESPACE}" width="${width}" height="${height}" viewBox="0 0 ${traced.width} ${traced.height}" preserveAspectRatio="none">${paths}</svg>`;
    const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
    try {
      return await decodeImage(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    // Smoothing is a bonus: without it, the image is edited as it is.
    return undefined;
  }
}

function decodeImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('decode'));
    image.src = url;
  });
}

function parseSvg(text: string): Element | null {
  const parse = (source: string) => {
    const document = new DOMParser().parseFromString(source, 'image/svg+xml');
    const root = document.documentElement;
    return document.getElementsByTagName('parsererror').length || root.localName !== 'svg' ? null : root;
  };
  let root = parse(text);
  // Without the SVG namespace the file is valid XML that no browser draws: add the namespace.
  if (root && root.namespaceURI !== SVG_NAMESPACE) root = parse(text.replace(/<svg\b/, `<svg xmlns="${SVG_NAMESPACE}"`));
  return root?.namespaceURI === SVG_NAMESPACE ? root : null;
}

/**
 * Removes scripts, event attributes and javascript: links, which have no place in a logo, and
 * foreignObject, whose HTML would forbid reading the pixels of the canvas.
 */
function cleanSvg(root: Element): void {
  root.querySelectorAll('script, foreignObject').forEach((node) => node.remove());
  [root, ...Array.from(root.querySelectorAll('*'))].forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const javascriptLink = /(^|:)href$/i.test(attribute.name) && /^\s*javascript:/i.test(attribute.value);
      if (/^on/i.test(attribute.name) || javascriptLink) element.removeAttribute(attribute.name);
    });
  });
}

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

function drawWorkingCopy(image: HTMLImageElement, width: number, height: number): HTMLCanvasElement {
  const canvas = createCanvas(width, height);
  const context = context2d(canvas);
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);
  try {
    // A browser that forbids reading these pixels could not apply any edit.
    context.getImageData(0, 0, 1, 1);
  } catch {
    throw new LogoLoadError('browser');
  }
  return canvas;
}

/** Bounds of the logo without its empty margins, in pixels of the working copy. */
export function trimBounds(logo: LoadedLogo): Rect | null {
  const data = context2d(logo.source, true).getImageData(0, 0, logo.width, logo.height).data;
  return contentBounds(data, logo.width, logo.height);
}

/** The whole working copy, for cropping. */
export function drawSourcePreview(target: HTMLCanvasElement, logo: LoadedLogo, scale: number): void {
  const width = Math.max(1, Math.round(logo.width * scale));
  const height = Math.max(1, Math.round(logo.height * scale));
  if (target.width !== width) target.width = width;
  if (target.height !== height) target.height = height;
  const context = context2d(target);
  context.clearRect(0, 0, width, height);
  context.imageSmoothingQuality = 'high';
  context.drawImage(logo.source, 0, 0, width, height);
}

type Layer = { canvas: HTMLCanvasElement; width: number; height: number; padding: number };
/** The last colored and outlined logo: moving or rotating it does not recompute its pixels. */
export type LayerCache = { key?: string; canvas?: HTMLCanvasElement };

/** The cropped logo with its colors, gradient and outline, at the size it is drawn. */
function logoLayer(logo: LoadedLogo, settings: LogoSettings, scale: number, cache?: LayerCache): Layer {
  const { crop } = settings;
  const width = crop.width * settings.scale * scale;
  const height = crop.height * settings.scale * scale;
  // An SVG is drawn again at the size needed. An image cannot show more detail than its
  // working copy has: beyond MAX_SIDE its pixels would only be enlarged.
  const resolution = logo.vector
    ? Math.min(1, Math.sqrt(MAX_EXPORT_PIXELS / (width * height)))
    : Math.min(1, MAX_SIDE / Math.max(width, height));
  const pixelWidth = Math.max(1, Math.round(width * resolution));
  const pixelHeight = Math.max(1, Math.round(height * resolution));
  const radius = settings.outlineEnabled ? settings.outlineWidth * scale * resolution : 0;
  const padding = radius > 0 ? Math.ceil(radius) + 2 : 0;
  const matrix = colorMatrix(settings);
  const gradient = settings.gradientEnabled && settings.gradientStrength > 0;
  const key = JSON.stringify([
    logo.id, pixelWidth, pixelHeight, padding, radius, crop, matrix,
    gradient && [settings.gradientFrom, settings.gradientTo, settings.gradientAngle, settings.gradientStrength],
    radius > 0 && settings.outlineColor,
  ]);
  const layer = (canvas: HTMLCanvasElement): Layer => ({ canvas, width, height, padding: padding / resolution });
  if (cache?.key === key && cache.canvas) return layer(cache.canvas);

  let canvas = createCanvas(pixelWidth + 2 * padding, pixelHeight + 2 * padding);
  const context = context2d(canvas, true);
  context.imageSmoothingQuality = 'high';
  context.drawImage(logo.vector ?? logo.source, crop.x, crop.y, crop.width, crop.height, padding, padding, pixelWidth, pixelHeight);
  // An enlarged image is blurry: an unsharp mask scaled to the enlargement brings its edges back.
  const enlargement = logo.vector ? 1 : pixelWidth / crop.width;
  if (enlargement >= 1.3 || !isIdentityMatrix(matrix)) {
    const image = context.getImageData(padding, padding, pixelWidth, pixelHeight);
    if (enlargement >= 1.3) sharpen(image.data, pixelWidth, pixelHeight, Math.min(6, Math.max(1, Math.round(enlargement / 2))), 0.7);
    if (!isIdentityMatrix(matrix)) applyColorMatrix(image.data, matrix);
    context.putImageData(image, padding, padding);
  }
  if (gradient) {
    const line = gradientLine(settings.gradientAngle, pixelWidth, pixelHeight);
    const fill = context.createLinearGradient(padding + line.x1, padding + line.y1, padding + line.x2, padding + line.y2);
    fill.addColorStop(0, safeColor(settings.gradientFrom));
    fill.addColorStop(1, safeColor(settings.gradientTo));
    context.save();
    // source-atop paints only where the logo is, keeping its transparency.
    context.globalCompositeOperation = 'source-atop';
    context.globalAlpha = settings.gradientStrength / 100;
    context.fillStyle = fill;
    context.fillRect(padding, padding, pixelWidth, pixelHeight);
    context.restore();
  }
  if (radius > 0) canvas = withOutline(canvas, context, radius, settings.outlineColor);
  if (cache) {
    cache.key = key;
    cache.canvas = canvas;
  }
  return layer(canvas);
}

function withOutline(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, radius: number, color: string): HTMLCanvasElement {
  const { width, height } = canvas;
  const pixels = context.getImageData(0, 0, width, height).data;
  const alpha = new Uint8ClampedArray(width * height);
  for (let index = 0; index < alpha.length; index += 1) alpha[index] = pixels[index * 4 + 3];
  const outline = outlineAlpha(alpha, width, height, radius);
  const [r, g, b] = hexToRgb(color);
  const result = createCanvas(width, height);
  const resultContext = context2d(result);
  const image = resultContext.createImageData(width, height);
  for (let index = 0; index < outline.length; index += 1) {
    image.data[index * 4] = r;
    image.data[index * 4 + 1] = g;
    image.data[index * 4 + 2] = b;
    image.data[index * 4 + 3] = outline[index];
  }
  resultContext.putImageData(image, 0, 0);
  resultContext.drawImage(canvas, 0, 0);
  return result;
}

/**
 * Draws the edit on `target` at `scale` (1 for the export, less for the preview). `fallbackBackground`
 * fills a transparent background, for formats without transparency.
 */
export function renderComposition(
  target: HTMLCanvasElement,
  logo: LoadedLogo,
  settings: LogoSettings,
  scale: number,
  cache?: LayerCache,
  fallbackBackground?: string,
): void {
  const width = Math.max(1, Math.round(settings.canvasWidth * scale));
  const height = Math.max(1, Math.round(settings.canvasHeight * scale));
  if (target.width !== width) target.width = width;
  if (target.height !== height) target.height = height;
  const context = context2d(target);
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, width, height);
  const fill = backgroundFill(settings) ?? fallbackBackground;
  if (fill) {
    context.fillStyle = fill;
    context.fillRect(0, 0, width, height);
  }
  const layer = logoLayer(logo, settings, scale, cache);
  context.save();
  context.globalAlpha = Math.min(1, Math.max(0, settings.opacity / 100));
  if (settings.shadowEnabled && settings.shadowOpacity > 0) {
    // Canvas shadows ignore the rotation below: the offset stays horizontal and vertical.
    context.shadowColor = rgba(settings.shadowColor, settings.shadowOpacity / 100);
    context.shadowBlur = settings.shadowBlur * scale;
    context.shadowOffsetX = settings.shadowX * scale;
    context.shadowOffsetY = settings.shadowY * scale;
  }
  context.translate(settings.x * scale, settings.y * scale);
  context.rotate((settings.rotation * Math.PI) / 180);
  context.scale(settings.flipX ? -1 : 1, settings.flipY ? -1 : 1);
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    layer.canvas,
    -layer.width / 2 - layer.padding,
    -layer.height / 2 - layer.padding,
    layer.width + 2 * layer.padding,
    layer.height + 2 * layer.padding,
  );
  context.restore();
}

function formatViewBox(viewBox: ViewBox): string {
  return viewBox.map((value) => String(Math.round(value * 10000) / 10000)).join(' ');
}

/** The original SVG cropped and placed in the vector export. */
function svgExport(logo: LoadedLogo, settings: LogoSettings): string {
  if (!logo.svg) throw new LogoExportError('format');
  const root = new DOMParser().parseFromString(logo.svg.markup, 'image/svg+xml').documentElement;
  root.setAttribute('x', '0');
  root.setAttribute('y', '0');
  root.setAttribute('width', String(settings.crop.width));
  root.setAttribute('height', String(settings.crop.height));
  root.setAttribute('viewBox', formatViewBox(cropViewBox(settings.crop, logo.width, logo.height, logo.svg.viewBox)));
  root.setAttribute('preserveAspectRatio', 'none');
  return buildSvgDocument(settings, new XMLSerializer().serializeToString(root));
}

/** The edited logo as a file. `quality` (0 to 1) applies to JPG and WebP, `scale` (HD) to images. */
export async function exportLogo(logo: LoadedLogo, settings: LogoSettings, format: ExportFormat, quality: number, scale: ExportScale = 1): Promise<Blob> {
  const type = EXPORT_TYPES[format];
  if (format === 'svg') return new Blob([svgExport(logo, settings)], { type });
  const canvas = document.createElement('canvas');
  // JPG has no transparency: a transparent background becomes white rather than black.
  renderComposition(canvas, logo, settings, scale, undefined, format === 'jpeg' ? '#ffffff' : undefined);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, format === 'png' ? undefined : quality));
  if (!blob) throw new LogoExportError('failed');
  // A browser that cannot encode the format silently returns a PNG instead.
  if (blob.type !== type) throw new LogoExportError('format');
  return blob;
}
