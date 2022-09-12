import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan } from '../lib/plan.js';

test('buildPlan replaces every occurrence in the base name', () => {
  const plan = buildPlan(['IMG_001_IMG.jpg'], { find: 'IMG', replacement: 'photo' });
  assert.deepEqual(plan, [{ from: 'IMG_001_IMG.jpg', to: 'photo_001_photo.jpg', changed: true }]);
});

test('buildPlan keeps the directory part untouched', () => {
  const plan = buildPlan(['/data/img/IMG_1.jpg', 'sub/IMG_2.jpg'], { find: 'IMG', replacement: 'x' });
  assert.deepEqual(plan.map(step => step.to), ['/data/img/x_1.jpg', 'sub/x_2.jpg']);
});

test('buildPlan does not look at directory names when matching', () => {
  const plan = buildPlan(['IMG/holiday.jpg'], { find: 'IMG', replacement: 'x' });
  assert.equal(plan[0].changed, false);
  assert.equal(plan[0].to, 'IMG/holiday.jpg');
});

test('buildPlan flags files that would not change', () => {
  const plan = buildPlan(['a.txt', 'b.txt'], { find: 'a', replacement: 'c' });
  assert.deepEqual(plan.map(step => step.changed), [true, false]);
});

test('buildPlan with an empty replacement removes the text', () => {
  const plan = buildPlan(['copy of report.txt'], { find: 'copy of ' });
  assert.equal(plan[0].to, 'report.txt');
});

test('buildPlan special characters in the text are literal', () => {
  const plan = buildPlan(['a.b(1).txt'], { find: '.b(1)', replacement: '' });
  assert.equal(plan[0].to, 'a.txt');
});

test('buildPlan needs something to find', () => {
  assert.throws(() => buildPlan(['a'], { find: '', replacement: 'x' }), /cannot be empty/);
  assert.throws(() => buildPlan(['a'], {}), /cannot be empty/);
});
