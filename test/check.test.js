import test from 'node:test';
import assert from 'node:assert/strict';
import { checkPlan, existingTargets } from '../lib/check.js';

const step = (from, to) => ({ from, to, changed: true });
const existing = (...files) => file => files.includes(file);

test('checkPlan accepts a clean plan', () => {
  const plan = [step('a', 'x'), step('b', 'y')];
  assert.deepEqual(checkPlan(plan, { exists: existing('a', 'b') }), []);
});

test('checkPlan reports missing sources', () => {
  const problems = checkPlan([step('a', 'x')], { exists: existing() });
  assert.deepEqual(problems, ['a: no such file']);
});

test('checkPlan reports two files going to the same name', () => {
  const plan = [step('a', 'x'), step('b', 'x')];
  assert.deepEqual(checkPlan(plan, { exists: existing('a', 'b') }), ['a and b would both be renamed to x']);
});

test('checkPlan reports a target that already exists', () => {
  const problems = checkPlan([step('a', 'x')], { exists: existing('a', 'x') });
  assert.deepEqual(problems, ['x already exists (needed for a)']);
});

test('checkPlan allows a target that is itself being renamed away', () => {
  const plan = [step('a', 'b'), step('b', 'c')];
  assert.deepEqual(checkPlan(plan, { exists: existing('a', 'b') }), []);
});

test('checkPlan allows swapping two names', () => {
  const plan = [step('a', 'b'), step('b', 'a')];
  assert.deepEqual(checkPlan(plan, { exists: existing('a', 'b') }), []);
});

test('checkPlan compares paths after resolving them', () => {
  const plan = [step('./a', './x'), step('a2', 'x')];
  assert.equal(checkPlan(plan, { exists: existing('./a', 'a2') }).length, 1);
});

test('checkPlan force allows replacing an existing file but not a folder', () => {
  const plan = [step('a', 'x')];
  const exists = existing('a', 'x');
  assert.deepEqual(checkPlan(plan, { exists, force: true, folder: () => false }), []);
  assert.deepEqual(checkPlan(plan, { exists, force: true, folder: () => true }), ['x is a folder; --force does not replace folders']);
  assert.equal(checkPlan(plan, { exists, force: false }).length, 1);
});

test('checkPlan force does not excuse two files going to one name', () => {
  const plan = [step('a', 'x'), step('b', 'x')];
  assert.equal(checkPlan(plan, { exists: existing('a', 'b'), force: true }).length, 1);
});

test('existingTargets lists the steps that would replace something', () => {
  const plan = [step('a', 'x'), step('b', 'c'), step('c', 'd')];
  const found = existingTargets(plan, { exists: existing('a', 'b', 'c', 'x'), sameFile: () => false });
  assert.deepEqual(found.map(s => s.from), ['a']);
});

test('checkPlan allows a case-only rename when both names are the same file', () => {
  const plan = [step('report.txt', 'Report.txt')];
  const exists = existing('report.txt', 'Report.txt');
  assert.deepEqual(checkPlan(plan, { exists, sameFile: () => true }), []);
  assert.deepEqual(checkPlan(plan, { exists, sameFile: () => false }), ['Report.txt already exists (needed for report.txt)']);
});
