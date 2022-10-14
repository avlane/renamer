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

test('buildPlan needs something to find or a case mode', () => {
  assert.throws(() => buildPlan(['a'], { find: '', replacement: 'x' }), /cannot be empty/);
  assert.throws(() => buildPlan(['a'], {}), /nothing to do/);
});

test('buildPlan case modes', () => {
  assert.equal(buildPlan(['dir/My File.JPG'], { caseMode: 'lower' })[0].to, 'dir/my file.jpg');
  assert.equal(buildPlan(['My Holiday (2022)!.JPG'], { caseMode: 'slug' })[0].to, 'my-holiday-2022.jpg');
  assert.equal(buildPlan(['a.txt'], { caseMode: 'lower' })[0].changed, false);
});

test('buildPlan searches first, then changes the case', () => {
  const plan = buildPlan(['IMG_01.JPG'], { find: 'IMG_', replacement: 'Holiday ', caseMode: 'title' });
  assert.equal(plan[0].to, 'Holiday 01.JPG');
});

test('buildPlan with a regular expression', () => {
  const plan = buildPlan(['IMG_0042.JPG'], { find: '^IMG_0*(\\d+)', replacement: 'photo-$1', regex: true });
  assert.equal(plan[0].to, 'photo-42.JPG');
});

test('buildPlan regular expressions replace every match by default', () => {
  const plan = buildPlan(['a1b22c333'], { find: '\\d+', replacement: '#', regex: true });
  assert.equal(plan[0].to, 'a#b#c#');
});

test('buildPlan --flags changes how the expression matches', () => {
  const insensitive = buildPlan(['Report.TXT'], { find: 'report', replacement: 'summary', regex: true, flags: 'i' });
  assert.equal(insensitive[0].to, 'summary.TXT');
  const first = buildPlan(['a1a2a3'], { find: 'a', replacement: 'x', regex: true, flags: '' });
  assert.equal(first[0].to, 'x1a2a3');
});

test('buildPlan named groups in the replacement', () => {
  const plan = buildPlan(['2022-09-30_report.txt'], {
    find: '^(?<y>\\d{4})-(?<m>\\d{2})-(?<d>\\d{2})_',
    replacement: '$<d>.$<m>.$<y> ',
    regex: true
  });
  assert.equal(plan[0].to, '30.09.2022 report.txt');
});

test('buildPlan anchors apply to the base name only', () => {
  const plan = buildPlan(['dir/abc.txt'], { find: '^a', replacement: 'X', regex: true });
  assert.equal(plan[0].to, 'dir/Xbc.txt');
});

test('buildPlan rejects bad regular expressions', () => {
  assert.throws(() => buildPlan(['a'], { find: '(', replacement: '', regex: true }), SyntaxError);
  assert.throws(() => buildPlan(['a'], { find: 'a', replacement: '', regex: true, flags: 'zz' }), SyntaxError);
});
