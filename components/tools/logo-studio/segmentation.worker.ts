// Runs the subject cut-out model off the main thread: the page stays responsive while the model
// downloads (once, then kept in the browser cache) and while it reads the photo.
import * as ort from 'onnxruntime-web';
import { MODEL_CACHE, SUBJECT_MODEL, matteToAlpha, toModelInput } from '@/lib/photo-segmentation';

export type SegmentationRequest = { id: number; pixels: Uint8ClampedArray; width: number; height: number };
export type SegmentationResponse =
  | { type: 'progress'; loaded: number; total: number }
  | { type: 'analyzing'; id: number }
  | { type: 'mask'; id: number; alpha: Uint8ClampedArray; width: number; height: number }
  | { type: 'error'; id: number; message: string };

const scope = self as unknown as { postMessage(message: SegmentationResponse, transfer?: Transferable[]): void; onmessage: ((event: MessageEvent<SegmentationRequest>) => void) | null };
const post = (message: SegmentationResponse, transfer: Transferable[] = []) => scope.postMessage(message, transfer);

// One thread: several would need cross-origin isolation, which the site's pages do not have.
ort.env.wasm.numThreads = 1;
ort.env.logLevel = 'error';

/** The model from the browser cache, or downloaded once with its progress and then cached. */
async function loadModel(): Promise<Uint8Array> {
  let cache: Cache | null = null;
  try {
    cache = await caches.open(MODEL_CACHE);
    const cached = await cache.match(SUBJECT_MODEL.url);
    if (cached) return new Uint8Array(await cached.arrayBuffer());
  } catch {
    // Private browsing can refuse the cache: the model is then downloaded on each visit.
  }
  const response = await fetch(SUBJECT_MODEL.url);
  if (!response.ok || !response.body) throw new Error(`model ${response.status}`);
  const total = Number(response.headers.get('content-length')) || SUBJECT_MODEL.bytes;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    post({ type: 'progress', loaded, total });
  }
  const model = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    model.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    await cache?.put(SUBJECT_MODEL.url, new Response(model, { headers: { 'Content-Type': 'application/octet-stream' } }));
  } catch {
    // A full disk only means the next visit downloads the model again.
  }
  return model;
}

let session: Promise<ort.InferenceSession> | null = null;

scope.onmessage = async (event) => {
  const { id, pixels, width, height } = event.data;
  try {
    session ??= loadModel().then((bytes) => ort.InferenceSession.create(bytes, { executionProviders: ['wasm'], logSeverityLevel: 3 }));
    const model = await session;
    post({ type: 'analyzing', id });
    const output = await model.run({ [SUBJECT_MODEL.input]: new ort.Tensor('float32', toModelInput(pixels, width, height), [1, 3, height, width]) });
    const alpha = matteToAlpha(output[SUBJECT_MODEL.output].data as Float32Array);
    post({ type: 'mask', id, alpha, width, height }, [alpha.buffer]);
  } catch (error) {
    // Start over on the next request: a failed download is retried, a cached model reloads quickly.
    session = null;
    post({ type: 'error', id, message: error instanceof Error ? error.message : String(error) });
  }
};
