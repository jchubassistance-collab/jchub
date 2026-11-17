/**
 * JcHub Logo Studio, photo retouching: what the subject cut-out needs without a browser — the
 * model, its input and output, the size of the cut-out mask, the magic wand and the mapping of a
 * point of the edited photo back to the original. Only types are imported: Node runs this file
 * as is (tests/photo-editor.test.js).
 */

import type { PhotoSettings } from './photo-editor';

/**
 * MODNet (Apache 2.0), half-precision export: 13 MB, the same cut-out as the full model and
 * fast enough without WebGPU. It is made for people and characters. The revision is pinned so
 * that a change upstream cannot break the tool.
 */
export const SUBJECT_MODEL = {
  url: 'https://huggingface.co/Xenova/modnet/resolve/fa2fa546052fba4c08921230a26cc69a333fca12/onnx/model_fp16.onnx',
  bytes: 12_984_781,
  input: 'input',
  output: 'output',
} as const;

/** Name of the browser cache the model is kept in after its first download. */
export const MODEL_CACHE = 'jchub-models-v1';

/** Longest side of the cut-out mask: precise enough for a brush, light enough to keep 50 undo steps. */
export const MASK_SIDE = 1024;

/**
 * Size of the image the model reads: shortest side 512 (what it was trained on), both sides
 * multiples of 32, the longest side at most 1024 so a panorama does not take minutes.
 */
export function modelDimensions(width: number, height: number): { width: number; height: number } {
  let scale = 512 / Math.min(width, height);
  if (Math.max(width, height) * scale > 1024) scale = 1024 / Math.max(width, height);
  const round = (value: number) => Math.max(32, Math.round((value * scale) / 32) * 32);
  return { width: round(width), height: round(height) };
}

/** Size of the mask of a `width` × `height` photo: the photo itself, at most MASK_SIDE long. */
export function maskDimensions(width: number, height: number): { width: number; height: number } {
  const scale = Math.min(1, MASK_SIDE / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** RGBA pixels → the model's planar RGB input, each value from -1 to 1. */
export function toModelInput(rgba: ArrayLike<number>, width: number, height: number): Float32Array {
  const pixels = width * height;
  const input = new Float32Array(3 * pixels);
  for (let index = 0; index < pixels; index += 1) {
    for (let channel = 0; channel < 3; channel += 1) input[channel * pixels + index] = rgba[index * 4 + channel] / 127.5 - 1;
  }
  return input;
}

/** The model's matte (0 to 1 per pixel) → opacities from 0 to 255. */
export function matteToAlpha(matte: ArrayLike<number>): Uint8ClampedArray {
  const alpha = new Uint8ClampedArray(matte.length);
  for (let index = 0; index < matte.length; index += 1) alpha[index] = Math.round(matte[index] * 255);
  return alpha;
}

/**
 * The magic wand: the pixels connected to `seed` (an index) whose color is close to the seed's,
 * `tolerance` from 0 to 100. Returns 1 for each selected pixel.
 */
export function floodSelect(data: ArrayLike<number>, width: number, height: number, seed: number, tolerance: number): Uint8Array {
  const total = width * height;
  const selected = new Uint8Array(total);
  if (seed < 0 || seed >= total) return selected;
  const [r0, g0, b0] = [data[seed * 4], data[seed * 4 + 1], data[seed * 4 + 2]];
  const limit = 8 + (tolerance / 100) * 160;
  const near = (index: number) => Math.hypot(data[index * 4] - r0, data[index * 4 + 1] - g0, data[index * 4 + 2] - b0) <= limit;
  const seen = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;
  seen[seed] = 1;
  queue[tail++] = seed;
  while (head < tail) {
    const index = queue[head++];
    selected[index] = 1;
    const x = index % width;
    const neighbours = [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1, index - width, index + width];
    for (const next of neighbours) {
      if (next < 0 || next >= total || seen[next]) continue;
      seen[next] = 1;
      if (near(next)) queue[tail++] = next;
    }
  }
  return selected;
}

/**
 * The point of the original photo (`photoWidth` × `photoHeight` pixels) shown at (x, y) of the
 * turned, flipped and straightened frame: where a brush stroke on the screen lands in the mask.
 * The inverse of the drawing in photo-render.ts (turns, then flips, then straightening).
 */
export function frameToSource(
  x: number,
  y: number,
  settings: Pick<PhotoSettings, 'turns' | 'flipX' | 'flipY' | 'straighten'>,
  photoWidth: number,
  photoHeight: number,
  zoom: number,
): { x: number; y: number } {
  const turned = settings.turns % 2 ? { width: photoHeight, height: photoWidth } : { width: photoWidth, height: photoHeight };
  let px = x - turned.width / 2;
  let py = y - turned.height / 2;
  const rotate = (angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    [px, py] = [px * cos - py * sin, px * sin + py * cos];
  };
  if (settings.straighten) {
    rotate((-settings.straighten * Math.PI) / 180);
    px /= zoom;
    py /= zoom;
  }
  if (settings.flipX) px = -px;
  if (settings.flipY) py = -py;
  rotate((-settings.turns * Math.PI) / 2);
  return { x: px + photoWidth / 2, y: py + photoHeight / 2 };
}
