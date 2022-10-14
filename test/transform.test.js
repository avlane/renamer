import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCase, slugify } from '../lib/transform.js';

test('slugify', () => {
  assert.equal(slugify('My Holiday (2022)!'), 'my-holiday-2022');
  assert.equal(slugify('  --Already--slugged--  '), 'already-slugged');
  assert.equal(slugify('Café crème'), 'cafe-creme');
  assert.equal(slugify('under_scores and.dots'), 'under-scores-and-dots');
  assert.equal(slugify('!!!'), '');
});

test('applyCase lower and upper change the extension too', () => {
  assert.deepEqual(applyCase('lower', 'My File', '.JPG'), { stem: 'my file', ext: '.jpg' });
  assert.deepEqual(applyCase('upper', 'My File', '.jpg'), { stem: 'MY FILE', ext: '.JPG' });
});

test('applyCase title leaves the extension alone', () => {
  assert.deepEqual(applyCase('title', 'my holiday_photo-2022', '.JPG'), { stem: 'My Holiday_Photo-2022', ext: '.JPG' });
  assert.deepEqual(applyCase('title', 'SHOUTING', '.txt'), { stem: 'Shouting', ext: '.txt' });
});

test('applyCase slug lower-cases the extension', () => {
  assert.deepEqual(applyCase('slug', 'My Holiday (2022)!', '.JPG'), { stem: 'my-holiday-2022', ext: '.jpg' });
});

test('applyCase rejects unknown modes', () => {
  assert.throws(() => applyCase('snake', 'a', '.b'), /unknown case mode/);
});
