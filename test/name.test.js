import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeExt, splitName } from '../lib/name.js';

test('splitName separates the extension', () => {
  assert.deepEqual(splitName('photo.jpg'), { stem: 'photo', ext: '.jpg' });
  assert.deepEqual(splitName('archive.v2.zip'), { stem: 'archive.v2', ext: '.zip' });
  assert.deepEqual(splitName('README'), { stem: 'README', ext: '' });
});

test('splitName treats dotfiles as having no extension', () => {
  assert.deepEqual(splitName('.gitignore'), { stem: '.gitignore', ext: '' });
});

test('splitName trailing dots', () => {
  assert.deepEqual(splitName('name.'), { stem: 'name', ext: '.' });
});

test('splitName keeps two-part extensions together', () => {
  assert.deepEqual(splitName('backup.tar.gz'), { stem: 'backup', ext: '.tar.gz' });
  assert.deepEqual(splitName('my.backup.2022.TAR.XZ'), { stem: 'my.backup.2022', ext: '.TAR.XZ' });
  assert.deepEqual(splitName('types.d.ts'), { stem: 'types', ext: '.d.ts' });
  assert.deepEqual(splitName('data.tar'), { stem: 'data', ext: '.tar' });
});

test('splitName does not treat a bare compound name as an extension', () => {
  assert.deepEqual(splitName('.tar.gz'), { stem: '.tar', ext: '.gz' });
});

test('normalizeExt', () => {
  assert.equal(normalizeExt('jpg'), '.jpg');
  assert.equal(normalizeExt('.jpg'), '.jpg');
  assert.equal(normalizeExt('tar.gz'), '.tar.gz');
  assert.equal(normalizeExt(''), '');
});
