/**
 * JcHub Logo Studio, photo retouching: the settings of an edit and every computation that does
 * not need a browser (tones and colors, filters, geometry, plain background removal, blur), so
 * that tests/photo-editor.test.js can run them. The canvas side lives in
 * components/tools/logo-studio/photo-render.ts. Only types are imported: Node runs this file as is.
 */

import type { Rect } from './logo-editor';

export type { Rect };

/* ------------------------------------------------------------------ settings */

/** Settings of the tones and colors, -100 to 100 unless noted. */
export type ToneSettings = {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  /** 0 to 100: lifts the blacks, for a matte look. */
  fade: number;
  /** Negative is cooler (blue), positive warmer (orange). */
  temperature: number;
  /** Negative is greener, positive more magenta. */
  tint: number;
  vibrance: number;
  saturation: number;
  /** 0 to 100: share of black and white. */
  mono: number;
  /** 0 to 100: share of sepia. */
  sepia: number;
  /** Negative lightens the edges, positive darkens them. */
  vignette: number;
  /** 0 to 100. */
  sharpness: number;
  /** 0 to 100. */
  blur: number;
};

export const TONE_KEYS = ['exposure', 'contrast', 'highlights', 'shadows', 'fade', 'temperature', 'tint', 'vibrance', 'saturation', 'mono', 'sepia', 'vignette', 'sharpness', 'blur'] as const satisfies readonly (keyof ToneSettings)[];
export type ToneKey = (typeof TONE_KEYS)[number];

/** Smallest and largest value of each setting. */
export const TONE_RANGES: Record<ToneKey, [number, number]> = {
  exposure: [-100, 100], contrast: [-100, 100], highlights: [-100, 100], shadows: [-100, 100], fade: [0, 100],
  temperature: [-100, 100], tint: [-100, 100], vibrance: [-100, 100], saturation: [-100, 100], mono: [0, 100], sepia: [0, 100],
  vignette: [-100, 100], sharpness: [0, 100], blur: [0, 100],
};

export const FILTER_IDS = ['none', 'vivid', 'warm', 'cool', 'mono', 'sepia', 'vintage', 'drama', 'soft', 'cinema'] as const;
export type FilterId = (typeof FILTER_IDS)[number];

export type PhotoSettings = ToneSettings & {
  /** The filter last chosen and its strength (0 to 100): its values are already in the tones above. */
  filter: FilterId;
  filterStrength: number;
  /** Quarter turns clockwise, 0 to 3. */
  turns: number;
  flipX: boolean;
  flipY: boolean;
  /** Degrees, -45 to 45: the photo is turned and enlarged so that no corner is left empty. */
  straighten: number;
  /** In pixels of the turned, flipped and straightened working copy. */
  crop: Rect;
  /**
   * The cut-out mask in use (made by the AI or from a plain background, then touched up with the
   * brushes), or null to keep the whole photo. Each touch-up is a new version: undo goes back
   * to the previous one.
   */
  maskVersion: number | null;
  /** 0 to 100: how far from the background color a pixel can be and still be removed. */
  backgroundTolerance: number;
  /** Color put behind the subject once the background is cut out; null keeps it transparent. */
  backgroundColor: string | null;
};

export const NEUTRAL_TONES: ToneSettings = {
  exposure: 0, contrast: 0, highlights: 0, shadows: 0, fade: 0, temperature: 0, tint: 0,
  vibrance: 0, saturation: 0, mono: 0, sepia: 0, vignette: 0, sharpness: 0, blur: 0,
};

/** Values of each filter at full strength; the settings not named stay at zero. */
export const FILTERS: Record<FilterId, Partial<ToneSettings>> = {
  none: {},
  vivid: { vibrance: 45, saturation: 10, contrast: 15 },
  warm: { temperature: 35, vibrance: 15, exposure: 4 },
  cool: { temperature: -35, tint: -5, contrast: 5 },
  mono: { mono: 100, contrast: 15 },
  sepia: { sepia: 80, contrast: 5, fade: 10 },
  vintage: { sepia: 30, fade: 35, contrast: -10, temperature: 15, saturation: -20, vignette: 30 },
  drama: { contrast: 40, highlights: -30, shadows: -15, saturation: -15, vignette: 45 },
  soft: { contrast: -20, fade: 20, highlights: -15, shadows: 20, exposure: 5 },
  cinema: { temperature: -15, tint: -10, contrast: 20, fade: 10, saturation: -10, vignette: 20 },
};

