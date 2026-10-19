import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SET,
  LIBRARY,
  TRACE_SIZE,
  buildIco,
  colorLayers,
  containRect,
  fontCss,
  fontEntries,
  glyphContours,
  hasTransparency,
  inkFromPixels,
  kmeans,
  libraryItem,
  loopsToPath,
  pickColorCount,
  pixelBlock,
  slugify,
  smoothLogo,
  spriteSymbol,
  svgFile,
  svgMarkup,
  traceInk,
  uniqueSlugs,
  usageCode,
  vectorKey,
} from '../lib/icon-pack.ts';

/** Signed area: its sign tells the direction a contour turns. */
const signedArea = (loop) => loop.reduce((sum, point, index) => {
  const next = loop[(index + 1) % loop.length];
  return sum + point[0] * next[1] - next[0] * point[1];
}, 0) / 2;

function inkSquare(size, squares) {
  const ink = new Uint8Array(size * size);
  for (const [x0, y0, x1, y1, value = 1] of squares) {
    for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) ink[y * size + x] = value;
  }
  return ink;
}

test('la bibliothèque a 28 icônes nommées dans les deux langues et le jeu d’exemple en vient', () => {
  assert.equal(LIBRARY.length, 28);
  assert.equal(new Set(LIBRARY.map((icon) => icon.id)).size, 28);
  for (const icon of LIBRARY) assert.ok(icon.fr && icon.en && icon.body.startsWith('<'), icon.id);
  for (const id of DEFAULT_SET) assert.ok(LIBRARY.some((icon) => icon.id === id), id);
  assert.equal(libraryItem(LIBRARY[0], 'i1', 'fr').name, 'accueil');
  assert.equal(libraryItem(LIBRARY[0], 'i1', 'en').name, 'home');
});

test('les noms de fichiers sont propres et uniques', () => {
  assert.equal(slugify('Appareil photo  Été!'), 'appareil-photo-ete');
  const items = [{ id: 'a', name: 'Cœur' }, { id: 'b', name: 'coeur' }, { id: 'c', name: '***' }, { id: 'd', name: 'coeur' }];
  assert.deepEqual(uniqueSlugs(items, 'icone'), { a: 'coeur', b: 'coeur-2', c: 'icone', d: 'coeur-3' });
});

test('le SVG d’une icône garde sa couleur, son trait et rien d’injecté', () => {
  const lib = { ...libraryItem(LIBRARY[1], 'i1', 'fr'), color: '#ff0000', strokeWidth: 2.5 };
  assert.match(svgMarkup(lib), /stroke="#ff0000" stroke-width="2.5"/);
  assert.match(svgMarkup(lib, { size: 64 }), / width="64" height="64"/);
  assert.match(svgMarkup({ ...lib, color: 'red" onload="x' }), /stroke="#2f6bff"/, 'une couleur invalide est remplacée');

  const svg = { id: 'i2', kind: 'svg', name: 'x', body: '<path fill="currentColor" d="M0 0h10v10z"/>', viewBox: '0 0 10 10"><script>', rootAttributes: 'fill="currentColor"', color: '#123456' };
  assert.match(svgMarkup(svg), /viewBox="0 0 10 10&quot;&gt;&lt;script&gt;"/);
  assert.match(svgMarkup(svg), /style="color:#123456"/);
  assert.match(svgFile(svg), /fill="#123456"/);
  assert.doesNotMatch(svgFile(svg), /currentColor/);
  assert.match(spriteSymbol(lib, 'jc-recherche'), /<symbol id="jc-recherche"[^>]*stroke="currentColor"/);
});

test('une image vectorisée s’exporte en une couleur ou en couches', () => {
  const raster = { id: 'i3', kind: 'raster', name: 'logo', src: 'data:', transparent: true, mode: 'vector', colors: 0, threshold: 150, invert: false, color: '#0b1b33' };
  assert.equal(svgMarkup(raster), '', 'pas encore vectorisée');
  const layers = [{ color: '#1f5fff', loops: [], d: 'M0 0L1 0L1 1Z' }, { color: '#000000', loops: [], d: 'M2 2L3 2L3 3Z' }];
  const multi = { ...raster, vector: { layers, usesThreshold: false } };
  assert.equal((svgMarkup(multi).match(/<path /g) ?? []).length, 2);
  assert.match(svgMarkup(multi), /fill="#1f5fff"/);
  assert.match(svgMarkup(multi, { mono: true, color: '#ffffff' }), /fill="#ffffff"><path fill-rule="nonzero" d="M0 0L1 0L1 1Z"\/><\/svg>$/);
  assert.notEqual(vectorKey(raster), vectorKey({ ...raster, threshold: 151 }));
});

