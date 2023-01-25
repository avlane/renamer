import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeName } from '../lib/sanitize.js';

test('sanitizeName leaves ordinary names alone', () => {
  assert.equal(sanitizeName('photo 01 (final).jpg'), 'photo 01 (final).jpg');
  assert.equal(sanitizeName('.gitignore'), '.gitignore');
  assert.equal(sanitizeName('café.txt'), 'café.txt');
});

test('sanitizeName replaces characters that are not allowed', () => {
  assert.equal(sanitizeName('a/b\\c.txt'), 'a_b_c.txt');
  assert.equal(sanitizeName('what?<>:"|*.txt'), 'what_______.txt');
  assert.equal(sanitizeName('tab\there.txt'), 'tab_here.txt');
});

test('sanitizeName drops trailing dots and spaces', () => {
  assert.equal(sanitizeName('name. . '), 'name');
  assert.equal(sanitizeName('...'), '');
});

test('sanitizeName protects reserved device names', () => {
  assert.equal(sanitizeName('con'), '_con');
  assert.equal(sanitizeName('NUL.txt'), '_NUL.txt');
  assert.equal(sanitizeName('com1'), '_com1');
  assert.equal(sanitizeName('console.txt'), 'console.txt');
  assert.equal(sanitizeName('lpt10'), 'lpt10');
});
