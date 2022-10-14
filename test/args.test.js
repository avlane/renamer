import test from 'node:test';
import assert from 'node:assert/strict';
import { readArgs, UsageError } from '../lib/args.js';

test('readArgs defaults', () => {
  const opts = readArgs(['a.txt']);
  assert.deepEqual(opts.files, ['a.txt']);
  assert.equal(opts.dryRun, false);
  assert.equal(opts.regex, false);
  assert.equal(opts.find, undefined);
  assert.equal(opts.caseMode, undefined);
});

test('readArgs find, with and regex options', () => {
  const opts = readArgs(['-f', 'a', '--with', 'b', '-e', '--flags', 'gi', '-n', 'x', 'y']);
  assert.deepEqual([opts.find, opts.replacement, opts.regex, opts.flags, opts.dryRun], ['a', 'b', true, 'gi', true]);
  assert.deepEqual(opts.files, ['x', 'y']);
});

test('readArgs case modes', () => {
  assert.equal(readArgs(['--lower', 'a']).caseMode, 'lower');
  assert.equal(readArgs(['--slug', 'a']).caseMode, 'slug');
  assert.throws(() => readArgs(['--lower', '--upper', 'a']), /only one of/);
});

test('readArgs errors', () => {
  assert.throws(() => readArgs(['--nope']), UsageError);
  assert.throws(() => readArgs(['-f']), /-f needs a value/);
  assert.equal(readArgs(['--help']).help, true);
});
