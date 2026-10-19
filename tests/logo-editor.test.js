import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_SIDE,
  applyColorMatrix,
  buildSvgDocument,
  colorMatrix,
  contentBounds,
  cropViewBox,
  dragCrop,
  exportScaleFor,
  fitAspect,
  fitCanvasToLogo,
  fitLogoInCanvas,
  initialSettings,
  isIdentityMatrix,
  outlineAlpha,
  overflowsCanvas,
  record,
  redo,
  safeColor,
  settle,
  sharpen,
  sniffFormat,
  startHistory,
  svgDimensions,
  svgMatrixValues,
  svgWorkingSize,
  undo,
} from '../lib/logo-editor.ts';

const pixel = (r, g, b, a = 255) => new Uint8ClampedArray([r, g, b, a]);
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-6, `${message}: ${actual} ≠ ${expected}`);

test('les réglages de couleur par défaut ne changent aucun pixel', () => {
  const settings = initialSettings(100, 50);
  assert.ok(isIdentityMatrix(colorMatrix(settings)));
  assert.equal(svgMatrixValues(colorMatrix(settings)), '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');
});

test('inversion, luminosité, saturation et recoloration donnent les couleurs attendues', () => {
  const base = initialSettings(10, 10);
  let data = pixel(255, 0, 0);
  applyColorMatrix(data, colorMatrix({ ...base, invert: true }));
  assert.deepEqual(Array.from(data), [0, 255, 255, 255]);

  data = pixel(100, 100, 100);
  applyColorMatrix(data, colorMatrix({ ...base, brightness: 50 }));
  assert.deepEqual(Array.from(data), [150, 150, 150, 255]);

  data = pixel(200, 40, 90);
  applyColorMatrix(data, colorMatrix({ ...base, saturation: -100 }));
  assert.equal(data[0], data[1], 'saturation à -100 : niveaux de gris');
  assert.equal(data[1], data[2]);

  data = pixel(12, 200, 90, 128);
  applyColorMatrix(data, colorMatrix({ ...base, tintEnabled: true, tintColor: '#2563eb', tintAmount: 100 }));
  assert.deepEqual(Array.from(data), [0x25, 0x63, 0xeb, 128], 'la couleur est remplacée, la transparence gardée');
});

test('les pixels transparents restent intacts', () => {
  const data = pixel(10, 20, 30, 0);
  applyColorMatrix(data, colorMatrix({ ...initialSettings(10, 10), invert: true, brightness: 80 }));
  assert.deepEqual(Array.from(data), [10, 20, 30, 0]);
});

test('le contour suit la distance réelle, même autour d’un seul pixel', () => {
  const size = 11;
  const alpha = new Uint8Array(size * size);
  alpha[5 * size + 5] = 255;
  const outline = outlineAlpha(alpha, size, size, 3);
  assert.equal(outline[5 * size + 5], 255, 'sous le logo');
  assert.equal(outline[5 * size + 8], 255, 'à 3 pixels');
  assert.equal(outline[5 * size + 9], 0, 'à 4 pixels');
  assert.equal(outline[7 * size + 7], 255, 'en diagonale à 2,8 pixels');
  assert.equal(outline[8 * size + 8], 0, 'en diagonale à 4,2 pixels');
  assert.ok(outline[5 * size + 2] === outline[5 * size + 8] && outline[2 * size + 5] === outline[8 * size + 5], 'contour symétrique');
});

test('le canevas ajusté entoure le logo pivoté et ses effets', () => {
  const rotated = settle({ ...initialSettings(100, 50), rotation: 90 });
  assert.equal(rotated.canvasWidth, 50);
  assert.equal(rotated.canvasHeight, 100);
  assert.equal(rotated.x, 25);
  assert.equal(rotated.y, 50);

  const outlined = settle({ ...initialSettings(100, 50), outlineEnabled: true, outlineWidth: 5 });
  assert.deepEqual([outlined.canvasWidth, outlined.canvasHeight, outlined.x, outlined.y], [110, 60, 55, 30]);

  const shadowed = settle({ ...initialSettings(100, 100), shadowEnabled: true, shadowBlur: 10, shadowX: 0, shadowY: 20 });
  assert.equal(shadowed.canvasWidth, 130, '1,5 × flou de chaque côté');
  assert.equal(shadowed.canvasHeight, 50 + 50 + 15 + 20, 'décalée vers le bas, l’ombre ne dépasse pas en haut');
  assert.equal(shadowed.y, 50);
  assert.ok(!overflowsCanvas(shadowed));
});

