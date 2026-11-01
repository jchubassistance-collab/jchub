/**
 * Background removal model run in the visitor's browser with onnxruntime-web, and the pixel
 * conversions around it. The revision is pinned so a change upstream cannot break the tool.
 */

/** Side of the square image the model reads and of the opacity mask it returns. */
export const MODEL_SIZE = 512;

/**
 * BiRefNet lite re-exported at 512 × 512 (MIT, weights included): it keeps people and objects
 * alike, runs on WebGPU and still fits in WebAssembly memory when the browser has no WebGPU.
 */
export const BACKGROUND_MODEL = {
  url: 'https://huggingface.co/studioludens/birefnet-lite-512/resolve/962e67969ec6acec9c19fab76acee4f5e22e990c/onnx/model_fp16.onnx',
  bytes: 98_484_532,
  input: 'input_image',
  output: 'output_image',
} as const;

const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

/** RGBA pixels of the image resized to MODEL_SIZE² → the model's planar RGB input, ImageNet-normalized. */
export function toModelInput(rgba: Uint8ClampedArray): Float32Array {
  const pixels = MODEL_SIZE * MODEL_SIZE;
  const input = new Float32Array(3 * pixels);
  for (let index = 0; index < pixels; index += 1) {
    for (let channel = 0; channel < 3; channel += 1) {
      input[channel * pixels + index] = (rgba[index * 4 + channel] / 255 - MEAN[channel]) / STD[channel];
    }
  }
  return input;
}

/** The model returns logits: their sigmoid is the opacity of each pixel of the mask. */
export function toMask(logits: Float32Array): Uint8ClampedArray {
  const mask = new Uint8ClampedArray(logits.length);
  for (let index = 0; index < logits.length; index += 1) {
    mask[index] = Math.round(255 / (1 + Math.exp(-logits[index])));
  }
  return mask;
}

/** Largest side of the downloaded image: beyond it the canvas would use too much memory. */
export const MAX_OUTPUT_SIDE = 4096;

export function outputSize(width: number, height: number): { width: number; height: number } {
  const scale = Math.min(1, MAX_OUTPUT_SIDE / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Messages between the tool and its worker. */
export type WorkerRequest = { type: 'remove'; id: number; pixels: Uint8ClampedArray };
export type WorkerResponse =
  | { type: 'download'; loaded: number; total: number }
  | { type: 'device'; device: 'webgpu' | 'wasm' }
  | { type: 'mask'; id: number; mask: Uint8ClampedArray }
  | { type: 'error'; id: number; message: string };
