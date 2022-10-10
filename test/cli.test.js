import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { makeDir, removeDir, listDir, runCli } from './helpers.js';

test('cli renames files', () => {
  const dir = makeDir({ 'IMG_1.jpg': 'a', 'IMG_2.jpg': 'b', 'notes.txt': 'c' });
  try {
    const { code, out } = runCli(['IMG_', 'photo_', path.join(dir, 'IMG_1.jpg'), path.join(dir, 'IMG_2.jpg'), path.join(dir, 'notes.txt')]);
    assert.equal(code, 0);
    assert.deepEqual(listDir(dir), ['notes.txt', 'photo_1.jpg', 'photo_2.jpg']);
    assert.equal(out.trimEnd().split('\n').length, 2);
  } finally {
    removeDir(dir);
  }
});

test('cli --dry-run changes nothing but says what would happen', () => {
  const dir = makeDir({ 'a.txt': 'x' });
  try {
    const { code, out } = runCli(['-n', 'a', 'b', path.join(dir, 'a.txt')]);
    assert.equal(code, 0);
    assert.deepEqual(listDir(dir), ['a.txt']);
    assert.equal(out, `(dry run) ${path.join(dir, 'a.txt')} -> ${path.join(dir, 'b.txt')}\n`);
  } finally {
    removeDir(dir);
  }
});

test('cli reports when there is nothing to do', () => {
  const dir = makeDir({ 'a.txt': 'x' });
  try {
    assert.equal(runCli(['zzz', 'b', path.join(dir, 'a.txt')]).out, 'nothing to rename\n');
  } finally {
    removeDir(dir);
  }
});

test('cli usage errors', () => {
  assert.equal(runCli([]).code, 2);
  assert.match(runCli([]).err, /^usage: renamer/);
  assert.equal(runCli(['a', 'b']).code, 2);
  assert.equal(runCli(['', 'b', 'file']).code, 2);
  assert.match(runCli(['', 'b', 'file']).err, /cannot be empty/);
});

test('cli stops before renaming anything when a target already exists', () => {
  const dir = makeDir({ 'x1.txt': '1', 'y.txt': '3' });
  try {
    const { code, err } = runCli(['x1', 'y', path.join(dir, 'x1.txt')]);
    assert.equal(code, 1);
    assert.match(err, /y\.txt already exists/);
    assert.match(err, /nothing was renamed/);
    assert.deepEqual(listDir(dir), ['x1.txt', 'y.txt']);
  } finally {
    removeDir(dir);
  }
});

test('cli stops before renaming anything when two files would collide', () => {
  const dir = makeDir({ 'AB.txt': '1', 'BA.txt': '2', 'other.txt': '3' });
  try {
    const files = ['AB.txt', 'BA.txt', 'other.txt'].map(name => path.join(dir, name));
    const { code, err } = runCli(['A', '', ...files]);
    assert.equal(code, 1);
    assert.match(err, /would both be renamed to/);
    assert.deepEqual(listDir(dir), ['AB.txt', 'BA.txt', 'other.txt']);
  } finally {
    removeDir(dir);
  }
});

test('cli reports a missing file without renaming the others', () => {
  const dir = makeDir({ 'a.txt': '1' });
  try {
    const { code, err } = runCli(['a', 'b', path.join(dir, 'a.txt'), path.join(dir, 'a-missing.txt')]);
    assert.equal(code, 1);
    assert.match(err, /a-missing\.txt: no such file/);
    assert.deepEqual(listDir(dir), ['a.txt']);
  } finally {
    removeDir(dir);
  }
});

test('cli --regex and --flags', () => {
  const dir = makeDir({ 'IMG_0001.JPG': 'a', 'IMG_0002.jpg': 'b' });
  try {
    const { code } = runCli(['--regex', '--flags', 'i', '^img_0*(\\d+)\\.jpg$', 'photo-$1.jpeg',
      path.join(dir, 'IMG_0001.JPG'), path.join(dir, 'IMG_0002.jpg')]);
    assert.equal(code, 0);
    assert.deepEqual(listDir(dir), ['photo-1.jpeg', 'photo-2.jpeg']);
  } finally {
    removeDir(dir);
  }
});

test('cli reports an invalid regular expression', () => {
  const { code, err } = runCli(['-e', '(', 'x', 'file']);
  assert.equal(code, 2);
  assert.match(err, /^renamer: Invalid regular expression/);
});