export function initialPhotoSettings(width: number, height: number): PhotoSettings {
  return {
    ...NEUTRAL_TONES,
    filter: 'none',
    filterStrength: 100,
    turns: 0,
    flipX: false,
    flipY: false,
    straighten: 0,
    crop: { x: 0, y: 0, width, height },
    maskVersion: null,
    backgroundTolerance: 30,
    backgroundColor: null,
  };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** The settings with every value in its range and whole: what the history keeps. */
export function settlePhoto(settings: PhotoSettings): PhotoSettings {
  const next = { ...settings };
  for (const key of TONE_KEYS) {
    const [min, max] = TONE_RANGES[key];
    next[key] = clamp(Math.round(Number(next[key]) || 0), min, max);
  }
  next.filterStrength = clamp(Math.round(next.filterStrength), 0, 100);
  next.turns = ((Math.round(next.turns) % 4) + 4) % 4;
  next.straighten = clamp(Math.round(next.straighten * 10) / 10, -45, 45);
  next.backgroundTolerance = clamp(Math.round(next.backgroundTolerance), 0, 100);
  return next;
}

/** The tones of `filter` at `strength` %, the other tones back to zero. */
export function applyFilter(settings: PhotoSettings, filter: FilterId, strength = 100): PhotoSettings {
  const values = FILTERS[filter];
  const tones = Object.fromEntries(TONE_KEYS.map((key) => [key, Math.round((values[key] ?? 0) * (strength / 100))])) as ToneSettings;
  return { ...settings, ...tones, filter, filterStrength: strength };
}

export function tonesOf(settings: ToneSettings): ToneSettings {
  return Object.fromEntries(TONE_KEYS.map((key) => [key, settings[key]])) as ToneSettings;
}

/** True when no tone, color or effect changes the pixels. */
export function isNeutralTone(settings: ToneSettings): boolean {
  return TONE_KEYS.every((key) => !settings[key]);
}

/** True when the per-pixel color step changes something (sharpness and blur are separate passes). */
function changesColors(settings: ToneSettings): boolean {
  return TONE_KEYS.some((key) => key !== 'sharpness' && key !== 'blur' && settings[key] !== 0);
}

/* ------------------------------------------------------------------ tones and colors */

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * Applies the tones, colors and vignette to RGBA pixels, in place. Each step is the usual one of
 * photo apps: exposure in stops, highlights and shadows weighted by the brightness, contrast around
 * the middle grey, saturation and vibrance around the luminance, then black and white, sepia and
 * the vignette. Transparent pixels keep their transparency.
 */
export function applyTones(data: Uint8ClampedArray, width: number, height: number, settings: ToneSettings): void {
  if (!changesColors(settings)) return;
  const exposure = 2 ** ((settings.exposure / 100) * 1.5);
  const contrast = Math.max(0.05, 1 + settings.contrast / 100);
  const highlights = settings.highlights / 100;
  const shadows = settings.shadows / 100;
  const lift = (settings.fade / 100) * 0.22;
  const warm = (settings.temperature / 100) * 0.14;
  const tint = (settings.tint / 100) * 0.1;
  const saturation = 1 + settings.saturation / 100;
  const vibrance = settings.vibrance / 100;
  const mono = settings.mono / 100;
  const sepia = settings.sepia / 100;
  const vignette = settings.vignette / 100;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.hypot(centerX, centerY) || 1;

  for (let y = 0; y < height; y += 1) {
    // Distance to the center, 0 there and 1 in the corners: the vignette darkens the outer part.
    const dy = (y + 0.5 - centerY) / radius;
    for (let x = 0; x < width; x += 1) {
      const at = (y * width + x) * 4;
      if (data[at + 3] === 0) continue;
      let r = (data[at] / 255) * exposure;
      let g = (data[at + 1] / 255) * exposure;
      let b = (data[at + 2] / 255) * exposure;
      r += warm;
      b -= warm;
      g -= tint;
      if (highlights || shadows) {
        const luma = clamp(0.2126 * r + 0.7152 * g + 0.0722 * b, 0, 1);
        const shift = shadows * 0.45 * (1 - luma) ** 3 + highlights * 0.45 * luma ** 3;
        r += shift;
        g += shift;
        b += shift;
      }
      r = (r - 0.5) * contrast + 0.5;
      g = (g - 0.5) * contrast + 0.5;
      b = (b - 0.5) * contrast + 0.5;
      if (lift) {
        r = lift + r * (1 - lift);
        g = lift + g * (1 - lift);
        b = lift + b * (1 - lift);
      }
      if (saturation !== 1 || vibrance) {
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        // Vibrance boosts the dull colors more than the vivid ones, and spares skin tones.
        const spread = Math.max(r, g, b) - Math.min(r, g, b);
        const factor = saturation * (1 + vibrance * (1 - clamp(spread, 0, 1)) * 1.3);
        r = luma + (r - luma) * factor;
        g = luma + (g - luma) * factor;
        b = luma + (b - luma) * factor;
      }
      if (mono) {
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r += (luma - r) * mono;
        g += (luma - g) * mono;
        b += (luma - b) * mono;
      }
      if (sepia) {
        const sr = 0.393 * r + 0.769 * g + 0.189 * b;
        const sg = 0.349 * r + 0.686 * g + 0.168 * b;
        const sb = 0.272 * r + 0.534 * g + 0.131 * b;
        r += (sr - r) * sepia;
        g += (sg - g) * sepia;
        b += (sb - b) * sepia;
      }
      if (vignette) {
        const dx = (x + 0.5 - centerX) / radius;
        const edge = smoothstep(0.35, 1.05, Math.hypot(dx, dy) * Math.SQRT2) * 0.7;
        if (vignette > 0) {
          const keep = 1 - vignette * edge;
          r *= keep;
          g *= keep;
          b *= keep;
        } else {
          const light = -vignette * edge;
          r += (1 - r) * light;
          g += (1 - g) * light;
          b += (1 - b) * light;
        }
      }
      data[at] = r * 255;
      data[at + 1] = g * 255;
      data[at + 2] = b * 255;
    }
  }
}

/* ------------------------------------------------------------------ blur and sharpness */

/** Three box blurs in a row (close to a gaussian) of premultiplied RGBA values. */
function boxBlur(source: Float32Array, width: number, height: number, radius: number, passes = 3): Float32Array {
  const pass = (input: Float32Array, length: number, lines: number, at: (line: number, position: number) => number) => {
    const output = new Float32Array(input.length);
    const size = 2 * radius + 1;
    for (let line = 0; line < lines; line += 1) {
      for (let channel = 0; channel < 4; channel += 1) {
        let sum = 0;
        for (let offset = -radius; offset <= radius; offset += 1) sum += input[at(line, clamp(offset, 0, length - 1)) + channel];
        for (let position = 0; position < length; position += 1) {
          output[at(line, position) + channel] = sum / size;
          sum += input[at(line, Math.min(length - 1, position + radius + 1)) + channel] - input[at(line, Math.max(0, position - radius)) + channel];
        }
      }
    }
    return output;
  };
  let result = source;
  for (let index = 0; index < passes; index += 1) {
    result = pass(result, width, height, (y, x) => (y * width + x) * 4);
    result = pass(result, height, width, (x, y) => (y * width + x) * 4);
  }
  return result;
}

function premultiply(data: Uint8ClampedArray): Float32Array {
  const values = new Float32Array(data.length);
  for (let at = 0; at < data.length; at += 4) {
    const alpha = data[at + 3];
    values[at] = (data[at] * alpha) / 255;
    values[at + 1] = (data[at + 1] * alpha) / 255;
    values[at + 2] = (data[at + 2] * alpha) / 255;
    values[at + 3] = alpha;
  }
  return values;
}

function unpremultiply(values: Float32Array, data: Uint8ClampedArray): void {
  for (let at = 0; at < data.length; at += 4) {
    const alpha = values[at + 3];
    data[at + 3] = alpha;
    data[at] = alpha > 0 ? (values[at] * 255) / alpha : 0;
    data[at + 1] = alpha > 0 ? (values[at + 1] * 255) / alpha : 0;
    data[at + 2] = alpha > 0 ? (values[at + 2] * 255) / alpha : 0;
  }
}

/**
 * Blur (`blur` 0 to 100) then sharpness (`sharpness` 0 to 100, an unsharp mask), in place. The
 * radii follow the size of the image, so that the preview and the full-size export look alike.
 */
export function applyDetail(data: Uint8ClampedArray, width: number, height: number, settings: Pick<ToneSettings, 'blur' | 'sharpness'>): void {
  const side = Math.max(width, height);
  if (settings.blur > 0) {
    const radius = Math.max(1, Math.round((settings.blur / 100) * 0.012 * side));
    unpremultiply(boxBlur(premultiply(data), width, height, radius), data);
  }
  if (settings.sharpness > 0) {
    const radius = Math.max(1, Math.round(side / 1500));
    const amount = (settings.sharpness / 100) * 1.5;
    const original = premultiply(data);
    const blurred = boxBlur(original, width, height, radius, 2);
    for (let index = 0; index < original.length; index += 1) original[index] += amount * (original[index] - blurred[index]);
    unpremultiply(original, data);
  }
}

/* ------------------------------------------------------------------ plain background */

/**
 * Color of the background: the most common color of the border of the image (quantized, so
 * that the noise of a photo does not split it), averaged over the pixels that have it.
 */
export function borderColor(data: ArrayLike<number>, width: number, height: number): [number, number, number] | null {
  const counts = new Map<number, { count: number; r: number; g: number; b: number }>();
  const visit = (x: number, y: number) => {
    const at = (y * width + x) * 4;
    if (data[at + 3] < 128) return;
    const key = ((data[at] >> 3) << 10) | ((data[at + 1] >> 3) << 5) | (data[at + 2] >> 3);
    const bin = counts.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bin.count += 1;
    bin.r += data[at];
    bin.g += data[at + 1];
    bin.b += data[at + 2];
    counts.set(key, bin);
  };
  for (let x = 0; x < width; x += 1) { visit(x, 0); visit(x, height - 1); }
  for (let y = 1; y < height - 1; y += 1) { visit(0, y); visit(width - 1, y); }
  const best = Array.from(counts.values()).reduce<{ count: number; r: number; g: number; b: number } | null>((top, bin) => (!top || bin.count > top.count ? bin : top), null);
  return best ? [best.r / best.count, best.g / best.count, best.b / best.count] : null;
}

/**
 * Makes transparent the plain background connected to the border of the image, in place: a
 * flood fill from the edges over the pixels close to the background color. `tolerance` (0 to 100)
 * sets how close; pixels near the limit become partly transparent, for soft edges.
 * Returns false when the image has no clear background (nothing was removed).
 */
export function removePlainBackground(data: Uint8ClampedArray, width: number, height: number, tolerance: number): boolean {
  const reference = borderColor(data, width, height);
  if (!reference) return false;
  const [r0, g0, b0] = reference;
  const limit = 12 + (tolerance / 100) * 150;
  const soft = limit * 0.65;
  const total = width * height;
  const distance = (index: number) => {
    const at = index * 4;
    return Math.hypot(data[at] - r0, data[at + 1] - g0, data[at + 2] - b0);
  };
  const seen = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;
  const push = (index: number) => {
    if (seen[index]) return;
    seen[index] = 1;
    // Already transparent pixels belong to the background as well.
    if (data[index * 4 + 3] < 16 || distance(index) <= limit) queue[tail++] = index;
  };
  for (let x = 0; x < width; x += 1) { push(x); push((height - 1) * width + x); }
  for (let y = 0; y < height; y += 1) { push(y * width); push(y * width + width - 1); }
  if (!tail) return false;
  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    if (x > 0) push(index - 1);
    if (x < width - 1) push(index + 1);
    if (index >= width) push(index - width);
    if (index < total - width) push(index + width);
  }
  for (let position = 0; position < tail; position += 1) {
    const index = queue[position];
    const at = index * 4 + 3;
    const gap = distance(index);
    // Near the limit (the edge of the subject, its shadow), the pixel keeps part of its opacity.
    const keep = gap <= soft ? 0 : (gap - soft) / (limit - soft);
    data[at] = Math.min(data[at], Math.round(data[at] * keep));
  }
  return true;
}