test('le suivi de contours trouve les formes, garde les trous et ignore les poussières', () => {
  const square = traceInk(inkSquare(20, [[5, 5, 15, 15]]), 20, 20);
  assert.equal(square.length, 1);
  assert.equal(square[0].length, 4, 'les points alignés sont supprimés');
  assert.equal(Math.abs(signedArea(square[0])), 100);

  const ring = traceInk(inkSquare(30, [[5, 5, 25, 25], [10, 10, 20, 20, 0]]), 30, 30);
  assert.equal(ring.length, 2);
  assert.ok(Math.sign(signedArea(ring[0])) !== Math.sign(signedArea(ring[1])), 'le trou tourne dans l’autre sens');

  assert.equal(traceInk(inkSquare(10, [[2, 2, 4, 4]]), 10, 10).length, 0, 'moins de 8 px² : ignoré');
  assert.equal(loopsToPath([[[0, 0], [10.04, 0], [10, 5.55]]]), 'M0 0L10 0L10 5.6Z');
  const octagon = [[4, 0], [6, 0], [8, 2], [8, 4], [6, 6], [4, 6], [2, 4], [2, 2]].map(([x, y]) => [x * 10, y * 10]);
  assert.match(loopsToPath([octagon]), /^M30 10Q40 0 50 0Q60 0 70 10Q80 20 80 30.*Q20 20 30 10Z$/, 'les angles doux deviennent des courbes');
});

test('le seuil, l’inversion et la transparence choisissent les bons pixels', () => {
  // 2 × 1 pixels: dark opaque, then light and transparent.
  const data = new Uint8ClampedArray([10, 10, 10, 255, 240, 240, 240, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const rect = { x: 0, y: 0, width: 2, height: 2 };
  assert.deepEqual(Array.from(inkFromPixels(data, 2, rect, false, 150, false)), [1, 0, 1, 1]);
  assert.deepEqual(Array.from(inkFromPixels(data, 2, rect, false, 150, true)), [0, 1, 0, 0]);
  assert.deepEqual(Array.from(inkFromPixels(data, 2, rect, true, 150, false)), [1, 0, 0, 0]);
  assert.equal(hasTransparency(data), true);
  assert.equal(hasTransparency(new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 255])), false);
  assert.deepEqual(containRect(200, 100, 16, 16, 368), { x: 16, y: 108, width: 368, height: 184 });
});

test('le nombre de couleurs est choisi automatiquement', () => {
  const two = new Float32Array(600);
  for (let index = 0; index < 200; index += 1) two.set(index < 100 ? [250, 20, 20] : [20, 20, 250], index * 3);
  assert.equal(pickColorCount(two, 200, 0), 2);
  assert.equal(pickColorCount(two, 200, 4), 4, 'un nombre choisi est respecté');
  assert.equal(pickColorCount(new Float32Array(300).fill(128), 100, 0), 1);
  const { centers } = kmeans(two, 200, 2);
  assert.deepEqual(centers.map((center) => center.map(Math.round)).sort((a, b) => a[0] - b[0]), [[20, 20, 250], [250, 20, 20]]);
});

test('une image en couleurs donne une couche par couleur, la plus grande en dessous, sans le fond', () => {
  // White background, a blue square and a black square inside it.
  const size = 60;
  const data = new Uint8ClampedArray(size * size * 4).fill(255);
  const paint = (x0, y0, x1, y1, [r, g, b]) => {
    for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) data.set([r, g, b, 255], (y * size + x) * 4);
  };
  paint(10, 10, 50, 50, [0, 0, 255]);
  paint(25, 25, 35, 35, [0, 0, 0]);
  const layers = colorLayers(data, size, { x: 0, y: 0, width: size, height: size }, false, 3, '#0b1b33');
  assert.equal(layers.length, 2, 'le blanc du bord est le fond');
  assert.equal(layers[0].color, '#0000ff');
  assert.equal(layers[0].loops.length, 1, 'la couche bleue couvre aussi le carré noir');
  assert.equal(Math.abs(signedArea(layers[0].loops[0])), 1600);
  assert.equal(layers[1].color, '#000000');
  assert.equal(Math.abs(signedArea(layers[1].loops[0])), 100);
});

