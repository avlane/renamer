import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeDir, removeDir, listDir, runCli } from './helpers.js';

test('cli renames files', () => {
  const dir = makeDir({ 'IMG_1.jpg': 'a', 'IMG_2.jpg': 'b', 'notes.txt': 'c' });
  try {
    const { code, out } = runCli(['-f', 'IMG_', '-w', 'photo_', path.join(dir, 'IMG_1.jpg'), path.join(dir, 'IMG_2.jpg'), path.join(dir, 'notes.txt')]);
    assert.equal(code, 0);
    assert.deepEqual(listDir(dir), ['notes.txt', 'photo_1.jpg', 'photo_2.jpg']);
    assert.equal(out.trimEnd().split('\n').length, 2);
  } finally {
    removeDir(dir);
  }
});

test('cli --dry-run changes nothing but says what would happen', () => {
  const dir = makeDir({ 'a.txt': 'x' });
  try {
    const { code, out } = runCli(['-n', '-f', 'a', '-w', 'b', path.join(dir, 'a.txt')]);
    assert.equal(code, 0);
    assert.deepEqual(listDir(dir), ['a.txt']);
    assert.equal(out, `(dry run) ${path.join(dir, 'a.txt')} -> ${path.join(dir, 'b.txt')}\n`);
  } finally {
    removeDir(dir);
  }
});

test('cli reports when there is nothing to do', () => {
  const dir = makeDir({ 'a.txt': 'x' });
  try {
    assert.equal(runCli(['-f', 'zzz', '-w', 'b', path.join(dir, 'a.txt')]).out, 'nothing to rename\n');
  } finally {
    removeDir(dir);
  }
});

test('cli usage errors', () => {
  assert.equal(runCli([]).code, 2);
  assert.match(runCli([]).err, /^usage: renamer/);
  assert.equal(runCli(['-f', 'a']).code, 2);
  assert.equal(runCli(['-f', '', 'file']).code, 2);
  assert.match(runCli(['-f', '', 'file']).err, /cannot be empty/);
  assert.equal(runCli(['file']).code, 2);
  assert.match(runCli(['file']).err, /nothing to do/);
  assert.equal(runCli(['--bogus', 'file']).code, 2);
  assert.equal(runCli(['--help']).code, 0);
});

test('cli stops before renaming anything when a target already exists', () => {
  const dir = makeDir({ 'x1.txt': '1', 'y.txt': '3' });
  try {
    const { code, err } = runCli(['-f', 'x1', '-w', 'y', path.join(dir, 'x1.txt')]);
    assert.equal(code, 1);
    assert.match(err, /y\.txt already exists/);
    assert.match(err, /nothing was renamed/);
    assert.deepEqual(listDir(dir), ['x1.txt', 'y.txt']);
  } finally {
    removeDir(dir);
  }
});

test('cli stops before renaming anything when two files would collide', () => {
  const dir = makeDir({ 'AB.txt': '1', 'BA.txt': '2', 'other.txt': '3' });
  try {
    const files = ['AB.txt', 'BA.txt', 'other.txt'].map(name => path.join(dir, name));
    const { code, err } = runCli(['-f', 'A', '-w', '', ...files]);
    assert.equal(code, 1);
    assert.match(err, /would both be renamed to/);
    assert.deepEqual(listDir(dir), ['AB.txt', 'BA.txt', 'other.txt']);
  } finally {
    removeDir(dir);
  }
});

test('cli reports a missing file without renaming the others', () => {
  const dir = makeDir({ 'a.txt': '1' });
  try {
    const { code, err } = runCli(['-f', 'a', '-w', 'b', path.join(dir, 'a.txt'), path.join(dir, 'a-missing.txt')]);
    assert.equal(code, 1);
    assert.match(err, /a-missing\.txt: no such file/);
    assert.deepEqual(listDir(dir), ['a.txt']);
  } finally {
    removeDir(dir);
  }
});

