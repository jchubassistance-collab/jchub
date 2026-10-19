import type { Zippable } from 'fflate';
import type { Locale } from '@/i18n/routing';
import { downloadBaseName } from '@/lib/download-name';
import {
  DEFAULT_IMAGE_COLOR,
  TRACE_SIZE,
  buildIco,
  colorLayers,
  containRect,
  escapeXml,
  faviconHead,
  fontCss,
  fontDemoHtml,
  fontEntries,
  glyphContours,
  hasTransparency,
  inkFromAlpha,
  inkFromPixels,
  loopsToPath,
  readme,
  spriteFile,
  svgFile,
  svgMarkup,
  traceInk,
  uniqueSlugs,
  vectorKey,
  type FontEntry,
  type RasterItem,
  type StudioItem,
  type SvgItem,
  type Vector,
} from '@/lib/icon-pack';

/**
 * Browser side of the Logo Studio icon pack: imports the files, vectorizes the images on a canvas and
 * builds the pack. Nothing leaves the browser.
 */

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
/** Margin around an image traced on the TRACE_SIZE square. */
const TRACE_PADDING = Math.round(TRACE_SIZE * 0.04);

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image'));
    image.src = src;
  });
}

export function svgDataUrl(markup: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function context2d(canvas: HTMLCanvasElement, willReadFrequently = false): CanvasRenderingContext2D {
  const context = canvas.getContext('2d', { willReadFrequently });
  if (!context) throw new Error('canvas');
  return context;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ import */

/** SVG elements and links that have no place in an icon and could run code. */
const UNSAFE_ELEMENTS = 'script,foreignObject,iframe,image,style,audio,video,animate,set,animateMotion,animateTransform';

/** Colors become currentColor, so that the icon takes the color chosen in the studio. */
function paintWithCurrentColor(element: Element) {
  for (const attribute of ['fill', 'stroke']) {
    const value = element.getAttribute(attribute)?.trim().toLowerCase();
    if (value && value !== 'none' && value !== 'currentcolor' && !value.startsWith('url(')) element.setAttribute(attribute, 'currentColor');
  }
  const style = element.getAttribute('style');
  if (style !== null) element.setAttribute('style', style.replace(/(fill|stroke)\s*:\s*[^;]+;?/gi, ''));
}

function parseSvgRoot(text: string): Element | null {
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

/** A cleaned SVG icon in one color. Throws when the file is not a valid SVG. */
export function importSvg(text: string, id: string, name: string, color: string): SvgItem {
  const root = parseSvgRoot(text);
  if (!root) throw new Error('svg');
  root.querySelectorAll(UNSAFE_ELEMENTS).forEach((node) => node.remove());
  root.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const attributeName = attribute.name.toLowerCase();
      if (attributeName.startsWith('on')) element.removeAttribute(attribute.name);
      else if ((attributeName === 'href' || attributeName === 'xlink:href') && !attribute.value.trim().startsWith('#')) element.removeAttribute(attribute.name);
    });
    paintWithCurrentColor(element);
  });
  let viewBox = root.getAttribute('viewBox')?.trim() ?? '';
  if (!/^-?[\d.]+([\s,]+-?[\d.]+){3}$/.test(viewBox)) {
    const width = parseFloat(root.getAttribute('width') ?? '') || 24;
    const height = parseFloat(root.getAttribute('height') ?? '') || 24;
    viewBox = `0 0 ${width} ${height}`;
  }
  paintWithCurrentColor(root);
  const kept = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule', 'clip-rule']
    .filter((attribute) => root.hasAttribute(attribute))
    .map((attribute) => `${attribute}="${escapeXml(root.getAttribute(attribute) ?? '')}"`);
  if (!root.hasAttribute('fill')) kept.push('fill="currentColor"');
  const serializer = new XMLSerializer();
  const body = Array.from(root.childNodes).map((node) => serializer.serializeToString(node)).join('');
  return { id, kind: 'svg', name, body, viewBox, rootAttributes: kept.join(' '), color };
}

/** An image kept as it is: it can be vectorized later. */
export async function importRaster(file: File, id: string, name: string): Promise<{ item: RasterItem; image: HTMLImageElement }> {
  const src = await readAsDataUrl(file);
  const image = await loadImage(src);
  // Transparency is measured on a small copy: enough to tell a logo on a transparent background.
  const scale = Math.min(1, 128 / Math.max(image.naturalWidth, image.naturalHeight));
  const sample = createCanvas(Math.max(1, Math.round(image.naturalWidth * scale)), Math.max(1, Math.round(image.naturalHeight * scale)));
  const context = context2d(sample, true);
  context.drawImage(image, 0, 0, sample.width, sample.height);
  const transparent = hasTransparency(context.getImageData(0, 0, sample.width, sample.height).data);
  return {
    item: { id, kind: 'raster', name, src, transparent, mode: 'image', colors: 0, threshold: 150, invert: false, color: DEFAULT_IMAGE_COLOR },
    image,
  };
}

