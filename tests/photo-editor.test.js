import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FILTERS,
  NEUTRAL_TONES,
  applyDetail,
  applyFilter,
  applyTones,
  borderColor,
  exportDimensions,
  fillBehind,
  flipRect,
  initialPhotoSettings,
  isNeutralTone,
  orientedSize,
  removePlainBackground,
  settlePhoto,
  straightenZoom,
  turnRect,
} from '../lib/photo-editor.ts';
import { floodSelect, frameToSource, maskDimensions, matteToAlpha, modelDimensions, toModelInput } from '../lib/photo-segmentation.ts';

/** A `width` × `height` image filled with one RGBA color. */
function image(width, height, [r, g, b, a = 255]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let at = 0; at < data.length; at += 4) data.set([r, g, b, a], at);
  return data;
}

test('une photo neutre garde exactement ses pixels', () => {
  const data = image(4, 3, [120, 80, 200]);
  const before = data.slice();
  applyTones(data, 4, 3, NEUTRAL_TONES);
  applyDetail(data, 4, 3, NEUTRAL_TONES);
  assert.deepEqual(data, before);
  assert.equal(isNeutralTone(initialPhotoSettings(10, 10)), true);
});

test('l’exposition éclaircit, le noir et blanc retire la couleur, la chaleur ajoute du rouge', () => {
  const bright = image(1, 1, [100, 100, 100]);
  applyTones(bright, 1, 1, { ...NEUTRAL_TONES, exposure: 50 });
  assert.ok(bright[0] > 100);

  const gray = image(1, 1, [200, 40, 40]);
  applyTones(gray, 1, 1, { ...NEUTRAL_TONES, mono: 100 });
  assert.equal(gray[0], gray[1]);
  assert.equal(gray[1], gray[2]);

  const warm = image(1, 1, [100, 100, 100]);
  applyTones(warm, 1, 1, { ...NEUTRAL_TONES, temperature: 60 });
  assert.ok(warm[0] > warm[2]);
});

test('la vignette assombrit les coins et épargne le centre', () => {
  const data = image(21, 21, [200, 200, 200]);
  applyTones(data, 21, 21, { ...NEUTRAL_TONES, vignette: 100 });
  const center = (10 * 21 + 10) * 4;
  assert.ok(data[center] >= 195);
  assert.ok(data[0] < 150);
});

test('un filtre remplace les réglages et suit son intensité', () => {
  const settings = { ...initialPhotoSettings(10, 10), exposure: 40 };
  const full = applyFilter(settings, 'vintage');
  assert.equal(full.exposure, 0);
  assert.equal(full.fade, FILTERS.vintage.fade);
  const half = applyFilter(settings, 'vintage', 50);
  assert.equal(half.fade, Math.round(FILTERS.vintage.fade / 2));
  assert.equal(applyFilter(settings, 'none').exposure, 0);
});

test('les réglages hors limites sont ramenés dans leur plage', () => {
  const settled = settlePhoto({ ...initialPhotoSettings(10, 10), exposure: 250, fade: -5, turns: 5, straighten: 90 });
  assert.equal(settled.exposure, 100);
  assert.equal(settled.fade, 0);
  assert.equal(settled.turns, 1);
  assert.equal(settled.straighten, 45);
});

test('quatre quarts de tour et deux miroirs rendent le même cadrage', () => {
  const crop = { x: 10, y: 20, width: 30, height: 40 };
  let rect = crop;
  let [width, height] = [200, 100];
  for (let index = 0; index < 4; index += 1) {
    rect = turnRect(rect, width, height);
    [width, height] = [height, width];
  }
  assert.deepEqual(rect, crop);
  assert.deepEqual(turnRect(crop, 200, 100), { x: 40, y: 10, width: 40, height: 30 });
  assert.deepEqual(flipRect(flipRect(crop, 200, 100, 'x'), 200, 100, 'x'), crop);
  assert.deepEqual(flipRect(crop, 200, 100, 'y'), { x: 10, y: 40, width: 30, height: 40 });
  assert.deepEqual(orientedSize(200, 100, 1), { width: 100, height: 200 });
});

test('redresser agrandit juste assez pour ne laisser aucun coin vide', () => {
  assert.equal(straightenZoom(400, 300, 0), 1);
  const zoom = straightenZoom(400, 300, 10);
  assert.ok(zoom > 1 && zoom < 1.5);
  assert.ok(straightenZoom(400, 300, 20) > zoom);
});