test('cli --regex and --flags', () => {
  const dir = makeDir({ 'IMG_0001.JPG': 'a', 'IMG_0002.jpg': 'b' });
  try {
    const { code } = runCli(['--regex', '--flags', 'i', '--find', '^img_0*(\\d+)\\.jpg$', '--with', 'photo-$1.jpeg',
      path.join(dir, 'IMG_0001.JPG'), path.join(dir, 'IMG_0002.jpg')]);
    assert.equal(code, 0);
    assert.deepEqual(listDir(dir), ['photo-1.jpeg', 'photo-2.jpeg']);
  } finally {
    removeDir(dir);
  }
});

test('cli reports an invalid regular expression', () => {
  const { code, err } = runCli(['-e', '-f', '(', '-w', 'x', 'file']);
  assert.equal(code, 2);
  assert.match(err, /^renamer: Invalid regular expression/);
});

test('cli case modes', () => {
  const dir = makeDir({ 'My Holiday (2022)!.JPG': 'a', 'Other FILE.txt': 'b' });
  try {
    const { code } = runCli(['--slug', path.join(dir, 'My Holiday (2022)!.JPG'), path.join(dir, 'Other FILE.txt')]);
    assert.equal(code, 0);
    assert.deepEqual(listDir(dir), ['my-holiday-2022.jpg', 'other-file.txt']);
  } finally {
    removeDir(dir);
  }
});

test('cli --template numbers the files', () => {
  const dir = makeDir({ 'b.jpg': 'b', 'a.jpg': 'a', 'c.jpg': 'c' });
  try {
    const { code } = runCli(['-t', 'photo-{n:2}{ext}', path.join(dir, 'a.jpg'), path.join(dir, 'b.jpg'), path.join(dir, 'c.jpg')]);
    assert.equal(code, 0);
    assert.deepEqual(listDir(dir), ['photo-01.jpg', 'photo-02.jpg', 'photo-03.jpg']);
    const a = makeDir({ 'x.txt': 'first' });
    try {
      assert.equal(runCli(['-t', '{n}.txt', path.join(a, 'x.txt')]).code, 0);
      assert.deepEqual(listDir(a), ['1.txt']);
    } finally {
      removeDir(a);
    }
  } finally {
    removeDir(dir);
  }
});

test('cli can swap two names through a template', () => {
  const dir = makeDir({ '1.txt': 'one', '2.txt': 'two' });
  try {
    const { code } = runCli(['-t', '{n}{ext}', path.join(dir, '2.txt'), path.join(dir, '1.txt')]);
    assert.equal(code, 0);
    assert.deepEqual(listDir(dir), ['1.txt', '2.txt']);
    assert.equal(fs.readFileSync(path.join(dir, '1.txt'), 'utf8'), 'two');
    assert.equal(fs.readFileSync(path.join(dir, '2.txt'), 'utf8'), 'one');
  } finally {
    removeDir(dir);
  }
});

test('cli reports a bad template', () => {
  const { code, err } = runCli(['-t', '{oops}', 'file']);
  assert.equal(code, 2);
  assert.match(err, /unknown template field \{oops\}/);
});

test('cli -R renames the files in folders, filtered by globs', () => {
  const dir = makeDir({ 'a.JPG': '', 'sub/b.JPG': '', 'sub/c.txt': '', 'skip/d.JPG': '' });
  try {
    const { code } = runCli(['-R', '--include', '*.JPG', '--exclude', 'skip/**', '-f', '.JPG', '-w', '.jpeg', dir]);
    assert.equal(code, 0);
    assert.deepEqual(listDir(dir), ['a.jpeg', 'skip/d.JPG', 'sub/b.jpeg', 'sub/c.txt']);
  } finally {
    removeDir(dir);
  }
});