/* ------------------------------------------------------------------ vectorization */

async function rasterVector(item: RasterItem, image: HTMLImageElement): Promise<Vector> {
  const canvas = createCanvas(TRACE_SIZE, TRACE_SIZE);
  const context = context2d(canvas, true);
  if (!item.transparent) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, TRACE_SIZE, TRACE_SIZE);
  }
  const rect = containRect(image.naturalWidth, image.naturalHeight, TRACE_PADDING, TRACE_PADDING, TRACE_SIZE - 2 * TRACE_PADDING);
  context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  const data = context.getImageData(0, 0, TRACE_SIZE, TRACE_SIZE).data;
  const layers = item.colors === 1 ? null : colorLayers(data, TRACE_SIZE, rect, item.transparent, item.colors, item.color);
  if (layers) return { layers, usesThreshold: false };
  const loops = traceInk(inkFromPixels(data, TRACE_SIZE, rect, item.transparent, item.threshold, item.invert), TRACE_SIZE, TRACE_SIZE);
  return { layers: [{ color: item.color, loops, d: loopsToPath(loops) }], usesThreshold: true };
}

/** Stroke or SVG icons become filled shapes: what an icon font needs. */
async function shapeVector(item: StudioItem): Promise<Vector> {
  const image = await loadImage(svgDataUrl(svgMarkup(item, { color: '#000000', size: TRACE_SIZE })));
  const canvas = createCanvas(TRACE_SIZE, TRACE_SIZE);
  const context = context2d(canvas, true);
  context.drawImage(image, 0, 0, TRACE_SIZE, TRACE_SIZE);
  const loops = traceInk(inkFromAlpha(context.getImageData(0, 0, TRACE_SIZE, TRACE_SIZE).data, TRACE_SIZE), TRACE_SIZE, TRACE_SIZE);
  return { layers: [{ color: item.color, loops, d: loopsToPath(loops) }], usesThreshold: false };
}

/** The item with an up-to-date vector: the same object when it already has one. */
export async function withVector<T extends StudioItem>(item: T, image?: HTMLImageElement): Promise<T> {
  const key = vectorKey(item);
  if (item.vector && item.vectorKey === key) return item;
  let vector: Vector;
  if (item.kind === 'raster') {
    if (!image) throw new Error('image');
    vector = await rasterVector(item, image);
  } else {
    vector = await shapeVector(item);
  }
  return { ...item, vector, vectorKey: key };
}

/* ------------------------------------------------------------------ images */

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

export type PngOptions = { background?: string | null; padding?: number; color?: string; mono?: boolean };

/** The item as a `size` px square PNG. An image not vectorized is drawn as it is. */
export async function renderPng(item: StudioItem, size: number, image: HTMLImageElement | undefined, options: PngOptions = {}): Promise<Blob> {
  const canvas = createCanvas(size, size);
  const context = context2d(canvas);
  const padding = options.padding ?? 0;
  const box = size - 2 * padding;
  if (options.background) {
    context.fillStyle = options.background;
    roundedRect(context, 0, 0, size, size, size * 0.22);
    context.fill();
  }
  context.imageSmoothingQuality = 'high';
  if (item.kind === 'raster' && (item.mode === 'image' || !item.vector)) {
    if (!image) throw new Error('image');
    const rect = containRect(image.naturalWidth, image.naturalHeight, padding, padding, box);
    context.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  } else {
    const drawn = await loadImage(svgDataUrl(svgMarkup(item, { color: options.color ?? item.color, size: box, mono: options.mono })));
    context.drawImage(drawn, padding, padding, box, box);
  }
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('png');
  return blob;
}

/* ------------------------------------------------------------------ pack */

async function buildFont(entries: FontEntry[], family: string): Promise<ArrayBuffer> {
  const { Font, Glyph, Path } = await import('opentype.js');
  const glyphs = [new Glyph({ name: '.notdef', unicode: 0, advanceWidth: 1024, path: new Path() })];
  for (const entry of entries) {
    const path = new Path();
    for (const contour of glyphContours(entry.loops)) {
      contour.forEach(([x, y], index) => (index ? path.lineTo(x, y) : path.moveTo(x, y)));
      path.close();
    }
    glyphs.push(new Glyph({ name: entry.glyphName, unicode: entry.code, advanceWidth: 1024, path }));
  }
  return new Font({ familyName: family, styleName: 'Regular', unitsPerEm: 1024, ascender: 960, descender: -64, glyphs }).toArrayBuffer();
}

export type PackStep = 'png' | 'font' | 'favicon' | 'zip';

