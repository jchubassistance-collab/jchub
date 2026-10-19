/**
 * JcHub Logo Studio, logo editor: the settings of an edit and every computation that does not
 * need a browser (color matrix, outline, geometry, crop, history, file formats, SVG export), so
 * that the tests can run them. The canvas rendering lives in components/tools/logo-studio/editor-render.ts.
 */

/** Larger files are refused: a logo rarely weighs more than a few megabytes. */
export const MAX_FILE_SIZE = 25 * 1024 * 1024;
/** Larger images are refused before the browser runs out of memory decoding them. */
export const MAX_SOURCE_PIXELS = 50_000_000;
/** Longest side of the working copy and of the canvas: 4096 × 4096 is also the largest canvas Safari on iOS draws. */
export const MAX_SIDE = 4096;
/** Export resolutions: 1 = canvas size, 2 = HD, 4 = Ultra HD. */
export const EXPORT_SCALES = [1, 2, 4] as const;
export type ExportScale = (typeof EXPORT_SCALES)[number];
/** Largest exported image (4096 × 4096): beyond it, Safari on iPhone returns an empty canvas. */
export const MAX_EXPORT_PIXELS = 4096 * 4096;
/** SVGs are drawn with at least this longest side: they are vectors, so they stay sharp when enlarged. */
export const SVG_MIN_SIDE = 1024;

export type Rect = { x: number; y: number; width: number; height: number };
export type Background = 'transparent' | 'white' | 'black' | 'custom';
export type ExportFormat = 'png' | 'jpeg' | 'webp' | 'svg';

export const EXPORT_TYPES: Record<ExportFormat, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml' };
export const EXPORT_EXTENSIONS: Record<ExportFormat, string> = { png: 'png', jpeg: 'jpg', webp: 'webp', svg: 'svg' };

/**
 * Everything the visitor can change. Lengths are in pixels of the canvas (the exported image),
 * the crop in pixels of the working copy of the logo, percentages from -100 to 100 unless noted.
 */
export type LogoSettings = {
  brightness: number;
  contrast: number;
  saturation: number;
  /** Degrees, -180 to 180. */
  hue: number;
  invert: boolean;
  /** Recolors the logo with one color, `tintAmount` % of the way (0 to 100). */
  tintEnabled: boolean;
  tintColor: string;
  tintAmount: number;
  /** 0 to 100. */
  opacity: number;
  background: Background;
  backgroundColor: string;
  shadowEnabled: boolean;
  shadowColor: string;
  /** 0 to 100. */
  shadowOpacity: number;
  shadowBlur: number;
  shadowX: number;
  shadowY: number;
  outlineEnabled: boolean;
  outlineColor: string;
  outlineWidth: number;
  gradientEnabled: boolean;
  gradientFrom: string;
  gradientTo: string;
  /** Degrees: 0 runs left to right, 90 top to bottom. */
  gradientAngle: number;
  /** 0 to 100. */
  gradientStrength: number;
  crop: Rect;
  /** Center of the logo on the canvas. */
  x: number;
  y: number;
  /** 1 draws the cropped logo at the size of the working copy. */
  scale: number;
  /** Degrees, -180 to 180. */
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  /** While true the canvas follows the logo: its size is the logo's, effects included, and the logo stays centered. */
  autoFit: boolean;
  canvasWidth: number;
  canvasHeight: number;
};

