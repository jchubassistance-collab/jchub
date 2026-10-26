import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdjustment, isMargin, isPageSize, jpegExifRotation, layoutImagePage, pdfImagePlacement } from '../lib/images-to-pdf.ts';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≠ ${expected}`);

test('sans marge, l’image entière occupe toute la largeur de la page A4 et reste centrée', () => {
  const { page, frame, image } = layoutImagePage(800, 600, { pageSize: 'a4', orientation: 'portrait', fit: 'contain', margin: 'none' });
  assert.deepEqual(page, { width: 210, height: 297 });
  assert.deepEqual(frame, { x: 0, y: 0, width: 210, height: 297 });
  close(image.x, 0);
  close(image.width, 210);
  close(image.height, 157.5);
  close(image.y, (297 - 157.5) / 2);
});

test('une marge laisse le même vide sur les quatre côtés de la zone de l’image', () => {
  const { frame, image } = layoutImagePage(800, 600, { pageSize: 'a4', orientation: 'portrait', fit: 'contain', margin: 'small' });
  assert.deepEqual(frame, { x: 10, y: 10, width: 190, height: 277 });
  close(image.x, 10);
  close(image.width, 190);
  close(image.y, 10 + (277 - 142.5) / 2);
});

test('« remplir la page » couvre toute la zone entre les marges et déborde du côté recadré', () => {
  const { page, frame, image } = layoutImagePage(800, 600, { pageSize: 'a4', orientation: 'landscape', fit: 'cover', margin: 'large' });
  assert.deepEqual(page, { width: 297, height: 210 });
  assert.deepEqual(frame, { x: 20, y: 20, width: 257, height: 170 });
  close(image.width, 257);
  assert.ok(image.height > frame.height);
  close(image.y + image.height / 2, frame.y + frame.height / 2);
});

test('une page à la taille de l’image garde ses proportions, quelle que soit l’orientation demandée', () => {
  const { page, image } = layoutImagePage(960, 480, { pageSize: 'image', orientation: 'portrait', fit: 'contain', margin: 'small' });
  close(image.width, 254);
  close(image.height, 127);
  assert.deepEqual({ x: image.x, y: image.y }, { x: 10, y: 10 });
  close(page.width, 274);
  close(page.height, 147);
});

test('seuls les formats et les marges proposés sont acceptés', () => {
  assert.ok(['a4', 'letter', 'image'].every(isPageSize));
  assert.ok(['none', 'small', 'large'].every(isMargin));
  for (const value of ['a3', 'toString', 'constructor', '', undefined, 10]) {
    assert.equal(isPageSize(value), false);
    assert.equal(isMargin(value), false);
  }
});

const a4 = { pageSize: 'a4', orientation: 'portrait', fit: 'contain', margin: 'small' };

test('le zoom agrandit l’image autour du centre du cadre', () => {
  const { frame, image } = layoutImagePage(800, 600, a4, { zoom: 2, x: 0, y: 0, rotation: 0 });
  close(image.width, 380);
  close(image.height, 285);
  close(image.x + image.width / 2, frame.x + frame.width / 2);
  close(image.y + image.height / 2, frame.y + frame.height / 2);
});

test('la position aligne les bords de l’image sur ceux du cadre, qu’elle soit plus petite ou plus grande', () => {
  const small = layoutImagePage(800, 600, a4, { zoom: 0.5, x: -1, y: 1, rotation: 0 });
  close(small.image.x, small.frame.x);
  close(small.image.y + small.image.height, small.frame.y + small.frame.height);
  const large = layoutImagePage(800, 600, a4, { zoom: 3, x: 1, y: -1, rotation: 0 });
  close(large.image.x + large.image.width, large.frame.x + large.frame.width);
  close(large.image.y, large.frame.y);
});

test('un quart de tour échange les côtés de l’image, y compris sur une page à sa taille', () => {
  const { image } = layoutImagePage(800, 600, { ...a4, margin: 'none' }, { zoom: 1, x: 0, y: 0, rotation: 90 });
  close(image.width, 210);
  close(image.height, 280);
  const matched = layoutImagePage(960, 480, { ...a4, pageSize: 'image' }, { zoom: 1, x: 0, y: 0, rotation: 270 });
  close(matched.image.width, 127);
  close(matched.image.height, 254);
  close(matched.page.height, 274);
});

/** Where jsPDF draws a point of the picture (u to the right, v down, from 0 to 1) with these `addImage` arguments. */
function jsPdfPoint({ x, y, width, height, angle }, u, v) {
  // Turned counterclockwise about the bottom-left corner of the unturned picture, y pointing down.
  const a = u * width;
  const b = -(1 - v) * height;
  const r = (angle * Math.PI) / 180;
  return [x + a * Math.cos(r) + b * Math.sin(r), y + height - a * Math.sin(r) + b * Math.cos(r)];
}

test('le placement jsPDF dessine l’image tournée exactement dans sa boîte', () => {
  const box = { x: 30, y: 40, width: 120, height: 80 };
  const corners = { tl: [30, 40], tr: [150, 40], br: [150, 120], bl: [30, 120] };
  // The corner where the top-left of the picture lands, then the top-right one.
  const expected = { 0: ['tl', 'tr'], 90: ['tr', 'br'], 180: ['br', 'bl'], 270: ['bl', 'tl'] };
  for (const rotation of [0, 90, 180, 270]) {
    const placement = pdfImagePlacement(box, rotation);
    const [topLeft, topRight] = expected[rotation];
    jsPdfPoint(placement, 0, 0).forEach((value, axis) => close(value, corners[topLeft][axis]));
    jsPdfPoint(placement, 1, 0).forEach((value, axis) => close(value, corners[topRight][axis]));
  }
});

/** A JPEG start with an EXIF orientation, in either byte order, behind a JFIF segment. */
function jpegWithOrientation(orientation, little) {
  const word = (value) => little ? [value & 0xff, value >> 8] : [value >> 8, value & 0xff];
  const tiff = [...(little ? [0x49, 0x49] : [0x4d, 0x4d]), ...word(42), ...(little ? [8, 0, 0, 0] : [0, 0, 0, 8]), ...word(1), ...word(0x0112), ...word(3), ...(little ? [1, 0, 0, 0] : [0, 0, 0, 1]), ...word(orientation), 0, 0, 0, 0, 0, 0];
  const exif = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
  const jfif = [0xff, 0xe0, 0, 7, 0x4a, 0x46, 0x49, 0x46, 0];
  return new Uint8Array([0xff, 0xd8, ...jfif, 0xff, 0xe1, (exif.length + 2) >> 8, (exif.length + 2) & 0xff, ...exif, 0xff, 0xda, 0, 2]);
}

test('l’orientation EXIF d’un JPEG donne le quart de tour à dessiner', () => {
  for (const little of [true, false]) {
    assert.equal(jpegExifRotation(jpegWithOrientation(1, little)), 0);
    assert.equal(jpegExifRotation(jpegWithOrientation(6, little)), 90);
    assert.equal(jpegExifRotation(jpegWithOrientation(3, little)), 180);
    assert.equal(jpegExifRotation(jpegWithOrientation(8, little)), 270);
  }
  assert.equal(jpegExifRotation(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0, 2])), 0);
  assert.equal(jpegExifRotation(new Uint8Array([0x89, 0x50, 0x4e, 0x47])), 0);
  assert.equal(jpegExifRotation(jpegWithOrientation(6, true).subarray(0, 30)), 0);
});

test('seuls les réglages d’aperçu dans les limites sont acceptés', () => {
  assert.ok(isAdjustment({ zoom: 1, x: 0, y: 0, rotation: 0 }));
  assert.ok(isAdjustment({ zoom: 4, x: -1, y: 1, rotation: 270 }));
  for (const value of [null, {}, { zoom: 5, x: 0, y: 0, rotation: 0 }, { zoom: 1, x: 2, y: 0, rotation: 0 }, { zoom: 1, x: 0, y: 0, rotation: 45 }, { zoom: Number.NaN, x: 0, y: 0, rotation: 0 }, { zoom: '1', x: 0, y: 0, rotation: 0 }]) {
    assert.equal(isAdjustment(value), false);
  }
});