/** Puts `color` behind the transparent parts, in place. */
export function fillBehind(data: Uint8ClampedArray, color: [number, number, number]): void {
  const [r, g, b] = color;
  for (let at = 0; at < data.length; at += 4) {
    const alpha = data[at + 3] / 255;
    if (alpha >= 1) continue;
    data[at] = data[at] * alpha + r * (1 - alpha);
    data[at + 1] = data[at + 1] * alpha + g * (1 - alpha);
    data[at + 2] = data[at + 2] * alpha + b * (1 - alpha);
    data[at + 3] = 255;
  }
}

/* ------------------------------------------------------------------ geometry */

/** Size of the image once turned by `turns` quarter turns. */
export function orientedSize(width: number, height: number, turns: number): { width: number; height: number } {
  return turns % 2 ? { width: height, height: width } : { width, height };
}

/**
 * How much the image is enlarged when straightened by `degrees`, so that the turned image still
 * covers its whole frame: no empty corner, as in photo apps.
 */
export function straightenZoom(width: number, height: number, degrees: number): number {
  const angle = (Math.abs(degrees) * Math.PI) / 180;
  if (!angle) return 1;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return Math.max((width * cos + height * sin) / width, (width * sin + height * cos) / height);
}

/** The crop after a quarter turn clockwise of an image that was `width` × `height` before it. */
export function turnRect(rect: Rect, width: number, height: number): Rect {
  return { x: height - rect.y - rect.height, y: rect.x, width: rect.height, height: rect.width };
}

