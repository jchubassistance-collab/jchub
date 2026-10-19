import type { Locale } from '@/i18n/routing';

/**
 * JcHub Logo Studio, icon pack: a set of icons, from the built-in library or from imported SVG, PNG, JPG
 * and WebP files, exported as a pack (SVG files, sprite, PNG, icon font, favicon). This module
 * holds everything that needs no browser, so that the tests can run it; the drawing and the
 * files are made by components/tools/logo-studio/icon-pack.ts.
 */

/** Images are vectorized on a square of this size. */
export const TRACE_SIZE = 1024;
export const MAX_FILES = 30;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const PNG_SIZES = [16, 24, 32, 48, 64, 128, 256, 512];
export const DEFAULT_PNG_SIZES = [32, 64, 128];
const SVG_NS = 'http://www.w3.org/2000/svg';

export type LibraryIcon = { id: string; fr: string; en: string; body: string };

/** Stroke icons drawn on a 24 × 24 grid. */
export const LIBRARY: LibraryIcon[] = [
  { id: 'accueil', fr: 'Accueil', en: 'Home', body: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>' },
  { id: 'recherche', fr: 'Recherche', en: 'Search', body: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.9-4.9"/>' },
  { id: 'courrier', fr: 'Courrier', en: 'Mail', body: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6.5L20.5 7"/>' },
  { id: 'cadenas', fr: 'Cadenas', en: 'Lock', body: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>' },
  { id: 'image', fr: 'Image', en: 'Image', body: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.7"/><path d="m21 16-5-5-9 9"/>' },
  { id: 'document', fr: 'Document', en: 'Document', body: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h7"/>' },
  { id: 'dossier', fr: 'Dossier', en: 'Folder', body: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>' },
  { id: 'utilisateur', fr: 'Utilisateur', en: 'User', body: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 4-6 8-6s7 2 8 6"/>' },
  { id: 'reglages', fr: 'Réglages', en: 'Settings', body: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>' },
  { id: 'etoile', fr: 'Étoile', en: 'Star', body: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>' },
  { id: 'coeur', fr: 'Cœur', en: 'Heart', body: '<path d="M12 20s-8-4.8-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.2 12 20 12 20z"/>' },
  { id: 'horloge', fr: 'Horloge', en: 'Clock', body: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
  { id: 'calendrier', fr: 'Calendrier', en: 'Calendar', body: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>' },
  { id: 'telechargement', fr: 'Téléchargement', en: 'Download', body: '<path d="M12 4v11m-5-5 5 5 5-5"/><path d="M4 20h16"/>' },
  { id: 'envoi', fr: 'Envoi', en: 'Upload', body: '<path d="M12 16V5m-5 5 5-5 5 5"/><path d="M4 20h16"/>' },
  { id: 'lien', fr: 'Lien', en: 'Link', body: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>' },
  { id: 'panier', fr: 'Panier', en: 'Cart', body: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2.5l2.4 11h10.6L21 8H6.5"/>' },
  { id: 'cloche', fr: 'Cloche', en: 'Bell', body: '<path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21h4"/>' },
  { id: 'position', fr: 'Position', en: 'Location', body: '<path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>' },
  { id: 'appareil-photo', fr: 'Appareil photo', en: 'Camera', body: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>' },
  { id: 'code', fr: 'Code', en: 'Code', body: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>' },
  { id: 'eclair', fr: 'Éclair', en: 'Lightning', body: '<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>' },
  { id: 'bouclier', fr: 'Bouclier', en: 'Shield', body: '<path d="M12 3 4.5 6v5.5c0 4.5 3.2 7.8 7.5 9.5 4.3-1.7 7.5-5 7.5-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>' },
  { id: 'graphique', fr: 'Graphique', en: 'Chart', body: '<path d="M4 20V4M4 20h16"/><rect x="7.5" y="12" width="3" height="5"/><rect x="12.5" y="8" width="3" height="9"/><rect x="17.5" y="5" width="3" height="12"/>' },
  { id: 'message', fr: 'Message', en: 'Message', body: '<path d="M4 5h16v11H10l-5 4v-4H4z"/>' },
  { id: 'telephone', fr: 'Téléphone', en: 'Phone', body: '<path d="M6 3h4l1.5 4.5-2.3 1.5a11 11 0 0 0 5.8 5.8l1.5-2.3L21 14v4a2 2 0 0 1-2 2A15 15 0 0 1 4 5a2 2 0 0 1 2-2z"/>' },
  { id: 'partage', fr: 'Partage', en: 'Share', body: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"/>' },
  { id: 'corbeille', fr: 'Corbeille', en: 'Trash', body: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/><path d="M10 11v5M14 11v5"/>' },
];

/** The example set shown on arrival and by « Remettre l'exemple ». */
export const DEFAULT_SET = ['accueil', 'recherche', 'courrier', 'cadenas', 'image', 'document', 'eclair', 'graphique'];

export const DEFAULT_ICON_COLOR = '#2f6bff';
export const DEFAULT_IMAGE_COLOR = '#0b1b33';

/* ------------------------------------------------------------------ items */

export type Point = [number, number];
export type Loop = Point[];
export type VectorLayer = { color: string; loops: Loop[]; d: string };
/** `usesThreshold`: traced in one color from a brightness threshold, so the threshold and Invert apply. */
export type Vector = { layers: VectorLayer[]; usesThreshold: boolean };

type CommonItem = { id: string; name: string; color: string; vector?: Vector; vectorKey?: string };
export type LibraryItem = CommonItem & { kind: 'lib'; libId: string; body: string; strokeWidth: number };
export type SvgItem = CommonItem & { kind: 'svg'; body: string; viewBox: string; rootAttributes: string };
export type RasterItem = CommonItem & {
  kind: 'raster';
  /** The image as a data URL. */
  src: string;
  /** True when the image has transparent areas: its shape is then its opaque pixels. */
  transparent: boolean;
  mode: 'image' | 'vector';
  /** 0 picks the number of colors automatically. */
  colors: number;
  threshold: number;
  invert: boolean;
};
export type StudioItem = LibraryItem | SvgItem | RasterItem;

export function libraryItem(icon: LibraryIcon, id: string, locale: Locale): LibraryItem {
  return { id, kind: 'lib', libId: icon.id, name: slugify(icon[locale]) || icon.id, body: icon.body, color: DEFAULT_ICON_COLOR, strokeWidth: 2 };
}

/* ------------------------------------------------------------------ text */

export function slugify(text: string): string {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    // Ligatures have no accent to drop: \u00ab C\u0153ur \u00bb must give coeur, not c-ur.
    .replace(/\u0153/g, 'oe')
    .replace(/\u00e6/g, 'ae')
    .replace(/\u00df/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function escapeXml(text: string): string {
  return String(text).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] as string);
}

/** The color if it is #rrggbb (what a color input gives), `fallback` otherwise. */
export function safeHex(color: string | undefined, fallback = DEFAULT_ICON_COLOR): string {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : fallback;
}

/** File name of each item, from its name, with -2, -3… for repeated names. */
export function uniqueSlugs(items: StudioItem[], fallback = 'icone'): Record<string, string> {
  const seen = new Set<string>();
  const result: Record<string, string> = {};
  for (const item of items) {
    const base = slugify(item.name) || fallback;
    let candidate = base;
    for (let number = 2; seen.has(candidate); number += 1) candidate = `${base}-${number}`;
    seen.add(candidate);
    result[item.id] = candidate;
  }
  return result;
}

/* ------------------------------------------------------------------ SVG */

/**
 * The item as an SVG document. `mono` draws a multicolor vectorized image as its silhouette in
 * one color. Empty for an image not vectorized yet.
 */
export function svgMarkup(item: StudioItem, options: { color?: string; size?: number; mono?: boolean } = {}): string {
  const color = safeHex(options.color ?? item.color);
  const size = options.size ? ` width="${options.size}" height="${options.size}"` : '';
  if (item.kind === 'lib') {
    return `<svg xmlns="${SVG_NS}" viewBox="0 0 24 24"${size} fill="none" stroke="${color}" stroke-width="${item.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${item.body}</svg>`;
  }
  if (item.kind === 'svg') {
    return `<svg xmlns="${SVG_NS}" viewBox="${escapeXml(item.viewBox)}"${size} ${item.rootAttributes} style="color:${color}">${item.body}</svg>`;
  }
  const layers = item.vector?.layers;
  if (!layers?.length) return '';
  const head = `<svg xmlns="${SVG_NS}" viewBox="0 0 ${TRACE_SIZE} ${TRACE_SIZE}"${size}`;
  if (options.mono || layers.length === 1) return `${head} fill="${color}"><path fill-rule="nonzero" d="${layers[0].d}"/></svg>`;
  return `${head}>${layers.map((layer) => `<path fill="${safeHex(layer.color)}" fill-rule="nonzero" d="${layer.d}"/>`).join('')}</svg>`;
}

/** Content of the item's .svg file, in its color. */
export function svgFile(item: StudioItem): string {
  const color = safeHex(item.color);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${svgMarkup(item, { color }).replace(/currentColor/g, color)}\n`;
}

/** The item as a <symbol> of the sprite: one color items take the color of the text (currentColor). */
export function spriteSymbol(item: StudioItem, id: string): string {
  if (item.kind === 'lib') {
    return `<symbol id="${id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${item.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${item.body}</symbol>`;
  }
  if (item.kind === 'svg') return `<symbol id="${id}" viewBox="${escapeXml(item.viewBox)}" ${item.rootAttributes}>${item.body}</symbol>`;
  const layers = item.vector?.layers ?? [];
  if (layers.length === 1) return `<symbol id="${id}" viewBox="0 0 ${TRACE_SIZE} ${TRACE_SIZE}"><path fill="currentColor" fill-rule="nonzero" d="${layers[0].d}"/></symbol>`;
  return `<symbol id="${id}" viewBox="0 0 ${TRACE_SIZE} ${TRACE_SIZE}">${layers.map((layer) => `<path fill="${safeHex(layer.color)}" fill-rule="nonzero" d="${layer.d}"/>`).join('')}</symbol>`;
}

export function spriteFile(items: StudioItem[], slugs: Record<string, string>, prefix: string): string {
  return `<svg xmlns="${SVG_NS}" style="display:none">\n${items.map((item) => spriteSymbol(item, `${prefix}-${slugs[item.id]}`)).join('\n')}\n</svg>\n`;
}

/** What the vectorization of an item depends on: when it changes, the item is traced again. */
export function vectorKey(item: StudioItem): string {
  if (item.kind === 'raster') return `r|${item.colors}|${item.threshold}|${item.invert}`;
  if (item.kind === 'lib') return `l|${item.strokeWidth}|${item.body}`;
  return `s|${item.viewBox}|${item.rootAttributes}|${item.body}`;
}

/* ------------------------------------------------------------------ vectorization */

export type Rect = { x: number; y: number; width: number; height: number };

/** An image of `width` × `height` scaled to fit a `box` square at (x, y), centered. */
export function containRect(width: number, height: number, x: number, y: number, box: number): Rect {
  const w = width || box;
  const h = height || box;
  const scale = Math.min(box / w, box / h);
  return { x: x + (box - w * scale) / 2, y: y + (box - h * scale) / 2, width: w * scale, height: h * scale };
}

/** True when more than 0.5 % of the pixels are transparent. */
export function hasTransparency(data: ArrayLike<number>): boolean {
  let transparent = 0;
  for (let index = 3; index < data.length; index += 4) if (data[index] < 200) transparent += 1;
  return transparent > (data.length / 4) * 0.005;
}

/**
 * Pixels that belong to the shape (1) or not (0): opaque pixels of an image with transparency,
 * dark pixels (brightness under `threshold`) otherwise. `invert` keeps the light pixels of the
 * image instead, never its margin.
 */
export function inkFromPixels(data: ArrayLike<number>, size: number, rect: Rect, transparent: boolean, threshold: number, invert: boolean): Uint8Array {
  const ink = new Uint8Array(size * size);
  for (let index = 0; index < size * size; index += 1) {
    let on = transparent
      ? data[index * 4 + 3] >= 128
      : 0.299 * data[index * 4] + 0.587 * data[index * 4 + 1] + 0.114 * data[index * 4 + 2] < threshold;
    if (invert) {
      const x = index % size;
      const y = (index / size) | 0;
      on = x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height ? !on : false;
    }
    ink[index] = on ? 1 : 0;
  }
  return ink;
}

/** Opaque pixels (alpha ≥ 128): the shape of a drawn SVG. */
export function inkFromAlpha(data: ArrayLike<number>, size: number): Uint8Array {
  const ink = new Uint8Array(size * size);
  for (let index = 0; index < size * size; index += 1) ink[index] = data[index * 4 + 3] >= 128 ? 1 : 0;
  return ink;
}

function segmentDistance(point: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = dx * dx + dy * dy;
  if (!length) return Math.hypot(point[0] - a[0], point[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / length));
  return Math.hypot(point[0] - (a[0] + t * dx), point[1] - (a[1] + t * dy));
}

/** Douglas-Peucker: drops the points closer than `epsilon` to the simplified line. */
function simplifyLine(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop() as [number, number];
    let farthest = 0;
    let index = -1;
    for (let i = a + 1; i < b; i += 1) {
      const distance = segmentDistance(points[i], points[a], points[b]);
      if (distance > farthest) {
        farthest = distance;
        index = i;
      }
    }
    if (farthest > epsilon && index > 0) {
      keep[index] = 1;
      stack.push([a, index], [index, b]);
    }
  }
  return points.filter((_, index) => keep[index]);
}

/** A closed contour simplified in two halves, split at the point farthest from its start. */
export function simplifyLoop(points: Point[], epsilon: number): Point[] {
  if (points.length < 5) return points;
  let far = 0;
  let farthest = -1;
  for (let index = 1; index < points.length; index += 1) {
    const dx = points[index][0] - points[0][0];
    const dy = points[index][1] - points[0][1];
    if (dx * dx + dy * dy > farthest) {
      farthest = dx * dx + dy * dy;
      far = index;
    }
  }
  const first = simplifyLine(points.slice(0, far + 1), epsilon);
  const second = simplifyLine(points.slice(far).concat([points[0]]), epsilon);
  return first.concat(second.slice(1, -1));
}

export function polygonArea(points: Point[]): number {
  let sum = 0;
  for (let index = 0; index < points.length; index += 1) {
    const next = points[(index + 1) % points.length];
    sum += points[index][0] * next[1] - next[0] * points[index][1];
  }
  return Math.abs(sum / 2);
}

/**
 * Contours of the shape (`ink`, one byte per pixel): each one follows the pixel edges between
 * ink and background, so outer contours and holes turn in opposite directions and a nonzero fill
 * keeps the holes. Contours are simplified; specks smaller than 8 px² are dropped.
 */
export function traceInk(ink: Uint8Array, width: number, height: number, epsilon = 0.9): Loop[] {
  const columns = width + 1;
  const flags = new Uint8Array(columns * (height + 1) * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!ink[y * width + x]) continue;
      if (y === 0 || !ink[(y - 1) * width + x]) flags[(y * columns + x) * 4] = 1;
      if (x === width - 1 || !ink[y * width + x + 1]) flags[(y * columns + x + 1) * 4 + 1] = 1;
      if (y === height - 1 || !ink[(y + 1) * width + x]) flags[((y + 1) * columns + x + 1) * 4 + 2] = 1;
      if (x === 0 || !ink[y * width + x - 1]) flags[((y + 1) * columns + x) * 4 + 3] = 1;
    }
  }
  const DX = [1, 0, -1, 0];
  const DY = [0, 1, 0, -1];
  const loops: Loop[] = [];
  // One pass over the flags: far faster than three nested loops on large images.
  for (let start = flags.indexOf(1); start >= 0; start = flags.indexOf(1, start + 1)) {
    const d0 = start & 3;
    const vx = (start >> 2) % columns;
    const vy = Math.floor((start >> 2) / columns);
    const points: Point[] = [];
    let px = vx;
    let py = vy;
    let direction = d0;
    let previous = -1;
    let guard = 0;
    let closed = true;
    for (;;) {
      if (direction !== previous) points.push([px, py]);
      const current = (py * columns + px) * 4 + direction;
      if (current !== start) flags[current] = 0;
      px += DX[direction];
      py += DY[direction];
      previous = direction;
      // Prefer turning right, then straight on, then left: touching corners stay separate.
      const candidates = [(direction + 1) & 3, direction, (direction + 3) & 3];
      let next = -1;
      for (const candidate of candidates) {
        if (flags[(py * columns + px) * 4 + candidate]) {
          next = candidate;
          break;
        }
      }
      if (next < 0) {
        closed = false;
        break;
      }
      if (px === vx && py === vy && next === d0) break;
      direction = next;
      guard += 1;
      if (guard > 3_000_000) {
        closed = false;
        break;
      }
    }
    flags[start] = 0;
    if (closed && points.length >= 3) {
      const polygon = simplifyLoop(points, epsilon);
      if (polygon.length >= 3 && polygonArea(polygon) >= 8) loops.push(polygon);
    }
  }
  return loops;
}

/** A turn sharper than this (cosine of the angle between two sides) is a corner, kept sharp. */
const CORNER_COSINE = Math.cos((50 * Math.PI) / 180);

function isCorner(previous: Point, point: Point, next: Point): boolean {
  const ax = point[0] - previous[0];
  const ay = point[1] - previous[1];
  const bx = next[0] - point[0];
  const by = next[1] - point[1];
  const length = Math.hypot(ax, ay) * Math.hypot(bx, by);
  return !length || (ax * bx + ay * by) / length < CORNER_COSINE;
}

/**
 * SVG path data of the contours, rounded to a tenth of a pixel. Corners stay sharp; the other
 * points become curves through the middle of their sides, which hides the facets of the trace.
 */
export function loopsToPath(loops: Loop[]): string {
  const round = (value: number) => Math.round(value * 10) / 10;
  const at = (point: Point) => `${round(point[0])} ${round(point[1])}`;
  const middle = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  return loops.map((loop) => {
    const count = loop.length;
    const corners = loop.map((point, index) => isCorner(loop[(index + count - 1) % count], point, loop[(index + 1) % count]));
    // Start on a corner when there is one: the path then closes on it exactly.
    const start = Math.max(0, corners.indexOf(true));
    const points = loop.slice(start).concat(loop.slice(0, start));
    const sharp = corners.slice(start).concat(corners.slice(0, start));
    let path = `M${at(sharp[0] ? points[0] : middle(points[count - 1], points[0]))}`;
    for (let index = sharp[0] ? 1 : 0; index < count; index += 1) {
      path += sharp[index] ? `L${at(points[index])}` : `Q${at(points[index])} ${at(middle(points[index], points[(index + 1) % count]))}`;
    }
    return `${path}Z`;
  }).join('');
}

export function toHex(color: number[]): string {
  return `#${color.map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('')}`;
}

/** k-means on RGB samples (3 numbers each), seeded with the farthest colors. */
export function kmeans(samples: ArrayLike<number>, count: number, k: number): { centers: number[][]; error: number } {
  const distance = (index: number, center: number[]) => {
    const r = samples[index * 3] - center[0];
    const g = samples[index * 3 + 1] - center[1];
    const b = samples[index * 3 + 2] - center[2];
    return r * r + g * g + b * b;
  };
  const mean = [0, 0, 0];
  for (let index = 0; index < count; index += 1) for (let channel = 0; channel < 3; channel += 1) mean[channel] += samples[index * 3 + channel] / count;
  let centers: number[][] = [];
  if (k === 1) centers = [mean];
  else {
    let best = 0;
    let bestDistance = -1;
    for (let index = 0; index < count; index += 1) {
      const d = distance(index, mean);
      if (d > bestDistance) {
        bestDistance = d;
        best = index;
      }
    }
    centers.push([samples[best * 3], samples[best * 3 + 1], samples[best * 3 + 2]]);
    const nearest = new Float32Array(count);
    for (let index = 0; index < count; index += 1) nearest[index] = distance(index, centers[0]);
    while (centers.length < k) {
      best = 0;
      bestDistance = -1;
      for (let index = 0; index < count; index += 1) {
        if (nearest[index] > bestDistance) {
          bestDistance = nearest[index];
          best = index;
        }
      }
      if (bestDistance <= 0) break;
      const center = [samples[best * 3], samples[best * 3 + 1], samples[best * 3 + 2]];
      centers.push(center);
      for (let index = 0; index < count; index += 1) nearest[index] = Math.min(nearest[index], distance(index, center));
    }
  }
  let error = 0;
  for (let round = 0; round < 10; round += 1) {
    const sums = centers.map(() => [0, 0, 0, 0]);
    error = 0;
    for (let index = 0; index < count; index += 1) {
      let closest = 0;
      let closestDistance = Infinity;
      centers.forEach((center, centerIndex) => {
        const d = distance(index, center);
        if (d < closestDistance) {
          closestDistance = d;
          closest = centerIndex;
        }
      });
      error += closestDistance;
      const sum = sums[closest];
      sum[0] += samples[index * 3];
      sum[1] += samples[index * 3 + 1];
      sum[2] += samples[index * 3 + 2];
      sum[3] += 1;
    }
    centers = centers.map((center, centerIndex) => (sums[centerIndex][3] ? sums[centerIndex].slice(0, 3).map((value) => value / sums[centerIndex][3]) : center));
  }
  return { centers, error };
}

/** `wanted` colors, or with 0 the fewest (up to 5) that keep 90 % of the color differences. */
export function pickColorCount(samples: ArrayLike<number>, count: number, wanted: number): number {
  if (wanted > 0) return wanted;
  const single = kmeans(samples, count, 1).error;
  if (single / count < 30) return 1;
  for (let k = 2; k <= 5; k += 1) if (kmeans(samples, count, k).error <= 0.1 * single) return k;
  return 5;
}

/**
 * Multicolor vectorization: groups the colors (k-means), then traces one layer per color.
 * Layers are stacked from the largest to the smallest: the largest covers the whole silhouette
 * and the others sit on it, so a black icon in the middle of a blue diamond stays visible.
 * `data` is the image drawn in `rect` on a `size` square. Null when one color is enough.
 */
export function colorLayers(data: ArrayLike<number>, size: number, rect: Rect, transparent: boolean, wanted: number, fallbackColor: string): VectorLayer[] | null {
  const total = size * size;
  const eligible = new Uint8Array(total);
  const x0 = Math.floor(rect.x);
  const y0 = Math.floor(rect.y);
  const x1 = Math.ceil(rect.x + rect.width);
  const y1 = Math.ceil(rect.y + rect.height);
  let eligibleCount = 0;
  for (let index = 0; index < total; index += 1) {
    const x = index % size;
    const y = (index / size) | 0;
    const inside = transparent ? data[index * 4 + 3] >= 128 : x >= x0 && x < x1 && y >= y0 && y < y1;
    if (inside) {
      eligible[index] = 1;
      eligibleCount += 1;
    }
  }
  if (!eligibleCount) return null;
  const step = Math.max(1, Math.floor(eligibleCount / 20000));
  const samples = new Float32Array(3 * Math.ceil(eligibleCount / step) + 3);
  let count = 0;
  let seen = 0;
  for (let index = 0; index < total; index += 1) {
    if (!eligible[index]) continue;
    if (seen++ % step) continue;
    samples[count * 3] = data[index * 4];
    samples[count * 3 + 1] = data[index * 4 + 1];
    samples[count * 3 + 2] = data[index * 4 + 2];
    count += 1;
  }
  const k = pickColorCount(samples, count, wanted);
  if (k <= 1) return null;
  const { centers } = kmeans(samples, count, k);
  const labels = new Uint8Array(total).fill(255);
  const counts: number[] = new Array(centers.length).fill(0);
  for (let index = 0; index < total; index += 1) {
    if (!eligible[index]) continue;
    let closest = 0;
    let closestDistance = Infinity;
    centers.forEach((center, centerIndex) => {
      const r = data[index * 4] - center[0];
      const g = data[index * 4 + 1] - center[1];
      const b = data[index * 4 + 2] - center[2];
      const d = r * r + g * g + b * b;
      if (d < closestDistance) {
        closestDistance = d;
        closest = centerIndex;
      }
    });
    labels[index] = closest;
    counts[closest] += 1;
  }
  // Without transparency, the color covering most of the image's border is its background.
  let background = -1;
  if (!transparent) {
    const ring: number[] = new Array(centers.length).fill(0);
    let ringTotal = 0;
    const hit = (x: number, y: number) => {
      const label = labels[y * size + x];
      if (label !== 255) {
        ring[label] += 1;
        ringTotal += 1;
      }
    };
    for (let x = x0 + 1; x < x1 - 1; x += 1) {
      hit(x, y0 + 1);
      hit(x, y1 - 2);
    }
    for (let y = y0 + 1; y < y1 - 1; y += 1) {
      hit(x0 + 1, y);
      hit(x1 - 2, y);
    }
    let biggest = 0;
    for (let label = 1; label < centers.length; label += 1) if (ring[label] > ring[biggest]) biggest = label;
    if (ringTotal && ring[biggest] > ringTotal * 0.5) background = biggest;
  }
  const order = centers.map((_, label) => label).filter((label) => label !== background && counts[label] >= 30).sort((a, b) => counts[b] - counts[a]);
  if (!order.length) return null;
  const rank = new Int8Array(centers.length).fill(-1);
  order.forEach((label, position) => { rank[label] = position; });
  const layers: VectorLayer[] = [];
  for (let position = 0; position < order.length; position += 1) {
    const ink = new Uint8Array(total);
    for (let index = 0; index < total; index += 1) {
      const label = labels[index];
      if (label !== 255 && rank[label] >= position) ink[index] = 1;
    }
    const loops = traceInk(ink, size, size);
    if (!loops.length) continue;
    layers.push({ color: order.length === 1 ? fallbackColor : toHex(centers[order[position]]), loops, d: loopsToPath(loops) });
  }
  return layers.length ? layers : null;
}

/* ------------------------------------------------------------------ files of the pack */

/** An .ico file holding the given PNG images (16, 32, 48 px…). */
export function buildIco(images: { size: number; data: Uint8Array }[]): Uint8Array {
  const header = 6 + 16 * images.length;
  const total = images.reduce((sum, image) => sum + image.data.byteLength, header);
  const bytes = new Uint8Array(total);
  const view = new DataView(bytes.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, images.length, true);
  let offset = header;
  images.forEach((image, index) => {
    const entry = 6 + 16 * index;
    view.setUint8(entry, image.size >= 256 ? 0 : image.size);
    view.setUint8(entry + 1, image.size >= 256 ? 0 : image.size);
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, image.data.byteLength, true);
    view.setUint32(entry + 12, offset, true);
    bytes.set(image.data, offset);
    offset += image.data.byteLength;
  });
  return bytes;
}

export type FontEntry = { slug: string; glyphName: string; code: number; loops: Loop[] };

/** Contours of a glyph on a 1024 units em square, the y axis pointing up. */
export function glyphContours(loops: Loop[]): Point[][] {
  return loops.map((loop) => loop.map(([x, y]) => [Math.round((x / TRACE_SIZE) * 1024), Math.round(((TRACE_SIZE - y) / TRACE_SIZE) * 1024 - 64)] as Point));
}

/** Private-use code points from U+E900, a glyph name font tools accept. */
export function fontEntries(items: StudioItem[], slugs: Record<string, string>): FontEntry[] {
  return items.map((item, index) => ({
    slug: slugs[item.id],
    glyphName: `g${index}_${slugs[item.id]}`.replace(/[^A-Za-z0-9_]/g, '_'),
    code: 0xe900 + index,
    loops: item.vector?.layers[0]?.loops ?? [],
  }));
}

export function fontCss(family: string, prefix: string, entries: FontEntry[]): string {
  let css = `@font-face{\n  font-family:"${family}";\n  src:url("fonts/${family}.otf") format("opentype");\n  font-weight:normal;\n  font-style:normal;\n  font-display:block;\n}\n\n`;
  css += `[class^="${prefix}-"],[class*=" ${prefix}-"]{\n  font-family:"${family}"!important;\n  font-style:normal;\n  font-weight:normal;\n  font-variant:normal;\n  text-transform:none;\n  line-height:1;\n  -webkit-font-smoothing:antialiased;\n}\n\n`;
  for (const entry of entries) css += `.${prefix}-${entry.slug}:before{content:"\\${entry.code.toString(16)}"}\n`;
  return css;
}

export function fontDemoHtml(prefix: string, entries: FontEntry[], family: string, locale: Locale): string {
  const cells = entries.map((entry) => `  <div class="cell"><i class="${prefix}-${entry.slug}"></i><code>${prefix}-${entry.slug}</code></div>`).join('\n');
  return `<!doctype html>\n<html lang="${locale}"><head><meta charset="utf-8"><title>${escapeXml(family)}</title>\n<link rel="stylesheet" href="style.css">\n`
    + '<style>body{font:16px system-ui,sans-serif;margin:32px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px}.cell{border:1px solid #d6deec;border-radius:12px;padding:16px;text-align:center}.cell i{font-size:40px;display:block;margin-bottom:8px}code{font-size:12px}</style></head>\n'
    + `<body><h1>${escapeXml(family)}</h1>\n<div class="g">\n${cells}\n</div></body></html>\n`;
}

export function faviconHead(): string {
  return '<link rel="icon" href="/favicon.ico" sizes="48x48">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n';
}

export function readme(locale: Locale): string {
  return locale === 'en'
    ? 'Pack made with JcHub Logo Studio (https://jchub.dev/en/tools/logo-studio).\n\nsvg/: one icon per file\nsprite/: SVG sprite (use <use href="sprite.svg#prefix-name">)\npng/: images by size\nfonts/ + style.css + demo.html: icon font\nfavicon/: favicon.ico, PNG images and HTML tags\n'
    : 'Pack créé avec JcHub Logo Studio (https://jchub.dev/fr/outils/logo-studio).\n\nsvg/ : une icône par fichier\nsprite/ : sprite SVG (utilise <use href="sprite.svg#prefixe-nom">)\npng/ : images par taille\nfonts/ + style.css + demo.html : police d’icônes\nfavicon/ : favicon.ico, PNG et balises HTML\n';
}

export type UsageTab = 'sprite' | 'font' | 'favicon';

/** Code showing how to use the selected icon from the pack. */
export function usageCode(tab: UsageTab, options: { prefix: string; family: string; name: string; color: string; locale: Locale }): string {
  const { prefix, family, name, color, locale } = options;
  const english = locale === 'en';
  if (tab === 'sprite') {
    return `<!-- sprite/sprite.svg: ${english ? 'put it in your project' : 'à placer dans ton projet'} -->\n<svg class="icon" width="24" height="24" aria-hidden="true">\n  <use href="sprite.svg#${prefix}-${name}"></use>\n</svg>\n\n/* CSS */\n.icon{color:${color}}`;
  }
  if (tab === 'font') {
    return `<link rel="stylesheet" href="style.css">\n\n<i class="${prefix}-${name}" aria-hidden="true"></i>\n\n/* ${english ? 'Size and color like text' : 'Taille et couleur comme du texte'} */\n.${prefix}-${name}{font-size:24px;color:${color}}\n\n/* ${english ? 'Font' : 'Police'}: fonts/${family}.otf */`;
  }
  return faviconHead().trim();
}

/* ------------------------------------------------------------------ smoothing of flat logos */

/** Logos up to this size are smoothed; they are traced on a grid at least this large. */
export const LOGO_TRACE_SIDE = 768;
/** Larger images already have enough pixels for an HD export. */
export const LOGO_SMOOTH_MAX_SIDE = 1024;
const TRANSPARENT = 255;

function colorDistance(data: ArrayLike<number>, at: number, color: number[]): number {
  const r = data[at] - color[0];
  const g = data[at + 1] - color[1];
  const b = data[at + 2] - color[2];
  return Math.sqrt(r * r + g * g + b * b);
}

function nearestColor(data: ArrayLike<number>, at: number, palette: number[][], allowed = -1): { index: number; distance: number } {
  let index = -1;
  let squared = Infinity;
  for (let candidate = 0; candidate < palette.length; candidate += 1) {
    if (!(allowed & (1 << candidate))) continue;
    const color = palette[candidate];
    const r = data[at] - color[0];
    const g = data[at + 1] - color[1];
    const b = data[at + 2] - color[2];
    const d = r * r + g * g + b * b;
    if (d < squared) {
      squared = d;
      index = candidate;
    }
  }
  return { index, distance: Math.sqrt(squared) };
}

/** Distance from `color` to the segment between two colors: small for a mix of both. */
function isBlend(color: number[], palette: number[][]): boolean {
  for (let first = 0; first < palette.length; first += 1) {
    for (let second = first + 1; second < palette.length; second += 1) {
      const a = palette[first];
      const b = palette[second];
      const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const length = ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2];
      if (!length) continue;
      const t = ((color[0] - a[0]) * ab[0] + (color[1] - a[1]) * ab[1] + (color[2] - a[2]) * ab[2]) / length;
      if (t <= 0.05 || t >= 0.95) continue;
      if (colorDistance([a[0] + t * ab[0], a[1] + t * ab[1], a[2] + t * ab[2]], 0, color) <= 8) return true;
    }
  }
  return false;
}

/** Share of the pixels of this exact color (`key`) whose eight neighbors have it too. */
function interiorShare(data: ArrayLike<number>, width: number, height: number, key: number): number {
  const keyAt = (x: number, y: number) => {
    const at = (y * width + x) * 4;
    return data[at + 3] >= 250 ? (data[at] << 16) | (data[at + 1] << 8) | data[at + 2] : -1;
  };
  let total = 0;
  let inside = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (keyAt(x, y) !== key) continue;
      total += 1;
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) continue;
      let surrounded = true;
      for (let dy = -1; dy <= 1 && surrounded; dy += 1) for (let dx = -1; dx <= 1; dx += 1) if (keyAt(x + dx, y + dy) !== key) { surrounded = false; break; }
      if (surrounded) inside += 1;
    }
  }
  return total ? inside / total : 0;
}

/**
 * The exact colors of a logo made of flat colors (RGBA `data`), or null for a photo, a gradient, a
 * soft shadow or too many colors, which flat colors would spoil. Flat means: a few colors cover
 * the logo, and every other pixel is an anti-aliased edge right next to them.
 */
export function flatPalette(data: ArrayLike<number>, width: number, height: number): number[][] | null {
  const total = width * height;
  const counts = new Map<number, number>();
  let visible = 0;
  for (let index = 0; index < total; index += 1) {
    const alpha = data[index * 4 + 3];
    if (alpha >= 128) visible += 1;
    if (alpha < 250) continue;
    const key = (data[index * 4] << 16) | (data[index * 4 + 1] << 8) | data[index * 4 + 2];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (visible < 64) return null;
  const palette: number[][] = [];
  for (const [key, count] of Array.from(counts).sort((a, b) => b[1] - a[1])) {
    if (count < visible * 0.002) break;
    const color = [(key >> 16) & 255, (key >> 8) & 255, key & 255];
    // Shades a few levels apart (compression) are the same color.
    if (palette.some((kept) => colorDistance(color, 0, kept) < 10)) continue;
    // A mix of two colors already kept, drawn only in thin strokes, is the anti-aliasing of their edge.
    if (isBlend(color, palette) && interiorShare(data, width, height, key) < 0.5) continue;
    palette.push(color);
    if (palette.length > 12) return null;
  }
  if (!palette.length) return null;
  const covered = new Uint8Array(total);
  let uncovered = 0;
  for (let index = 0; index < total; index += 1) {
    const alpha = data[index * 4 + 3];
    if (alpha < 8 || (alpha >= 250 && nearestColor(data, index * 4, palette).distance <= 6)) covered[index] = 1;
    else if (alpha >= 128) uncovered += 1;
  }
  // Pixels of no palette color are only allowed along the edges, never far from a flat area.
  let far = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (covered[y * width + x]) continue;
      let near = false;
      for (let dy = -2; dy <= 2 && !near; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < width && ny < height && covered[ny * width + nx]) {
            near = true;
            break;
          }
        }
      }
      if (!near) far += 1;
    }
  }
  return uncovered <= visible * 0.3 && far <= visible * 0.01 ? palette : null;
}

/**
 * A flat logo redrawn as vector shapes, one per color, traced on a grid of at least `side` px for
 * its longest side. The image is enlarged smoothly first and each pixel takes the nearest color found around
 * it in the original: edges land between the pixels and no third color appears along them.
 */
export function vectorizeFlatLogo(data: ArrayLike<number>, width: number, height: number, palette: number[][], side = LOGO_TRACE_SIDE): { width: number; height: number; layers: VectorLayer[] } {
  const all = (1 << palette.length) - 1;
  const transparentBit = 1 << 15;
  // Colors allowed around each original pixel: the flat colors of its 3 × 3 neighbors.
  const own = new Uint16Array(width * height);
  for (let index = 0; index < width * height; index += 1) {
    const alpha = data[index * 4 + 3];
    if (alpha < 8) own[index] = transparentBit;
    else if (alpha >= 250) {
      const nearest = nearestColor(data, index * 4, palette);
      if (nearest.distance <= 6) own[index] = 1 << nearest.index;
    }
  }
  const allowed = new Uint16Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let mask = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < width && ny < height) mask |= own[ny * width + nx];
        }
      }
      allowed[y * width + x] = mask & all ? mask & all : all;
    }
  }

  // Never fewer pixels than the original: no detail is lost.
  const scale = Math.max(1, side / Math.max(width, height));
  const traceWidth = Math.max(1, Math.round(width * scale));
  const traceHeight = Math.max(1, Math.round(height * scale));
  const labels = new Uint8Array(traceWidth * traceHeight).fill(TRANSPARENT);
  const counts: number[] = new Array(palette.length).fill(0);
  // A cell between four original pixels of the same flat color takes that color: no need to
  // interpolate it. -1 for the cells along an edge.
  const uniform = new Int16Array(width * height).fill(-1);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const first = own[y * width + x];
      const right = own[y * width + Math.min(width - 1, x + 1)];
      const below = own[Math.min(height - 1, y + 1) * width + x];
      const diagonal = own[Math.min(height - 1, y + 1) * width + Math.min(width - 1, x + 1)];
      if (!first || first !== right || first !== below || first !== diagonal) continue;
      uniform[y * width + x] = first === transparentBit ? TRANSPARENT : 31 - Math.clz32(first);
    }
  }
  const pixel = [0, 0, 0];
  let alpha = 0;
  let mask = 0;
  // Bilinear, on premultiplied colors: transparent pixels do not darken the edges.
  const add = (x: number, y: number, weight: number) => {
    const at = (y * width + x) * 4;
    const a = data[at + 3] * weight;
    alpha += a;
    pixel[0] += data[at] * a;
    pixel[1] += data[at + 1] * a;
    pixel[2] += data[at + 2] * a;
    mask |= allowed[y * width + x];
  };
  for (let ty = 0; ty < traceHeight; ty += 1) {
    const sy = Math.min(height - 1, Math.max(0, (ty + 0.5) / scale - 0.5));
    const y0 = Math.floor(sy);
    const y1 = Math.min(height - 1, y0 + 1);
    const fy = sy - y0;
    for (let tx = 0; tx < traceWidth; tx += 1) {
      const sx = Math.min(width - 1, Math.max(0, (tx + 0.5) / scale - 0.5));
      const x0 = Math.floor(sx);
      const x1 = Math.min(width - 1, x0 + 1);
      const fx = sx - x0;
      const known = uniform[y0 * width + x0];
      if (known >= 0) {
        if (known !== TRANSPARENT) {
          labels[ty * traceWidth + tx] = known;
          counts[known] += 1;
        }
        continue;
      }
      alpha = 0;
      mask = 0;
      pixel[0] = 0;
      pixel[1] = 0;
      pixel[2] = 0;
      add(x0, y0, (1 - fx) * (1 - fy));
      add(x1, y0, fx * (1 - fy));
      add(x0, y1, (1 - fx) * fy);
      add(x1, y1, fx * fy);
      if (alpha < 128) continue;
      pixel[0] /= alpha;
      pixel[1] /= alpha;
      pixel[2] /= alpha;
      const { index } = nearestColor(pixel, 0, palette, mask & all ? mask & all : all);
      labels[ty * traceWidth + tx] = index;
      counts[index] += 1;
    }
  }

  // Largest color at the bottom, each smaller one on top. A color also reaches 2 px under the
  // colors drawn above it: their anti-aliased edges then blend with it, the color really next to
  // them, never with a color further down nor with the background.
  const order = palette.map((_, index) => index).filter((index) => counts[index] > 0).sort((a, b) => counts[b] - counts[a]);
  const rank = new Int8Array(palette.length).fill(-1);
  order.forEach((index, position) => { rank[index] = position; });
  // Bit r set: a pixel of rank r is less than 2 px away.
  const near = new Uint16Array(labels.length);
  for (let index = 0; index < labels.length; index += 1) if (labels[index] !== TRANSPARENT) near[index] = 1 << rank[labels[index]];
  orWindow(near, traceWidth, traceHeight, 2);
  const layers: VectorLayer[] = [];
  const layer = new Uint8Array(labels.length);
  for (let position = 0; position < order.length; position += 1) {
    const bit = 1 << position;
    // Each layer is traced on its own bounding box only: the small colors cost little.
    let left = traceWidth;
    let top = traceHeight;
    let right = -1;
    let bottom = -1;
    for (let y = 0, index = 0; y < traceHeight; y += 1) {
      for (let x = 0; x < traceWidth; x += 1, index += 1) {
        const label = labels[index];
        const level = label === TRANSPARENT ? -1 : rank[label];
        if (level !== position && !(level > position && near[index] & bit)) {
          layer[index] = 0;
          continue;
        }
        layer[index] = 1;
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
    if (right < 0) continue;
    const boxWidth = right - left + 1;
    const boxHeight = bottom - top + 1;
    const ink = new Uint8Array(boxWidth * boxHeight);
    for (let y = 0; y < boxHeight; y += 1) ink.set(layer.subarray((top + y) * traceWidth + left, (top + y) * traceWidth + left + boxWidth), y * boxWidth);
    // Details smaller than a quarter of an original pixel are noise of the enlargement.
    const loops = traceInk(ink, boxWidth, boxHeight, Math.max(0.9, scale / 4)).map((loop) => loop.map(([x, y]) => [x + left, y + top] as Point));
    if (loops.length) layers.push({ color: toHex(palette[order[position]]), loops, d: loopsToPath(loops) });
  }
  return { width: traceWidth, height: traceHeight, layers };
}

/** Each value ORed, in place, with its neighbors up to `radius` px away (a square). */
function orWindow(values: Uint16Array, width: number, height: number, radius: number): void {
  const rows = new Uint16Array(values.length);
  for (let y = 0; y < height; y += 1) {
    const line = y * width;
    for (let x = 0; x < width; x += 1) {
      let bits = 0;
      for (let at = Math.max(0, x - radius); at <= Math.min(width - 1, x + radius); at += 1) bits |= values[line + at];
      rows[line + x] = bits;
    }
  }
  for (let y = 0; y < height; y += 1) {
    const from = Math.max(0, y - radius);
    const to = Math.min(height - 1, y + radius);
    for (let x = 0; x < width; x += 1) {
      let bits = 0;
      for (let row = from; row <= to; row += 1) bits |= rows[row * width + x];
      values[y * width + x] = bits;
    }
  }
}

/**
 * Side of the square blocks of an image enlarged without smoothing (each pixel repeated 2 to 8
 * times), or 1. Such an image is traced from its real pixels, whose shades give smooth edges.
 */
export function pixelBlock(data: ArrayLike<number>, width: number, height: number): number {
  for (let size = 8; size >= 2; size -= 1) {
    if (width % size || height % size || width / size < 16 || height / size < 16) continue;
    let same = true;
    for (let y = 0; y < height && same; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const at = (y * width + x) * 4;
        const corner = ((y - (y % size)) * width + x - (x % size)) * 4;
        if (data[at] !== data[corner] || data[at + 1] !== data[corner + 1] || data[at + 2] !== data[corner + 2] || data[at + 3] !== data[corner + 3]) {
          same = false;
          break;
        }
      }
    }
    if (same) return size;
  }
  return 1;
}

/**
 * A logo of flat colors redrawn as vector shapes (see vectorizeFlatLogo), or null when it is a
 * photo, a gradient or a soft shadow, which must keep their pixels.
 */
export function smoothLogo(data: ArrayLike<number>, width: number, height: number, side = LOGO_TRACE_SIDE): { width: number; height: number; layers: VectorLayer[] } | null {
  const block = pixelBlock(data, width, height);
  let pixels = data;
  if (block > 1) {
    const small = new Uint8ClampedArray((width / block) * (height / block) * 4);
    for (let y = 0; y < height / block; y += 1) {
      for (let x = 0; x < width / block; x += 1) {
        const at = (y * block * width + x * block) * 4;
        small.set([data[at], data[at + 1], data[at + 2], data[at + 3]], (y * (width / block) + x) * 4);
      }
    }
    pixels = small;
    width /= block;
    height /= block;
  }
  const palette = flatPalette(pixels, width, height);
  if (!palette) return null;
  const traced = vectorizeFlatLogo(pixels, width, height, palette, side);
  return traced.layers.length ? traced : null;
}