test('le canevas ne dépasse jamais la taille maximale', () => {
  const huge = fitCanvasToLogo({ ...initialSettings(MAX_SIDE, MAX_SIDE), rotation: 45 });
  assert.ok(huge.canvasWidth <= MAX_SIDE && huge.canvasHeight <= MAX_SIDE);
  assert.ok(huge.scale < 1);
});

test('un format choisi centre le logo et le met à l’échelle avec une marge', () => {
  const placed = fitLogoInCanvas(initialSettings(200, 100), 512, 512);
  assert.equal(placed.autoFit, false);
  assert.deepEqual([placed.canvasWidth, placed.canvasHeight, placed.x, placed.y], [512, 512, 256, 256]);
  close(placed.scale, (512 * 0.8) / 200, 'échelle');
  assert.ok(!overflowsCanvas(placed));
  assert.ok(overflowsCanvas({ ...placed, x: 20 }));
});

test('le cadre de recadrage reste dans l’image et garde ses proportions', () => {
  const start = { x: 10, y: 10, width: 50, height: 50 };
  assert.deepEqual(dragCrop(start, 'move', 100, -30, 100, 80), { x: 50, y: 0, width: 50, height: 50 });
  assert.deepEqual(dragCrop(start, 'se', 20, 5, 100, 80), { x: 10, y: 10, width: 70, height: 55 });
  assert.deepEqual(dragCrop(start, 'nw', 70, 70, 100, 80), { x: 52, y: 52, width: 8, height: 8 }, 'taille minimale');
  assert.deepEqual(dragCrop(start, 'se', 20, 0, 100, 80, 1), { x: 10, y: 10, width: 70, height: 70 });
  assert.deepEqual(dragCrop(start, 'se', 200, 200, 100, 80, 1), { x: 10, y: 10, width: 70, height: 70 }, 'bloqué par le bas de l’image');
  assert.deepEqual(fitAspect({ x: 0, y: 0, width: 200, height: 100 }, 1), { x: 50, y: 0, width: 100, height: 100 });
});

test('les bords vides sont détectés, transparents ou de la couleur du fond', () => {
  const width = 6;
  const height = 5;
  const transparent = new Uint8ClampedArray(width * height * 4);
  for (const [x, y] of [[2, 1], [3, 3]]) transparent.set([0, 0, 0, 255], (y * width + x) * 4);
  assert.deepEqual(contentBounds(transparent, width, height), { x: 2, y: 1, width: 2, height: 3 });

  const white = new Uint8ClampedArray(width * height * 4).fill(255);
  white.set([30, 60, 200, 255], (2 * width + 4) * 4);
  white.set([250, 250, 252, 255], (0 * width + 5) * 4);
  assert.deepEqual(contentBounds(white, width, height), { x: 4, y: 2, width: 1, height: 1 }, 'un blanc presque pur est un fond');

  assert.equal(contentBounds(new Uint8ClampedArray(width * height * 4), width, height), null);
});

test('l’historique annule, rétablit et regroupe les réglages d’un même curseur', () => {
  let history = startHistory({ value: 0 });
  history = record(history, { value: 1 }, 'slider', 1000);
  history = record(history, { value: 2 }, 'slider', 1500);
  history = record(history, { value: 3 }, 'slider', 5000);
  assert.deepEqual(history.past.map((entry) => entry.value), [0, 2], 'les deux premiers mouvements forment une seule étape');
  history = undo(history);
  assert.equal(history.present.value, 2);
  history = undo(undo(history));
  assert.equal(history.present.value, 0);
  assert.equal(undo(history), history, 'rien avant le début');
  history = redo(history);
  assert.equal(history.present.value, 2);
  history = record(history, { value: 9 }, undefined, 6000);
  assert.deepEqual(history.future, [], 'un nouveau réglage efface ce qui pouvait être rétabli');
});

test('le format est reconnu d’après le contenu du fichier', () => {
  const bytes = (...values) => new Uint8Array(values.flatMap((value) => typeof value === 'string' ? Array.from(value, (char) => char.charCodeAt(0)) : [value]));
  assert.equal(sniffFormat(bytes(0x89, 'PNG\r\n')), 'png');
  assert.equal(sniffFormat(bytes(0xff, 0xd8, 0xff, 0xe0)), 'jpeg');
  assert.equal(sniffFormat(bytes('GIF89a')), 'gif');
  assert.equal(sniffFormat(bytes('RIFF', 0, 0, 0, 0, 'WEBPVP8 ')), 'webp');
  assert.equal(sniffFormat(bytes(0, 0, 0, 0x1c, 'ftypavif', 0, 0, 0, 0, 'avifmif1')), 'avif');
  assert.equal(sniffFormat(bytes(0, 0, 0, 0x18, 'ftypheic', 0, 0, 0, 0, 'mif1heic')), 'heic');
  assert.equal(sniffFormat(bytes('%PDF-1.7')), 'pdf');
  assert.equal(sniffFormat(bytes('8BPS')), 'psd');
  assert.equal(sniffFormat(bytes(0xef, 0xbb, 0xbf, '<?xml version="1.0"?>\n<!-- logo -->\n<svg viewBox="0 0 10 10">')), 'svg');
  assert.equal(sniffFormat(bytes('<html>'), 'logo.svg'), 'svg', 'un .svg sans balise reconnue est essayé comme SVG');
  assert.equal(sniffFormat(bytes('hello')), 'unknown');
});

