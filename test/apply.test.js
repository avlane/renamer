import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { applyPlan } from '../lib/apply.js';
import { makeDir, removeDir, listDir } from './helpers.js';

const step = (dir, from, to) => ({ from: path.join(dir, from), to: path.join(dir, to), changed: true });
const read = (dir, name) => fs.readFileSync(path.join(dir, name), 'utf8');

test('applyPlan renames plain files', () => {
  const dir = makeDir({ 'a': '1', 'b': '2' });
  try {
    applyPlan([step(dir, 'a', 'x'), step(dir, 'b', 'y')]);
    assert.deepEqual(listDir(dir), ['x', 'y']);
    assert.equal(read(dir, 'x'), '1');
  } finally {
    removeDir(dir);
  }
});

test('applyPlan swaps two files', () => {
  const dir = makeDir({ 'a': 'was a', 'b': 'was b' });
  try {
    applyPlan([step(dir, 'a', 'b'), step(dir, 'b', 'a')]);
    assert.deepEqual(listDir(dir), ['a', 'b']);
    assert.equal(read(dir, 'a'), 'was b');
    assert.equal(read(dir, 'b'), 'was a');
  } finally {
    removeDir(dir);
  }
});

test('applyPlan handles chains in either order', () => {
  for (const order of [[0, 1, 2], [2, 1, 0], [1, 0, 2]]) {
    const dir = makeDir({ '1': 'one', '2': 'two', '3': 'three' });
    try {
      const steps = [step(dir, '1', '2'), step(dir, '2', '3'), step(dir, '3', '4')];
      applyPlan(order.map(i => steps[i]));
      assert.deepEqual(listDir(dir), ['2', '3', '4']);
      assert.deepEqual([read(dir, '2'), read(dir, '3'), read(dir, '4')], ['one', 'two', 'three']);
    } finally {
      removeDir(dir);
    }
  }
});

test('applyPlan leaves no temporary files behind', () => {
  const dir = makeDir({ 'a': '1', 'b': '2', 'c': '3' });
  try {
    applyPlan([step(dir, 'a', 'b'), step(dir, 'b', 'c'), step(dir, 'c', 'a')]);
    assert.deepEqual(listDir(dir), ['a', 'b', 'c']);
    assert.equal(read(dir, 'b'), '1');
  } finally {
    removeDir(dir);
  }
});

test('applyPlan only parks files that need it', () => {
  const calls = [];
  applyPlan([{ from: 'a', to: 'x' }, { from: 'b', to: 'a' }], { rename: (from, to) => calls.push([from, to]) });
  assert.equal(calls.length, 3);
  assert.deepEqual(calls[0], ['a', 'x']);
  assert.equal(calls[1][0], 'b');
  assert.match(calls[1][1], /^\.renamer-[0-9a-f]{8}-b$/);
  assert.deepEqual(calls[2], [calls[1][1], 'a']);
});