export function initialSettings(width: number, height: number): LogoSettings {
  const size = Math.max(width, height);
  return {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0,
    invert: false,
    tintEnabled: false,
    tintColor: '#2563eb',
    tintAmount: 100,
    opacity: 100,
    background: 'transparent',
    backgroundColor: '#eff6ff',
    shadowEnabled: false,
    shadowColor: '#0f172a',
    shadowOpacity: 35,
    shadowBlur: Math.max(2, Math.round(size * 0.04)),
    shadowX: 0,
    shadowY: Math.max(1, Math.round(size * 0.02)),
    outlineEnabled: false,
    outlineColor: '#ffffff',
    outlineWidth: Math.max(1, Math.round(size * 0.015)),
    gradientEnabled: false,
    gradientFrom: '#2563eb',
    gradientTo: '#06b6d4',
    gradientAngle: 45,
    gradientStrength: 100,
    crop: { x: 0, y: 0, width, height },
    x: width / 2,
    y: height / 2,
    scale: 1,
    rotation: 0,
    flipX: false,
    flipY: false,
    autoFit: true,
    canvasWidth: width,
    canvasHeight: height,
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/* ------------------------------------------------------------------ colors */

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** The color if it is a #rrggbb value (what <input type="color"> gives), black otherwise. */
export function safeColor(color: string): string {
  return HEX_COLOR.test(color) ? color.toLowerCase() : '#000000';
}

export function hexToRgb(color: string): [number, number, number] {
  const value = parseInt(safeColor(color).slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

export function rgba(color: string, alpha: number): string {
  const [r, g, b] = hexToRgb(color);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

/** Color filling the canvas behind the logo, null when transparent. */
export function backgroundFill(settings: LogoSettings): string | null {
  if (settings.background === 'white') return '#ffffff';
  if (settings.background === 'black') return '#000000';
  if (settings.background === 'custom') return safeColor(settings.backgroundColor);
  return null;
}

/**
 * Affine color transform: 3 rows (R, G, B) of 4 numbers (R, G, B factors then offset), for
 * channels between 0 and 1. It is the RGB part of an SVG feColorMatrix, so the canvas preview
 * and the SVG export apply exactly the same computation; alpha is never changed.
 */
export type ColorMatrix = number[];

export const IDENTITY_MATRIX: ColorMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];

/** `outer` applied after `inner`. */
function compose(outer: ColorMatrix, inner: ColorMatrix): ColorMatrix {
  const result: number[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      let sum = column === 3 ? outer[row * 4 + 3] : 0;
      for (let k = 0; k < 3; k += 1) sum += outer[row * 4 + k] * inner[k * 4 + column];
      result.push(sum);
    }
  }
  return result;
}

/** feColorMatrix type="saturate" (1 keeps the colors, 0 is grayscale, 2 doubles the saturation). */
function saturateMatrix(amount: number): ColorMatrix {
  const s = amount;
  return [
    0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s, 0,
    0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s, 0,
    0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s, 0,
  ];
}

/** feColorMatrix type="hueRotate". */
function hueRotateMatrix(degrees: number): ColorMatrix {
  const angle = (degrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    0.213 + cos * 0.787 - sin * 0.213, 0.715 - cos * 0.715 - sin * 0.715, 0.072 - cos * 0.072 + sin * 0.928, 0,
    0.213 - cos * 0.213 + sin * 0.143, 0.715 + cos * 0.285 + sin * 0.14, 0.072 - cos * 0.072 - sin * 0.283, 0,
    0.213 - cos * 0.213 - sin * 0.787, 0.715 - cos * 0.715 + sin * 0.715, 0.072 + cos * 0.928 + sin * 0.072, 0,
  ];
}

/** Inversion, brightness and contrast, saturation, hue, then recoloring, as one matrix. */
export function colorMatrix(settings: LogoSettings): ColorMatrix {
  let matrix = IDENTITY_MATRIX;
  if (settings.invert) matrix = compose([-1, 0, 0, 1, 0, -1, 0, 1, 0, 0, -1, 1], matrix);
  const brightness = 1 + clamp(settings.brightness, -100, 100) / 100;
  const contrast = 1 + clamp(settings.contrast, -100, 100) / 100;
  if (brightness !== 1 || contrast !== 1) {
    // Same as the CSS filters brightness() then contrast().
    const slope = brightness * contrast;
    const offset = 0.5 - 0.5 * contrast;
    matrix = compose([slope, 0, 0, offset, 0, slope, 0, offset, 0, 0, slope, offset], matrix);
  }
  if (settings.saturation) matrix = compose(saturateMatrix(1 + clamp(settings.saturation, -100, 100) / 100), matrix);
  if (settings.hue) matrix = compose(hueRotateMatrix(settings.hue), matrix);
  if (settings.tintEnabled && settings.tintAmount > 0) {
    const amount = clamp(settings.tintAmount, 0, 100) / 100;
    const [r, g, b] = hexToRgb(settings.tintColor).map((channel) => channel / 255);
    const keep = 1 - amount;
    matrix = compose([keep, 0, 0, amount * r, 0, keep, 0, amount * g, 0, 0, keep, amount * b], matrix);
  }
  return matrix;
}

export function isIdentityMatrix(matrix: ColorMatrix): boolean {
  return matrix.every((value, index) => Math.abs(value - IDENTITY_MATRIX[index]) < 1e-9);
}

/** Applies the matrix to RGBA pixels (not premultiplied, as getImageData returns them), in place. */
export function applyColorMatrix(data: Uint8ClampedArray, matrix: ColorMatrix): void {
  const [m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11] = matrix;
  const o0 = m3 * 255;
  const o1 = m7 * 255;
  const o2 = m11 * 255;
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] === 0) continue;
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    data[index] = m0 * r + m1 * g + m2 * b + o0;
    data[index + 1] = m4 * r + m5 * g + m6 * b + o1;
    data[index + 2] = m8 * r + m9 * g + m10 * b + o2;
  }
}

