import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeDir, removeDir, listDir } from './helpers.js';

const bin = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'renamer.js');
const renamer = (args, cwd) => spawnSync(process.execPath, [bin, ...args], { cwd, encoding: 'utf8' });

test('the executable renames files and --undo puts them back', () => {
  const dir = makeDir({ 'a.txt': 'A', 'b.txt': 'B' });
  try {
    const first = renamer(['-f', '.txt', '-w', '.md', 'a.txt', 'b.txt'], dir);
    assert.equal(first.status, 0, first.stderr);
    assert.deepEqual(listDir(dir), ['.renamer-undo.json', 'a.md', 'b.md']);
    const undo = renamer(['--undo'], dir);
    assert.equal(undo.status, 0, undo.stderr);
    assert.deepEqual(listDir(dir), ['a.txt', 'b.txt']);
  } finally {
    removeDir(dir);
  }
});

test('the executable uses exit status 2 for bad options and 1 for refused renames', () => {
  const dir = makeDir({ 'a.txt': '', 'b.txt': '' });
  try {
    assert.equal(renamer(['--bogus', 'a.txt'], dir).status, 2);
    const refused = renamer(['-f', 'a', '-w', 'b', 'a.txt'], dir);
    assert.equal(refused.status, 1);
    assert.match(refused.stderr, /already exists/);
  } finally {
    removeDir(dir);
  }
});
