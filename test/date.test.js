import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDate } from '../lib/date.js';

const date = new Date(Date.UTC(2022, 11, 3, 4, 5, 6));

test('formatDate tokens', () => {
  assert.equal(formatDate(date, 'YYYY-MM-DD', true), '2022-12-03');
  assert.equal(formatDate(date, 'YY/MM/DD HH:mm:ss', true), '22/12/03 04:05:06');
  assert.equal(formatDate(date, 'YYYYMMDD_HHmmss', true), '20221203_040506');
});

test('formatDate copies other text', () => {
  assert.equal(formatDate(date, 'photos from MM-YYYY', true), 'photos from 12-2022');
  assert.equal(formatDate(date, 'no tokens', true), 'no tokens');
});

test('formatDate pads small years and values', () => {
  const early = new Date(Date.UTC(2000, 0, 1));
  early.setUTCFullYear(5);
  assert.equal(formatDate(early, 'YYYY', true), '0005');
  assert.equal(formatDate(new Date(Date.UTC(2005, 0, 2, 3, 4, 5)), 'MM/DD HH:mm:ss', true), '01/02 03:04:05');
});

test('formatDate local time follows the local getters', () => {
  const local = new Date(2022, 11, 3, 23, 59, 58);
  assert.equal(formatDate(local, 'YYYY-MM-DD HH:mm:ss'), '2022-12-03 23:59:58');
});