/** The 20 values of the SVG feColorMatrix equal to `matrix` (alpha unchanged). */
export function svgMatrixValues(matrix: ColorMatrix): string {
  const rows = [0, 1, 2].map((row) => [...matrix.slice(row * 4, row * 4 + 3), 0, matrix[row * 4 + 3]]);
  return [...rows.flat(), 0, 0, 0, 1, 0].map(formatNumber).join(' ');
}

/** Start and end of the gradient in a box of the given size. */
export function gradientLine(angle: number, width: number, height: number): { x1: number; y1: number; x2: number; y2: number } {
  const radians = (angle * Math.PI) / 180;
  const dx = Math.cos(radians) / 2;
  const dy = Math.sin(radians) / 2;
  return { x1: (0.5 - dx) * width, y1: (0.5 - dy) * height, x2: (0.5 + dx) * width, y2: (0.5 + dy) * height };
}

/* ------------------------------------------------------------------ outline */

const FAR = 1e20;

/** Squared distance transform of one line (Felzenszwalb & Huttenlocher). */
function distanceLine(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array): void {
  let k = 0;
  v[0] = 0;
  z[0] = -FAR;
  z[1] = FAR;
  for (let q = 1; q < n; q += 1) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k -= 1;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k += 1;
    v[k] = q;
    z[k] = s;
    z[k + 1] = FAR;
  }
  k = 0;
  for (let q = 0; q < n; q += 1) {
    while (z[k + 1] < q) k += 1;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

/**
 * Alpha (one byte per pixel) of an outline `radius` pixels wide around the opaque pixels of
 * `alpha`, with a soft edge. The distance is exact, so thin strokes and dots get a round outline
 * too. The image must already have room for the outline around the logo.
 */
export function outlineAlpha(alpha: ArrayLike<number>, width: number, height: number, radius: number): Uint8ClampedArray {
  const grid = new Float32Array(width * height);
  for (let index = 0; index < grid.length; index += 1) grid[index] = alpha[index] >= 128 ? 0 : FAR;
  const longest = Math.max(width, height);
  const f = new Float64Array(longest);
  const d = new Float64Array(longest);
  const v = new Int32Array(longest);
  const z = new Float64Array(longest + 1);
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) f[y] = grid[y * width + x];
    distanceLine(f, height, d, v, z);
    for (let y = 0; y < height; y += 1) grid[y * width + x] = d[y];
  }
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    for (let x = 0; x < width; x += 1) f[x] = grid[row + x];
    distanceLine(f, width, d, v, z);
    for (let x = 0; x < width; x += 1) grid[row + x] = d[x];
  }
  // Pixels `radius` away from the logo are fully covered, those one pixel further not at all.
  const result = new Uint8ClampedArray(width * height);
  for (let index = 0; index < result.length; index += 1) {
    result[index] = (radius + 1 - Math.sqrt(grid[index])) * 255;
  }
  return result;
}

/* ------------------------------------------------------------------ geometry */

