import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { collectFiles, WalkError } from '../lib/walk.js';
import { makeDir, removeDir } from './helpers.js';

const rel = (dir, files) => files.map(file => path.relative(dir, file).split(path.sep).join('/'));

test('collectFiles passes plain files through', () => {
  assert.deepEqual(collectFiles(['a.txt', 'dir/b.txt', 'missing.txt']), ['a.txt', 'dir/b.txt', 'missing.txt']);
});

test('collectFiles refuses folders without -R', () => {
  const dir = makeDir({ 'a.txt': '' });
  try {
    assert.throws(() => collectFiles([dir]), WalkError);
    assert.throws(() => collectFiles([dir]), /use -R/);
  } finally {
    removeDir(dir);
  }
});

test('collectFiles walks folders in name order, files only', () => {
  const dir = makeDir({ 'b.txt': '', 'a.txt': '', 'sub/z.txt': '', 'sub/deeper/y.txt': '', 'empty/.keep': '' });
  try {
    const files = collectFiles([dir], { recursive: true });
    assert.deepEqual(rel(dir, files), ['a.txt', 'b.txt', 'empty/.keep', 'sub/deeper/y.txt', 'sub/z.txt']);
  } finally {
    removeDir(dir);
  }
});

test('collectFiles include and exclude globs', () => {
  const dir = makeDir({ 'a.jpg': '', 'b.png': '', 'sub/c.jpg': '', 'sub/d.txt': '', 'node_modules/e.jpg': '' });
  try {
    const jpgs = collectFiles([dir], { recursive: true, include: ['*.jpg'] });
    assert.deepEqual(rel(dir, jpgs), ['a.jpg', 'node_modules/e.jpg', 'sub/c.jpg']);
    const filtered = collectFiles([dir], { recursive: true, include: ['*.jpg'], exclude: ['node_modules/**'] });
    assert.deepEqual(rel(dir, filtered), ['a.jpg', 'sub/c.jpg']);
    const topOnly = collectFiles([dir], { recursive: true, exclude: ['sub/**', 'node_modules/**'] });
    assert.deepEqual(rel(dir, topOnly), ['a.jpg', 'b.png']);
  } finally {
    removeDir(dir);
  }
});

test('collectFiles filters explicit files by their name', () => {
  assert.deepEqual(collectFiles(['x/a.txt', 'x/b.md'], { include: ['*.txt'] }), ['x/a.txt']);
  assert.deepEqual(collectFiles(['x/a.txt', 'x/b.md'], { exclude: ['*.txt'] }), ['x/b.md']);
});
