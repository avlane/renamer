import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPreset, validatePreset, RC_NAME } from '../lib/presets.js';
import { UsageError } from '../lib/args.js';
import { makeDir, removeDir } from './helpers.js';

test('validatePreset converts values to the shape parseArgs produces', () => {
  const values = validatePreset('p', { template: '{n}{ext}', start: 5, step: '2', slug: true, include: '*.jpg', exclude: ['a', 'b'] });
  assert.deepEqual(values, { template: '{n}{ext}', start: '5', step: '2', slug: true, include: ['*.jpg'], exclude: ['a', 'b'] });
});

test('validatePreset rejects unknown options and wrong types', () => {
  assert.throws(() => validatePreset('p', { tempalte: 'x' }), /preset "p": unknown option "tempalte"/);
  assert.throws(() => validatePreset('p', { undo: true }), /unknown option "undo"/);
  assert.throws(() => validatePreset('p', { 'dry-run': true }), /unknown option "dry-run"/);
  assert.throws(() => validatePreset('p', { slug: 'yes' }), /"slug" must be true or false/);
  assert.throws(() => validatePreset('p', { template: 5 }), /"template" must be a string/);
  assert.throws(() => validatePreset('p', { start: 'x' }), /"start" must be a whole number/);
  assert.throws(() => validatePreset('p', { include: [1] }), /"include" must be a string or a list of strings/);
  assert.throws(() => validatePreset('p', []), UsageError);
  assert.throws(() => validatePreset('p', null), /must be an object/);
});

test('loadPreset reads .renamerrc.json from a folder', () => {
  const dir = makeDir({ [RC_NAME]: JSON.stringify({ presets: { photos: { lower: true, ext: 'jpg' }, docs: { slug: true } } }) });
  try {
    assert.deepEqual(loadPreset(dir, 'photos'), { lower: true, ext: 'jpg' });
    assert.throws(() => loadPreset(dir, 'missing'), /has no preset called "missing" \(it has: photos, docs\)/);
    assert.throws(() => loadPreset(dir, 'constructor'), /has no preset called "constructor"/);
  } finally {
    removeDir(dir);
  }
});

test('loadPreset without a config file or with a broken one', () => {
  const none = makeDir();
  const broken = makeDir({ [RC_NAME]: '{oops' });
  const empty = makeDir({ [RC_NAME]: '{}' });
  try {
    assert.throws(() => loadPreset(none, 'x'), /--preset x: there is no \.renamerrc\.json/);
    assert.throws(() => loadPreset(broken, 'x'), /is not valid JSON/);
    assert.throws(() => loadPreset(empty, 'x'), /has no preset called "x"$/);
  } finally {
    removeDir(none);
    removeDir(broken);
    removeDir(empty);
  }
});
