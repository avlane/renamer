import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { writeLog, readLog, removeLog, undoPlan, LOG_NAME } from '../lib/undo.js';
import { makeDir, removeDir } from './helpers.js';

test('writeLog and readLog round trip with absolute paths', () => {
  const dir = makeDir();
  try {
    writeLog(dir, [{ from: 'a.txt', to: 'b.txt' }], new Date('2022-11-19T10:00:00Z'));
    const log = readLog(dir);
    assert.equal(log.createdAt, '2022-11-19T10:00:00.000Z');
    assert.deepEqual(log.steps, [{ from: path.resolve('a.txt'), to: path.resolve('b.txt') }]);
  } finally {
    removeDir(dir);
  }
});

test('readLog without a log gives null', () => {
  const dir = makeDir();
  try {
    assert.equal(readLog(dir), null);
  } finally {
    removeDir(dir);
  }
});

test('readLog rejects damaged logs', () => {
  const dir = makeDir({ [LOG_NAME]: '{oops' });
  try {
    assert.throws(() => readLog(dir), /damaged \(not valid JSON\)/);
    fs.writeFileSync(path.join(dir, LOG_NAME), '{"version": 2, "steps": []}');
    assert.throws(() => readLog(dir), /damaged \(unexpected contents\)/);
    fs.writeFileSync(path.join(dir, LOG_NAME), '{"version": 1, "steps": [{"from": 1}]}');
    assert.throws(() => readLog(dir), /unexpected contents/);
  } finally {
    removeDir(dir);
  }
});

test('removeLog deletes the log and tolerates its absence', () => {
  const dir = makeDir({ [LOG_NAME]: '{}' });
  try {
    removeLog(dir);
    assert.equal(fs.existsSync(path.join(dir, LOG_NAME)), false);
    removeLog(dir);
  } finally {
    removeDir(dir);
  }
});

test('undoPlan reverses every step', () => {
  const plan = undoPlan({ steps: [{ from: '/a', to: '/b' }, { from: '/c', to: '/d' }] });
  assert.deepEqual(plan, [{ from: '/b', to: '/a', changed: true }, { from: '/d', to: '/c', changed: true }]);
});
