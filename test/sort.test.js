import test from 'node:test';
import assert from 'node:assert/strict';
import { sortFiles } from '../lib/sort.js';

const files = ['img10.jpg', 'img2.jpg', 'Img1.jpg', 'img2b.jpg'];

test('sortFiles keeps the given order by default', () => {
  assert.deepEqual(sortFiles(files), files);
  assert.notEqual(sortFiles(files), files);
});

test('sortFiles name is plain alphabetical order', () => {
  assert.deepEqual(sortFiles(files, 'name'), ['Img1.jpg', 'img10.jpg', 'img2.jpg', 'img2b.jpg']);
});

test('sortFiles natural compares numbers as numbers and ignores case', () => {
  assert.deepEqual(sortFiles(files, 'natural'), ['Img1.jpg', 'img2.jpg', 'img2b.jpg', 'img10.jpg']);
});

test('sortFiles natural sorts by folder first', () => {
  assert.deepEqual(sortFiles(['b/1.txt', 'a/10.txt', 'a/9.txt'], 'natural'), ['a/9.txt', 'a/10.txt', 'b/1.txt']);
});

test('sortFiles mtime and size use the file data, ties by name', () => {
  const data = { a: { mtimeMs: 30, size: 5 }, b: { mtimeMs: 10, size: 5 }, c: { mtimeMs: 20, size: 1 } };
  const stat = file => data[file];
  assert.deepEqual(sortFiles(['a', 'b', 'c'], 'mtime', { stat }), ['b', 'c', 'a']);
  assert.deepEqual(sortFiles(['a', 'b', 'c'], 'size', { stat }), ['c', 'a', 'b']);
});

test('sortFiles reverse', () => {
  assert.deepEqual(sortFiles(['a', 'c', 'b'], 'name', { reverse: true }), ['c', 'b', 'a']);
  assert.deepEqual(sortFiles(['a', 'c', 'b'], undefined, { reverse: true }), ['b', 'c', 'a']);
});

test('sortFiles errors', () => {
  const stat = () => {
    throw Object.assign(new Error('nope'), { code: 'ENOENT' });
  };
  assert.throws(() => sortFiles(['gone'], 'mtime', { stat }), /cannot read gone to sort it by mtime \(ENOENT\)/);
  assert.throws(() => sortFiles(['a'], 'random'), /unknown sort order: random/);
});