/** Distance from the logo's center to each side of the box it covers on the canvas, effects included. */
export function logoExtents(settings: LogoSettings): { left: number; right: number; top: number; bottom: number } {
  const width = settings.crop.width * settings.scale;
  const height = settings.crop.height * settings.scale;
  const radians = (settings.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  let halfWidth = (width * cos + height * sin) / 2;
  let halfHeight = (width * sin + height * cos) / 2;
  if (settings.outlineEnabled) {
    halfWidth += settings.outlineWidth;
    halfHeight += settings.outlineWidth;
  }
  if (!settings.shadowEnabled) return { left: halfWidth, right: halfWidth, top: halfHeight, bottom: halfHeight };
  // A canvas shadow blurs with a standard deviation of half its blur: 3 deviations cover it.
  const spread = settings.shadowBlur * 1.5;
  return {
    left: Math.max(halfWidth, halfWidth + spread - settings.shadowX),
    right: Math.max(halfWidth, halfWidth + spread + settings.shadowX),
    top: Math.max(halfHeight, halfHeight + spread - settings.shadowY),
    bottom: Math.max(halfHeight, halfHeight + spread + settings.shadowY),
  };
}

/** True when part of the logo or of its effects falls outside the canvas. */
export function overflowsCanvas(settings: LogoSettings): boolean {
  const extents = logoExtents(settings);
  const margin = 0.5;
  return settings.x - extents.left < -margin
    || settings.y - extents.top < -margin
    || settings.x + extents.right > settings.canvasWidth + margin
    || settings.y + extents.bottom > settings.canvasHeight + margin;
}

/** The canvas resized around the logo and its effects, with the logo scaled down if it would exceed MAX_SIDE. */
export function fitCanvasToLogo(settings: LogoSettings): LogoSettings {
  let next = settings;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const extents = logoExtents(next);
    // cos(90°) is not exactly 0 in floating point: ignore what would only add a phantom pixel.
    const width = Math.ceil(extents.left + extents.right - 1e-6);
    const height = Math.ceil(extents.top + extents.bottom - 1e-6);
    if (width <= MAX_SIDE && height <= MAX_SIDE) {
      return {
        ...next,
        canvasWidth: Math.max(1, width),
        canvasHeight: Math.max(1, height),
        x: extents.left + (width - extents.left - extents.right) / 2,
        y: extents.top + (height - extents.top - extents.bottom) / 2,
      };
    }
    next = { ...next, scale: next.scale * (MAX_SIDE / Math.max(width, height)) * 0.995 };
  }
  return { ...next, canvasWidth: Math.min(MAX_SIDE, next.canvasWidth), canvasHeight: Math.min(MAX_SIDE, next.canvasHeight) };
}

/** A canvas of the given size, the logo centered and scaled to fill it but `margin` (0 to 0.5) of each side. */
export function fitLogoInCanvas(settings: LogoSettings, width: number, height: number, margin = 0.1): LogoSettings {
  const canvasWidth = clamp(Math.round(width), 1, MAX_SIDE);
  const canvasHeight = clamp(Math.round(height), 1, MAX_SIDE);
  const extents = logoExtents({ ...settings, scale: 1, shadowEnabled: false, outlineEnabled: false });
  const ratio = Math.min(
    (canvasWidth * (1 - 2 * margin)) / (extents.left + extents.right),
    (canvasHeight * (1 - 2 * margin)) / (extents.top + extents.bottom),
  );
  return { ...settings, autoFit: false, canvasWidth, canvasHeight, x: canvasWidth / 2, y: canvasHeight / 2, scale: clampScale(ratio) };
}

export const MIN_SCALE = 0.02;
export const MAX_SCALE = 8;

export function clampScale(scale: number): number {
  return Number.isFinite(scale) ? clamp(scale, MIN_SCALE, MAX_SCALE) : 1;
}

/** Angle between -180 (excluded) and 180 degrees. */
export function normalizeAngle(degrees: number): number {
  const angle = ((degrees % 360) + 360) % 360;
  return angle > 180 ? angle - 360 : angle;
}

/** Keeps every value in its range and, while autoFit is on, the canvas around the logo. */
export function settle(settings: LogoSettings): LogoSettings {
  const next: LogoSettings = {
    ...settings,
    scale: clampScale(settings.scale),
    rotation: normalizeAngle(settings.rotation),
    outlineWidth: Math.max(0, settings.outlineWidth),
    shadowBlur: Math.max(0, settings.shadowBlur),
    canvasWidth: clamp(Math.round(settings.canvasWidth) || 1, 1, MAX_SIDE),
    canvasHeight: clamp(Math.round(settings.canvasHeight) || 1, 1, MAX_SIDE),
  };
  return next.autoFit ? fitCanvasToLogo(next) : next;
}

/* ------------------------------------------------------------------ crop */

export type CropHandle = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const MIN_CROP = 8;

/**
 * The crop rectangle after dragging `handle` by (dx, dy) pixels of the image. `aspect`
 * (width / height) keeps its proportions; the rectangle never leaves the image.
 */