export type PackOptions = {
  /** Items already vectorized where the chosen formats need it (see neededVectors). */
  items: StudioItem[];
  images: Map<string, HTMLImageElement>;
  locale: Locale;
  formats: { svg: boolean; sprite: boolean; font: boolean; png: boolean; favicon: boolean };
  pngSizes: number[];
  /** Prefix of the CSS classes and sprite ids. */
  prefix: string;
  /** Prefix of the file names: empty keeps the plain icon names. */
  filePrefix: string;
  family: string;
  faviconItem: StudioItem;
  faviconBackground: string | null;
  fallbackName: string;
  onProgress: (step: PackStep) => void;
};

/** Items that must be vectorized before the pack: all of them for the font, images for SVG files and the sprite. */
export function neededVectors(item: StudioItem, formats: PackOptions['formats']): boolean {
  if (formats.font) return true;
  if (item.kind !== 'raster') return false;
  return formats.svg || formats.sprite || item.mode === 'vector';
}

const bytes = async (blob: Blob) => new Uint8Array(await blob.arrayBuffer());

export async function buildPack(options: PackOptions): Promise<{ blob: Blob; count: number }> {
  const { items, images, formats, prefix, family, onProgress, locale } = options;
  const { strToU8, zipSync } = await import('fflate');
  const files: Zippable = {};
  // PNG images are already compressed: storing them as they are keeps the ZIP fast to build.
  const addImage = async (path: string, blob: Blob) => { files[path] = [await bytes(blob), { level: 0 }]; };
  const slugs = uniqueSlugs(items, options.fallbackName);
  const fileName = (id: string) => downloadBaseName(options.filePrefix ? `${options.filePrefix}-${slugs[id]}` : slugs[id]);

  if (formats.svg) for (const item of items) files[`svg/${fileName(item.id)}.svg`] = strToU8(svgFile(item));
  if (formats.sprite) files['sprite/sprite.svg'] = strToU8(spriteFile(items, slugs, prefix));
  if (formats.png && options.pngSizes.length) {
    onProgress('png');
    for (const item of items) {
      for (const size of options.pngSizes) await addImage(`png/${size}/${fileName(item.id)}.png`, await renderPng(item, size, images.get(item.id)));
    }
  }
  if (formats.font) {
    onProgress('font');
    const entries = fontEntries(items, slugs);
    files[`fonts/${family}.otf`] = new Uint8Array(await buildFont(entries, family));
    files['style.css'] = strToU8(fontCss(family, prefix, entries));
    files['demo.html'] = strToU8(fontDemoHtml(prefix, entries, family, locale));
  }
  if (formats.favicon) {
    onProgress('favicon');
    const item = options.faviconItem;
    const background = options.faviconBackground;
    // On a colored background the icon is drawn in white, in one piece.
    const look = (size: number): PngOptions => ({ background, padding: background ? Math.round(size * 0.2) : 0, color: background ? '#ffffff' : item.color, mono: Boolean(background) });
    const render = (size: number) => renderPng(item, size, images.get(item.id), look(size));
    for (const [size, path] of [[16, 'favicon-16x16.png'], [32, 'favicon-32x32.png'], [180, 'apple-touch-icon.png'], [192, 'icon-192.png'], [512, 'icon-512.png']] as const) {
      await addImage(`favicon/${path}`, await render(size));
    }
    const ico = [];
    for (const size of [16, 32, 48]) ico.push({ size, data: await bytes(await render(size)) });
    files['favicon/favicon.ico'] = buildIco(ico);
    files['favicon/head.html'] = strToU8(faviconHead());
  }
  files[locale === 'en' ? 'README.txt' : 'LISEZMOI.txt'] = strToU8(readme(locale));
  onProgress('zip');
  const zip = zipSync(files);
  return { blob: new Blob([zip as Uint8Array<ArrayBuffer>], { type: 'application/zip' }), count: Object.keys(files).length };
}

/** A data URL as a file. fetch() cannot read it here: the site's CSP does not allow data: connections. */
function dataUrlFile(src: string, name: string): File {
  const comma = src.indexOf(',');
  const header = src.slice(0, comma);
  const payload = src.slice(comma + 1);
  const type = /^data:([^;,]+)/.exec(header)?.[1] ?? 'image/png';
  const bytes = header.includes(';base64')
    ? Uint8Array.from(atob(payload), (character) => character.charCodeAt(0))
    : new TextEncoder().encode(decodeURIComponent(payload));
  const extension = ({ 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg' } as Record<string, string>)[type] ?? 'png';
  return new File([bytes], `${name}.${extension}`, { type });
}

/** The item as a file the logo editor can open: the image as it was imported, or the item's SVG. */
export function itemFile(item: StudioItem, name: string): File {
  if (item.kind === 'raster' && (item.mode === 'image' || !item.vector)) return dataUrlFile(item.src, name);
  return new File([svgFile(item)], `${name}.svg`, { type: 'image/svg+xml' });
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
