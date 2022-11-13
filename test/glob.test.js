import test from 'node:test';
import assert from 'node:assert/strict';
import { globToRegExp, matchesGlob } from '../lib/glob.js';

test('globToRegExp stars stay inside one path segment', () => {
  const re = globToRegExp('*.jpg');
  assert.ok(re.test('a.jpg'));
  assert.ok(re.test('.jpg'));
  assert.ok(!re.test('a.jpeg'));
  assert.ok(!re.test('dir/a.jpg'));
});

test('globToRegExp double star crosses folders', () => {
  assert.ok(globToRegExp('**/*.js').test('a.js'));
  assert.ok(globToRegExp('**/*.js').test('src/lib/a.js'));
  assert.ok(!globToRegExp('**/*.js').test('src/lib/a.ts'));
  assert.ok(globToRegExp('src/**').test('src/lib/deep/file.txt'));
});

test('globToRegExp question mark and classes', () => {
  assert.ok(globToRegExp('img_??.png').test('img_01.png'));
  assert.ok(!globToRegExp('img_??.png').test('img_1.png'));
  assert.ok(globToRegExp('file[123].txt').test('file2.txt'));
  assert.ok(!globToRegExp('file[123].txt').test('file4.txt'));
  assert.ok(globToRegExp('file[!123].txt').test('file4.txt'));
  assert.ok(!globToRegExp('file[!123].txt').test('file1.txt'));
});

test('globToRegExp literal characters are escaped', () => {
  assert.ok(globToRegExp('a+b(1).txt').test('a+b(1).txt'));
  assert.ok(!globToRegExp('a.txt').test('aXtxt'));
  assert.ok(globToRegExp('weird[.txt').test('weird[.txt'));
});

test('matchesGlob uses the file name when the glob has no slash', () => {
  assert.ok(matchesGlob('*.txt', 'docs/deep/a.txt'));
  assert.ok(!matchesGlob('*.txt', 'docs/deep/a.md'));
});

test('matchesGlob uses the whole path when the glob has a slash', () => {
  assert.ok(matchesGlob('docs/*.txt', 'docs/a.txt'));
  assert.ok(!matchesGlob('docs/*.txt', 'docs/deep/a.txt'));
  assert.ok(matchesGlob('docs/**/*.txt', 'docs/deep/er/a.txt'));
});
