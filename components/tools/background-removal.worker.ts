/// <reference lib="webworker" />
// Runs the background removal model off the main thread, so the page stays responsive while
// the model downloads and while a CPU without WebGPU spends a minute or two on one image.
import * as ort from 'onnxruntime-web/webgpu';
import { BACKGROUND_MODEL, MODEL_SIZE, toMask, toModelInput, type WorkerRequest, type WorkerResponse } from '@/lib/background-removal';

const scope = self as unknown as DedicatedWorkerGlobalScope;
const CACHE_NAME = 'jchub-models-v1';
const post = (message: WorkerResponse, transfer: Transferable[] = []) => scope.postMessage(message, transfer);

// Threads would need a cross-origin isolated page, which the site is not.
ort.env.wasm.numThreads = 1;
ort.env.logLevel = 'error';

/** The model from the browser cache, or downloaded once with its progress and then cached. */
async function loadModel(): Promise<Uint8Array> {
  let cache: Cache | undefined;
  try {
    cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(BACKGROUND_MODEL.url);
    if (cached) return new Uint8Array(await cached.arrayBuffer());
  } catch {
    // Private browsing can refuse the cache: the model is then downloaded each visit.
    cache = undefined;
  }

  const response = await fetch(BACKGROUND_MODEL.url);
  if (!response.ok || !response.body) throw new Error(`model ${response.status}`);
  const total = Number(response.headers.get('content-length')) || BACKGROUND_MODEL.bytes;
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  const reader = response.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    post({ type: 'download', loaded, total });
  }
  const model = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    model.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    await cache?.put(BACKGROUND_MODEL.url, new Response(model, { headers: { 'Content-Type': 'application/octet-stream' } }));
  } catch {
    // A full disk only costs a new download next time.
  }
  return model;
}

let model: Promise<Uint8Array> | null = null;
let session: { device: 'webgpu' | 'wasm'; run: Promise<ort.InferenceSession> } | null = null;

async function hasWebGpu(): Promise<boolean> {
  try {
    return Boolean(await (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu?.requestAdapter());
  } catch {
    return false;
  }
}

function openSession(device: 'webgpu' | 'wasm') {
  model ??= loadModel();
  // Severity 3 keeps the console clear of the graph optimizer's harmless warnings.
  session = { device, run: model.then((bytes) => ort.InferenceSession.create(bytes, { executionProviders: [device], logSeverityLevel: 3 })) };
  session.run.then(() => post({ type: 'device', device }), () => undefined);
  return session.run;
}

async function infer(pixels: Uint8ClampedArray): Promise<Uint8ClampedArray> {
  const input = new ort.Tensor('float32', toModelInput(pixels), [1, 3, MODEL_SIZE, MODEL_SIZE]);
  const tryDevice = async (device: 'webgpu' | 'wasm') => {
    const current = session?.device === device ? await session.run : await openSession(device);
    const output = await current.run({ [BACKGROUND_MODEL.input]: input });
    return toMask(output[BACKGROUND_MODEL.output].data as Float32Array);
  };
  if (session?.device === 'wasm') return tryDevice('wasm');
  if (session?.device === 'webgpu' || await hasWebGpu()) {
    try {
      return await tryDevice('webgpu');
    } catch {
      // Some GPUs reject a shader of the model: the CPU is slower but always works.
    }
  }
  return tryDevice('wasm');
}

scope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, pixels } = event.data;
  try {
    const mask = await infer(pixels);
    post({ type: 'mask', id, mask }, [mask.buffer]);
  } catch (error) {
    // Start over on the next image: a failed download is retried, a cached model reloads quickly.
    session = null;
    model = null;
    post({ type: 'error', id, message: error instanceof Error ? error.message : String(error) });
  }
};