export function dragCrop(start: Rect, handle: CropHandle, dx: number, dy: number, imageWidth: number, imageHeight: number, aspect: number | null = null): Rect {
  const minimum = Math.min(MIN_CROP, imageWidth, imageHeight);
  if (handle === 'move') {
    return roundRect({
      ...start,
      x: clamp(start.x + dx, 0, imageWidth - start.width),
      y: clamp(start.y + dy, 0, imageHeight - start.height),
    });
  }
  let left = start.x;
  let top = start.y;
  let right = start.x + start.width;
  let bottom = start.y + start.height;
  if (handle.includes('w')) left = clamp(left + dx, 0, right - minimum);
  if (handle.includes('e')) right = clamp(right + dx, left + minimum, imageWidth);
  if (handle.includes('n')) top = clamp(top + dy, 0, bottom - minimum);
  if (handle.includes('s')) bottom = clamp(bottom + dy, top + minimum, imageHeight);
  if (!aspect) return roundRect({ x: left, y: top, width: right - left, height: bottom - top });

  // With fixed proportions the dragged corner leads; the opposite corner stays in place.
  const anchorX = handle.includes('w') ? start.x + start.width : start.x;
  const anchorY = handle.includes('n') ? start.y + start.height : start.y;
  const roomX = handle.includes('w') ? anchorX : imageWidth - anchorX;
  const roomY = handle.includes('n') ? anchorY : imageHeight - anchorY;
  let width = Math.max(right - left, (bottom - top) * aspect);
  width = Math.min(width, roomX, roomY * aspect);
  width = Math.max(width, Math.min(minimum, roomX, roomY * aspect));
  const height = width / aspect;
  return roundRect({
    x: handle.includes('w') ? anchorX - width : anchorX,
    y: handle.includes('n') ? anchorY - height : anchorY,
    width,
    height,
  });
}

/** The largest rectangle of proportions `aspect` centered inside `rect`. */
export function fitAspect(rect: Rect, aspect: number): Rect {
  let width = rect.width;
  let height = width / aspect;
  if (height > rect.height) {
    height = rect.height;
    width = height * aspect;
  }
  return roundRect({ x: rect.x + (rect.width - width) / 2, y: rect.y + (rect.height - height) / 2, width, height });
}

function roundRect(rect: Rect): Rect {
  const x = Math.round(rect.x);
  const y = Math.round(rect.y);
  return { x, y, width: Math.max(1, Math.round(rect.x + rect.width) - x), height: Math.max(1, Math.round(rect.y + rect.height) - y) };
}

export function isFullCrop(crop: Rect, width: number, height: number): boolean {
  return crop.x === 0 && crop.y === 0 && crop.width === width && crop.height === height;
}

/**
 * Bounds of the logo without its empty margins: transparent pixels, or for an image without
 * transparency (a JPG) the color of its top-left corner. Null when the image is empty.
 */
export function contentBounds(data: ArrayLike<number>, width: number, height: number, tolerance = 24): Rect | null {
  const transparentCorner = data[3] < 16;
  const [r0, g0, b0] = [data[0], data[1], data[2]];
  const isContent = (index: number) => {
    if (data[index + 3] < 16) return false;
    if (transparentCorner) return true;
    return Math.abs(data[index] - r0) + Math.abs(data[index + 1] - g0) + Math.abs(data[index + 2] - b0) > tolerance;
  };
  let top = -1;
  let bottom = -1;
  let left = width;
  let right = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!isContent((y * width + x) * 4)) continue;
      if (top < 0) top = y;
      bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  if (top < 0) return null;
  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

/* ------------------------------------------------------------------ history */

export type History<T> = { past: T[]; present: T; future: T[]; key?: string; at?: number };

export const HISTORY_LIMIT = 100;
/** Changes with the same key closer than this (a slider being dragged) form a single step. */
export const MERGE_DELAY = 800;

export function startHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

export function record<T>(history: History<T>, next: T, key?: string, now = Date.now()): History<T> {
  if (next === history.present) return history;
  if (key && key === history.key && history.at !== undefined && now - history.at < MERGE_DELAY) {
    return { ...history, present: next, future: [], at: now };
  }
  return { past: [...history.past, history.present].slice(-HISTORY_LIMIT), present: next, future: [], key, at: now };
}

export function undo<T>(history: History<T>): History<T> {
  if (!history.past.length) return history;
  return { past: history.past.slice(0, -1), present: history.past[history.past.length - 1], future: [history.present, ...history.future] };
}

