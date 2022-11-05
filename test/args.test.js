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

test('readArgs template', () => {
  assert.equal(readArgs(['-t', '{n}{ext}', 'a']).template, '{n}{ext}');
  assert.equal(readArgs(['--template', '{name}', 'a']).template, '{name}');
});

test('readArgs start and step', () => {
  const opts = readArgs(['--start', '100', '--step=-5', 'a']);
  assert.deepEqual([opts.start, opts.step], [100, -5]);
  assert.equal(readArgs(['a']).start, undefined);
  assert.throws(() => readArgs(['--start', 'x']), /--start needs a whole number/);
  assert.throws(() => readArgs(['--step', '1.5']), /--step needs a whole number/);
});

test('readArgs case modes', () => {
  assert.equal(readArgs(['--lower', 'a']).caseMode, 'lower');
  assert.equal(readArgs(['--slug', 'a']).caseMode, 'slug');
  assert.throws(() => readArgs(['--lower', '--upper', 'a']), /only one of/);
});

test('readArgs errors', () => {
  assert.throws(() => readArgs(['--nope']), UsageError);
  assert.throws(() => readArgs(['-f']), UsageError);
  assert.throws(() => readArgs(['--find']), UsageError);
  assert.equal(readArgs(['--help']).help, true);
});

test('readArgs combined short flags and an empty value', () => {
  const opts = readArgs(['-ne', '-f', '', 'a']);
  assert.deepEqual([opts.dryRun, opts.regex, opts.find], [true, true, '']);
});

test('readArgs everything after -- is a file', () => {
  assert.deepEqual(readArgs(['--lower', '--', '-odd.TXT']).files, ['-odd.TXT']);
});

test('readArgs --option=value', () => {
  const opts = readArgs(['--find=a', '--with=b', '--template={n}']);
  assert.deepEqual([opts.find, opts.replacement, opts.template], ['a', 'b', '{n}']);
});
