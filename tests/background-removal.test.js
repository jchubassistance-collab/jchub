import test from 'node:test';
import assert from 'node:assert/strict';
import { MODEL_SIZE, outputSize, toMask, toModelInput } from '../lib/background-removal.ts';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} ≠ ${expected}`);

test('l’entrée du modèle range les canaux R, G puis B à la suite, normalisés comme ImageNet', () => {
  const pixels = MODEL_SIZE * MODEL_SIZE;
  const rgba = new Uint8ClampedArray(pixels * 4);
  rgba.set([255, 0, 128, 255], 0);
  rgba.set([0, 255, 0, 255], (pixels - 1) * 4);
  const input = toModelInput(rgba);
  assert.equal(input.length, 3 * pixels);
  close(input[0], (1 - 0.485) / 0.229);
  close(input[pixels], (0 - 0.456) / 0.224);
  close(input[2 * pixels], (128 / 255 - 0.406) / 0.225);
  close(input[2 * pixels - 1], (1 - 0.456) / 0.224);
});

test('le masque est la sigmoïde des logits, sur un octet', () => {
  assert.deepEqual(Array.from(toMask(new Float32Array([0, 20, -20, 2]))), [128, 255, 0, 225]);
});

test('l’image téléchargée garde sa taille, sauf au-delà de 4096 pixels de côté', () => {
  assert.deepEqual(outputSize(1024, 683), { width: 1024, height: 683 });
  assert.deepEqual(outputSize(8000, 4000), { width: 4096, height: 2048 });
  assert.deepEqual(outputSize(3000, 9000), { width: 1365, height: 4096 });
});