export function redo<T>(history: History<T>): History<T> {
  if (!history.future.length) return history;
  return { past: [...history.past, history.present], present: history.future[0], future: history.future.slice(1) };
}

/* ------------------------------------------------------------------ files */

export type SniffedFormat = 'png' | 'jpeg' | 'gif' | 'webp' | 'bmp' | 'ico' | 'avif' | 'heic' | 'tiff' | 'svg' | 'pdf' | 'psd' | 'eps' | 'unknown';

/** Formats that are not images a browser can draw: the visitor gets advice instead of a vague error. */
export const UNSUPPORTED_FORMATS = new Set<SniffedFormat>(['pdf', 'psd', 'eps']);

/** Format of a file from its first bytes (at least 1 KB for SVG), then its name and type for SVG. */
export function sniffFormat(bytes: Uint8Array, name = '', type = ''): SniffedFormat {
  const ascii = (start: number, length: number) => Array.from(bytes.subarray(start, start + length), (byte) => String.fromCharCode(byte)).join('');
  const startsWith = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  if (startsWith(0x89, 0x50, 0x4e, 0x47)) return 'png';
  if (startsWith(0xff, 0xd8, 0xff)) return 'jpeg';
  if (ascii(0, 4) === 'GIF8') return 'gif';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return 'webp';
  if (ascii(0, 2) === 'BM') return 'bmp';
  if (startsWith(0, 0, 1, 0) || startsWith(0, 0, 2, 0)) return 'ico';
  if (ascii(4, 4) === 'ftyp') {
    // The major brand, then the compatible brands, tell AVIF from HEIC (both are HEIF files).
    const brands = ascii(8, Math.min(bytes.length, 64) - 8);
    if (/avi[fs]/.test(brands)) return 'avif';
    if (/hei[cx]|hev[cx]|mif1|msf1/.test(brands)) return 'heic';
  }
  if (startsWith(0x49, 0x49, 0x2a, 0) || startsWith(0x4d, 0x4d, 0, 0x2a)) return 'tiff';
  if (ascii(0, 5) === '%PDF-') return 'pdf';
  if (ascii(0, 4) === '8BPS') return 'psd';
  if (ascii(0, 4) === '%!PS' || startsWith(0xc5, 0xd0, 0xd3, 0xc6)) return 'eps';
  const text = new TextDecoder().decode(bytes.subarray(0, 4096)).replace(/^﻿/, '').trimStart();
  if (text.startsWith('<') && /<svg[\s>]/i.test(text)) return 'svg';
  if (/\.svg$/i.test(name) || type === 'image/svg+xml') return 'svg';
  return 'unknown';
}

/** Width and height scaled down so that the longest side is at most `max`. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const ratio = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

const UNIT_PIXELS: Record<string, number> = { '': 1, px: 1, pt: 4 / 3, pc: 16, mm: 96 / 25.4, cm: 96 / 2.54, in: 96 };

function svgLength(value: string | null): number | null {
  const match = value?.trim().match(/^([0-9]*\.?[0-9]+(?:e[-+]?[0-9]+)?)\s*(px|pt|pc|mm|cm|in)?$/i);
  if (!match) return null;
  const length = parseFloat(match[1]) * UNIT_PIXELS[(match[2] ?? '').toLowerCase()];
  return length > 0 && Number.isFinite(length) ? length : null;
}

export type ViewBox = [number, number, number, number];

/**
 * Size in pixels and viewBox of an SVG from the attributes of its root. The height follows the
 * proportions of the viewBox, so that a pixel of the drawing always maps to the same viewBox area.
 */
export function svgDimensions(width: string | null, height: string | null, viewBox: string | null): { width: number; height: number; viewBox: ViewBox } {
  const box = viewBox?.trim().split(/[\s,]+/).map(Number);
  const w = svgLength(width);
  const h = svgLength(height);
  if (box && box.length === 4 && box.every(Number.isFinite) && box[2] > 0 && box[3] > 0) {
    const pixelWidth = w ?? (h ? (h * box[2]) / box[3] : box[2]);
    return { width: pixelWidth, height: (pixelWidth * box[3]) / box[2], viewBox: box as ViewBox };
  }
  // Without a viewBox a browser draws the SVG at 300 × 150 when it has no size either.
  const pixelWidth = w ?? 300;
  const pixelHeight = h ?? 150;
  return { width: pixelWidth, height: pixelHeight, viewBox: [0, 0, pixelWidth, pixelHeight] };
}

