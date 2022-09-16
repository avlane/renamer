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
