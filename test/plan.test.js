import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlan } from '../lib/plan.js';
import { PlanError } from '../lib/errors.js';

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

test('buildPlan with a template', () => {
  const plan = buildPlan(['/x/Trip/a.jpg', '/x/Trip/b.JPG', '/x/Trip/c.png'], { template: '{parent|lower}-{n:3}{ext|lower}' });
  assert.deepEqual(plan.map(step => step.to), ['/x/Trip/trip-001.jpg', '/x/Trip/trip-002.jpg', '/x/Trip/trip-003.png']);
});

test('buildPlan counter start and step', () => {
  const plan = buildPlan(['a', 'b', 'c'], { template: '{n:3}', start: 10, step: 10 });
  assert.deepEqual(plan.map(step => step.to), ['010', '020', '030']);
  const down = buildPlan(['a', 'b'], { template: '{n}', start: 5, step: -1 });
  assert.deepEqual(down.map(step => step.to), ['5', '4']);
});

test('buildPlan template and find cannot be combined', () => {
  assert.throws(() => buildPlan(['a'], { template: '{name}', find: 'a' }), /either --template or --find/);
});

test('buildPlan a template can still be followed by a case mode', () => {
  const plan = buildPlan(['a.TXT'], { template: 'Note {n}{ext}', caseMode: 'upper' });
  assert.equal(plan[0].to, 'NOTE 1.TXT');
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

test('buildPlan --ext', () => {
  const plan = buildPlan(['a.JPG', 'b.tar.gz', 'c', 'd.txt'], { ext: 'md' });
  assert.deepEqual(plan.map(step => step.to), ['a.md', 'b.md', 'c.md', 'd.md']);
  assert.equal(buildPlan(['a.txt'], { ext: '.txt' })[0].changed, false);
  assert.deepEqual(buildPlan(['a.txt', 'b.tar.gz'], { ext: '' }).map(step => step.to), ['a', 'b']);
});

test('buildPlan --ext comes after case changes and templates', () => {
  assert.equal(buildPlan(['My File.TXT'], { caseMode: 'slug', ext: 'md' })[0].to, 'my-file.md');
  assert.equal(buildPlan(['a.txt'], { template: 'copy-{name}{ext}', ext: 'bak' })[0].to, 'copy-a.bak');
});

test('buildPlan case modes treat .tar.gz as one extension', () => {
  assert.equal(buildPlan(['Backup 2022.TAR.GZ'], { caseMode: 'lower' })[0].to, 'backup 2022.tar.gz');
  assert.equal(buildPlan(['Backup 2022.tar.gz'], { caseMode: 'slug' })[0].to, 'backup-2022.tar.gz');
});

test('buildPlan {mtime} reads the modification time only when the template asks for it', () => {
  const stats = [];
  const stat = file => {
    stats.push(file);
    return { mtime: new Date(Date.UTC(2021, 4, 6, 7, 8, 9)) };
  };
  const plan = buildPlan(['a.jpg'], { template: '{mtime:YYYY-MM-DD}_{name}{ext}', utc: true }, { stat });
  assert.equal(plan[0].to, '2021-05-06_a.jpg');
  buildPlan(['a.jpg'], { template: '{name}{ext}' }, { stat });
  assert.deepEqual(stats, ['a.jpg']);
});

test('buildPlan {mtime} on a missing file is an error', () => {
  const stat = () => {
    throw Object.assign(new Error('boom'), { code: 'ENOENT' });
  };
  assert.throws(() => buildPlan(['gone.jpg'], { template: '{mtime}' }, { stat }), /cannot read the modification time of gone\.jpg \(ENOENT\)/);
});

test('buildPlan generated names cannot contain path separators or reserved characters', () => {
  const plan = buildPlan(['a.txt', 'b.txt'], { find: 'a', replacement: '../x:y' });
  assert.equal(plan[0].to, '.._x_y.txt');
  const slash = buildPlan(['dir/a.txt'], { find: 'a', replacement: '/' });
  assert.equal(slash[0].to, 'dir/_.txt');
});

test('buildPlan leaves names alone that the tool did not change', () => {
  const plan = buildPlan(['odd:name.txt', 'b.txt'], { find: 'b', replacement: 'c' });
  assert.deepEqual(plan.map(step => [step.to, step.changed]), [['odd:name.txt', false], ['c.txt', true]]);
});

test('buildPlan reserved names and empty results', () => {
  assert.equal(buildPlan(['x.dat'], { find: 'x', replacement: 'con' })[0].to, '_con.dat');
  assert.throws(() => buildPlan(['dots...'], { find: 'dots', replacement: '' }), /dots\.\.\.: the new name would be empty/);
  assert.throws(() => buildPlan(['abc'], { find: 'abc', replacement: '' }), PlanError);
});

test('buildPlan numbers files in the --sort order and returns the plan in that order', () => {
  const plan = buildPlan(['img10.jpg', 'img2.jpg', 'img1.jpg'], { template: '{n:2}{ext}', sort: 'natural' });
  assert.deepEqual(plan.map(step => [step.from, step.to]), [
    ['img1.jpg', '01.jpg'],
    ['img2.jpg', '02.jpg'],
    ['img10.jpg', '03.jpg']
  ]);
  const reversed = buildPlan(['a', 'b', 'c'], { template: '{n}', sort: 'name', reverse: true });
  assert.deepEqual(reversed.map(step => [step.from, step.to]), [['c', '1'], ['b', '2'], ['a', '3']]);
});

test('buildPlan --sort mtime needs to read the files', () => {
  const stat = file => ({ mtimeMs: { a: 3, b: 1, c: 2 }[file] });
  const plan = buildPlan(['a', 'b', 'c'], { template: '{n}', sort: 'mtime' }, { stat });
  assert.deepEqual(plan.map(step => step.from), ['b', 'c', 'a']);
});