test('l’export réduit la photo à la taille demandée sans jamais l’agrandir', () => {
  const crop = { x: 0, y: 0, width: 4000, height: 3000 };
  assert.deepEqual(exportDimensions(crop, 1080), { width: 1080, height: 810, scale: 0.27 });
  assert.equal(exportDimensions(crop, 'original').width, 4000);
  assert.equal(exportDimensions({ x: 0, y: 0, width: 500, height: 400 }, 2048).width, 500);
});

test('le fond uni est rendu transparent et le sujet garde ses pixels', () => {
  const width = 10;
  const height = 10;
  const data = image(width, height, [250, 250, 250]);
  // A dark square in the middle: the subject.
  for (let y = 3; y < 7; y += 1) for (let x = 3; x < 7; x += 1) data.set([20, 30, 160, 255], (y * width + x) * 4);
  assert.deepEqual(borderColor(data, width, height).map(Math.round), [250, 250, 250]);
  assert.equal(removePlainBackground(data, width, height, 30), true);
  assert.equal(data[3], 0);
  assert.equal(data[(5 * width + 5) * 4 + 3], 255);
  assert.deepEqual([...data.slice((5 * width + 5) * 4, (5 * width + 5) * 4 + 3)], [20, 30, 160]);
  fillBehind(data, [255, 255, 255]);
  assert.deepEqual([...data.slice(0, 4)], [255, 255, 255, 255]);
});

test('le flou adoucit un bord net, la netteté le renforce', () => {
  const width = 12;
  const make = () => {
    const data = image(width, 1, [0, 0, 0]);
    for (let x = 6; x < width; x += 1) data.set([255, 255, 255, 255], x * 4);
    return data;
  };
  const blurred = make();
  applyDetail(blurred, width, 1, { blur: 100, sharpness: 0 });
  assert.ok(blurred[5 * 4] > 0 && blurred[6 * 4] < 255);
  const sharp = make();
  applyDetail(sharp, width, 1, { blur: 0, sharpness: 100 });
  assert.equal(sharp[0], 0);
  assert.equal(sharp[(width - 1) * 4], 255);
});

test('le modèle de détourage lit une image au côté court de 512, en multiples de 32, jamais plus de 1024', () => {
  assert.deepEqual(modelDimensions(1600, 1200), { width: 672, height: 512 });
  assert.deepEqual(modelDimensions(591, 1280), { width: 480, height: 1024 });
  const panorama = modelDimensions(6000, 1000);
  assert.ok(panorama.width <= 1024 && panorama.width % 32 === 0 && panorama.height % 32 === 0);
  assert.deepEqual(maskDimensions(4000, 3000), { width: 1024, height: 768 });
  assert.deepEqual(maskDimensions(800, 600), { width: 800, height: 600 });
});

test('l’entrée du modèle va de -1 à 1 par couleur, et sa sortie devient une opacité', () => {
  const input = toModelInput(new Uint8ClampedArray([0, 255, 127.5, 255]), 1, 1);
  assert.equal(input[0], -1);
  assert.equal(input[1], 1);
  assert.deepEqual([...matteToAlpha([0, 0.5, 1])], [0, 128, 255]);
});

test('la baguette sélectionne la zone touchée de même couleur, pas au-delà d’un bord', () => {
  const width = 6;
  const data = image(width, 1, [250, 250, 250]);
  data.set([10, 10, 10, 255], 3 * 4); // a dark pixel splits the line in two
  const selected = floodSelect(data, width, 1, 0, 10);
  assert.deepEqual([...selected], [1, 1, 1, 0, 0, 0]);
});

test('un point de la photo tournée, retournée et redressée retombe sur le bon pixel de l’original', () => {
  const flat = { turns: 0, flipX: false, flipY: false, straighten: 0 };
  assert.deepEqual(frameToSource(10, 20, flat, 200, 100, 1), { x: 10, y: 20 });
  // A quarter turn clockwise: the top-left corner of the original goes to the top-right.
  const turned = frameToSource(99, 0, { ...flat, turns: 1 }, 200, 100, 1);
  assert.ok(Math.abs(turned.x) < 1e-9 && Math.abs(turned.y - 1) < 1e-9);
  const mirrored = frameToSource(10, 20, { ...flat, flipX: true }, 200, 100, 1);
  assert.deepEqual(mirrored, { x: 190, y: 20 });
  // Straightening turns around the center: the center stays where it is.
  const center = frameToSource(100, 50, { ...flat, straighten: 12 }, 200, 100, 1.3);
  assert.ok(Math.abs(center.x - 100) < 1e-9 && Math.abs(center.y - 50) < 1e-9);
});