/** Working size of an SVG: its own size, enlarged up to SVG_MIN_SIDE or reduced to MAX_SIDE. */
export function svgWorkingSize(width: number, height: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  const target = clamp(longest, SVG_MIN_SIDE, MAX_SIDE);
  return { width: Math.max(1, Math.round((width * target) / longest)), height: Math.max(1, Math.round((height * target) / longest)) };
}

/** The part of the viewBox shown by the crop, the crop being in pixels of the working copy. */
export function cropViewBox(crop: Rect, width: number, height: number, viewBox: ViewBox): ViewBox {
  const [x, y, w, h] = viewBox;
  return [x + (crop.x * w) / width, y + (crop.y * h) / height, (crop.width * w) / width, (crop.height * h) / height];
}

/* ------------------------------------------------------------------ SVG export */

function formatNumber(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

const PREFIX = 'jchub-logo-studio';

/**
 * Vector version of the edit. `inner` is the original SVG, its root set to x=0 y=0 and to the
 * size and viewBox of the crop: the effects are SVG filters, so the logo stays a vector.
 */
export function buildSvgDocument(settings: LogoSettings, inner: string): string {
  const n = formatNumber;
  const s = settings;
  const width = s.crop.width;
  const height = s.crop.height;
  const defs: string[] = [];
  const matrix = colorMatrix(s);
  const colorFilter = !isIdentityMatrix(matrix);
  if (colorFilter) {
    defs.push(`<filter id="${PREFIX}-color" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${svgMatrixValues(matrix)}"/></filter>`);
  }
  const gradient = s.gradientEnabled && s.gradientStrength > 0;
  if (gradient) {
    const line = gradientLine(s.gradientAngle, 1, 1);
    defs.push(
      `<linearGradient id="${PREFIX}-gradient" x1="${n(line.x1)}" y1="${n(line.y1)}" x2="${n(line.x2)}" y2="${n(line.y2)}">`
      + `<stop offset="0" stop-color="${safeColor(s.gradientFrom)}"/><stop offset="1" stop-color="${safeColor(s.gradientTo)}"/></linearGradient>`,
      `<mask id="${PREFIX}-mask" mask-type="alpha"><use xlink:href="#${PREFIX}-core"/></mask>`,
    );
  }
  const outline = s.outlineEnabled && s.outlineWidth > 0;
  if (outline) {
    // The filter region must hold the outline: its margin is a fraction of the scaled logo.
    const marginX = (s.outlineWidth + 2) / Math.max(1e-6, width * s.scale);
    const marginY = (s.outlineWidth + 2) / Math.max(1e-6, height * s.scale);
    defs.push(
      `<filter id="${PREFIX}-outline" x="${n(-marginX)}" y="${n(-marginY)}" width="${n(1 + 2 * marginX)}" height="${n(1 + 2 * marginY)}" color-interpolation-filters="sRGB">`
      + `<feMorphology in="SourceAlpha" operator="dilate" radius="${n(s.outlineWidth)}" result="spread"/>`
      + `<feFlood flood-color="${safeColor(s.outlineColor)}"/><feComposite in2="spread" operator="in" result="outline"/>`
      + '<feMerge><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/></feMerge></filter>',
    );
  }
  const shadow = s.shadowEnabled && s.shadowOpacity > 0;
  if (shadow) {
    defs.push(
      `<filter id="${PREFIX}-shadow" filterUnits="userSpaceOnUse" x="0" y="0" width="${s.canvasWidth}" height="${s.canvasHeight}" color-interpolation-filters="sRGB">`
      + `<feDropShadow dx="${n(s.shadowX)}" dy="${n(s.shadowY)}" stdDeviation="${n(s.shadowBlur / 2)}" flood-color="${safeColor(s.shadowColor)}" flood-opacity="${n(s.shadowOpacity / 100)}"/></filter>`,
    );
  }

  const fill = backgroundFill(s);
  const core = `<g id="${PREFIX}-core"${colorFilter ? ` filter="url(#${PREFIX}-color)"` : ''}>${inner}</g>`;
  const gradientLayer = gradient
    ? `<rect width="${n(width)}" height="${n(height)}" fill="url(#${PREFIX}-gradient)" mask="url(#${PREFIX}-mask)" opacity="${n(s.gradientStrength / 100)}"/>`
    : '';
  const flip = `scale(${s.flipX ? -s.scale : s.scale} ${s.flipY ? -s.scale : s.scale})`;
  // Rotation outside the outline filter, scale inside: the outline width stays in canvas pixels.
  let logo = `<g transform="${flip} translate(${n(-width / 2)} ${n(-height / 2)})">${core}${gradientLayer}</g>`;
  if (outline) logo = `<g filter="url(#${PREFIX}-outline)">${logo}</g>`;
  logo = `<g transform="translate(${n(s.x)} ${n(s.y)}) rotate(${n(s.rotation)})">${logo}</g>`;
  if (shadow) logo = `<g filter="url(#${PREFIX}-shadow)">${logo}</g>`;
  if (s.opacity < 100) logo = `<g opacity="${n(clamp(s.opacity, 0, 100) / 100)}">${logo}</g>`;

  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${s.canvasWidth}" height="${s.canvasHeight}" viewBox="0 0 ${s.canvasWidth} ${s.canvasHeight}">`
    + (defs.length ? `<defs>${defs.join('')}</defs>` : '')
    + (fill ? `<rect width="100%" height="100%" fill="${fill}"/>` : '')
    + logo
    + '</svg>\n';
}

/* ------------------------------------------------------------------ HD export */

/** The `wanted` export resolution, or the largest smaller one the image still fits in. */
export function exportScaleFor(width: number, height: number, wanted: ExportScale): ExportScale {
  const fitting = EXPORT_SCALES.filter((scale) => scale <= wanted && width * height * scale * scale <= MAX_EXPORT_PIXELS);
  return fitting.length ? fitting[fitting.length - 1] : 1;
}

/** Two box blurs in a row (close to a gaussian) of premultiplied RGBA values. */
function blurTwice(source: Float32Array, width: number, height: number, radius: number): Float32Array {
  const pass = (input: Float32Array, length: number, lines: number, at: (line: number, position: number) => number) => {
    const output = new Float32Array(input.length);
    const size = 2 * radius + 1;
    for (let line = 0; line < lines; line += 1) {
      for (let channel = 0; channel < 4; channel += 1) {
        let sum = 0;
        for (let offset = -radius; offset <= radius; offset += 1) sum += input[at(line, Math.min(length - 1, Math.max(0, offset))) + channel];
        for (let position = 0; position < length; position += 1) {
          output[at(line, position) + channel] = sum / size;
          sum += input[at(line, Math.min(length - 1, position + radius + 1)) + channel] - input[at(line, Math.max(0, position - radius)) + channel];
        }
      }
    }
    return output;
  };
  const horizontal = (input: Float32Array) => pass(input, width, height, (y, x) => (y * width + x) * 4);
  const vertical = (input: Float32Array) => pass(input, height, width, (x, y) => (y * width + x) * 4);
  return vertical(horizontal(vertical(horizontal(source))));
}

/**
 * Unsharp mask on RGBA pixels, in place: brings back crisp edges to an enlarged image. Works on
 * premultiplied colors, so transparent pixels never darken the edges of a logo.
 */
export function sharpen(data: Uint8ClampedArray, width: number, height: number, radius: number, amount: number): void {
  const total = width * height;
  const premultiplied = new Float32Array(total * 4);
  for (let index = 0; index < total; index += 1) {
    const alpha = data[index * 4 + 3];
    for (let channel = 0; channel < 3; channel += 1) premultiplied[index * 4 + channel] = (data[index * 4 + channel] * alpha) / 255;
    premultiplied[index * 4 + 3] = alpha;
  }
  const blurred = blurTwice(premultiplied, width, height, radius);
  for (let index = 0; index < total; index += 1) {
    const at = index * 4;
    // Colors are divided by the alpha before it is clamped: a plain color keeps its exact shade.
    const alpha = premultiplied[at + 3] + amount * (premultiplied[at + 3] - blurred[at + 3]);
    data[at + 3] = alpha;
    for (let channel = 0; channel < 3; channel += 1) {
      const value = premultiplied[at + channel] + amount * (premultiplied[at + channel] - blurred[at + channel]);
      data[at + channel] = alpha > 0 ? (value * 255) / alpha : 0;
    }
  }
}