test('le favicon ICO, la police et le code d’utilisation sont bien formés', () => {
  const ico = buildIco([{ size: 16, data: new Uint8Array([1, 2, 3]) }, { size: 256, data: new Uint8Array([4, 5]) }]);
  assert.deepEqual(Array.from(ico.slice(0, 6)), [0, 0, 1, 0, 2, 0]);
  assert.equal(ico[6], 16);
  assert.equal(ico[22], 0, '256 px s’écrit 0');
  const view = new DataView(ico.buffer);
  assert.equal(view.getUint32(6 + 12, true), 38, 'la première image suit l’en-tête');
  assert.deepEqual(Array.from(ico.slice(38)), [1, 2, 3, 4, 5]);

  assert.deepEqual(glyphContours([[[0, 0], [TRACE_SIZE, TRACE_SIZE]]]), [[[0, 960], [1024, -64]]]);
  const items = [{ id: 'a', name: 'accueil', vector: { layers: [{ color: '', loops: [[[0, 0], [1, 0], [1, 1]]], d: '' }], usesThreshold: false } }];
  const entries = fontEntries(items, { a: 'accueil' });
  assert.equal(entries[0].code, 0xe900);
  assert.match(fontCss('jchub-icons', 'jc', entries), /\.jc-accueil:before\{content:"\\e900"\}/);
  assert.match(usageCode('sprite', { prefix: 'jc', family: 'jchub-icons', name: 'accueil', color: '#2f6bff', locale: 'fr' }), /<use href="sprite\.svg#jc-accueil">/);
  assert.match(usageCode('font', { prefix: 'jc', family: 'jchub-icons', name: 'home', color: '#2f6bff', locale: 'en' }), /Size and color like text/);
  assert.match(usageCode('favicon', { prefix: 'jc', family: 'f', name: 'x', color: '#000000', locale: 'fr' }), /apple-touch-icon/);
});

/** A `size` px image: white, with a blue disc whose edge is anti-aliased. */
function discImage(size) {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const cover = Math.max(0, Math.min(1, size * 0.3 - Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) + 0.5));
      data.set([Math.round(255 - 255 * cover), Math.round(255 - 153 * cover), 255, 255], (y * size + x) * 4);
    }
  }
  return data;
}

test('un logo en aplats est redessiné en formes vectorielles, avec ses couleurs exactes', () => {
  const smooth = smoothLogo(discImage(64), 64, 64);
  assert.ok(smooth, 'aplats reconnus');
  assert.deepEqual(smooth.layers.map((layer) => layer.color), ['#ffffff', '#0066ff'], 'les nuances du bord ne deviennent pas des couleurs');
  assert.match(smooth.layers[1].d, /Q/, 'le disque est fait de courbes');
  assert.equal(smooth.width, 768);
});

test('une photo ou un dégradé garde ses pixels', () => {
  const gradient = new Uint8ClampedArray(64 * 64 * 4);
  for (let index = 0; index < 64 * 64; index += 1) gradient.set([index % 64 * 4, 80, 255 - (index % 64) * 4, 255], index * 4);
  assert.equal(smoothLogo(gradient, 64, 64), null);
  const noise = new Uint8ClampedArray(64 * 64 * 4).map((_, index) => (index % 4 === 3 ? 255 : (index * 7919) % 251));
  assert.equal(smoothLogo(noise, 64, 64), null);
});

test('une image agrandie sans lissage est retracée depuis ses vrais pixels', () => {
  const small = discImage(32);
  const big = new Uint8ClampedArray(96 * 96 * 4);
  for (let y = 0; y < 96; y += 1) for (let x = 0; x < 96; x += 1) big.set(small.subarray(((y / 3 | 0) * 32 + (x / 3 | 0)) * 4, ((y / 3 | 0) * 32 + (x / 3 | 0)) * 4 + 4), (y * 96 + x) * 4);
  assert.equal(pixelBlock(big, 96, 96), 3);
  assert.equal(pixelBlock(small, 32, 32), 1);
});