test('cli explains that a folder needs -R', () => {
  const dir = makeDir({ 'a.txt': '' });
  try {
    const { code, err } = runCli(['-f', 'a', '-w', 'b', dir]);
    assert.equal(code, 2);
    assert.match(err, /is a folder \(use -R/);
    assert.deepEqual(listDir(dir), ['a.txt']);
  } finally {
    removeDir(dir);
  }
});

test('cli writes an undo log and --undo restores the names', () => {
  const dir = makeDir({ 'a.txt': 'A', 'b.txt': 'B' });
  const work = makeDir();
  try {
    const files = [path.join(dir, 'a.txt'), path.join(dir, 'b.txt')];
    assert.equal(runCli(['-f', '.txt', '-w', '.md', ...files], { cwd: work, now: () => new Date('2022-11-19T12:00:00Z') }).code, 0);
    assert.deepEqual(listDir(dir), ['a.md', 'b.md']);
    assert.deepEqual(listDir(work), ['.renamer-undo.json']);

    const dry = runCli(['--undo', '--dry-run'], { cwd: work });
    assert.equal(dry.code, 0);
    assert.match(dry.out, /^\(dry run\) .*a\.md -> .*a\.txt\n/);
    assert.deepEqual(listDir(dir), ['a.md', 'b.md']);

    const undone = runCli(['--undo'], { cwd: work });
    assert.equal(undone.code, 0);
    assert.deepEqual(listDir(dir), ['a.txt', 'b.txt']);
    assert.deepEqual(listDir(work), []);
    assert.equal(fs.readFileSync(files[0], 'utf8'), 'A');
  } finally {
    removeDir(dir);
    removeDir(work);
  }
});

test('cli --undo with nothing to undo', () => {
  const work = makeDir();
  try {
    const { code, err } = runCli(['--undo'], { cwd: work });
    assert.equal(code, 1);
    assert.match(err, /nothing to undo/);
  } finally {
    removeDir(work);
  }
});

test('cli --undo refuses when a name has been taken in the meantime', () => {
  const dir = makeDir({ 'a.txt': 'A' });
  const work = makeDir();
  try {
    runCli(['-f', 'a', '-w', 'b', path.join(dir, 'a.txt')], { cwd: work });
    fs.writeFileSync(path.join(dir, 'a.txt'), 'someone else');
    const { code, err } = runCli(['--undo'], { cwd: work });
    assert.equal(code, 1);
    assert.match(err, /already exists/);
    assert.match(err, /nothing was undone/);
    assert.deepEqual(listDir(dir), ['a.txt', 'b.txt']);
  } finally {
    removeDir(dir);
    removeDir(work);
  }
});

test('cli a dry run or a failed run writes no undo log', () => {
  const dir = makeDir({ 'a.txt': 'A', 'b.txt': 'B' });
  const work = makeDir();
  try {
    runCli(['-n', '-f', 'a', '-w', 'z', path.join(dir, 'a.txt')], { cwd: work });
    runCli(['-f', 'a', '-w', 'b', path.join(dir, 'a.txt')], { cwd: work });
    runCli(['-f', 'q', '-w', 'z', path.join(dir, 'a.txt')], { cwd: work });
    assert.deepEqual(listDir(work), []);
  } finally {
    removeDir(dir);
    removeDir(work);
  }
});

test('cli --ext renames the extension', () => {
  const dir = makeDir({ 'a.jpeg': '', 'b.tar.gz': '' });
  try {
    assert.equal(runCli(['--ext', 'jpg', path.join(dir, 'a.jpeg')]).code, 0);
    assert.equal(runCli(['--ext', '', path.join(dir, 'b.tar.gz')]).code, 0);
    assert.deepEqual(listDir(dir), ['a.jpg', 'b']);
  } finally {
    removeDir(dir);
  }
});

test('cli {mtime} with --utc', () => {
  const dir = makeDir({ 'a.jpg': '' });
  try {
    fs.utimesSync(path.join(dir, 'a.jpg'), new Date(Date.UTC(2020, 1, 29, 12, 0, 0)), new Date(Date.UTC(2020, 1, 29, 12, 0, 0)));
    const { code } = runCli(['--utc', '-t', '{mtime:YYYYMMDD}-{name}{ext}', path.join(dir, 'a.jpg')]);
    assert.equal(code, 0);
    assert.deepEqual(listDir(dir), ['20200229-a.jpg']);
  } finally {
    removeDir(dir);
  }
});

test('cli {mtime} on a file that does not exist', () => {
  const { code, err } = runCli(['-t', '{mtime}', '/definitely/not/here.jpg']);
  assert.equal(code, 2);
  assert.match(err, /cannot read the modification time of/);
});

test('cli renames a file to a different case of its own name', () => {
  const dir = makeDir({ 'report.txt': 'text', 'NOTES.TXT': 'notes' });
  try {
    const { code, err } = runCli(['--title', path.join(dir, 'report.txt')]);
    assert.equal(err, '');
    assert.equal(code, 0);
    assert.deepEqual(listDir(dir), ['NOTES.TXT', 'Report.txt']);
    assert.equal(runCli(['--lower', path.join(dir, 'NOTES.TXT')]).code, 0);
    assert.deepEqual(listDir(dir), ['Report.txt', 'notes.txt']);
    assert.equal(fs.readFileSync(path.join(dir, 'notes.txt'), 'utf8'), 'notes');
  } finally {
    removeDir(dir);
  }
});

test('cli --force replaces an existing file, says so, and --undo warns', () => {
  const dir = makeDir({ 'a.txt': 'new', 'b.txt': 'old' });
  const work = makeDir();
  try {
    const args = ['-f', 'a', '-w', 'b', path.join(dir, 'a.txt')];
    assert.equal(runCli(args, { cwd: work }).code, 1);
    const dry = runCli(['-n', '--force', ...args], { cwd: work });
    assert.equal(dry.code, 0);
    assert.match(dry.out, /\(replaces an existing file\)\n$/);
    assert.deepEqual(listDir(work), []);

    assert.equal(runCli(['--force', ...args], { cwd: work }).code, 0);
    assert.deepEqual(listDir(dir), ['b.txt']);
    assert.equal(fs.readFileSync(path.join(dir, 'b.txt'), 'utf8'), 'new');

    const undone = runCli(['--undo'], { cwd: work });
    assert.equal(undone.code, 0);
    assert.match(undone.err, /note: 1 file\(s\) replaced by that run cannot be restored/);
    assert.deepEqual(listDir(dir), ['a.txt']);
  } finally {
    removeDir(dir);
    removeDir(work);
  }
});

test('cli --force never replaces a folder', () => {
  const dir = makeDir({ 'a.txt': 'x', 'b/inside.txt': 'y' });
  try {
    const { code, err } = runCli(['--force', '-f', 'a.txt', '-w', 'b', path.join(dir, 'a.txt')]);
    assert.equal(code, 1);
    assert.match(err, /is a folder; --force does not replace folders/);
    assert.deepEqual(listDir(dir), ['a.txt', 'b/inside.txt']);
  } finally {
    removeDir(dir);
  }
});

test('cli --sort natural numbers photo2 before photo10', () => {
  const dir = makeDir({ 'photo10.jpg': 'ten', 'photo2.jpg': 'two', 'photo1.jpg': 'one' });
  try {
    const files = ['photo10.jpg', 'photo2.jpg', 'photo1.jpg'].map(name => path.join(dir, name));
    const { code, out } = runCli(['--sort', 'natural', '-t', 'trip-{n:2}{ext}', ...files]);
    assert.equal(code, 0);
    assert.deepEqual(listDir(dir), ['trip-01.jpg', 'trip-02.jpg', 'trip-03.jpg']);
    assert.equal(fs.readFileSync(path.join(dir, 'trip-03.jpg'), 'utf8'), 'ten');
    assert.match(out.split('\n')[0], /photo1\.jpg -> .*trip-01\.jpg$/);
  } finally {
    removeDir(dir);
  }
});

test('cli --sort mtime on a missing file is a usage-level error', () => {
  const { code, err } = runCli(['--sort', 'mtime', '-t', '{n}', '/definitely/not/here.jpg']);
  assert.equal(code, 2);
  assert.match(err, /cannot read \/definitely\/not\/here\.jpg to sort it by mtime/);
});

test('cli keeps a replacement from moving files into other folders', () => {
  const dir = makeDir({ 'a.txt': 'x', 'sub/keep.txt': 'y' });
  try {
    const { code } = runCli(['-f', 'a', '-w', 'sub/', path.join(dir, 'a.txt')]);
    assert.equal(code, 0);
    assert.deepEqual(listDir(dir), ['sub/keep.txt', 'sub_.txt']);
  } finally {
    removeDir(dir);
  }
});

test('cli refuses a name that would come out empty', () => {
  const dir = makeDir({ '...': 'x' });
  try {
    const { code, err } = runCli(['-f', '...', '-w', '', path.join(dir, '...')]);
    assert.equal(code, 2);
    assert.match(err, /the new name would be empty/);
  } finally {
    removeDir(dir);
  }
});
