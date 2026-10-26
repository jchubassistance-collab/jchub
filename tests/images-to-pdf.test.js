import test from 'node:test';
import assert from 'node:assert/strict';
import { isMargin, isPageSize, layoutImagePage } from '../lib/images-to-pdf.ts';

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
