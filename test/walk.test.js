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
  const dir = makeDir({ 'b.txt': '', 'a.txt': '', 'sub/z.txt': '', 'sub/deeper/y.txt': '', 'empty/keep.txt': '' });
  try {
    const files = collectFiles([dir], { recursive: true });
    assert.deepEqual(rel(dir, files), ['a.txt', 'b.txt', 'empty/keep.txt', 'sub/deeper/y.txt', 'sub/z.txt']);
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

test('collectFiles skips hidden files and folders unless asked', () => {
  const dir = makeDir({ 'a.txt': '', '.env': '', '.git/config': '', 'sub/.hidden': '', 'sub/b.txt': '' });
  try {
    assert.deepEqual(rel(dir, collectFiles([dir], { recursive: true })), ['a.txt', 'sub/b.txt']);
    assert.deepEqual(rel(dir, collectFiles([dir], { recursive: true, hidden: true })),
      ['.env', '.git/config', 'a.txt', 'sub/.hidden', 'sub/b.txt']);
    assert.deepEqual(collectFiles(['x/.env']), ['x/.env']);
  } finally {
    removeDir(dir);
  }
});

test('collectFiles maxDepth counts folders below the one named', () => {
  const dir = makeDir({ 'top.txt': '', 'one/a.txt': '', 'one/two/b.txt': '', 'one/two/three/c.txt': '' });
  try {
    assert.deepEqual(rel(dir, collectFiles([dir], { recursive: true, maxDepth: 0 })), ['top.txt']);
    assert.deepEqual(rel(dir, collectFiles([dir], { recursive: true, maxDepth: 1 })), ['one/a.txt', 'top.txt']);
    assert.deepEqual(rel(dir, collectFiles([dir], { recursive: true, maxDepth: 2 })), ['one/a.txt', 'one/two/b.txt', 'top.txt']);
    assert.equal(collectFiles([dir], { recursive: true }).length, 4);
  } finally {
    removeDir(dir);
  }
});