test('la taille d’un SVG suit son viewBox et ses unités', () => {
  assert.deepEqual(svgDimensions(null, null, '0 0 200 100'), { width: 200, height: 100, viewBox: [0, 0, 200, 100] });
  assert.deepEqual(svgDimensions('400px', '50', '0,0,200,100'), { width: 400, height: 200, viewBox: [0, 0, 200, 100] });
  assert.deepEqual(svgDimensions(null, '50', '10 10 200 100'), { width: 100, height: 50, viewBox: [10, 10, 200, 100] });
  assert.equal(Math.round(svgDimensions('1in', '1in', null).width), 96);
  assert.deepEqual(svgDimensions('100%', null, null), { width: 300, height: 150, viewBox: [0, 0, 300, 150] });
  assert.deepEqual(svgWorkingSize(24, 12), { width: 1024, height: 512 });
  assert.deepEqual(svgWorkingSize(10000, 5000), { width: MAX_SIDE, height: MAX_SIDE / 2 });
  assert.deepEqual(cropViewBox({ x: 512, y: 0, width: 512, height: 256 }, 1024, 512, [10, 10, 200, 100]), [110, 10, 100, 50]);
});

test('le SVG exporté n’ajoute que les filtres utilisés et refuse les couleurs invalides', () => {
  const plain = buildSvgDocument(initialSettings(100, 50), '<svg/>');
  assert.match(plain, /^<\?xml[^>]+\?>\n<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"[^>]* width="100" height="50" viewBox="0 0 100 50">/);
  assert.doesNotMatch(plain, /<filter|<rect/);
  assert.match(plain, /translate\(50 25\) rotate\(0\)/);

  const styled = buildSvgDocument({
    ...initialSettings(100, 50),
    background: 'custom',
    backgroundColor: 'red" onload="alert(1)',
    invert: true,
    shadowEnabled: true,
    outlineEnabled: true,
    gradientEnabled: true,
    opacity: 50,
    flipX: true,
  }, '<svg/>');
  assert.match(styled, /<rect width="100%" height="100%" fill="#000000"\/>/);
  assert.doesNotMatch(styled, /onload/);
  for (const id of ['color', 'outline', 'shadow', 'gradient', 'mask']) assert.match(styled, new RegExp(`id="jchub-logo-studio-${id}"`));
  assert.match(styled, /scale\(-1 1\)/);
  assert.match(styled, /<g opacity="0.5">/);
  const opened = (styled.match(/<g[\s>]/g) ?? []).length;
  assert.equal(opened, (styled.match(/<\/g>/g) ?? []).length, 'chaque groupe est fermé');
  assert.equal(safeColor('#ABCDEF'), '#abcdef');
});

test('l’export HD double ou quadruple la taille sans dépasser 4096 × 4096 px', () => {
  assert.equal(exportScaleFor(500, 500, 4), 4);
  assert.equal(exportScaleFor(1500, 1500, 4), 2, 'Ultra HD trop grand : HD');
  assert.equal(exportScaleFor(4096, 4096, 2), 1);
  assert.equal(exportScaleFor(800, 600, 1), 1);
});

test('l’accentuation rend les bords plus nets sans noircir autour de la transparence', () => {
  // A soft edge 0 → 255 over 6 pixels, on one line.
  const width = 12;
  const data = new Uint8ClampedArray(width * 4);
  for (let x = 0; x < width; x += 1) {
    const value = Math.max(0, Math.min(255, Math.round(((x - 3) / 6) * 255)));
    data.set([200, 40, 40, value], x * 4);
  }
  const before = Array.from({ length: width }, (_, x) => data[x * 4 + 3]);
  sharpen(data, width, 1, 2, 0.7);
  const after = Array.from({ length: width }, (_, x) => data[x * 4 + 3]);
  assert.ok(after[4] < before[4] && after[7] > before[7], 'pente plus raide');
  for (let x = 0; x < width; x += 1) if (data[x * 4 + 3]) assert.deepEqual(Array.from(data.slice(x * 4, x * 4 + 3)), [200, 40, 40], 'la couleur reste la même');
});