/** The crop after a horizontal (`axis` x) or vertical (`axis` y) flip of a `width` × `height` image. */
export function flipRect(rect: Rect, width: number, height: number, axis: 'x' | 'y'): Rect {
  return axis === 'x' ? { ...rect, x: width - rect.x - rect.width } : { ...rect, y: height - rect.y - rect.height };
}

/** Crop proportions offered: free, the photo's own, and the formats of social networks. */
export const CROP_RATIOS = ['free', 'original', 'square', 'portrait', 'story', 'landscape', 'link'] as const;
export type CropRatio = (typeof CROP_RATIOS)[number];
export const RATIO_VALUES: Record<Exclude<CropRatio, 'free' | 'original'>, number> = {
  square: 1,
  portrait: 4 / 5,
  story: 9 / 16,
  landscape: 16 / 9,
  link: 1.91,
};

/** Longest side of the exported photo: `original` keeps the size of the working copy. */
export const EXPORT_SIZES = ['original', 2048, 1080, 720] as const;
export type ExportSize = (typeof EXPORT_SIZES)[number];

/** Size of the exported photo: the crop, reduced to `size` on its longest side, never enlarged. */
export function exportDimensions(crop: Rect, size: ExportSize): { width: number; height: number; scale: number } {
  const longest = Math.max(crop.width, crop.height);
  const scale = size === 'original' ? 1 : Math.min(1, size / longest);
  return { width: Math.max(1, Math.round(crop.width * scale)), height: Math.max(1, Math.round(crop.height * scale)), scale };
}

export function hexToRgb(color: string): [number, number, number] {
  const value = /^#[0-9a-f]{6}$/i.test(color) ? color.slice(1) : '000000';
  return [parseInt(value.slice(0, 2), 16), parseInt(value.slice(2, 4), 16), parseInt(value.slice(4, 6), 16)];
}
